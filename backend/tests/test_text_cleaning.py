import pytest
from app.services.text_cleaning import clean_text, clean_pages

def test_clean_text_hyphenation_and_ligatures():
    # Hyphenated line breaks should be merged
    raw_text = "This agree-\n    ment has ﬁne terms and  conditions."
    cleaned = clean_text(raw_text)
    assert "agreement" in cleaned
    assert "fine terms" in cleaned

def test_clean_text_whitespace():
    messy = "Contract    Section   1.1  \n\n  Terms and   Conditions  "
    norm = clean_text(messy)
    assert "Contract Section 1.1" in norm
    assert "Terms and Conditions" in norm

def test_clean_pages_pipeline():
    pages = [
        {"page_number": 1, "text": "Header Inc\nPage content 1\nFooter Inc"},
        {"page_number": 2, "text": "Header Inc\nPage content 2\nFooter Inc"},
        {"page_number": 3, "text": "Header Inc\nPage content 3\nFooter Inc"}
    ]
    cleaned = clean_pages(pages)
    assert len(cleaned) == 3
    assert "Page content 1" in cleaned[0]["text"]
    assert "Header Inc" not in cleaned[0]["text"]
