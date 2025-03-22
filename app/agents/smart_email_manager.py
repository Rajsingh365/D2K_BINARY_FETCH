# --- START OF FILE smart_email_manager.py ---
from typing import Dict, Any, Optional, List
from app.agents.base import BaseAgent
import re
from datetime import datetime
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Load environment variables including Google API key
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


class SmartEmailManager(BaseAgent):
    """Agent that helps manage emails by categorizing, prioritizing, and generating responses."""

    def __init__(self, mode: str = "categorize", response_tone: str = "professional"):
        super().__init__()
        self.mode = mode  # categorize, prioritize, draft_response
        self.response_tone = response_tone  # professional, friendly, concise
        self.model = genai.GenerativeModel(
            "models/gemini-2.0-flash"
        )  # Initialize Gemini Model
        logger.info(
            f"Initializing SmartEmailManager with mode={mode}, response_tone={response_tone}"
        )

    def process(
        self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process input data based on the selected mode.

        Args:
            input_data: Dict containing content in various formats
            context: Optional workflow context with original prompt

        Returns:
            Dict with processed email data
        """
        logger.info(f"Processing email with mode: {self.mode}")
        # Get original user prompt if available
        original_prompt = self.get_original_prompt(context) if context else ""

        # Determine the content type we're dealing with
        content_type = self._detect_content_type(input_data)
        logger.info(f"Detected content type: {content_type}")

        # Extract or create email object
        email = input_data.get("email", {})

        # If email is completely missing or not a dict, create an email dict from available data
        if not email or not isinstance(email, dict):
            if content_type == "meeting_summary":
                # Create a more useful email from meeting summary
                email = self._create_email_from_meeting_summary(input_data)
            elif content_type == "seo_optimization":
                # Create email from SEO optimization data
                email = self._create_email_from_seo_data(input_data)
            elif "content" in input_data:
                # Create from content field
                email = {
                    "subject": input_data.get("title", "Content Processing"),
                    "body": input_data["content"],
                    "sender": "content-processor@example.com",
                    "sender_name": "Content Processor",
                }
            elif "summary" in input_data:
                # Create from just a summary
                email = {
                    "subject": "Content Summary",
                    "body": input_data["summary"],
                    "sender": "summary@example.com",
                    "sender_name": "Summary Generator",
                }
            elif "error" in input_data and "agent_id" in input_data:
                # This is likely output from a previous failed agent
                email = {
                    "subject": "Processed Agent Output",
                    "body": str(input_data.get("error", "No content available")),
                    "sender": "system@example.com",
                    "sender_name": "System",
                }
            else:
                # Create a minimal email from whatever text we can extract
                extracted_text = self.extract_text_content(input_data)
                email = {
                    "subject": "Extracted Content",
                    "body": extracted_text or str(input_data),
                    "sender": "unknown@example.com",
                    "sender_name": "Unknown",
                }

        # Add categories and priority to email if they're in input (from previous steps)
        if "categories" in input_data:
            email["categories"] = input_data["categories"]
        if "priority_level" in input_data:
            email["priority_level"] = input_data["priority_level"]

        # Store content type for use in response generation
        email["content_type"] = content_type

        # Process based on mode
        try:
            if self.mode == "categorize":
                result = self._categorize_email(email)
            elif self.mode == "prioritize":
                result = self._prioritize_email(email)
            elif self.mode == "draft_response":
                # Generate response based on detected content type
                result = self._draft_content_based_response(
                    email, input_data, user_prompt=original_prompt
                )
            else:
                result = {"error": f"Unknown mode: {self.mode}", "status": "failed"}

            # Store generated knowledge for RAG
            if "response_body" in result:
                self.generated_knowledge = [
                    {
                        "collection": "email_templates",
                        "document": result["response_body"],
                        "metadata": {
                            "type": "email_response",
                            "tone": self.response_tone,
                            "subject": email.get("subject", "No Subject"),
                        },
                    }
                ]
            logger.info(f"Email processing successful. Result: {result}")
            return result

        except Exception as e:
            logger.error(f"Error processing email: {str(e)}", exc_info=True)
            return {"error": f"Email processing failed: {str(e)}", "status": "failed"}

    def _detect_content_type(self, input_data: Dict[str, Any]) -> str:
        """Detect the type of content received from previous agents."""
        # Check for meeting summary specific fields
        if "summary" in input_data and any(
            [
                "action_items" in input_data,
                "participants" in input_data,
                "duration_minutes" in input_data,
            ]
        ):
            return "meeting_summary"

        # Check for SEO optimization results
        if "recommendations" in input_data and "seo_score" in input_data:
            return "seo_optimization"

        # Check for grammar checking results
        if "corrected_text" in input_data and "grammar_issues" in input_data:
            return "grammar_check"

        # Default to generic content
        return "generic_content"

    def _create_email_from_meeting_summary(
        self, meeting_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create an email object from meeting summary data."""
        summary = meeting_data.get("summary", "")
        action_items = meeting_data.get("action_items", [])
        participants = meeting_data.get("participants", [])

        subject = "Meeting Summary"
        if ":" in summary and len(summary.split(":")[0]) < 50:
            subject = summary.split(":")[0].strip()

        # Format action items and participants
        action_items_text = (
            "\n".join(
                f"{i}. {item['task']} ({item.get('assignee', 'Unassigned')})"
                for i, item in enumerate(action_items, 1)
            )
            if action_items
            else ""
        )
        participants_text = (
            ", ".join(participants) if participants else "No participants listed"
        )

        body = f"Summary:\n{summary}\n\nParticipants: {participants_text}\n\nAction Items:\n{action_items_text}"

        sender_name = (
            meeting_data["participants"][0]
            if meeting_data.get("participants")
            else "Team Member"
        )

        return {
            "subject": subject,
            "body": body,
            "sender": "meeting-summary@company.com",
            "sender_name": sender_name,
        }

    def _create_email_from_seo_data(self, seo_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an email object from SEO optimization data."""
        content = seo_data.get("content", "")
        recommendations = seo_data.get("recommendations", [])
        seo_score = seo_data.get("seo_score", 0)
        keywords = seo_data.get("keywords", [])

        subject = "SEO Optimization Results"

        # Format recommendations and keywords
        recommendations_text = (
            "\n".join([f"- {rec}" for rec in recommendations])
            if recommendations
            else "No specific recommendations."
        )
        keywords_text = ", ".join(keywords) if keywords else "No specific keywords."

        body = f"SEO Analysis Results\n\nSEO Score: {seo_score}/100\n\nTarget Keywords: {keywords_text}\n\nRecommendations:\n{recommendations_text}\n\nAnalyzed Content:\n{content[:300]}..."

        return {
            "subject": subject,
            "body": body,
            "sender": "seo-analyzer@company.com",
            "sender_name": "SEO Analyzer",
        }

    def _draft_meeting_summary_response(
        self, email: Dict[str, Any], meeting_data: Dict[str, Any], user_prompt: str = ""
    ) -> Dict[str, Any]:
        """Generate a response specifically for meeting summary emails."""
        try:
            response_body = self._generate_meeting_response_with_gemini(
                email.get("subject", "Meeting Summary"),
                email.get("body", ""),
                meeting_data,
                user_prompt=user_prompt,
            )
            return {
                "email_id": email.get("id", "unknown"),
                "subject": f"Re: {email.get('subject', 'Meeting Summary')}",
                "response_body": response_body,
                "suggested_follow_up": "in 1 day"
                if meeting_data.get("action_items")
                else None,
                "status": "success",
                "original_content": meeting_data.get("summary", ""),  # For chaining
            }
        except Exception as e:
            logger.error(
                f"Error generating meeting response with Gemini: {str(e)}",
                exc_info=True,
            )
            # Fall back to standard response
            return self._draft_response(email, user_prompt=user_prompt)

    def _generate_meeting_response_with_gemini(
        self,
        subject: str,
        body: str,
        meeting_data: Dict[str, Any],
        user_prompt: str = "",
    ) -> str:
        """Generate a meeting-specific email response using Gemini."""
        action_items = meeting_data.get("action_items", [])
        participants = meeting_data.get("participants", [])

        # Format action items for the prompt
        action_items_text = (
            "\n".join(
                f"{i}. {item['task']} (Assigned to: {item.get('assignee', 'Unassigned')})"
                for i, item in enumerate(action_items, 1)
            )
            if action_items
            else "No action items."
        )

        # Format participants for the prompt
        participants_text = (
            ", ".join(participants) if participants else "No participants listed."
        )

        tone_desc = {
            "professional": "formal, business-appropriate",
            "friendly": "warm and conversational",
            "concise": "brief and to-the-point",
        }.get(self.response_tone, "professional")

        # STRUCTURED SYSTEM PROMPT (Meeting Specific)
        prompt = f"""You are an AI assistant drafting a {tone_desc} email response to a meeting summary.

**Meeting Details:**
* Subject: {subject}
* Participants: {participants_text}
* Action Items: {action_items_text}

**User's Specific Instructions (If Any):**
{user_prompt}

**Response Requirements:**
1. Acknowledge receipt of the summary.
2. Briefly recap 1-2 key discussion points.
3. Highlight any urgent action items.
4. Suggest a follow-up action (e.g., schedule another meeting, send update).
5. Use a {tone_desc} tone.
6. Include a professional greeting and sign-off.

Meeting Summary:
{body}
"""
        try:
            response = self.model.generate_content(prompt)
            logger.info(
                f"Gemini meeting response generated (raw): {response.text}"
            )  # Log Raw
            return response.text
        except Exception as e:
            logger.error(
                f"Error in _generate_meeting_response_with_gemini: {e}", exc_info=True
            )
            raise

    def _draft_content_based_response(
        self, email: Dict[str, Any], input_data: Dict[str, Any], user_prompt: str = ""
    ) -> Dict[str, Any]:
        """Generate a response based on the detected content type."""
        content_type = email.get("content_type", "generic_content")

        try:
            if content_type == "meeting_summary":
                return self._draft_meeting_summary_response(
                    email, input_data, user_prompt=user_prompt
                )
            elif content_type == "seo_optimization":
                return self._draft_seo_response(
                    email, input_data, user_prompt=user_prompt
                )
            elif content_type == "grammar_check":
                return self._draft_grammar_check_response(
                    email, input_data, user_prompt=user_prompt
                )
            else:
                # For generic content, use the standard response generator
                return self._draft_response(email, user_prompt=user_prompt)
        except Exception as e:
            logger.error(f"Error in content-based response: {str(e)}", exc_info=True)
            # Fall back to standard response
            return self._draft_response(email, user_prompt=user_prompt)

    def _draft_seo_response(
        self, email: Dict[str, Any], seo_data: Dict[str, Any], user_prompt: str = ""
    ) -> Dict[str, Any]:
        """Generate a response for SEO optimization results."""
        try:
            response_body = self._generate_seo_response_with_gemini(
                email.get("subject", "SEO Analysis"),
                email.get("body", ""),
                seo_data,
                user_prompt=user_prompt,
            )
            return {
                "email_id": email.get("id", "unknown"),
                "subject": f"Re: {email.get('subject', 'SEO Analysis')}",
                "response_body": response_body,
                "suggested_follow_up": "in 1 week for SEO progress check",
                "status": "success",
                "original_content": seo_data.get("content", ""),  # For chaining
            }
        except Exception as e:
            logger.error(
                f"Error generating SEO response with Gemini: {str(e)}",
                exc_info=True,
            )
            # Fall back to standard response
            return self._draft_response(email, user_prompt=user_prompt)

    def _generate_seo_response_with_gemini(
        self,
        subject: str,
        body: str,
        seo_data: Dict[str, Any],
        user_prompt: str = "",
    ) -> str:
        """Generate an SEO-specific email response using Gemini."""
        recommendations = seo_data.get("recommendations", [])
        seo_score = seo_data.get("seo_score", 0)
        keywords = seo_data.get("keywords", [])

        # Format recommendations for the prompt
        recommendations_text = (
            "\n".join([f"- {rec}" for rec in recommendations])
            if recommendations
            else "No specific recommendations."
        )

        tone_desc = {
            "professional": "formal, business-appropriate",
            "friendly": "warm and conversational",
            "concise": "brief and to-the-point",
        }.get(self.response_tone, "professional")

        # STRUCTURED SYSTEM PROMPT (SEO Specific)
        prompt = f"""You are an AI assistant drafting a {tone_desc} email response to SEO optimization results.

**SEO Analysis Details:**
* Subject: {subject}
* SEO Score: {seo_score}/100
* Target Keywords: {", ".join(keywords) if keywords else "None specified"}

**SEO Recommendations:**
{recommendations_text}

**User's Specific Instructions (If Any):**
{user_prompt}

**Response Requirements:**
1. Acknowledge the SEO analysis results.
2. Highlight the most important 2-3 recommendations.
3. Suggest next steps for implementation.
4. Use a {tone_desc} tone.
5. Include a professional greeting and sign-off.

Original Content:
{body}
"""
        try:
            response = self.model.generate_content(prompt)
            logger.info(f"Gemini SEO response generated (raw): {response.text}")
            return response.text
        except Exception as e:
            logger.error(
                f"Error in _generate_seo_response_with_gemini: {e}", exc_info=True
            )
            raise

    def _draft_grammar_check_response(
        self, email: Dict[str, Any], grammar_data: Dict[str, Any], user_prompt: str = ""
    ) -> Dict[str, Any]:
        """Generate a response for grammar check results."""
        try:
            response_body = self._generate_grammar_response_with_gemini(
                email.get("subject", "Grammar Check"),
                email.get("body", ""),
                grammar_data,
                user_prompt=user_prompt,
            )
            return {
                "email_id": email.get("id", "unknown"),
                "subject": f"Re: {email.get('subject', 'Grammar Check')}",
                "response_body": response_body,
                "suggested_follow_up": None,
                "status": "success",
                "original_content": grammar_data.get(
                    "corrected_text", ""
                ),  # For chaining
            }
        except Exception as e:
            logger.error(
                f"Error generating grammar response with Gemini: {str(e)}",
                exc_info=True,
            )
            # Fall back to standard response
            return self._draft_response(email, user_prompt=user_prompt)

    def _generate_grammar_response_with_gemini(
        self,
        subject: str,
        body: str,
        grammar_data: Dict[str, Any],
        user_prompt: str = "",
    ) -> str:
        """Generate a grammar-check specific email response using Gemini."""
        corrected_text = grammar_data.get("corrected_text", "")
        issues = grammar_data.get("grammar_issues", [])

        # Format issues for the prompt
        issues_text = (
            "\n".join([f"- {issue}" for issue in issues])
            if issues
            else "No major grammar issues found."
        )

        tone_desc = {
            "professional": "formal, business-appropriate",
            "friendly": "warm and conversational",
            "concise": "brief and to-the-point",
        }.get(self.response_tone, "professional")

        # STRUCTURED SYSTEM PROMPT (Grammar Check Specific)
        prompt = f"""You are an AI assistant drafting a {tone_desc} email response to grammar check results.

**Grammar Check Details:**
* Subject: {subject}
* Number of Issues: {len(issues)}

**Grammar Issues Identified:**
{issues_text}

**User's Specific Instructions (If Any):**
{user_prompt}

**Response Requirements:**
1. Acknowledge the grammar check results.
2. Briefly mention the most important improvements.
3. Provide any relevant writing tips.
4. Use a {tone_desc} tone.
5. Include a professional greeting and sign-off.

Original Content:
{body}
"""
        try:
            response = self.model.generate_content(prompt)
            logger.info(f"Gemini grammar response generated (raw): {response.text}")
            return response.text
        except Exception as e:
            logger.error(
                f"Error in _generate_grammar_response_with_gemini: {e}", exc_info=True
            )
            raise

    def _categorize_email(self, email: Dict[str, Any]) -> Dict[str, Any]:
        """Categorize email based on content and metadata."""
        subject = email.get("subject", "")
        body = email.get("body", "")
        sender = email.get("sender", "")

        # Initialize categories
        categories = []

        # Check for internal/external
        if "@ourcompany.com" in sender:
            categories.append("internal")
        else:
            categories.append("external")

        # Look for content-based categories
        category_keywords = {
            "sales": ["purchase", "buy", "order", "customer", "pricing", "quote"],
            "support": [
                "help",
                "issue",
                "problem",
                "doesn't work",
                "broken",
                "fix",
                "error",
            ],
            "marketing": [
                "campaign",
                "promotion",
                "advertis",
                "market",
                "social media",
            ],
            "finance": ["invoice", "payment", "bill", "budget", "expense", "financial"],
            "hr": ["vacation", "leave", "benefits", "hiring", "interview", "salary"],
            "legal": ["contract", "agreement", "compliance", "legal", "terms"],
            "product": ["feature", "improvement", "suggestion", "roadmap", "product"],
        }

        content = f"{subject} {body}".lower()

        for category, keywords in category_keywords.items():
            if any(keyword in content for keyword in keywords):
                categories.append(category)

        # If no content category, mark as "general"
        if len(categories) == 1:  # Only has internal/external
            categories.append("general")

        return {
            "email_id": email.get("id", "unknown"),
            "categories": categories,
            "categorization_confidence": 0.85,  # In a real system, this would be calculated
            "status": "success",
        }

    def _prioritize_email(self, email: Dict[str, Any]) -> Dict[str, Any]:
        """Prioritize email based on content, sender, and time sensitivity."""
        subject = email.get("subject", "").lower()
        body = email.get("body", "").lower()
        sender = email.get("sender", "")
        received_time = email.get("received_time", datetime.now().isoformat())

        # Initialize priority score (0-100)
        priority_score = 50

        # Check for urgency keywords
        urgency_keywords = [
            "urgent",
            "asap",
            "immediate",
            "emergency",
            "critical",
            "important",
            "deadline",
        ]
        if any(keyword in subject for keyword in urgency_keywords):
            priority_score += 20
        if any(keyword in body for keyword in urgency_keywords):
            priority_score += 10

        # Check sender domain for VIPs
        vip_domains = ["bigcustomer.com", "partner.com", "investor.com"]
        if any(domain in sender for domain in vip_domains):
            priority_score += 15

        # Check for time-sensitive words and dates
        time_words = ["today", "tomorrow", "asap", "soon", "this week"]
        if any(word in body for word in time_words):
            priority_score += 10

        # Look for question marks (indicates a question needing answer)
        if "?" in body:
            priority_score += 5

        # Calculate priority level
        if priority_score >= 80:
            priority_level = "urgent"
        elif priority_score >= 60:
            priority_level = "high"
        elif priority_score >= 40:
            priority_level = "medium"
        else:
            priority_level = "low"

        return {
            "email_id": email.get("id", "unknown"),
            "priority_score": priority_score,
            "priority_level": priority_level,
            "time_sensitive": priority_score >= 70,
            "needs_response": "?" in body
            or any(keyword in body for keyword in urgency_keywords),
            "status": "success",
        }

    def _draft_response(
        self, email: Dict[str, Any], user_prompt: str = ""
    ) -> Dict[str, Any]:
        """Draft a response to the email based on its content using Gemini."""
        subject = email.get("subject", "No Subject")
        body = email.get("body", "")

        # IMPROVED SENDER NAME HANDLING
        sender_name = email.get("sender_name", "")
        if not sender_name:
            if "participants" in email and email["participants"]:
                sender_name = email["participants"][0]  # First participant
            else:
                sender_name = "Sender"  # Neutral default

        # Get categories and priority (from previous agents, if available!)
        categories = email.get("categories", [])
        priority_level = email.get("priority_level", "medium")

        try:
            # --- KEY CHANGE: Extract key points BEFORE calling Gemini ---
            key_points = self._extract_key_points_with_gemini(body)

            response_body = self._generate_response_with_gemini(
                subject,
                body,
                sender_name,
                key_points,
                categories,
                priority_level,
                user_prompt=user_prompt,
            )

            return {
                "email_id": email.get("id", "unknown"),
                "subject": f"Re: {subject}",
                "response_body": response_body,
                "suggested_follow_up": "in 2 days" if "?" in body else None,
                "status": "success",
                "original_content": body,  # For chaining
            }

        except Exception as e:
            logger.error(f"General error in _draft_response: {str(e)}", exc_info=True)
            return self._draft_response_with_templates(
                email, sender_name
            )  # Pass sender_name

    def _extract_key_points_with_gemini(self, body: str) -> str:
        """Extract the 2-3 most important sentences from an email body using Gemini."""
        logger.info("Extracting key points with Gemini")
        prompt = (
            """You are an AI that extracts the 2-3 most important sentences from a text.
Return ONLY these sentences, separated by newlines.
Do NOT include any introductory or concluding text.

Email Body:
"""
            + body
        )

        try:
            response = self.model.generate_content(prompt)
            result = response.text.strip()
            logger.info(f"Extracted key points (processed): {result}")
            return result
        except Exception as e:
            logger.error(
                f"Error in _extract_key_points_with_gemini: {e}", exc_info=True
            )
            return ""  # Return empty in case of failure.

    def _generate_response_with_gemini(
        self,
        subject: str,
        body: str,
        sender_name: str,
        key_points: str,
        categories: List[str],
        priority_level: str,
        user_prompt: str = "",
    ) -> str:
        """Generate an email response using Gemini."""
        tone_descriptions = {
            "professional": "formal, polite, and business-appropriate",
            "friendly": "warm, personable, and conversational",
            "concise": "brief, direct, and to-the-point without unnecessary details",
        }
        tone_desc = tone_descriptions.get(self.response_tone, "professional")

        # --- KEY CHANGE: STRUCTURED SYSTEM PROMPT ---
        prompt = f"""You are an AI assistant that drafts email responses.
Create a {tone_desc} response.

**Email Details:**
* Subject: {subject}
* Sender: {sender_name}
* Category: {", ".join(categories) if categories else "General"}
* Priority: {priority_level}

**Key Points to Address (Summarize These):**
{key_points}

**User's Specific Instructions (If Any):**
{user_prompt}

**Response Requirements:**
1. Acknowledge the email.
2. Briefly address the key points.
3. Use a {tone_desc} tone.
4. Include a greeting and sign-off.

Original Email Body:
{body}
"""
        try:
            response = self.model.generate_content(prompt)
            response_content = response.text.strip()
            logger.info(f"Generated response (processed): {response_content}")
            return response_content
        except Exception as e:
            logger.error(
                f"Error in _generate_response_with_gemini: {str(e)}", exc_info=True
            )
            return ""

    def _draft_response_with_templates(
        self, email: Dict[str, Any], sender_name: str
    ) -> Dict[str, Any]:
        """Fallback method to draft email responses using templates."""
        subject = email.get("subject", "No Subject")
        body = email.get("body", "")

        # --- IMPROVED FALLBACK LOGIC ---
        greetings = {
            "professional": f"Dear {sender_name},",
            "friendly": f"Hi {sender_name},",
            "concise": f"Hi {sender_name},",
        }
        signoffs = {
            "professional": "Best regards,\n[Your Name]",
            "friendly": "Thanks,\n[Your Name]",
            "concise": "Regards,\n[Your Name]",
        }
        greeting = greetings[self.response_tone]
        signoff = signoffs[self.response_tone]

        # More sophisticated template selection
        if "?" in body:
            response_body = "Thank you for your question. I will look into this and get back to you shortly."
            if self.response_tone == "professional":
                response_body += "\n\nPlease don't hesitate to contact me if you need further assistance."
        elif any(
            word in body.lower() for word in ["thanks", "thank you", "appreciate"]
        ):
            response_body = (
                "You're welcome! Let me know if I can help with anything else."
            )
        elif "urgent" in body.lower() or "asap" in body.lower():
            response_body = (
                "I've received your urgent request and will prioritize it accordingly."
            )
        else:
            # Try to extract the first sentence or two as a VERY basic summary
            sentences = re.split(r"(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s", body)
            summary_part = " ".join(sentences[:2]) if sentences else ""
            response_body = f"Thank you for your email regarding {summary_part}. I will review it and respond as needed."

        response = f"{greeting}\n\n{response_body}\n\n{signoff}"

        return {
            "email_id": email.get("id", "unknown"),
            "subject": f"Re: {subject}",
            "response_body": response,
            "suggested_follow_up": "in 2 days" if "?" in body else None,
            "status": "success",
        }

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "email": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "subject": {"type": "string"},
                        "body": {"type": "string"},
                        "sender": {"type": "string"},
                        "sender_name": {"type": "string"},
                        "received_time": {"type": "string", "format": "date-time"},
                    },
                },
                # Add additional fields for integration with other agents
                "content": {
                    "type": "string",
                    "description": "Main content to process if no email object",
                },
                "summary": {
                    "type": "string",
                    "description": "Summary text from previous agent",
                },
                "action_items": {
                    "type": "array",
                    "description": "Action items from meeting summarizer",
                },
                "transcript": {
                    "type": "string",
                    "description": "Meeting transcript from previous agent",
                },
                "participants": {
                    "type": "array",
                    "description": "Meeting participants from previous agent",
                },
                # Add fields for capturing output from previous agents
                "categories": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Categories of email from previous agent",
                },
                "priority_level": {
                    "type": "string",
                    "description": "Email Priority level from previous agent",
                },
            },
            "required": [],  # No requirements as we'll adapt to whatever is provided
        }

    def get_output_schema(self) -> Dict[str, Any]:
        schemas = {
            "categorize": {
                "type": "object",
                "properties": {
                    "email_id": {"type": "string"},
                    "categories": {"type": "array", "items": {"type": "string"}},
                    "categorization_confidence": {"type": "number"},
                    "status": {"type": "string"},
                },
            },
            "prioritize": {
                "type": "object",
                "properties": {
                    "email_id": {"type": "string"},
                    "priority_score": {"type": "number"},
                    "priority_level": {"type": "string"},
                    "time_sensitive": {"type": "boolean"},
                    "needs_response": {"type": "boolean"},
                    "status": {"type": "string"},
                },
            },
            "draft_response": {
                "type": "object",
                "properties": {
                    "email_id": {"type": "string"},
                    "subject": {"type": "string"},
                    "response_body": {"type": "string"},
                    "suggested_follow_up": {"type": ["string", "null"]},
                    "status": {"type": "string"},
                },
            },
        }

        return schemas.get(self.mode, {"type": "object"})

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "mode": {
                    "type": "string",
                    "enum": ["categorize", "prioritize", "draft_response"],
                    "description": "Operation mode for the email manager",
                },
                "response_tone": {
                    "type": "string",
                    "enum": ["professional", "friendly", "concise"],
                    "description": "Tone to use for email responses",
                },
            },
        }


# --- END OF FILE smart_email_manager.py ---
