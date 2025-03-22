# app/agents/zoom_meeting_scheduler.py
import os
import json
import time
import hmac
import hashlib
import base64
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from app.agents.base import BaseAgent
import logging

logger = logging.getLogger(__name__)

load_dotenv()


class ZoomMeetingScheduler(BaseAgent):
    """
    An agent that schedules Zoom meetings.
    """

    def __init__(self, user_id: str = "me"):
        super().__init__()
        self.api_key = os.getenv("ZOOM_API_KEY")
        self.api_secret = os.getenv("ZOOM_API_SECRET")
        self.user_id = user_id  # User ID or email (defaults to 'me' for self)
        if not self.api_key or not self.api_secret:
            raise ValueError("ZOOM_API_KEY and ZOOM_API_SECRET must be set in .env")
        logger.info(f"Initializing ZoomMeetingScheduler with user_id: {self.user_id}")

    def _generate_jwt(self) -> str:
        """Generates a JWT for Zoom API authentication."""
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {"iss": self.api_key, "exp": int(time.time() + 3600)}  # 1 hour expiry

        header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode()
        payload_encoded = base64.urlsafe_b64encode(
            json.dumps(payload).encode()
        ).decode()

        signature = hmac.new(
            self.api_secret.encode(),
            f"{header_encoded}.{payload_encoded}".encode(),
            hashlib.sha256,
        ).digest()
        signature_encoded = base64.urlsafe_b64encode(signature).decode()

        return f"{header_encoded}.{payload_encoded}.{signature_encoded}"

    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Schedules a Zoom meeting based on the input in the state.
        """
        # Extract meeting details from state (adapt as needed)
        topic = state.get("meeting_topic", "My Meeting")  # Default values
        start_time = state.get(
            "meeting_start_time", "2024-12-31T12:00:00"
        )  # Example: ISO 8601 format
        duration = int(state.get("meeting_duration", 60))  # Default to 60 minutes
        timezone = state.get("timezone", "UTC")  # default

        # Construct meeting data
        meeting_data = {
            "topic": topic,
            "type": 2,  # Scheduled meeting
            "start_time": start_time,
            "duration": duration,
            "timezone": timezone,
            "settings": {
                "host_video": True,
                "participant_video": True,
                "join_before_host": False,
                "mute_upon_entry": False,
                "watermark": False,
                "use_pmi": False,  # Don't use Personal Meeting ID
            },
        }

        # Generate JWT token
        jwt_token = self._generate_jwt()
        headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json",
        }

        # Make API call to Zoom
        try:
            response = requests.post(
                f"https://api.zoom.us/v2/users/{self.user_id}/meetings",
                headers=headers,
                json=meeting_data,
            )
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
            meeting_info = response.json()

            # Update the state with the meeting details
            state["meeting_info"] = meeting_info
            logger.info(f"Zoom meeting scheduled: {meeting_info}")
            return state  # Return the updated state

        except requests.exceptions.RequestException as e:
            logger.error(f"Error scheduling Zoom meeting: {e}", exc_info=True)
            state["error"] = f"Failed to schedule Zoom meeting: {e}"  # Update the state
            return state
        except Exception as e:
            logger.error(f"Error scheduling Zoom meeting: {e}", exc_info=True)
            state["error"] = f"Failed to schedule Zoom meeting: {e}"  # Update the state
            return state

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "meeting_topic": {
                    "type": "string",
                    "description": "The topic of the meeting.",
                },
                "meeting_start_time": {
                    "type": "string",
                    "format": "date-time",
                    "description": "The start time of the meeting in ISO 8601 format (YYYY-MM-DDTHH:MM:SS).",
                },
                "meeting_duration": {
                    "type": "integer",
                    "description": "The duration of the meeting in minutes.",
                },
                "timezone": {
                    "type": "string",
                    "description": "Timezone of the meeting",
                },
            },
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "meeting_info": {
                    "type": "object",
                    "description": "Details of the scheduled Zoom meeting (returned by Zoom API).",
                },
                "error": {
                    "type": "string",
                    "description": "Error message, if any.",
                },
            },
        }

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "user id of the zoom account",
                }
            },
        }

    def build_chain(self):
        pass  # No chain needed
