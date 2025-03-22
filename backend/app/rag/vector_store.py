import os
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import logging

# Setup logging
logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self, collection_name: str, persist_directory: str = "./chroma_db"):
        # Initialize ChromaDB client with updated configuration
        logger.info(
            f"Initializing ChromaDB client with persist_directory={persist_directory}"
        )

        try:
            # New client initialization pattern according to ChromaDB migration docs
            self.client = chromadb.PersistentClient(path=persist_directory)

            # Get or create collection
            self.collection = self.client.get_or_create_collection(name=collection_name)
            logger.info(f"Successfully connected to collection: {collection_name}")

        except Exception as e:
            logger.error(f"Error initializing ChromaDB: {str(e)}", exc_info=True)
            # Re-raise to handle it upstream
            raise

    def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ):
        """
        Add documents to the vector store.

        Args:
            documents: List of text documents to embed and store
            metadatas: Optional metadata for each document
            ids: Optional custom IDs for each document
        """
        if not ids:
            ids = [f"doc_{i}" for i in range(len(documents))]

        if not metadatas:
            metadatas = [{} for _ in documents]

        try:
            logger.info(f"Adding {len(documents)} documents to collection")
            self.collection.add(documents=documents, metadatas=metadatas, ids=ids)
            logger.info("Documents added successfully")
        except Exception as e:
            logger.error(f"Error adding documents: {str(e)}", exc_info=True)
            raise

    def search(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for documents similar to the query.

        Args:
            query: Text query to search for
            n_results: Number of results to return

        Returns:
            List of matched documents with their metadata and similarity scores
        """
        try:
            logger.info(f"Searching with query: '{query}' (n_results={n_results})")
            results = self.collection.query(query_texts=[query], n_results=n_results)

            # Format the results
            formatted_results = []
            for i in range(len(results["documents"][0])):
                formatted_results.append(
                    {
                        "id": results["ids"][0][i],
                        "document": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i]
                        if "distances" in results
                        else None,
                    }
                )
            logger.info(f"Found {len(formatted_results)} results")
            return formatted_results
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}", exc_info=True)
            # Return empty results instead of breaking
            return []
