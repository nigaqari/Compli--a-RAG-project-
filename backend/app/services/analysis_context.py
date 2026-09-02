import tiktoken
from sqlalchemy.orm import Session
from app.models.document_chunk import DocumentChunk
from typing import List, Tuple

# Token budget for a single pass (leaving room for output and prompt)
MAX_CONTEXT_TOKENS = 6000

def num_tokens_from_string(string: str, encoding_name: str = "cl100k_base") -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

def assemble_document_context(db: Session, document_id: str) -> Tuple[bool, List[str]]:
    """
    Retrieves all chunks for a document.
    Returns (is_single_pass, list_of_contexts)
    If single pass, the list has 1 element (the full text).
    If map-reduce, the list has multiple elements (each <= MAX_CONTEXT_TOKENS).
    """
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index).all()
    
    if not chunks:
        return True, [""]
        
    full_text_parts = []
    for chunk in chunks:
        page_indicator = f"[Page {chunk.page_number}]" if chunk.page_number else "[Page Unknown]"
        full_text_parts.append(f"{page_indicator}\n{chunk.text}")
        
    full_text = "\n\n".join(full_text_parts)
    total_tokens = num_tokens_from_string(full_text)
    
    if total_tokens <= MAX_CONTEXT_TOKENS:
        return True, [full_text]
        
    # Map-reduce fallback: split into sections that fit the budget
    sections = []
    current_section = []
    current_tokens = 0
    
    for chunk in chunks:
        page_indicator = f"[Page {chunk.page_number}]" if chunk.page_number else "[Page Unknown]"
        chunk_text = f"{page_indicator}\n{chunk.text}"
        chunk_tokens = num_tokens_from_string(chunk_text)
        
        if current_tokens + chunk_tokens > MAX_CONTEXT_TOKENS and current_section:
            sections.append("\n\n".join(current_section))
            current_section = [chunk_text]
            current_tokens = chunk_tokens
        else:
            current_section.append(chunk_text)
            current_tokens += chunk_tokens
            
    if current_section:
        sections.append("\n\n".join(current_section))
        
    return False, sections
