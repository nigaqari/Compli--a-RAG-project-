from typing import List, Dict, Any
from app.services.embedding_service import embedding_service
from app.services.vector_service import vector_service

def retrieve_context(question: str, user_id: str, scope_filters: dict = None, top_k: int = 6) -> List[Dict[str, Any]]:
    """
    Retrieves the most relevant document chunks for a given question.
    Strictly applies access controls (owner_id) and optional scope filters.
    """
    # 1. Embed the question
    query_embedding = embedding_service.embed_chunks([question])[0]

    # 2. Build filters - ALWAYS scope to user_id
    filters = {"owner_id": {"$eq": user_id}}
    
    if scope_filters:
        if "document_id" in scope_filters:
            filters = {
                "$and": [
                    {"owner_id": {"$eq": user_id}},
                    {"document_id": {"$eq": scope_filters["document_id"]}}
                ]
            }
        elif "document_type" in scope_filters:
            filters = {
                "$and": [
                    {"owner_id": {"$eq": user_id}},
                    {"document_type": {"$eq": scope_filters["document_type"]}}
                ]
            }

    # 3. Search ChromaDB
    results = vector_service.search_chunks(
        query_embedding=query_embedding,
        top_k=top_k,
        filters=filters
    )

    # 4. Relevance thresholding (Cosine distance: smaller is more similar)
    THRESHOLD = 0.75
    relevant_chunks = [r for r in results if r["distance"] < THRESHOLD]

    return relevant_chunks
