# --- app/data/sample_data.py ---
import json
from typing import Dict, Any
from app.models.workflow import WorkflowCreate, WorkflowUpdate
from fastapi import HTTPException
from app.core.agent_registry import AgentRegistry
import os


def load_sample_agents() -> Dict[int, Dict]:
    """Loads sample agents from a JSON file."""
    try:
        with open("app/data/sample_agents.json", "r") as f:
            agents = json.load(f)
            # Convert to dictionary keyed by ID
            return {agent["id"]: agent for agent in agents}
    except FileNotFoundError:
        print("WARNING: app/data/sample_agents.json not found.  Returning empty data.")
        return {}
    except json.JSONDecodeError:
        print(
            "WARNING: app/data/sample_agents.json contains invalid JSON. Returning empty data."
        )
        return {}


def load_sample_workflows() -> Dict[int, Dict]:
    """Loads sample workflows from a JSON file."""
    try:
        with open("app/data/sample_workflows.json", "r") as f:
            workflows = json.load(f)
            # Convert to dictionary keyed by ID
            return {workflow["id"]: workflow for workflow in workflows}
    except FileNotFoundError:
        print(
            "WARNING: app/data/sample_workflows.json not found. Returning empty data."
        )
        return {}
    except json.JSONDecodeError:
        print(
            "WARNING: app/data/sample_workflows.json contains invalid JSON. Returning empty data."
        )
        return {}


def add_workflow(dummy_data: Dict, workflow: WorkflowCreate) -> Dict:
    """Adds a new workflow to the dummy data."""

    # Basic validation (ensure agent IDs exist)
    for agent_data in workflow.agents:
        if agent_data.agent_id not in dummy_data["agents"]:
            raise HTTPException(
                status_code=400, detail=f"Agent with id {agent_data.agent_id} not found"
            )

    new_id = max(dummy_data["workflows"].keys(), default=0) + 1
    new_workflow = workflow.dict()
    new_workflow["id"] = new_id

    # Convert WorkflowAgentCreate to a simple dict for storage
    new_workflow["agents"] = [agent.dict() for agent in new_workflow["agents"]]
    for agent_data in new_workflow["agents"]:
        agent_data["id"] = agent_data["agent_id"]  # Assign agent id for dummy_db
        agent_data["workflow_id"] = new_id

    dummy_data["workflows"][new_id] = new_workflow
    return new_workflow


def update_workflow_data(
    dummy_data, workflow_id: int, workflow_update: WorkflowUpdate
) -> Dict:
    """Updates a workflow to the dummy data."""
    if workflow_id not in dummy_data["workflows"]:
        raise HTTPException(status_code=404, detail="Workflow not found")

    existing_workflow = dummy_data["workflows"][workflow_id]

    if workflow_update.name is not None:
        existing_workflow["name"] = workflow_update.name
    if workflow_update.description is not None:
        existing_workflow["description"] = workflow_update.description
    if workflow_update.category is not None:
        existing_workflow["category"] = workflow_update.category
    if workflow_update.is_template is not None:
        existing_workflow["is_template"] = workflow_update.is_template

    if workflow_update.agents is not None:
        # Clear the agents list
        existing_workflow["agents"] = []

        for agent_data in workflow_update.agents:
            if agent_data.agent_id not in dummy_data["agents"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Agent with id {agent_data.agent_id} not found",
                )
            agent_entry = agent_data.dict()
            agent_entry["id"] = agent_data.agent_id
            agent_entry["workflow_id"] = workflow_id
            existing_workflow["agents"].append(agent_entry)

    return existing_workflow


def delete_workflow_data(dummy_data, workflow_id: int) -> Dict:
    """Deletes a workflow from dummy data."""
    if workflow_id not in dummy_data["workflows"]:
        raise HTTPException(status_code=404, detail="Workflow not found")

    del dummy_data["workflows"][workflow_id]
    return {"message": f"Workflow {workflow_id} deleted successfully"}


# Create the sample JSON files (if they don't exist)
# This part will only execute when sample_data.py is run directly.
if __name__ == "__main__":
    sample_agents_data = [
        {
            "id": 1,
            "name": "SEO Optimizer",
            "description": "Analyzes content and provides SEO recommendations",
            "category": "marketing",
            "input_schema": {
                "type": "object",
                "properties": {
                    "content": {"type": "string"},
                    "keywords": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["content"],
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "keyword_analysis": {"type": "object"},
                    "recommendations": {"type": "array", "items": {"type": "string"}},
                    "seo_score": {"type": "number"},
                },
            },
            "config_schema": {
                "type": "object",
                "properties": {"collection_name": {"type": "string"}},
            },
            "implementation_path": "app.agents.seo_optimizer.SEOOptimizer",
        },
        {
            "id": 2,
            "name": "Meeting Summarizer",
            "description": "Summarizes meeting transcripts and extracts action items",
            "category": "productivity",
            "input_schema": {
                "type": "object",
                "properties": {"transcript": {"type": "string"}},
                "required": ["transcript"],
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string"},
                    "action_items": {"type": "array"},
                    "participants": {"type": "array"},
                    "duration_minutes": {"type": "integer"},
                },
            },
            "config_schema": {
                "type": "object",
                "properties": {
                    "summary_length": {
                        "type": "string",
                        "enum": ["short", "medium", "long"],
                    },
                    "extract_actions": {"type": "boolean"},
                },
            },
            "implementation_path": "app.agents.meeting_summarizer.MeetingSummarizer",
        },
        {
            "id": 3,
            "name": "Smart Email Manager",
            "description": "Categorizes, prioritizes, and drafts responses to emails",
            "category": "productivity",
            "input_schema": {
                "type": "object",
                "properties": {"email": {"type": "object"}},
                "required": ["email"],
            },
            "output_schema": {"type": "object"},
            "config_schema": {
                "type": "object",
                "properties": {
                    "mode": {
                        "type": "string",
                        "enum": ["categorize", "prioritize", "draft_response"],
                    },
                    "response_tone": {
                        "type": "string",
                        "enum": ["professional", "friendly", "concise"],
                    },
                },
            },
            "implementation_path": "app.agents.smart_email_manager.SmartEmailManager",
        },
        {
            "id": 4,
            "name": "Grammar and Style Checker",
            "description": "Checks and corrects grammar/style errors",
            "category": "content",
            "input_schema": {
                "type": "object",
                "properties": {"content": {"type": "string"}},
                "required": ["content"],
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "corrected_text": {"type": "string"},
                    "grammar_issues": {"type": "array", "items": {"type": "string"}},
                },
            },
            "config_schema": {},
            "implementation_path": "app.agents.grammar_and_style_checker.GrammarAndStyleChecker",
        },
        {
            "id": 5,
            "name": "Zoom Meeting Scheduler",
            "description": "Schedules zoom meetings based on provided information",
            "category": "productivity",
            "input_schema": {
                "type": "object",
                "properties": {
                    "meeting_title": {
                        "type": "string",
                        "description": "Title of the meeting",
                    },
                    "participants": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of email addresses of participants",
                    },
                    "start_time": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Start time of the meeting in ISO format",
                    },
                    "duration": {
                        "type": "integer",
                        "description": "Duration of meeting in minutes",
                    },
                    "agenda": {
                        "type": "string",
                        "description": "Meeting agenda/description",
                    },
                },
                "required": ["meeting_title", "participants", "start_time", "duration"],
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "meeting_id": {
                        "type": "string",
                        "description": "ID of the scheduled meeting",
                    },
                    "join_url": {
                        "type": "string",
                        "description": "URL for participants to join the meeting",
                    },
                    "start_url": {
                        "type": "string",
                        "description": "URL for the host to start the meeting",
                    },
                    "status": {
                        "type": "string",
                        "description": "Status of the meeting creation",
                    },
                },
            },
            "config_schema": {
                "type": "object",
                "properties": {
                    "use_pmi": {
                        "type": "boolean",
                        "description": "Whether to use Personal Meeting ID",
                        "default": False,
                    },
                    "auto_recording": {
                        "type": "string",
                        "enum": ["none", "local", "cloud"],
                        "default": "none",
                        "description": "Automatic recording option",
                    },
                    "mute_upon_entry": {
                        "type": "boolean",
                        "default": True,
                        "description": "Whether to mute participants upon entry",
                    },
                },
            },
            "implementation_path": "app.agents.zoom_meeting_scheduler.ZoomMeetingScheduler",
        },
    ]

    sample_workflows_data = [
        {
            "id": 1,
            "name": "Marketing Content Optimizer",
            "description": "Optimize marketing content for SEO and engagement",
            "category": "marketing",
            "is_template": True,
            "agents": [
                {"agent_id": 1, "order": 1, "config": {}, "id": 1, "workflow_id": 1}
            ],  # Use agent IDs
        },
        {
            "id": 2,
            "name": "Meeting Productivity Suite",
            "description": "Summarize meetings and manage follow-up emails",
            "category": "productivity",
            "is_template": True,
            "agents": [
                {"agent_id": 2, "order": 1, "config": {}, "id": 2, "workflow_id": 2},
                {"agent_id": 3, "order": 2, "config": {}, "id": 3, "workflow_id": 2},
            ],
        },
        {
            "id": 3,
            "name": "Meeting Management Suite",
            "description": "Schedule, prepare, and follow up on meetings efficiently",
            "category": "productivity",
            "is_template": True,
            "agents": [
                {
                    "agent_id": 5,
                    "order": 1,
                    "config": {"mute_upon_entry": True, "auto_recording": "cloud"},
                    "id": 5,
                    "workflow_id": 3,
                },
                {
                    "agent_id": 2,
                    "order": 2,
                    "config": {"summary_length": "medium", "extract_actions": True},
                    "id": 2,
                    "workflow_id": 3,
                },
            ],
        },
    ]

    # Ensure the directory exists
    os.makedirs("app/data", exist_ok=True)

    # Check and write sample agents data
    if not os.path.exists("app/data/sample_agents.json"):
        with open("app/data/sample_agents.json", "w") as f:
            json.dump(sample_agents_data, f, indent=4)
        print("Created app/data/sample_agents.json")

    # Check and write sample workflows data
    if not os.path.exists("app/data/sample_workflows.json"):
        with open("app/data/sample_workflows.json", "w") as f:
            json.dump(sample_workflows_data, f, indent=4)
        print("Created app/data/sample_workflows.json")
