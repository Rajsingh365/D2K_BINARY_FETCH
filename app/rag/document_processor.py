from typing import List, Dict, Any, Optional
import tiktoken
from langchain.text_splitter import RecursiveCharacterTextSplitter
import logging

# Setup logging
logger = logging.getLogger(__name__)


class DocumentProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        logger.info(
            f"Initializing DocumentProcessor with chunk_size={chunk_size}, chunk_overlap={chunk_overlap}"
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=self._num_tokens,
        )

    @staticmethod
    def _num_tokens(text: str) -> int:
        """Count tokens using tiktoken for compatibility with OpenAI models."""
        try:
            encoding = tiktoken.get_encoding("cl100k_base")  # GPT-4 encoding
            return len(encoding.encode(text))
        except Exception as e:
            logger.warning(
                f"Error counting tokens: {str(e)}. Falling back to character count."
            )
            # Fallback to approximate token count (1 token ≈ 4 chars)
            return len(text) // 4

    def process_documents(
        self, documents: List[str], metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, List]:
        """
        Process and split documents for RAG.

        Args:
            documents: List of raw documents
            metadatas: Optional metadata for each document

        Returns:
            Dictionary with chunks and corresponding metadatas
        """
        if not documents:
            logger.warning("No documents provided for processing")
            return {"chunks": [], "metadatas": []}

        if not metadatas:
            metadatas = [{} for _ in documents]

        chunks = []
        chunk_metadatas = []

        logger.info(f"Processing {len(documents)} documents")

        try:
            for doc, meta in zip(documents, metadatas):
                doc_chunks = self.text_splitter.split_text(doc)
                logger.info(f"Split document into {len(doc_chunks)} chunks")

                chunks.extend(doc_chunks)
                chunk_metadatas.extend([meta for _ in doc_chunks])

            return {"chunks": chunks, "metadatas": chunk_metadatas}
        except Exception as e:
            logger.error(f"Error processing documents: {str(e)}", exc_info=True)
            # Return what we have so far or empty lists
            if not chunks:
                return {"chunks": documents, "metadatas": metadatas}
            return {"chunks": chunks, "metadatas": chunk_metadatas}
