import importlib
from typing import Dict, Type, List, Any
from app.agents.base import BaseAgent
from app.db.models import Agent as AgentModel
from sqlalchemy.orm import Session


class AgentRegistry:
    """Registry for managing available agents."""

    @staticmethod
    def get_agent_class(implementation_path: str) -> Type[BaseAgent]:
        """
        Dynamically import and return the agent class.

        Args:
            implementation_path: Module path to the agent class (e.g., "app.agents.seo_optimizer.SEOOptimizer")

        Returns:
            The agent class
        """
        module_path, class_name = implementation_path.rsplit(".", 1)
        module = importlib.import_module(module_path)
        return getattr(module, class_name)

    @staticmethod
    def get_agent_instance(
        agent_model: AgentModel, config: Dict[str, Any] = None
    ) -> BaseAgent:
        """
        Get an instance of an agent from database model.

        Args:
            agent_model: Database model of the agent
            config: Optional configuration for the agent

        Returns:
            Initialized agent instance
        """
        agent_class = AgentRegistry.get_agent_class(agent_model.implementation_path)
        return agent_class(**(config or {}))

    @staticmethod
    def list_available_agents(db: Session) -> List[AgentModel]:
        """
        List all available agents in the system.

        Args:
            db: Database session

        Returns:
            List of agent models
        """
        return db.query(AgentModel).all()

    @staticmethod
    def get_agent_by_id(db: Session, agent_id: int) -> AgentModel:
        """
        Get agent model by ID.

        Args:
            db: Database session
            agent_id: ID of the agent

        Returns:
            Agent model or None if not found
        """
        return db.query(AgentModel).filter(AgentModel.id == agent_id).first()
