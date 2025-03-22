from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class AgentBase(BaseModel):
    name: str
    description: str
    category: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    config_schema: Dict[str, Any]
    implementation_path: str


class AgentCreate(AgentBase):
    pass


class Agent(AgentBase):
    id: int

    class Config:
        from_attributes = True  # Updated from orm_mode = True
