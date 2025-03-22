# --- app/core/agent_registry.py ---
import importlib
from typing import Dict, Optional, Type, List, Any

# from sqlalchemy.orm import Session  # Removed

from app.agents.base import BaseAgent

# from app.db.models import Agent as AgentModel # Removed


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
        agent_model: Dict, config: Dict[str, Any] = None
    ) -> BaseAgent:  # Changed type
        """
        Get an instance of an agent from database model.

        Args:
            agent_model: Database model of the agent (now a dictionary)
            config: Optional configuration for the agent

        Returns:
            Initialized agent instance
        """
        agent_class = AgentRegistry.get_agent_class(agent_model["implementation_path"])
        return agent_class(**(config or {}))

    @staticmethod
    def list_available_agents(dummy_db) -> List[Dict]:  # Changed return type
        """
        List all available agents in the system.

        Args:
            dummy_db: Dummy database

        Returns:
            List of agent models (dictionaries)
        """
        return list(dummy_db["agents"].values())

    @staticmethod
    def get_agent_by_id(dummy_db, agent_id: int) -> Optional[Dict]:  # Changed return
        """
        Get agent model by ID.

        Args:
            dummy_db: Dummy database.
            agent_id: ID of the agent

        Returns:
            Agent model (dictionary) or None if not found
        """
        return dummy_db["agents"].get(agent_id)
