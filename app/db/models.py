from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from .database import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    category = Column(String, index=True)
    input_schema = Column(JSON)
    output_schema = Column(JSON)
    config_schema = Column(JSON)
    implementation_path = Column(String)  # Path to implementation class

    # Relationships
    workflows = relationship("WorkflowAgent", back_populates="agent")


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    category = Column(String, index=True)
    is_template = Column(Boolean, default=False)

    # Relationships
    agents = relationship("WorkflowAgent", back_populates="workflow")


class WorkflowAgent(Base):
    __tablename__ = "workflow_agents"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"))
    order = Column(Integer)  # Position in workflow
    config = Column(JSON)  # Agent-specific configuration

    # Relationships
    workflow = relationship("Workflow", back_populates="agents")
    agent = relationship("Agent", back_populates="workflows")
