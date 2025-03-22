"""
Sample data generator for populating the database with initial agents and templates.
This is useful for demo/hackathon purposes.
"""

from sqlalchemy.orm import Session
from app.db.models import Agent, Workflow, WorkflowAgent


def create_sample_data(db: Session):
    """Create sample data for the marketplace."""

    # Skip if data already exists
    if db.query(Agent).count() > 0:
        return

    # Create agents
    agents = [
        Agent(
            name="SEO Optimizer",
            description="Analyzes content and provides SEO recommendations",
            category="marketing",
            input_schema={
                "type": "object",
                "properties": {
                    "content": {"type": "string"},
                    "keywords": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["content"],
            },
            output_schema={
                "type": "object",
                "properties": {
                    "keyword_analysis": {"type": "object"},
                    "recommendations": {"type": "array", "items": {"type": "string"}},
                    "seo_score": {"type": "number"},
                },
            },
            config_schema={
                "type": "object",
                "properties": {"collection_name": {"type": "string"}},
            },
            implementation_path="app.agents.seo_optimizer.SEOOptimizer",
        ),
        Agent(
            name="Meeting Summarizer",
            description="Summarizes meeting transcripts and extracts action items",
            category="productivity",
            input_schema={
                "type": "object",
                "properties": {"transcript": {"type": "string"}},
                "required": ["transcript"],
            },
            output_schema={
                "type": "object",
                "properties": {
                    "summary": {"type": "string"},
                    "action_items": {"type": "array"},
                    "participants": {"type": "array"},
                    "duration_minutes": {"type": "integer"},
                },
            },
            config_schema={
                "type": "object",
                "properties": {
                    "summary_length": {
                        "type": "string",
                        "enum": ["short", "medium", "long"],
                    },
                    "extract_actions": {"type": "boolean"},
                },
            },
            implementation_path="app.agents.meeting_summarizer.MeetingSummarizer",
        ),
        Agent(
            name="Smart Email Manager",
            description="Categorizes, prioritizes, and drafts responses to emails",
            category="productivity",
            input_schema={
                "type": "object",
                "properties": {"email": {"type": "object"}},
                "required": ["email"],
            },
            output_schema={"type": "object"},
            config_schema={
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
            implementation_path="app.agents.smart_email_manager.SmartEmailManager",
        ),
        # Add the Grammar and Style Checker agent
        Agent(
            name="Grammar and Style Checker",
            description="Checks and corrects grammar/style errors and provides writing suggestions",
            category="content",
            input_schema={
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "The text content to be checked and corrected.",
                    },
                    "transcript": {"type": "string"},
                    "summary": {"type": "string"},
                    "email": {"type": "object"},
                },
                "required": [],
            },
            output_schema={
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
            },
            config_schema={
                "type": "object",
                "properties": {
                    "model_name": {
                        "type": "string",
                        "description": "The name of the Gemini model to use.",
                        "default": "models/gemini-1.0-pro",
                    }
                },
            },
            implementation="app.agents.grammar_and_style_checker.GrammarAndStyleChecker",
        ),
    ]

    for agent in agents:
        db.add(agent)

    db.commit()

    # Create template workflows
    workflows = [
        {
            "name": "Marketing Content Optimizer",
            "description": "Optimize marketing content for SEO and engagement",
            "category": "marketing",
            "is_template": True,
            "agents": [{"agent_name": "SEO Optimizer", "order": 1, "config": {}}],
        },
        {
            "name": "Meeting Productivity Suite",
            "description": "Summarize meetings and manage follow-up emails",
            "category": "productivity",
            "is_template": True,
            "agents": [
                {
                    "agent_name": "Meeting Summarizer",
                    "order": 1,
                    "config": {"summary_length": "medium", "extract_actions": True},
                },
                {
                    "agent_name": "Smart Email Manager",
                    "order": 2,
                    "config": {
                        "mode": "draft_response",
                        "response_tone": "professional",
                    },
                },
            ],
        },
    ]

    for workflow_data in workflows:
        # Create workflow
        workflow = Workflow(
            name=workflow_data["name"],
            description=workflow_data["description"],
            category=workflow_data["category"],
            is_template=workflow_data["is_template"],
        )
        db.add(workflow)
        db.flush()  # Get the ID before committing

        # Add workflow agents
        for agent_info in workflow_data["agents"]:
            # Find the agent by name
            agent = (
                db.query(Agent).filter(Agent.name == agent_info["agent_name"]).first()
            )
            if agent:
                workflow_agent = WorkflowAgent(
                    workflow_id=workflow.id,
                    agent_id=agent.id,
                    order=agent_info["order"],
                    config=agent_info["config"],
                )
                db.add(workflow_agent)

    # Commit all changes
    db.commit()
