# --- app/api/marketplace.py ---
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict

# from sqlalchemy.orm import Session # Removed
# from app.db.database import get_db # Removed
# from app.db.models import Agent, Workflow # Removed
from app.models.agent import Agent as AgentSchema  # Keep
from app.models.workflow import Workflow as WorkflowSchema  # Keep

# Import sample data
from app.core.sample_data import (
    load_sample_agents,
    load_sample_workflows,
)  # Fixed import path

router = APIRouter()

# Dummy data stores (load from JSON files)
dummy_agents = load_sample_agents()
dummy_workflows = load_sample_workflows()


# Dummy DB dependency
def get_dummy_data():
    return {"agents": dummy_agents, "workflows": dummy_workflows}


@router.get("/marketplace/agents/", response_model=List[Dict])
def list_marketplace_agents(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    dummy_data=Depends(get_dummy_data),  # Use dummy data
):
    """List all available agents in the marketplace."""
    agents_list = list(dummy_data["agents"].values())

    if category:
        agents_list = [a for a in agents_list if a["category"] == category]

    return agents_list[skip : skip + limit]


@router.get("/marketplace/agents/{agent_id}", response_model=Dict)
def get_marketplace_agent(agent_id: int, dummy_data=Depends(get_dummy_data)):
    """Get detailed information about a specific agent."""
    agent = dummy_data["agents"].get(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("/marketplace/agents/compatibility/{agent1_id}/{agent2_id}")
def check_agent_compatibility(
    agent1_id: int, agent2_id: int, dummy_data=Depends(get_dummy_data)
):
    """Check if two agents can be connected in a workflow."""
    agent1 = dummy_data["agents"].get(agent1_id)
    agent2 = dummy_data["agents"].get(agent2_id)

    if agent1 is None or agent2 is None:
        raise HTTPException(status_code=404, detail="One or both agents not found")

    compatible = True
    compatibility_score = 0.8

    for key in agent2["input_schema"].get("properties", {}):
        if key in agent1["output_schema"].get("properties", {}):
            compatibility_score += 0.1

    compatibility_score = min(1.0, compatibility_score)

    return {
        "compatible": compatible,
        "compatibility_score": compatibility_score,
        "message": "These agents can work together"
        if compatible
        else "These agents may not work well together",
    }


@router.get("/marketplace/templates/", response_model=List[Dict])
def list_workflow_templates(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    dummy_data=Depends(get_dummy_data),
):
    """List workflow templates available in the marketplace."""
    workflows_list = [
        w for w in dummy_data["workflows"].values() if w["is_template"]
    ]  # Filter

    if category:
        workflows_list = [w for w in workflows_list if w["category"] == category]

    return workflows_list[skip : skip + limit]


@router.get("/marketplace/categories/")
def list_categories(dummy_data=Depends(get_dummy_data)):
    """List all categories used in the marketplace."""
    agent_categories = list(
        set(agent["category"] for agent in dummy_data["agents"].values())
    )
    workflow_categories = list(
        set(workflow["category"] for workflow in dummy_data["workflows"].values())
    )
    all_categories = list(set(agent_categories + workflow_categories))

    return {
        "agent_categories": agent_categories,
        "workflow_categories": workflow_categories,
        "all_categories": all_categories,
    }
