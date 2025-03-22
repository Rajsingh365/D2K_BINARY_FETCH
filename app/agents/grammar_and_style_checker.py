# grammar_and_style_checker.py
from typing import Dict, Any, Optional
from app.agents.base import BaseAgent
import google.generativeai as genai
from dotenv import load_dotenv
import os
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Load environment variables and configure Gemini
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.error(
        "CRITICAL: GOOGLE_API_KEY is not set in .env file or environment variables."
    )
    raise ValueError("GOOGLE_API_KEY is not set. Cannot continue.")
else:
    logger.info(
        f"GOOGLE_API_KEY loaded: {GOOGLE_API_KEY[:5]}... (truncated for security)"
    )
genai.configure(api_key=GOOGLE_API_KEY)


class GrammarAndStyleChecker(BaseAgent):
    """Agent that checks and corrects grammar/style errors and provides suggestions."""

    def __init__(
        self, model_name: str = "models/gemini-2.0-flash"
    ):  # Allow model selection
        super().__init__()
        self.model = genai.GenerativeModel(model_name)
        logger.info(f"Initializing GrammarAndStyleChecker with model: {model_name}")

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the content and provide grammar and style improvements."""
        content = input_data.get("content", "")
        if not content:
            return {"error": "No content provided for grammar checking"}

        # Construct prompt
        prompt = f"""
        Review the following text for grammar, spelling, punctuation, clarity, and style issues.
        
        Text to review:
        {content}
        
        Provide:
        1. Corrected version of the text
        2. List of specific improvements or suggestions
        """

        try:
            # Updated model name to use one from the available models list
            self.model = genai.GenerativeModel("gemini-1.5-pro")
            response = self.model.generate_content(prompt)
            suggestions = response.text if response.text else "No grammar issues found."

            # Return the corrected text and suggestions
            return {
                "original_text": content,
                "corrected_text": content,  # Default to original if parsing fails
                "suggestions": suggestions,
            }
        except Exception as e:
            logger.error(f"Error in Gemini grammar check: {e}")
            # Return original text with error message
            return {
                "original_text": content,
                "corrected_text": content,
                "suggestions": f"Error during grammar check: {str(e)}",
            }

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "The text content to be checked and corrected.",
                },
                # Consider supporting other input formats, like previous agent outputs:
                "transcript": {"type": "string"},
                "summary": {"type": "string"},
                "email": {"type": "object"},  # Could contain text in 'body'
            },
            "required": [],  # We use extract_text_content, so nothing *strictly* required
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "corrected_text": {
                    "type": "string",
                    "description": "The text with grammar and style corrections applied.",
                },
                "suggestions": {
                    "type": "string",
                    "description": "Specific suggestions for further improvement.",
                },
                "original_text": {
                    "type": "string",
                    "description": "The original, uncorrected text (for comparison).",
                },
            },
        }

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "model_name": {
                    "type": "string",
                    "description": "The name of the Gemini model to use.",
                    "default": "models/gemini-1.0-pro",
                }
            },
        }


# --- END OF FILE grammar_and_style_checker.py ---
