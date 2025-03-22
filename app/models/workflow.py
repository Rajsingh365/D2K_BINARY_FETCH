from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class WorkflowAgentBase(BaseModel):
    agent_id: int
    order: int
    config: Dict[str, Any] = {}


class WorkflowAgentCreate(WorkflowAgentBase):
    pass


class WorkflowAgentUpdate(WorkflowAgentBase):
    pass


class WorkflowAgentInDB(WorkflowAgentBase):
    id: int
    workflow_id: int

    class Config:
        from_attributes = True  # Updated from orm_mode = True
        arbitrary_types_allowed = True


class WorkflowBase(BaseModel):
    name: str
    description: str
    category: str
    is_template: bool = False


class WorkflowCreate(WorkflowBase):
    agents: List[WorkflowAgentCreate]


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_template: Optional[bool] = None
    agents: Optional[List[WorkflowAgentUpdate]] = None


class Workflow(WorkflowBase):
    id: int
    agents: List[WorkflowAgentInDB] = []

    class Config:
        from_attributes = True  # Updated from orm_mode = True
        arbitrary_types_allowed = True
