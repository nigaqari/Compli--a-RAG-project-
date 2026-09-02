import re
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.services.rag_retrieval import retrieve_context
from app.services.llm_service import generate_completion
from app.models.chat import ChatHistory
from app.models.document import Document

def _read_prompt_template(filename: str) -> str:
    with open(f"prompts/{filename}", "r") as f:
        return f.read()

def _format_context(chunks: List[Dict[str, Any]], db: Session) -> str:
    formatted = []
    
    # Pre-fetch document names
    doc_cache = {}
    for chunk in chunks:
        doc_id = chunk['metadata']['document_id']
        if doc_id not in doc_cache:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            doc_cache[doc_id] = (doc.original_name or doc.filename) if doc else "Document"

    for chunk in chunks:
        doc_name = doc_cache[chunk['metadata']['document_id']]
        page_num = chunk['metadata'].get('page_number', 1)
        text = chunk['document']
        formatted.append(f"<excerpt source=\"{doc_name}\" page=\"{page_num}\">\n{text}\n</excerpt>")
    
    return "\n\n".join(formatted)

def _format_history(history: List[ChatHistory]) -> str:
    if not history:
        return ""
    
    formatted = ["Previous conversation:"]
    for msg in history:
        role = "User" if msg.role == "user" else "Juris"
        formatted.append(f"{role}: {msg.content}")
    
    return "\n".join(formatted) + "\n\n"

def extract_citations(raw_answer: str, chunks: List[Dict[str, Any]], db: Session) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Extracts structured citations [DocumentName, p.X] from the LLM response.
    Returns the cleaned answer (with our UI citation markers if desired) and a list of citation objects.
    """
    citations = []
    
    # Pre-fetch document names for mapping
    doc_cache = {}
    for chunk in chunks:
        doc_id = chunk['metadata']['document_id']
        if doc_id not in doc_cache:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            doc_cache[doc_id] = (doc.original_name or doc.filename) if doc else "Document"
            
    # Find patterns like [Document.pdf, p.1]
    pattern = r'\[(.*?),\s*p\.(\d+)\]'
    
    def replace_citation(match):
        doc_name = match.group(1)
        page_num = int(match.group(2))
        
        # Try to find the matching chunk to get the snippet
        matched_chunk = None
        for chunk in chunks:
            if doc_cache.get(chunk['metadata']['document_id']) == doc_name and chunk['metadata'].get('page_number') == page_num:
                matched_chunk = chunk
                break
                
        if matched_chunk:
            citations.append({
                "document_id": matched_chunk['metadata']['document_id'],
                "document_name": doc_name,
                "page_number": page_num,
                "excerpt_snippet": matched_chunk['document'][:200] + "..." # Just a snippet for the UI pill
            })
            # Return a citation index marker e.g., [1]
            return f"[{len(citations)}]"
        return match.group(0) # Keep original if no match found
        
    cleaned_answer = re.sub(pattern, replace_citation, raw_answer)
    
    return cleaned_answer, citations

def answer_question(db: Session, question: str, user_id: str, conversation_id: str, scope_filters: dict = None) -> Dict[str, Any]:
    # 1. Fetch recent chat history
    history = db.query(ChatHistory).filter(
        ChatHistory.conversation_id == conversation_id
    ).order_by(ChatHistory.created_at.desc()).limit(3).all()
    history.reverse() # Oldest first for context
    
    # 2. Retrieve context chunks
    chunks = retrieve_context(question, user_id, scope_filters)
    
    # 3. Handle empty chunks (Fallback gracefully inside LLM context)
    if not chunks:
        formatted_context = "No relevant document excerpts were found."
    else:
        formatted_context = _format_context(chunks, db)
    system_prompt = _read_prompt_template("system_juris.txt")
    qa_template = _read_prompt_template("qa.txt")
    
    formatted_history = _format_history(history)
    
    prompt = qa_template.format(
        context=formatted_context,
        history=formatted_history,
        question=question
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    
    # 5. Call LLM
    raw_answer = generate_completion(db, user_id, messages)
    
    # 6. Extract citations
    cleaned_answer, citations = extract_citations(raw_answer, chunks, db)
    
    # Fallback to retrieval-based if structural regex fails
    if not citations and chunks:
        for chunk in chunks:
            doc_id = chunk['metadata']['document_id']
            doc = db.query(Document).filter(Document.id == doc_id).first()
            citations.append({
                "document_id": doc_id,
                "document_name": (doc.original_name or doc.filename) if doc else "Document",
                "page_number": chunk['metadata'].get('page_number', 1),
                "excerpt_snippet": chunk['document'][:200] + "..."
            })
            
    return {
        "answer": cleaned_answer,
        "citations": citations,
        "chunks_used": [c['id'] for c in chunks]
    }
