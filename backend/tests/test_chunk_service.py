import pytest
from app.services.chunk_service import chunk_document, _split_into_sentences

def test_split_into_sentences():
    text = "The vendor shall deliver services. All invoices are net 30! Do you agree?"
    sentences = _split_into_sentences(text)
    assert len(sentences) == 3
    assert sentences[0] == "The vendor shall deliver services."
    assert sentences[1] == "All invoices are net 30!"
    assert sentences[2] == "Do you agree?"

def test_chunk_document_preserves_page_numbers():
    pages = [
        {"page_number": 1, "text": "This is page 1 content. It contains important introductory terms."},
        {"page_number": 2, "text": "This is page 2 content. It outlines termination conditions."}
    ]
    chunks = chunk_document(pages, chunk_size=100, overlap=20)
    assert len(chunks) >= 2
    assert chunks[0].page_number == 1
    assert chunks[1].page_number == 2
    assert chunks[0].chunk_index == 0
    assert chunks[1].chunk_index == 1
