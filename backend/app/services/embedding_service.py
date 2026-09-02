import logging
from typing import List

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance

    def _get_model(self):
        if self._model is None:
            logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Model loaded successfully.")
        return self._model

    def embed_chunks(self, texts: List[str]) -> List[List[float]]:
        """
        Generates 384-dimensional embeddings for a batch of text chunks.
        Uses sentence-transformers built-in batching.
        """
        if not texts:
            return []
            
        model = self._get_model()
        embeddings = model.encode(texts, batch_size=32, show_progress_bar=False)
        return embeddings.tolist()

# Singleton instance export
embedding_service = EmbeddingService()
