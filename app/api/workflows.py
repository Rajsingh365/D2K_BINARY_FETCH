from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Workflow, WorkflowAgent, Agent
from app.models.workflow import (
    WorkflowCreate,
    Workflow as WorkflowSchema,
    WorkflowUpdate,
)

router = APIRouter()


@router.post("/workflows/", response_model=WorkflowSchema)
def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_db)):
    """Create a new workflow with associated agents."""
    # Create new workflow
    db_workflow = Workflow(
        name=workflow.name,
        description=workflow.description,
        category=workflow.category,
        is_template=workflow.is_template,
    )
    db.add(db_workflow)
    db.flush()  # Flush to get the ID

    # Add agents to workflow
    for agent_data in workflow.agents:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_data.agent_id).first()
        if not agent:
            db.rollback()
            raise HTTPException(
                status_code=404, detail=f"Agent with id {agent_data.agent_id} not found"
            )

        # Create workflow-agent relationship
        db_workflow_agent = WorkflowAgent(
            workflow_id=db_workflow.id,
            agent_id=agent_data.agent_id,
            order=agent_data.order,
            config=agent_data.config,
        )
        db.add(db_workflow_agent)

    db.commit()
    db.refresh(db_workflow)
    return db_workflow


@router.get("/workflows/", response_model=List[WorkflowSchema])
def read_workflows(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_template: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """Get all workflows with optional filtering."""
    query = db.query(Workflow)

    if category:
        query = query.filter(Workflow.category == category)

    if is_template is not None:
        query = query.filter(Workflow.is_template == is_template)

    return query.offset(skip).limit(limit).all()


@router.get("/workflows/{workflow_id}", response_model=WorkflowSchema)
def read_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """Get a specific workflow by ID."""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/workflows/{workflow_id}", response_model=WorkflowSchema)
def update_workflow(
    workflow_id: int, workflow_update: WorkflowUpdate, db: Session = Depends(get_db)
):
    """Update a workflow and its agents."""
    # Get existing workflow
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if db_workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Update workflow fields
    if workflow_update.name is not None:
        db_workflow.name = workflow_update.name
    if workflow_update.description is not None:
        db_workflow.description = workflow_update.description
    if workflow_update.category is not None:
        db_workflow.category = workflow_update.category
    if workflow_update.is_template is not None:
        db_workflow.is_template = workflow_update.is_template

    # Update agents if provided
    if workflow_update.agents is not None:
        # Remove existing workflow agents
        db.query(WorkflowAgent).filter(
            WorkflowAgent.workflow_id == workflow_id
        ).delete()

        # Add updated agents
        for agent_data in workflow_update.agents:
            # Verify agent exists
            agent = db.query(Agent).filter(Agent.id == agent_data.agent_id).first()
            if not agent:
                db.rollback()
                raise HTTPException(
                    status_code=404,
                    detail=f"Agent with id {agent_data.agent_id} not found",
                )

            # Create workflow-agent relationship
            db_workflow_agent = WorkflowAgent(
                workflow_id=db_workflow.id,
                agent_id=agent_data.agent_id,
                order=agent_data.order,
                config=agent_data.config,
            )
            db.add(db_workflow_agent)

    db.commit()
    db.refresh(db_workflow)
    return db_workflow


@router.delete("/workflows/{workflow_id}", response_model=dict)
def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """Delete a workflow."""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Delete workflow (cascade will handle workflow_agents)
    db.delete(workflow)
    db.commit()

    return {"message": f"Workflow {workflow_id} deleted successfully"}
