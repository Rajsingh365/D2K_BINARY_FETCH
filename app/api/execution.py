# --- app/api/execution.py ---
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    BackgroundTasks,
    UploadFile,
    File,
    Form,
)
from fastapi.params import (
    Body,
)  # Keep Body for now, might be useful for other endpoints
from typing import Dict, Any, Optional
import json

# from sqlalchemy.orm import Session  # Removed

# from app.db.database import get_db # Removed
from app.core.workflow_engine import WorkflowEngine, test_execute_workflow
from app.core.input_adapter import InputAdapter

# from app.db.models import WorkflowAgent, Agent # Removed
# from app.models.workflow import WorkflowCreate # Removed
from app.models.execution import (
    WorkflowInput,
    WorkflowExecutionResponse,
    TestWorkflowRequest,
)  # Keep

from app.core.agent_registry import AgentRegistry
from app.core.sample_data import load_sample_agents, load_sample_workflows
from app.models.workflow import WorkflowCreate  # Import for TestWorkflowRequest

router = APIRouter()

# Dummy DB replacement
dummy_agents_db = load_sample_agents()
dummy_workflows_db = load_sample_workflows()


def get_dummy_db():
    """Provides a dictionary to simulate a database session."""
    return {"agents": dummy_agents_db, "workflows": dummy_workflows_db}


@router.post(
    "/execution/workflows/{workflow_id}/execute",
    response_model=WorkflowExecutionResponse,
)
async def execute_workflow(
    workflow_id: int,
    content: str = Form(...),
    variables: str = Form("{}"),
    context: str = Form("{}"),
    file: Optional[UploadFile] = File(None),
    # db: Session = Depends(get_db), # Removed
    dummy_db=Depends(get_dummy_db),
):
    """Execute a workflow with form data and optional file upload."""
    try:
        # Parse JSON strings from form data
        variables_dict = json.loads(variables)
        context_dict = json.loads(context)

        # Create WorkflowInput object
        workflow_input = WorkflowInput(
            content=content, variables=variables_dict, context=context_dict
        )

        return await _process_workflow_execution(
            workflow_id=workflow_id,
            workflow_input=workflow_input,
            file=file,
            dummy_db=dummy_db,
        )
    except HTTPException as e:
        raise e
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid JSON in form data: {str(e)}"
        )
    except Exception as e:
        import traceback

        error_detail = f"Error executing workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execution/test-workflow", response_model=WorkflowExecutionResponse)
async def test_workflow(
    workflow_spec: str = Form(...),
    content: str = Form(...),
    variables: str = Form("{}"),
    context: str = Form("{}"),
    file: Optional[UploadFile] = File(None),
    dummy_db=Depends(get_dummy_db),  # Use the dummy DB
):
    """Test a workflow without saving it."""
    try:
        # Parse JSON strings from form data
        workflow_spec_dict = json.loads(workflow_spec)
        variables_dict = json.loads(variables)
        context_dict = json.loads(context)

        # Create WorkflowInput object
        workflow_input = WorkflowInput(
            content=content, variables=variables_dict, context=context_dict
        )
        # Create WorkflowCreate object
        workflow_create = WorkflowCreate(**workflow_spec_dict)

        agents_data = []
        for agent_data in workflow_create.agents:
            agent_model = dummy_db["agents"].get(agent_data.agent_id)
            if not agent_model:
                raise HTTPException(
                    status_code=400,
                    detail=f"Agent with id {agent_data.agent_id} not found",
                )
            agents_data.append((agent_model, agent_data.config, agent_data.order))

        result = await test_execute_workflow(
            dummy_db=dummy_db,
            agents=agents_data,
            initial_input=workflow_input.dict(),
        )

        return {"status": "success", "workflow_id": 0, "result": result}
    except Exception as e:
        import traceback

        error_detail = f"Error testing workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))


async def _process_workflow_execution(
    workflow_id: int,
    workflow_input: WorkflowInput,
    file: Optional[UploadFile],
    dummy_db,  # Pass the dummy DB
) -> Dict[str, Any]:
    """Process workflow execution with the provided input."""
    # Create workflow engine - pass the dummy_db instead of db
    engine = WorkflowEngine(dummy_db)

    # Get the first agent - replace DB query with dictionary lookup
    workflow = dummy_db["workflows"].get(workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=404, detail=f"Workflow with ID {workflow_id} not found"
        )

    first_agent_record = workflow["agents"][
        0
    ]  # Assuming agents are ordered in the data
    first_agent = dummy_db["agents"][first_agent_record["agent_id"]]

    # Adapt the input for the first agent
    try:
        adapted_input = await InputAdapter.adapt_input(
            workflow_input=workflow_input,
            first_agent=first_agent,
            file=file,
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to adapt input for agent: {str(e)}",
        )

    # Execute workflow with adapted input  # Pass dummy_db to execute_workflow
    result = engine.execute_workflow(workflow_id, adapted_input)

    return {"status": "success", "workflow_id": workflow_id, "result": result}


@router.post("/execution/workflows/{workflow_id}/execute-async")
async def execute_workflow_async(
    workflow_id: int,
    workflow_input: WorkflowInput = Body(...),
    file: Optional[UploadFile] = File(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    # db: Session = Depends(get_db),  # Removed
    dummy_db=Depends(get_dummy_db),
):
    """Execute a workflow asynchronously."""
    try:
        # Create workflow engine
        engine = WorkflowEngine(dummy_db)

        # Get the first agent
        workflow = dummy_db["workflows"].get(workflow_id)
        if not workflow:
            raise HTTPException(
                status_code=404, detail=f"Workflow with ID {workflow_id} not found"
            )

        first_agent_record = workflow["agents"][
            0
        ]  # Assuming agents are ordered in the data
        first_agent = dummy_db["agents"][first_agent_record["agent_id"]]

        if not first_agent:
            raise HTTPException(
                status_code=404,
                detail=f"No agents found in workflow with ID {workflow_id}",
            )

        # Adapt the input for the first agent
        adapted_input = await InputAdapter.adapt_input(
            workflow_input=workflow_input,
            first_agent=first_agent,
            file=file,
        )

        # Add to background tasks
        background_tasks.add_task(engine.execute_workflow, workflow_id, adapted_input)

        return {
            "status": "accepted",
            "workflow_id": workflow_id,
            "message": "Workflow execution started asynchronously",
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback

        error_detail = (
            f"Error starting workflow execution: {str(e)}\n{traceback.format_exc()}"
        )
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execution/preview/agent/{agent_id}")
async def preview_agent_output(
    agent_id: int,
    workflow_input: WorkflowInput = Body(...),
    file: Optional[UploadFile] = File(None),
    config: Optional[Dict[str, Any]] = Body(None),
    # db: Session = Depends(get_db), # Removed
    dummy_db=Depends(get_dummy_db),
):
    """Preview the output of a single agent."""
    # from app.core.agent_registry import AgentRegistry  # Already imported at the top

    try:
        # Get agent
        agent_model = dummy_db["agents"].get(agent_id)
        if not agent_model:
            raise HTTPException(
                status_code=404, detail=f"Agent with id {agent_id} not found"
            )

        # Adapt the input for this agent
        adapted_input = await InputAdapter.adapt_input(
            workflow_input=workflow_input,
            first_agent=agent_model,
            file=file,
        )

        # Get agent instance
        agent_instance = AgentRegistry.get_agent_instance(agent_model, config or {})

        # Create context for the agent
        context = {"agent_id": agent_id, "preview_mode": True}

        # Process with agent
        output = agent_instance.process(adapted_input, context)

        return {
            "status": "success",
            "agent_id": agent_id,
            "agent_name": agent_model["name"],
            "input": adapted_input,
            "output": output,
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error previewing agent output: {str(e)}"
        )
