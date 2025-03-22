from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Agent, Workflow
from app.models.agent import Agent as AgentSchema
from app.models.workflow import Workflow as WorkflowSchema

router = APIRouter()


@router.get("/marketplace/agents/", response_model=List[AgentSchema])
def list_marketplace_agents(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all available agents in the marketplace."""
    query = db.query(Agent)

    if category:
        query = query.filter(Agent.category == category)

    return query.offset(skip).limit(limit).all()


@router.get("/marketplace/agents/{agent_id}", response_model=AgentSchema)
def get_marketplace_agent(agent_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("/marketplace/agents/compatibility/{agent1_id}/{agent2_id}")
def check_agent_compatibility(
    agent1_id: int, agent2_id: int, db: Session = Depends(get_db)
):
    """Check if two agents can be connected in a workflow."""
    agent1 = db.query(Agent).filter(Agent.id == agent1_id).first()
    agent2 = db.query(Agent).filter(Agent.id == agent2_id).first()

    if agent1 is None or agent2 is None:
        raise HTTPException(status_code=404, detail="One or both agents not found")

    # Check if output schema of agent1 is compatible with input schema of agent2
    # This is a simplified example - in a real system you'd implement more sophisticated compatibility checking
    compatible = True
    compatibility_score = 0.8  # Example score

    # Check outputs of agent1 against inputs of agent2
    # This is placeholder logic - you would need a more sophisticated schema matching algorithm
    for key in agent2.input_schema.get("properties", {}):
        if key in agent1.output_schema.get("properties", {}):
            compatibility_score += 0.1  # Increase score for each matching property

    compatibility_score = min(1.0, compatibility_score)  # Cap at 1.0

    return {
        "compatible": compatible,
        "compatibility_score": compatibility_score,
        "message": "These agents can work together"
        if compatible
        else "These agents may not work well together",
    }


@router.get("/marketplace/templates/", response_model=List[WorkflowSchema])
def list_workflow_templates(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List workflow templates available in the marketplace."""
    query = db.query(Workflow).filter(Workflow.is_template == True)

    if category:
        query = query.filter(Workflow.category == category)

    return query.offset(skip).limit(limit).all()


@router.get("/marketplace/categories/")
def list_categories(db: Session = Depends(get_db)):
    """List all categories used in the marketplace."""
    # Get unique agent categories
    agent_categories = [r[0] for r in db.query(Agent.category).distinct().all()]

    # Get unique workflow categories
    workflow_categories = [r[0] for r in db.query(Workflow.category).distinct().all()]

    # Merge and remove duplicates
    all_categories = list(set(agent_categories + workflow_categories))

    return {
        "agent_categories": agent_categories,
        "workflow_categories": workflow_categories,
        "all_categories": all_categories,
    }
