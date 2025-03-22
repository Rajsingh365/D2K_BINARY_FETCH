# --- app/api/workflows.py ---
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict

# from sqlalchemy.orm import Session # Removed
# from app.db.database import get_db # Removed
# from app.db.models import Workflow, WorkflowAgent, Agent # Removed
from app.models.workflow import (
    WorkflowCreate,
    Workflow as WorkflowSchema,
    WorkflowUpdate,
)  # Keep

from app.core.sample_data import (
    load_sample_agents,
    load_sample_workflows,
    add_workflow,
    update_workflow_data,
    delete_workflow_data,
)

router = APIRouter()

# Use dummy data stores (dictionaries)
dummy_agents = load_sample_agents()
dummy_workflows = load_sample_workflows()


# Dependency to get the dummy data stores
def get_dummy_data():
    return {"agents": dummy_agents, "workflows": dummy_workflows}


@router.post("/workflows/", response_model=WorkflowSchema)
def create_workflow(
    workflow: WorkflowCreate, dummy_data=Depends(get_dummy_data)
):  # Use dummy DB
    """Create a new workflow with associated agents."""
    return add_workflow(dummy_data, workflow)  # Delegate to function in sample_data.py


@router.get("/workflows/", response_model=List[WorkflowSchema])
def read_workflows(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_template: Optional[bool] = None,
    dummy_data=Depends(get_dummy_data),
):
    """Get all workflows with optional filtering."""
    workflows_list = list(dummy_data["workflows"].values())

    if category:
        workflows_list = [w for w in workflows_list if w["category"] == category]
    if is_template is not None:
        workflows_list = [w for w in workflows_list if w["is_template"] == is_template]

    # Convert to WorkflowSchema for response
    return [WorkflowSchema(**w) for w in workflows_list[skip : skip + limit]]


@router.get("/workflows/{workflow_id}", response_model=WorkflowSchema)
def read_workflow(workflow_id: int, dummy_data=Depends(get_dummy_data)):
    """Get a specific workflow by ID."""
    workflow = dummy_data["workflows"].get(workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return WorkflowSchema(**workflow)


@router.put("/workflows/{workflow_id}", response_model=WorkflowSchema)
def update_workflow(
    workflow_id: int,
    workflow_update: WorkflowUpdate,
    dummy_data=Depends(get_dummy_data),
):
    """Update a workflow and its agents."""
    return update_workflow_data(dummy_data, workflow_id, workflow_update)


@router.delete("/workflows/{workflow_id}", response_model=dict)
def delete_workflow(workflow_id: int, dummy_data=Depends(get_dummy_data)):
    """Delete a workflow."""
    return delete_workflow_data(dummy_data, workflow_id)
