from typing import Dict, Any, List, Optional
from app.db.models import Workflow as WorkflowModel, WorkflowAgent as WorkflowAgentModel
from app.core.agent_registry import AgentRegistry
from app.rag.rag_service import RAGService
from app.core.knowledge_registry import KnowledgeRegistry
from sqlalchemy.orm import Session
import jsonschema
from jsonschema.exceptions import ValidationError


class WorkflowEngine:
    """Engine for executing agent workflows."""

    def __init__(self, db: Session):
        self.db = db
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
        # Get workflow with agents
        workflow = (
            self.db.query(WorkflowModel).filter(WorkflowModel.id == workflow_id).first()
        )

        if not workflow:
            raise ValueError(f"Workflow with ID {workflow_id} not found")

        # Get ordered workflow agents
        workflow_agents = (
            self.db.query(WorkflowAgentModel)
            .filter(WorkflowAgentModel.workflow_id == workflow_id)
            .order_by(WorkflowAgentModel.order)
            .all()
        )

        # Initialize workflow context with RAG information and original user input
        context = {
            "workflow_id": workflow_id,
            "workflow_name": workflow.name,
            "intermediate_results": {},
            "original_input": initial_input,  # Store the original input
            "user_prompt": initial_input.get("content", ""),  # Extract user's prompt
            "rag_context": {
                "shared_collections": list(self.rag_service.list_shared_collections()),
                "domain_collections": {},
                "generated_knowledge": {},
            },
        }

        # Add domain collections based on workflow category
        if workflow.category:
            context["rag_context"]["domain_collections"] = list(
                self.knowledge_registry.get_domain_collections(workflow.category)
            )

        # Execute each agent in sequence
        current_input = initial_input

        for i, workflow_agent in enumerate(workflow_agents):
            agent_model = workflow_agent.agent
            agent_instance = AgentRegistry.get_agent_instance(
                agent_model, workflow_agent.config
            )

            # Validate input against agent's input schema
            try:
                self._validate_agent_input(agent_instance, current_input)
            except ValidationError as e:
                # Add error to context
                context["errors"] = context.get("errors", []) + [
                    {
                        "step": i,
                        "agent_id": agent_model.id,
                        "agent_name": agent_model.name,
                        "error": f"Input validation failed: {str(e)}",
                        "input": current_input,
                    }
                ]

                # Try to adapt input if possible
                try:
                    current_input = self._adapt_input_for_agent(
                        agent_instance, current_input
                    )
                    context["adaptations"] = context.get("adaptations", []) + [
                        {
                            "step": i,
                            "agent_id": agent_model.id,
                            "agent_name": agent_model.name,
                            "message": "Input was adapted to match expected schema",
                        }
                    ]
                except Exception as adapt_err:
                    # If adaptation fails, we'll still try to process but add to errors
                    context["errors"] = context.get("errors", []) + [
                        {
                            "step": i,
                            "agent_id": agent_model.id,
                            "agent_name": agent_model.name,
                            "error": f"Input adaptation failed: {str(adapt_err)}",
                        }
                    ]

            # Process with current agent
            try:
                agent_output = agent_instance.process(current_input, context)

                # Store intermediate results
                context["intermediate_results"][workflow_agent.id] = agent_output

                # Capture any generated knowledge from the agent if it exists
                if hasattr(agent_instance, "get_generated_knowledge"):
                    knowledge = agent_instance.get_generated_knowledge()
                    if knowledge:
                        context["rag_context"]["generated_knowledge"][
                            agent_model.name
                        ] = knowledge

                # Output becomes input for next agent
                current_input = agent_output

            except Exception as e:
                # Handle processing errors
                error_msg = f"Agent processing failed: {str(e)}"
                context["errors"] = context.get("errors", []) + [
                    {
                        "step": i,
                        "agent_id": agent_model.id,
                        "agent_name": agent_model.name,
                        "error": error_msg,
                    }
                ]
                # Use fallback output if we can't proceed
                current_input = {"error": error_msg, "agent_id": agent_model.id}

        return {"final_output": current_input, "context": context}

    def _validate_agent_input(self, agent_instance, input_data):
        """Validate input data against agent's input schema"""
        input_schema = agent_instance.get_input_schema()
        jsonschema.validate(instance=input_data, schema=input_schema)

    def _adapt_input_for_agent(self, agent_instance, input_data):
        """Try to adapt input to match the agent's expected schema"""
        input_schema = agent_instance.get_input_schema()
        adapted_input = {}

        # Basic adaptation - copy matching fields and add required fields with defaults
        for field, schema in input_schema.get("properties", {}).items():
            # If field exists in input, use it
            if field in input_data:
                adapted_input[field] = input_data[field]
            # Otherwise, try to use a default value if specified
            elif "default" in schema:
                adapted_input[field] = schema["default"]
            # For required fields with no default, try reasonable values based on type
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
    db: Session, agents: List[tuple], initial_input: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Execute a temporary workflow without saving it to the database.

    Args:
        db: Database session
        agents: List of tuples containing (agent_model, config, order)
        initial_input: Initial input data for the workflow

    Returns:
        Final output from the workflow
    """
    # Initialize workflow context
    context = {
        "workflow_id": "test",
        "workflow_name": "Test Workflow",
        "intermediate_results": {},
    }

    # Execute each agent in sequence
    current_input = initial_input

    for i, (agent_model, config, order) in enumerate(agents):
        # Get agent instance
        agent_instance = AgentRegistry.get_agent_instance(agent_model, config)

        # Process with current agent
        try:
            agent_output = agent_instance.process(current_input, context)

            # Store intermediate results
            context["intermediate_results"][f"step_{i}"] = agent_output

            # Output becomes input for next agent
            current_input = agent_output

        except Exception as e:
            # Handle processing errors
            error_msg = f"Agent processing failed: {str(e)}"
            context["errors"] = context.get("errors", []) + [
                {
                    "step": i,
                    "agent_id": agent_model.id,
                    "agent_name": agent_model.name,
                    "error": error_msg,
                }
            ]
            # Use fallback output if we can't proceed
            current_input = {"error": error_msg, "agent_id": agent_model.id}

    return {"final_output": current_input, "context": context}
