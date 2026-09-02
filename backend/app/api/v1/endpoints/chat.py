from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db.session import SessionLocal
from app.models.user import User
from app.models.chat import Conversation, ChatHistory
from app.api.deps import get_current_user
from app.services.rag_service import answer_question

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class MessageCreate(BaseModel):
    question: str
    document_scope_id: Optional[str] = None

class ConversationCreate(BaseModel):
    title: Optional[str] = None
    document_scope_id: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: str

@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return conversations

@router.post("/conversations")
def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_conv = Conversation(
        user_id=current_user.id,
        title=conversation.title or "New Conversation",
        document_scope_id=conversation.document_scope_id
    )
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)
    return new_conv

@router.get("/conversations/{id}/messages")
def get_messages(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(Conversation.id == id, Conversation.user_id == current_user.id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = db.query(ChatHistory).filter(ChatHistory.conversation_id == id).order_by(ChatHistory.created_at.asc()).all()
    return messages

@router.post("/conversations/{id}/messages")
def send_message(
    id: str,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify conversation exists and belongs to current user
    conversation = db.query(Conversation).filter(Conversation.id == id, Conversation.user_id == current_user.id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    # 2. Auto-title if it's the first message
    msg_count = db.query(ChatHistory).filter(ChatHistory.conversation_id == id).count()
    if msg_count == 0 and conversation.title == "New Conversation":
        conversation.title = message.question[:40] + ("..." if len(message.question) > 40 else "")
        db.commit()
        
    # 3. Save User Message
    user_msg = ChatHistory(
        user_id=current_user.id,
        conversation_id=id,
        role="user",
        content=message.question,
        document_scope_id=message.document_scope_id
    )
    db.add(user_msg)
    db.commit()

    # 4. Scope filters
    scope_filters = None
    if message.document_scope_id and message.document_scope_id != "all":
        scope_filters = {"document_id": message.document_scope_id}
    elif conversation.document_scope_id and conversation.document_scope_id != "all":
        scope_filters = {"document_id": conversation.document_scope_id}
        
    # 5. Call RAG Engine
    try:
        rag_response = answer_question(
            db=db,
            question=message.question,
            user_id=current_user.id,
            conversation_id=id,
            scope_filters=scope_filters
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # 6. Save Assistant Message
    assistant_msg = ChatHistory(
        user_id=current_user.id,
        conversation_id=id,
        role="assistant",
        content=rag_response["answer"],
        citations=rag_response["citations"]
    )
    db.add(assistant_msg)
    
    # Update conversation updated_at
    conversation.updated_at = assistant_msg.created_at
    db.commit()
    
    return {
        "answer": rag_response["answer"],
        "citations": rag_response["citations"],
        "conversation_id": id,
        "message_id": assistant_msg.id
    }

@router.patch("/conversations/{id}")
def rename_conversation(
    id: str,
    update: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(Conversation.id == id, Conversation.user_id == current_user.id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conversation.title = update.title
    db.commit()
    return conversation

@router.delete("/conversations/{id}")
def delete_conversation(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(Conversation.id == id, Conversation.user_id == current_user.id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.query(ChatHistory).filter(ChatHistory.conversation_id == id).delete()
    db.delete(conversation)
    db.commit()
    return {"status": "success"}
