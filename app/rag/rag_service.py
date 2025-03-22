from typing import List, Dict, Any, Optional, Set
from .vector_store import VectorStore
from .document_processor import DocumentProcessor
import logging

# Setup logging
logger = logging.getLogger(__name__)


class RAGService:
    """Centralized service for document storage and retrieval across agents."""

    _instance = None

    @classmethod
    def get_instance(cls) -> "RAGService":
        """Singleton pattern to ensure a single RAG service instance."""
        if cls._instance is None:
            cls._instance = RAGService()
        return cls._instance

    def __init__(self):
        """Initialize the RAG service with collections storage."""
        logger.info("Initializing RAG service")
        self.collections: Dict[str, VectorStore] = {}
        self.document_processor = DocumentProcessor()
        self.shared_collections: Set[str] = set()

    def get_collection(self, collection_name: str) -> VectorStore:
        """Get or create a vector store collection."""
        if collection_name not in self.collections:
            logger.info(f"Creating new collection: {collection_name}")
            try:
                self.collections[collection_name] = VectorStore(collection_name)
            except Exception as e:
                logger.error(f"Error creating collection {collection_name}: {str(e)}")

                # Don't fail completely, create a dummy store that handles errors gracefully
                class DummyVectorStore:
                    def add_documents(self, *args, **kwargs):
                        logger.warning(
                            f"Dummy store: add_documents called for {collection_name}"
                        )
                        return

                    def search(self, *args, **kwargs):
                        logger.warning(
                            f"Dummy store: search called for {collection_name}"
                        )
                        return []

                self.collections[collection_name] = DummyVectorStore()

        return self.collections[collection_name]

    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ):
        """Add documents to a specified collection."""
        try:
            collection = self.get_collection(collection_name)

            # Process documents if needed (chunking)
            processed = self.document_processor.process_documents(documents, metadatas)

            # Add to vector store
            collection.add_documents(
                documents=processed["chunks"],
                metadatas=processed["metadatas"],
                ids=ids or [f"doc_{i}" for i in range(len(processed["chunks"]))],
            )
            logger.info(f"Added {len(processed['chunks'])} chunks to {collection_name}")
        except Exception as e:
            logger.error(
                f"Error adding documents to {collection_name}: {str(e)}", exc_info=True
            )
            # Don't fail the entire workflow if RAG operations fail

    def search(
        self, collection_name: str, query: str, n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for relevant documents in a collection."""
        try:
            collection = self.get_collection(collection_name)
            return collection.search(query, n_results)
        except Exception as e:
            logger.error(f"Error searching {collection_name}: {str(e)}")
            return []

    def list_collections(self) -> Set[str]:
        """List all available collections."""
        return set(self.collections.keys())

    def mark_collection_as_shared(self, collection_name: str):
        """Mark a collection as shared across agents."""
        if collection_name not in self.collections:
            self.get_collection(collection_name)
        self.shared_collections.add(collection_name)

    def is_collection_shared(self, collection_name: str) -> bool:
        """Check if a collection is marked as shared."""
        return collection_name in self.shared_collections

    def list_shared_collections(self) -> Set[str]:
        """List all shared collections."""
        return self.shared_collections

    def search_across_collections(
        self, query: str, n_results: int = 5, collections: Optional[List[str]] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Search across multiple collections and return combined results.

        Args:
            query: Text query to search for
            n_results: Number of results to return per collection
            collections: Specific collections to search (defaults to all shared collections)

        Returns:
            Dictionary mapping collection names to their search results
        """
        if collections is None:
            collections = list(self.shared_collections)

        results = {}
        for collection_name in collections:
            if collection_name in self.collections:
                try:
                    results[collection_name] = self.search(
                        collection_name, query, n_results
                    )
                except Exception as e:
                    logger.error(
                        f"Error searching collection {collection_name}: {str(e)}"
                    )
                    results[collection_name] = []

        return results
