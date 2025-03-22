from typing import Dict, List, Any, Optional, Set
from app.rag.rag_service import RAGService


class KnowledgeRegistry:
    """Registry for managing and sharing knowledge between agents."""

    _instance = None

    @classmethod
    def get_instance(cls) -> "KnowledgeRegistry":
        """Singleton pattern to ensure a single registry instance."""
        if cls._instance is None:
            cls._instance = KnowledgeRegistry()
        return cls._instance

    def __init__(self):
        """Initialize the knowledge registry."""
        self.rag_service = RAGService.get_instance()
        self.knowledge_domains: Dict[str, Set[str]] = {
            "marketing": {"marketing_knowledge", "seo_knowledge"},
            "productivity": {"meeting_knowledge", "productivity_tips"},
            "email": {"email_templates", "communication_best_practices"},
            "general": {"general_knowledge"},
        }

        # Register shared collections
        for domain, collections in self.knowledge_domains.items():
            for collection in collections:
                self.rag_service.mark_collection_as_shared(collection)

    def get_domain_collections(self, domain: str) -> Set[str]:
        """Get collections for a specific knowledge domain."""
        return self.knowledge_domains.get(domain, set())

    def register_collection_to_domain(self, domain: str, collection: str):
        """Register a collection to a domain and mark it as shared."""
        if domain not in self.knowledge_domains:
            self.knowledge_domains[domain] = set()

        self.knowledge_domains[domain].add(collection)
        self.rag_service.mark_collection_as_shared(collection)

    def search_domain_knowledge(
        self, domain: str, query: str, n_results: int = 5
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Search for knowledge within a specific domain."""
        collections = list(self.get_domain_collections(domain))
        return self.rag_service.search_across_collections(query, n_results, collections)

    def list_domains(self) -> List[str]:
        """List all available knowledge domains."""
        return list(self.knowledge_domains.keys())
