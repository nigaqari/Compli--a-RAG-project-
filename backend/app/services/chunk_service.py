import tiktoken
import re
from typing import List, Dict, Any

class Chunk:
    def __init__(self, chunk_index: int, page_number: int, text: str, char_start: int, char_end: int):
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.text = text
        self.char_start = char_start
        self.char_end = char_end

    def to_dict(self):
        return {
            "chunk_index": self.chunk_index,
            "page_number": self.page_number,
            "text": self.text,
            "char_start": self.char_start,
            "char_end": self.char_end
        }

def _split_into_sentences(text: str) -> List[str]:
    """Splits text into sentences using simple regex boundaries."""
    # Split on periods followed by space, or double newlines (paragraphs)
    # Keeping the punctuation attached to the sentence.
    sentences = re.split(r'(?<=[.!?])\s+|\n\n+', text)
    return [s.strip() for s in sentences if s.strip()]

def chunk_document(pages: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 75) -> List[Chunk]:
    """
    Chunks a document into overlapping windows of ~chunk_size tokens.
    Preserves the page_number of where the chunk started.
    """
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
    except Exception:
        # Fallback if tiktoken fails to load
        encoding = None

    def count_tokens(text: str) -> int:
        if encoding:
            return len(encoding.encode(text, disallowed_special=()))
        return len(text) // 4  # rough heuristic fallback

    chunks = []
    chunk_index = 0

    for page in pages:
        page_num = page["page_number"]
        page_text = page["text"]
        
        if not page_text:
            continue

        sentences = _split_into_sentences(page_text)
        
        current_chunk_sentences = []
        current_token_count = 0
        char_offset = 0 # This is a local offset per page
        
        for sentence in sentences:
            sentence_tokens = count_tokens(sentence)
            
            # If a single sentence is larger than chunk_size, we still append it
            # (or we could forcefully split it, but usually best to keep it intact)
            if current_token_count + sentence_tokens > chunk_size and current_chunk_sentences:
                # Flush current chunk
                chunk_text = " ".join(current_chunk_sentences)
                chunks.append(Chunk(
                    chunk_index=chunk_index,
                    page_number=page_num,
                    text=chunk_text,
                    char_start=0, # Simplified for Week 3
                    char_end=len(chunk_text)
                ))
                chunk_index += 1
                
                # Keep overlap sentences
                overlap_sentences = []
                overlap_tokens = 0
                for s in reversed(current_chunk_sentences):
                    t_count = count_tokens(s)
                    if overlap_tokens + t_count > overlap:
                        break
                    overlap_sentences.insert(0, s)
                    overlap_tokens += t_count
                    
                current_chunk_sentences = overlap_sentences
                current_token_count = overlap_tokens
                
            current_chunk_sentences.append(sentence)
            current_token_count += sentence_tokens
            
        # Flush remaining for the page
        if current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences)
            chunks.append(Chunk(
                chunk_index=chunk_index,
                page_number=page_num,
                text=chunk_text,
                char_start=0,
                char_end=len(chunk_text)
            ))
            chunk_index += 1

    return chunks
