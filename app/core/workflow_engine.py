# --- app/core/workflow_engine.py ---
from typing import Dict, Any, List, Optional

# from sqlalchemy.orm import Session # Removed

# from app.db.models import Workflow as WorkflowModel, WorkflowAgent as WorkflowAgentModel # Removed
from app.core.agent_registry import AgentRegistry
from app.rag.rag_service import RAGService
from app.core.knowledge_registry import KnowledgeRegistry
import jsonschema
from jsonschema.exceptions import ValidationError


class WorkflowEngine:
    """Engine for executing agent workflows."""

    def __init__(self, dummy_db):  # Changed db to dummy_db
        self.dummy_db = dummy_db  # Store the dummy DB
        self.rag_service = RAGService.get_instance()
        self.knowledge_registry = KnowledgeRegistry.get_instance()

    def execute_workflow(
        self, workflow_id: int, initial_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a workflow by running each agent in sequence.

        Args:
            workflow_id: ID of the workflow to execute
            initial_input: Initial input data for the workflow

        Returns:
            Final output from the workflow
        """
        # Get workflow - use dictionary lookup instead of DB query
        workflow = self.dummy_db["workflows"].get(workflow_id)

        if not workflow:
            raise ValueError(f"Workflow with ID {workflow_id} not found")

        # Get ordered workflow agents - use list directly from data
        workflow_agents = workflow["agents"]

        # Initialize workflow context
        context = {
            "workflow_id": workflow_id,
            "workflow_name": workflow["name"],
            "intermediate_results": {},
            "original_input": initial_input,
            "user_prompt": initial_input.get("content", ""),
            "rag_context": {
                "shared_collections": list(self.rag_service.list_shared_collections()),
                "domain_collections": {},
                "generated_knowledge": {},
            },
        }

        if workflow["category"]:
            context["rag_context"]["domain_collections"] = list(
                self.knowledge_registry.get_domain_collections(workflow["category"])
            )

        current_input = initial_input

        for i, workflow_agent in enumerate(workflow_agents):
            # Get agent model and instance using dummy data
            agent_model = self.dummy_db["agents"][workflow_agent["agent_id"]]
            agent_instance = AgentRegistry.get_agent_instance(
                agent_model, workflow_agent["config"]
            )

            try:
                self._validate_agent_input(agent_instance, current_input)
            except ValidationError as e:
                context["errors"] = context.get("errors", []) + [
                    {
                        "step": i,
                        "agent_id": agent_model["id"],
                        "agent_name": agent_model["name"],
                        "error": f"Input validation failed: {str(e)}",
                        "input": current_input,
                    }
                ]

                try:
                    current_input = self._adapt_input_for_agent(
                        agent_instance, current_input
                    )
                    context["adaptations"] = context.get("adaptations", []) + [
                        {
                            "step": i,
                            "agent_id": agent_model["id"],
                            "agent_name": agent_model["name"],
                            "message": "Input was adapted to match expected schema",
                        }
                    ]
                except Exception as adapt_err:
                    context["errors"] = context.get("errors", []) + [
                        {
                            "step": i,
                            "agent_id": agent_model["id"],
                            "agent_name": agent_model["name"],
                            "error": f"Input adaptation failed: {str(adapt_err)}",
                        }
                    ]

            try:
                agent_output = agent_instance.process(current_input, context)

                context["intermediate_results"][workflow_agent["id"]] = agent_output

                if hasattr(agent_instance, "get_generated_knowledge"):
                    knowledge = agent_instance.get_generated_knowledge()
                    if knowledge:
                        context["rag_context"]["generated_knowledge"][
                            agent_model["name"]
                        ] = knowledge

                current_input = agent_output

            except Exception as e:
                error_msg = f"Agent processing failed: {str(e)}"
                context["errors"] = context.get("errors", []) + [
                    {
                        "step": i,
                        "agent_id": agent_model["id"],
                        "agent_name": agent_model["name"],
                        "error": error_msg,
                    }
                ]
                current_input = {"error": error_msg, "agent_id": agent_model["id"]}

        return {"final_output": current_input, "context": context}

    def _validate_agent_input(self, agent_instance, input_data):
        """Validate input data against agent's input schema"""
        input_schema = agent_instance.get_input_schema()
        jsonschema.validate(instance=input_data, schema=input_schema)

    def _adapt_input_for_agent(self, agent_instance, input_data):
        """Try to adapt input to match the agent's expected schema."""
        input_schema = agent_instance.get_input_schema()
        adapted_input = {}

        for field, schema in input_schema.get("properties", {}).items():
            if field in input_data:
                adapted_input[field] = input_data[field]
            elif "default" in schema:
                adapted_input[field] = schema["default"]
            elif field in input_schema.get("required", []):
                if schema.get("type") == "string":
                    adapted_input[field] = ""
                elif schema.get("type") == "array":
                    adapted_input[field] = []
                elif schema.get("type") == "object":
                    adapted_input[field] = {}
                elif schema.get("type") == "number":
                    adapted_input[field] = 0
                elif schema.get("type") == "boolean":
                    adapted_input[field] = False
        return adapted_input


async def test_execute_workflow(
    dummy_db, agents: List[tuple], initial_input: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Execute a temporary workflow without saving it to the database.

    Args:
        dummy_db: The dummy database.
        agents: List of tuples: (agent_model_dict, config, order).
        initial_input: Initial input.

    Returns:
        Workflow results.
    """
    context = {
        "workflow_id": "test",
        "workflow_name": "Test Workflow",
        "intermediate_results": {},
    }
    current_input = initial_input

    for i, (agent_model, config, order) in enumerate(agents):
        agent_instance = AgentRegistry.get_agent_instance(agent_model, config)

        try:
            agent_output = agent_instance.process(current_input, context)
            context["intermediate_results"][f"step_{i}"] = agent_output
            current_input = agent_output
        except Exception as e:
            error_msg = f"Agent processing failed: {str(e)}"
            context["errors"] = context.get("errors", []) + [
                {
                    "step": i,
                    "agent_id": agent_model["id"],
                    "agent_name": agent_model["name"],
                    "error": error_msg,
                }
            ]
            current_input = {"error": error_msg, "agent_id": agent_model["id"]}

    return {"final_output": current_input, "context": context}
