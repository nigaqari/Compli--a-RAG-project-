import fitz  # PyMuPDF
import logging
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

class PDFProcessingError(Exception):
    pass

class ScannedPDFError(PDFProcessingError):
    pass

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(IOError)
)
def extract_metadata(file_path: str) -> Dict[str, Optional[any]]:
    """Extract cheap metadata synchronously at upload time."""
    try:
        with fitz.open(file_path) as doc:
            meta = doc.metadata or {}
            return {
                "page_count": doc.page_count,
                "title": meta.get("title", ""),
                "author": meta.get("author", ""),
                "is_encrypted": doc.is_encrypted
            }
    except Exception as e:
        logger.error(f"Failed to extract metadata from {file_path}: {e}")
        raise PDFProcessingError(f"Metadata extraction failed: {str(e)}")

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(IOError)
)
def extract_text_by_page(file_path: str) -> List[Dict[str, any]]:
    """Extract text per page. Detects if PDF is image-based (scanned)."""
    pages_text = []
    total_text_length = 0
    
    try:
        with fitz.open(file_path) as doc:
            if doc.is_encrypted:
                raise PDFProcessingError("Cannot extract text from encrypted PDF")
                
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                text = page.get_text("text")
                pages_text.append({
                    "page_number": page_num + 1,
                    "text": text
                })
                total_text_length += len(text.strip())
                
            # Heuristic: if average text per page is extremely low, it's likely scanned
            avg_chars_per_page = total_text_length / max(1, doc.page_count)
            if doc.page_count > 0 and avg_chars_per_page < 50:
                raise ScannedPDFError("scanned_pdf_no_text_layer")
                
            return pages_text
    except ScannedPDFError:
        raise
    except Exception as e:
        logger.error(f"Failed to extract text from {file_path}: {e}")
        raise PDFProcessingError(f"Text extraction failed: {str(e)}")

def extract_text_from_pdf(file_path: str) -> str:
    """Convenience wrapper to get all text as a single string."""
    pages = extract_text_by_page(file_path)
    return "\n\n".join([p["text"] for p in pages])
