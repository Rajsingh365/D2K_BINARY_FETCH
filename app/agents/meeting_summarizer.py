# --- START OF FILE meeting_summarizer.py ---
from typing import Dict, Any, Optional, List
from app.agents.base import BaseAgent
from langchain.text_splitter import RecursiveCharacterTextSplitter
import re
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
    )  # Corrected log message
genai.configure(api_key=GOOGLE_API_KEY)


class MeetingSummarizer(BaseAgent):
    """Agent that summarizes meeting transcripts and extracts action items."""

    def __init__(self, summary_length: str = "medium", extract_actions: bool = True):
        super().__init__()
        self.summary_length = summary_length
        self.extract_actions = extract_actions
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=100
        )
        self.model = genai.GenerativeModel(
            "models/gemini-2.0-flash"
        )  # Initialize Gemini Model
        logger.info(
            f"Initializing MeetingSummarizer with summary_length={summary_length}, extract_actions={extract_actions}"
        )

    def process(
        self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process meeting transcript and generate summary.

        Args:
            input_data: Dict containing text content (transcript or other formats)
            context: Optional workflow context with original prompt

        Returns:
            Dict with meeting summary and action items
        """
        logger.info("Processing meeting transcript")
        # Extract text content
        transcript = self.extract_text_content(input_data)
        original_prompt = self.get_original_prompt(context) if context else ""

        if "transcript" not in input_data:
            input_data["transcript"] = transcript

        if not transcript or len(transcript.strip()) < 10:
            logger.warning("No transcript provided or transcript too short")
            return {
                "summary": "No transcript provided or transcript too short to summarize.",
                "action_items": [],
                "participants": [],
                "duration_minutes": 0,
            }

        try:
            # Use Gemini for all parts of the summarization
            summary = self._create_summary_with_gemini(
                transcript, prompt_context=original_prompt
            )
            participants = self._extract_participants_with_gemini(transcript)
            action_items = (
                self._extract_action_items_with_gemini(transcript)
                if self.extract_actions
                else []
            )
            duration = self._estimate_duration_with_gemini(transcript)

            # Store generated knowledge (remains the same)
            self.generated_knowledge = [
                {
                    "collection": "meeting_knowledge",
                    "document": f"Meeting summary: {summary}",
                    "metadata": {"type": "meeting_summary", "content_type": "summary"},
                }
            ]
            if action_items:
                self.generated_knowledge.append(
                    {
                        "collection": "meeting_knowledge",
                        "document": f"Action items: {json.dumps(action_items)}",
                        "metadata": {
                            "type": "meeting_summary",
                            "content_type": "action_items",
                        },
                    }
                )
            logger.info("Meeting processing with Gemini successful.")
            return {
                "summary": summary,
                "action_items": action_items,
                "participants": participants,
                "duration_minutes": duration,
                "transcript": transcript,
            }
        except Exception as e:
            logger.error(
                f"Gemini summarization failed: {str(e)}. Using fallback methods.",
                exc_info=True,
            )
            # Fallback methods (remain largely the same, but use _extract_key_points)
            participants = self._extract_participants(transcript)
            duration = self._estimate_duration(transcript)
            key_points = self._extract_key_points(transcript)  # Use key points
            summary = self._create_summary(key_points)  # Pass key_points
            action_items = (
                self._extract_action_items(transcript) if self.extract_actions else []
            )

            logger.info("Meeting processing with fallback methods successful.")
            return {
                "summary": summary,
                "action_items": action_items,
                "participants": participants,
                "duration_minutes": duration,
                "transcript": transcript,
            }

    def _create_summary_with_gemini(
        self, transcript: str, prompt_context: str = ""
    ) -> str:
        """Create meeting summary using Gemini."""
        length_desc = {
            "short": "a brief 2-3 sentence",
            "medium": "a comprehensive 1-paragraph",
            "long": "a detailed multi-paragraph",
        }.get(self.summary_length, "a 1-paragraph")

        prompt = f"""You are an AI that creates {length_desc} summary of meeting transcripts.
Focus on key discussions, decisions made, and important points.
Do NOT include metadata like meeting date, attendee list, or timestamps in the summary.
Provide a concise, business-appropriate summary focused only on the content of the discussions.

{"Focus on: " + prompt_context if prompt_context else ""}
Meeting Transcript:
{transcript}
"""
        try:
            response = self.model.generate_content(prompt)
            logger.info(f"Gemini summary generated (raw): {response.text}")  # Log Raw
            return response.text
        except Exception as e:
            logger.error(f"Error in _create_summary_with_gemini: {e}", exc_info=True)
            raise

    def _extract_participants_with_gemini(self, transcript: str) -> List[str]:
        """Extract meeting participants using Gemini."""
        prompt = f"""You are an AI that extracts the names of participants from meeting transcripts.
Focus on the actual people's names, not generic roles like 'Facilitator' or 'Note Taker'.
Look for names especially in the attendance list or speaker identifiers (like 'SJ:' for Sarah Johnson).
Return only the list of unique participant names in JSON format as an array of strings.

Meeting Transcript:
{transcript}
"""
        try:
            response = self.model.generate_content(prompt)
            logger.info(
                f"Gemini participants generated (raw): {response.text}"
            )  # Log Raw
            # Attempt to parse as JSON, with error handling.
            try:
                participants_text = response.text.strip()
                if "[" in participants_text and "]" in participants_text:
                    participants_text = participants_text[
                        participants_text.find("[") : participants_text.rfind("]") + 1
                    ]
                return json.loads(participants_text)
            except json.JSONDecodeError:
                logger.warning(
                    f"Failed to parse participants JSON: {response.text}.  Falling back to line-by-line extraction."
                )
                lines = response.text.strip().split("\n")
                participants = []
                for line in lines:
                    if ":" in line:
                        name = line.split(":")[0].strip()
                        if name and name not in participants:
                            participants.append(name)
                    elif "-" in line:
                        name = line.split("-")[0].strip()
                        if name and name not in participants:
                            participants.append(name)
                    elif line and not line.startswith(("1.", "2.", "•")):
                        participants.append(line.strip())
                return participants

        except Exception as e:
            logger.error(
                f"Error in _extract_participants_with_gemini: {e}", exc_info=True
            )
            raise

    def _extract_action_items_with_gemini(
        self, transcript: str
    ) -> List[Dict[str, Any]]:
        """Extract action items from transcript using Gemini."""
        prompt = f"""You are an AI that extracts action items and tasks from meeting transcripts.
Pay SPECIAL ATTENTION to lines explicitly labeled as 'ACTION ITEM:' or similar markers.
Look for clear assignments of responsibilities in the text.
For each action item, extract:
1. The task description (be specific and detailed)
2. The assignee (the person responsible)
3. Any deadline mentioned (e.g., 'by Thursday', 'today', etc.)

Return the list in JSON format as an array of objects with 'task', 'assignee', 'deadline' (if available), and 'status' fields.  The 'status' should always be set to 'pending'.

Example format:
[
    {{"task": "Prepare a budget report", "assignee": "Michael", "deadline": "Thursday", "status": "pending"}},
    {{"task": "Schedule team training", "assignee": "Sarah", "deadline": null, "status": "pending"}}
]

Meeting Transcript:
{transcript}
"""
        try:
            response = self.model.generate_content(prompt)
            logger.info(
                f"Gemini action items generated (raw): {response.text}"
            )  # Log raw
            # Attempt JSON parsing with error handling
            try:
                action_items_text = response.text.strip()
                if "[" in action_items_text and "]" in action_items_text:
                    action_items_text = action_items_text[
                        action_items_text.find("[") : action_items_text.rfind("]") + 1
                    ]
                return json.loads(action_items_text)
            except json.JSONDecodeError:
                logger.warning(
                    f"Failed to parse action items JSON: {response.text}. Returning empty list."
                )
                return []
        except Exception as e:
            logger.error(
                f"Error in _extract_action_items_with_gemini: {e}", exc_info=True
            )
            raise

    def _estimate_duration_with_gemini(self, transcript: str) -> int:
        """Estimate meeting duration using Gemini."""
        prompt = f"""You are an AI that estimates the duration of a meeting in minutes based on its transcript.
Consider factors like:
- The presence of timestamps (if any).
- The density of conversation (long blocks of text might indicate a longer meeting).
- The number of topics discussed.

Return ONLY the estimated duration as a single integer (number of minutes).
Do NOT include any explanations or extra text.

Meeting Transcript:
{transcript}
"""
        try:
            response = self.model.generate_content(prompt)
            logger.info(f"Gemini duration generated (raw): {response.text}")  # Log raw
            try:
                duration = int(response.text.strip())
                return min(max(duration, 1), 180)  # Cap at 3 hours, min 1 minute
            except ValueError:
                logger.warning(
                    f"Invalid duration from Gemini: {response.text}. Using fallback."
                )
                return self._estimate_duration(transcript)
        except Exception as e:
            logger.error(f"Error in _estimate_duration_with_gemini: {e}", exc_info=True)
            raise

    # --- Fallback Methods (Remain Largely Unchanged) ---
    def _extract_participants(self, transcript: str) -> List[str]:
        """Extract meeting participants from transcript."""
        participant_matches = re.findall(r"([A-Z][a-z]+):", transcript)
        participants = list(set(participant_matches))  # Remove duplicates
        return participants

    def _extract_key_points(self, transcript: str) -> str:
        """Extract key sentences for the fallback summary."""
        sentences = re.split(r"[.!?]+", transcript)
        sentences = [s.strip() for s in sentences if s.strip()]

        if len(sentences) <= 5:
            return " ".join(sentences)  # Return all if few sentences

        # Select key sentences: start, middle, and end
        selected_sentences = (
            sentences[:2]
            + sentences[len(sentences) // 2 : len(sentences) // 2 + 1]
            + sentences[-2:]
        )
        return " ".join(selected_sentences)

    def _estimate_duration(self, transcript: str) -> int:
        """Estimate meeting duration in minutes based on transcript length."""
        word_count = len(transcript.split())
        estimated_minutes = max(1, round(word_count / 150))
        return min(estimated_minutes, 180)  # Cap at 3 hours

    def _create_summary(self, key_points: str) -> str:
        """Create a basic summary using extracted key points."""
        return f"The meeting covered the following key points: {key_points}."

    def _extract_action_items(self, transcript: str) -> List[Dict[str, Any]]:
        """Extract action items from transcript."""
        action_patterns = [
            r"(?:TODO|TO-DO|Action item|Action|Task):\s*([^\n.]+)",
            r"([A-Z][a-z]+) (?:will|should|needs to|has to) ([^\n.]+)",
            r"(?:Let\'s|We should|We need to) ([^\n.]+)",
        ]

        action_items = []

        for pattern in action_patterns:
            matches = re.findall(pattern, transcript)
            for match in matches:
                if isinstance(match, tuple):
                    # Handle patterns with assignee groups
                    assignee = match[0]
                    task = match[1]
                    action_items.append(
                        {"task": task, "assignee": assignee, "status": "pending"}
                    )
                else:
                    # Handle patterns without assignee
                    action_items.append(
                        {"task": match, "assignee": None, "status": "pending"}
                    )

        return action_items

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "transcript": {
                    "type": "string",
                    "description": "Meeting transcript to summarize",
                },
                "content": {
                    "type": "string",
                    "description": "Alternative content field (will be used if transcript is not provided)",
                },
                # Add fields from other possible input sources for chaining
                "summary": {
                    "type": "string",
                    "description": "Summary from previous processing (will be used if no transcript/content)",
                },
                "email": {
                    "type": "object",
                    "description": "Email containing transcript in body field",
                },
            },
            "required": [],  # No fields required as we can extract from various inputs
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "Concise summary of the meeting",
                },
                "action_items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "task": {"type": "string"},
                            "assignee": {"type": ["string", "null"]},
                            "status": {"type": "string"},
                        },
                    },
                    "description": "Action items extracted from the meeting",
                },
                "participants": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Meeting participants",
                },
                "duration_minutes": {
                    "type": "integer",
                    "description": "Estimated meeting duration in minutes",
                },
            },
        }

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "summary_length": {
                    "type": "string",
                    "enum": ["short", "medium", "long"],
                    "description": "Desired length of meeting summary",
                },
                "extract_actions": {
                    "type": "boolean",
                    "description": "Whether to extract action items",
                },
            },
        }


# --- END OF FILE meeting_summarizer.py ---
