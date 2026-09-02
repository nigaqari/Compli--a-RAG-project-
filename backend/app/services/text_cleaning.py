import re
from typing import List, Dict

def _remove_repeating_headers_footers(pages: List[Dict[str, any]]) -> List[Dict[str, any]]:
    """
    Detects and removes lines that repeat identically across many pages
    (usually headers and footers).
    """
    if len(pages) < 3:
        return pages

    # Collect first and last few lines of every page
    first_lines = {}
    last_lines = {}

    for page in pages:
        lines = [line.strip() for line in page["text"].split('\n') if line.strip()]
        if not lines:
            continue
            
        # Look at top 3 and bottom 3 lines
        for line in lines[:3]:
            first_lines[line] = first_lines.get(line, 0) + 1
        for line in lines[-3:]:
            last_lines[line] = last_lines.get(line, 0) + 1

    # If a line appears on more than 40% of pages, it's likely a header/footer
    threshold = max(3, int(len(pages) * 0.4))
    headers_footers_to_strip = {
        line for line, count in {**first_lines, **last_lines}.items() 
        if count >= threshold and len(line) > 3
    }

    cleaned_pages = []
    for page in pages:
        lines = page["text"].split('\n')
        cleaned_lines = []
        for line in lines:
            if line.strip() not in headers_footers_to_strip:
                cleaned_lines.append(line)
        cleaned_pages.append({
            "page_number": page["page_number"],
            "text": '\n'.join(cleaned_lines)
        })

    return cleaned_pages

def clean_text(text: str) -> str:
    """
    Normalizes whitespace, fixes ligatures, and cleans artifacts.
    Preserves paragraph breaks (double newlines).
    """
    if not text:
        return ""

    # Fix hyphenated line breaks (e.g., "compli-\nance" -> "compliance")
    text = re.sub(r'-\n\s*', '', text)
    
    # Normalize unicode ligatures (common in PDFs)
    ligatures = {
        'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl',
        '”': '"', '“': '"', '’': "'", '‘': "'",
        '—': '-', '–': '-', '\u00A0': ' '
    }
    for search, replace in ligatures.items():
        text = text.replace(search, replace)
        
    # Replace single newlines with a space, but preserve double newlines (paragraphs)
    # First, temporarily replace double newlines with a placeholder
    text = re.sub(r'\n\s*\n', '<PARAGRAPH_BREAK>', text)
    
    # Now replace remaining single newlines with space
    text = re.sub(r'\n', ' ', text)
    
    # Restore paragraph breaks
    text = text.replace('<PARAGRAPH_BREAK>', '\n\n')
    
    # Collapse multiple spaces into one
    text = re.sub(r'[ \t]+', ' ', text)
    
    return text.strip()

def clean_pages(pages: List[Dict[str, any]]) -> List[Dict[str, any]]:
    """Runs the full cleaning pipeline over a list of page dicts."""
    # 1. Strip repeating headers/footers across pages
    pages_no_hf = _remove_repeating_headers_footers(pages)
    
    # 2. Clean text per page
    cleaned = []
    for page in pages_no_hf:
        cleaned.append({
            "page_number": page["page_number"],
            "text": clean_text(page["text"])
        })
        
    return cleaned
