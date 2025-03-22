from typing import Dict, Any, Optional, List
from app.agents.base import BaseAgent
from app.rag.rag_service import RAGService


class SEOOptimizer(BaseAgent):
    """Agent that analyzes content and provides SEO recommendations."""

    def __init__(self, collection_name: str = "seo_knowledge"):
        super().__init__()
        self.collection_name = collection_name
        self.rag_service = RAGService.get_instance()

        # Populate with some SEO knowledge if empty
        self._initialize_knowledge()

    def _initialize_knowledge(self):
        # Check if collection exists and has documents
        try:
            collection = self.rag_service.get_collection(self.collection_name)
            if len(collection.collection.get()["ids"]) == 0:
                self._populate_seo_knowledge()
        except:
            # Collection doesn't exist yet, create and populate
            self._populate_seo_knowledge()

    def _populate_seo_knowledge(self):
        seo_documents = [
            "Use descriptive titles with primary keywords under 60 characters.",
            "Create meta descriptions between 150-160 characters with a call to action.",
            "Structure content with H1, H2, and H3 tags in hierarchical order.",
            "Optimize images with descriptive filenames and alt text.",
            "Ensure responsive design for mobile optimization.",
            "Improve page loading speed by optimizing image sizes and leveraging browser caching.",
            "Create high-quality, original content of at least 300 words per page.",
            "Include relevant internal and external links with descriptive anchor text.",
            "Use canonical tags to prevent duplicate content issues.",
            "Create a logical site structure with breadcrumb navigation.",
            "Implement schema markup for rich snippets in search results.",
            "Ensure proper URL structure with keywords and logical hierarchy.",
            "Create an XML sitemap and submit to search engines.",
            "Use 301 redirects for changed or moved pages.",
            "Set up Google Analytics and Google Search Console for monitoring.",
        ]

        self.rag_service.add_documents(
            collection_name=self.collection_name,
            documents=seo_documents,
            metadatas=[{"type": "seo_best_practice"} for _ in seo_documents],
            ids=[f"seo_{i}" for i in range(len(seo_documents))],
        )

    def process(
        self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process content and provide SEO recommendations.

        Args:
            input_data: Dict containing text content in any format
            context: Optional workflow context with original prompt

        Returns:
            Dict with SEO recommendations
        """
        # Extract content from any input format using base helper method
        content = self.extract_text_content(input_data)

        # Get original user prompt if available
        original_prompt = self.get_original_prompt(context) if context else ""

        # If content not directly in content field, set it for downstream compatibility
        if "content" not in input_data:
            input_data["content"] = content

        # Extract keywords from input data or use original prompt for guidance
        target_keywords = []

        # Try to get keywords from input directly
        if "keywords" in input_data and isinstance(input_data["keywords"], list):
            target_keywords = input_data["keywords"]
        # Extract from email subject if available
        elif "email" in input_data and isinstance(input_data["email"], dict):
            email_subject = input_data["email"].get("subject", "")
            if email_subject:
                # Extract potential keywords from subject
                target_keywords = [
                    word for word in email_subject.split() if len(word) > 3
                ]
        # Use meeting summary participants if available
        elif "participants" in input_data and isinstance(
            input_data["participants"], list
        ):
            for participant in input_data["participants"]:
                if isinstance(participant, str) and len(participant) > 3:
                    target_keywords.append(participant)

        # Use original prompt to extract potential keywords if no keywords found
        if not target_keywords and original_prompt:
            target_keywords = [
                word for word in original_prompt.split() if len(word) > 3
            ]

        # Limit to reasonable number of keywords
        target_keywords = target_keywords[:5]

        # Basic keyword analysis
        keyword_findings = self._analyze_keywords(content, target_keywords)

        # Get relevant SEO recommendations from vector store
        relevant_recommendations = self._get_recommendations(content)

        return {
            "content": content,  # Include content for chaining
            "keywords": target_keywords,  # Include keywords for chaining
            "keyword_analysis": keyword_findings,
            "recommendations": relevant_recommendations,
            "seo_score": self._calculate_seo_score(keyword_findings, content),
        }

    def _analyze_keywords(self, content: str, target_keywords: list) -> Dict[str, Any]:
        """Analyze keyword usage in content."""
        content_lower = content.lower()
        results = {}

        for keyword in target_keywords:
            keyword_lower = keyword.lower()
            count = content_lower.count(keyword_lower)
            results[keyword] = {
                "count": count,
                "density": round(
                    (count * len(keyword.split())) / max(1, len(content.split())) * 100,
                    2,
                ),
                "in_first_paragraph": keyword_lower in content_lower.split("\n\n")[0]
                if "\n\n" in content_lower
                else keyword_lower in content_lower[:200],
            }

        return results

    def _get_recommendations(self, content: str) -> List[str]:
        """Get relevant SEO recommendations based on content."""
        # Get recommendations from RAG service
        results = self.rag_service.search(self.collection_name, content, n_results=5)
        return [r["document"] for r in results]

    def _calculate_seo_score(
        self, keyword_findings: Dict[str, Any], content: str
    ) -> int:
        """Calculate a simple SEO score based on analysis."""
        score = 50  # Base score

        # Add points for keyword usage
        for keyword, data in keyword_findings.items():
            if data["count"] > 0:
                score += 5
            if data["in_first_paragraph"]:
                score += 5
            if 0.5 <= data["density"] <= 2.5:  # Ideal keyword density
                score += 5
            elif data["density"] > 2.5:  # Over-optimization penalty
                score -= 5

        # Basic content checks
        if len(content.split()) > 300:  # Content length
            score += 10

        # Cap the score at 100
        return min(100, score)

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "The content to analyze for SEO",
                },
                "keywords": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Target keywords for SEO optimization",
                },
                # Additional fields for integration with other agents
                "summary": {
                    "type": "string",
                    "description": "Summary from meeting summarizer or other agent",
                },
                "email": {
                    "type": "object",
                    "description": "Email containing content in body field",
                },
                "transcript": {
                    "type": "string",
                    "description": "Meeting transcript from previous agent",
                },
            },
            "required": [],  # No fields required as we can extract from various inputs
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "keyword_analysis": {
                    "type": "object",
                    "description": "Analysis of keyword usage in content",
                },
                "recommendations": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "SEO recommendations based on content analysis",
                },
                "seo_score": {
                    "type": "number",
                    "description": "Overall SEO score from 0-100",
                },
            },
        }

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "collection_name": {
                    "type": "string",
                    "description": "Name of the vector collection for SEO knowledge",
                }
            },
        }
