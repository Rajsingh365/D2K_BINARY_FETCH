import os
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure the Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.error(
        "CRITICAL: GEMINI_API_KEY is not set in .env file or environment variables."
    )
    raise ValueError("GEMINI_API_KEY is not set. Cannot continue.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info(
        f"GEMINI_API_KEY loaded: {GEMINI_API_KEY[:5]}... (truncated for security)"
    )


class GeminiService:
    """Service for interacting with Google's Gemini models."""

    @staticmethod
    def generate_text(
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        """
        Generate text using Gemini.

        Args:
            system_prompt: Instructions for the model
            user_prompt: User's input
            max_tokens: Maximum number of tokens to generate
            temperature: Controls randomness (0.0 to 1.0)

        Returns:
            Generated text as string
        """
        try:
            # For Gemini, we combine system and user prompts since it has a different interface
            combined_prompt = f"{system_prompt}\n\n{user_prompt}"

            # Configure the model
            model = genai.GenerativeModel(
                model_name="gemini-pro",
                generation_config={
                    "max_output_tokens": max_tokens,
                    "temperature": temperature,
                },
            )

            # Generate the response
            response = model.generate_content(combined_prompt)

            # Extract and return the text
            return response.text

        except Exception as e:
            logger.error(f"Error generating text with Gemini: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def generate_structured_json(
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.2,
    ) -> Any:
        """
        Generate JSON structured data using Gemini.

        Args:
            system_prompt: Instructions for the model
            user_prompt: User's input
            max_tokens: Maximum number of tokens to generate
            temperature: Controls randomness (0.0 to 1.0)

        Returns:
            Parsed JSON object
        """
        import json

        try:
            # Add specific instructions for JSON output
            enhanced_system_prompt = f"{system_prompt}\n\nYou must respond ONLY with valid JSON. No other text or explanations."

            # Get the text response
            json_text = GeminiService.generate_text(
                system_prompt=enhanced_system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            # Clean up the response to ensure it's valid JSON
            # Remove markdown code block markers if present
            json_text = json_text.strip()
            if json_text.startswith("```json"):
                json_text = json_text[7:]
            if json_text.endswith("```"):
                json_text = json_text[:-3]

            json_text = json_text.strip()

            # Parse and return the JSON
            return json.loads(json_text)

        except json.JSONDecodeError as e:
            logger.error(
                f"Error parsing JSON from Gemini response: {str(e)}", exc_info=True
            )
            logger.error(f"Raw response: {json_text}")
            raise
        except Exception as e:
            logger.error(
                f"Error generating structured JSON with Gemini: {str(e)}", exc_info=True
            )
            raise

    @staticmethod
    def estimate_token_count(text: str) -> int:
        """
        Estimate the number of tokens in a text for Gemini models.

        This is a rough approximation - Gemini doesn't have a direct token
        counting method like OpenAI's tiktoken.

        Args:
            text: Input text

        Returns:
            Estimated token count
        """
        # A simple approximation: ~4 characters per token for English text
        return len(text) // 4
