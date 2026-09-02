import chromadb
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self, db_path: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection_name = "compli_chunks"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"} # Default for sentence-transformers
        )

    def upsert_chunks(self, document_id: str, owner_id: str, document_type: str, chunks: List[Any], embeddings: List[List[float]]):
        """
        Upserts a batch of chunks and their embeddings into ChromaDB.
        """
        if not chunks:
            return

        ids = []
        documents = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            # chunk is expected to be a Chunk object from chunk_service
            chunk_id = f"{document_id}_{chunk.chunk_index}"
            ids.append(chunk_id)
            documents.append(chunk.text)
            
            # Metadata for filtering and retrieval
            metadatas.append({
                "document_id": document_id,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "document_type": document_type,
                "owner_id": owner_id
            })

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Upserted {len(chunks)} vectors for document {document_id}")

    def delete_document_vectors(self, document_id: str):
        """
        Deletes all vectors associated with a specific document.
        """
        self.collection.delete(
            where={"document_id": document_id}
        )
        logger.info(f"Deleted vectors for document {document_id}")

    def search_chunks(self, query_embedding: List[float], top_k: int = 6, filters: dict = None) -> List[Dict[str, Any]]:
        """
        Searches ChromaDB for the top_k most similar chunks.
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filters
        )
        
        parsed_results = []
        if results['ids'] and len(results['ids']) > 0:
            for i in range(len(results['ids'][0])):
                parsed_results.append({
                    "id": results['ids'][0][i],
                    "document": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i]
                })
        return parsed_results

vector_service = VectorService()
