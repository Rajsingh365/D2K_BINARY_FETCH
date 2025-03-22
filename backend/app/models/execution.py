from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.models.workflow import WorkflowCreate


class WorkflowInput(BaseModel):
    """Input format for workflow execution"""

    content: str = Field(..., description="Main content/prompt for the workflow")
    variables: Dict[str, str] = Field(
        default_factory=dict, description="Variables for workflow customization"
    )
    context: Dict[str, Any] = Field(
        default_factory=dict, description="Additional context for execution"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "content": "Summarize this meeting transcript",
                "variables": {"length": "short"},
                "context": {"username": "John Doe"},
            }
        }


class WorkflowExecutionResponse(BaseModel):
    """Standard response format for workflow execution"""

    status: str
    workflow_id: int
    result: Dict[str, Any]


class TestWorkflowRequest(BaseModel):
    """Request for testing a workflow without saving"""

    workflow_spec: WorkflowCreate
    input: WorkflowInput

    class Config:
        json_schema_extra = {
            "example": {
                "workflow_spec": {
                    "name": "Test Workflow",
                    "description": "A test workflow",
                    "category": "test",
                    "is_template": False,
                    "agents": [{"agent_id": 1, "order": 1, "config": {}}],
                },
                "input": {
                    "content": "Summarize this meeting transcript",
                    "variables": {},
                    "context": {},
                },
            }
        }
