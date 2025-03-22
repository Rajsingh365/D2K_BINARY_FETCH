from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    BackgroundTasks,
    UploadFile,
    File,
    Form,
)
from fastapi.params import Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json

from app.db.database import get_db
from app.core.workflow_engine import WorkflowEngine, test_execute_workflow
from app.core.input_adapter import InputAdapter
from app.models.execution import (
    WorkflowInput,
    WorkflowExecutionResponse,
    TestWorkflowRequest,
)
from app.db.models import WorkflowAgent, Agent
from app.models.workflow import WorkflowCreate

router = APIRouter()


# Remove the JSON version and keep only the form data version
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
    db: Session = Depends(get_db),
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
            workflow_id=workflow_id, workflow_input=workflow_input, file=file, db=db
        )
    except HTTPException as e:
        # Re-raise HTTP exceptions rather than wrapping them
        raise e
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid JSON in form data: {str(e)}"
        )
    except Exception as e:
        # Add better error logging
        import traceback

        error_detail = f"Error executing workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log the full error
        raise HTTPException(status_code=500, detail=str(e))


# Update the test workflow endpoint to also use form data
@router.post("/execution/test-workflow", response_model=WorkflowExecutionResponse)
async def test_workflow(
    workflow_spec: str = Form(...),
    content: str = Form(...),
    variables: str = Form("{}"),
    context: str = Form("{}"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
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

        # Execute test workflow
        result = await test_execute_workflow(
            db=db,
            agents=[(agent.agent_id, agent.config) for agent in workflow_create.agents],
            initial_input=workflow_input.dict(),
        )

        return {"status": "success", "workflow_id": 0, "result": result}
    except Exception as e:
        # Add better error logging
        import traceback

        error_detail = f"Error testing workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))


# Helper function to process workflow execution
async def _process_workflow_execution(
    workflow_id: int,
    workflow_input: WorkflowInput,
    file: Optional[UploadFile],
    db: Session,
) -> Dict[str, Any]:
    """Process workflow execution with the provided input."""
    # Create workflow engine
    engine = WorkflowEngine(db)

    # Get the first agent in the workflow to adapt input for
    first_agent_record = (
        db.query(WorkflowAgent)
        .filter(WorkflowAgent.workflow_id == workflow_id)
        .order_by(WorkflowAgent.order)
        .first()
    )

    if not first_agent_record:
        raise HTTPException(
            status_code=404,
            detail=f"No agents found in workflow with ID {workflow_id}",
        )

    # Get the agent model
    first_agent = first_agent_record.agent

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

    # Execute workflow with adapted input
    result = engine.execute_workflow(workflow_id, adapted_input)

    return {"status": "success", "workflow_id": workflow_id, "result": result}


# Update the remaining endpoints to use the helper function
@router.post("/execution/workflows/{workflow_id}/execute-async")
async def execute_workflow_async(
    workflow_id: int,
    workflow_input: WorkflowInput = Body(...),
    file: Optional[UploadFile] = File(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """Execute a workflow asynchronously."""
    try:
        # Create workflow engine
        engine = WorkflowEngine(db)

        # Get the first agent
        first_agent_record = (
            db.query(WorkflowAgent)
            .filter(WorkflowAgent.workflow_id == workflow_id)
            .order_by(WorkflowAgent.order)
            .first()
        )

        if not first_agent_record:
            raise HTTPException(
                status_code=404,
                detail=f"No agents found in workflow with ID {workflow_id}",
            )

        # Adapt the input for the first agent
        adapted_input = await InputAdapter.adapt_input(
            workflow_input=workflow_input,
            first_agent=first_agent_record.agent,
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
        # Re-raise HTTP exceptions rather than wrapping them
        raise e
    except Exception as e:
        # Add better error logging
        import traceback

        error_detail = (
            f"Error starting workflow execution: {str(e)}\n{traceback.format_exc()}"
        )
        print(error_detail)  # Log the full error
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execution/preview/agent/{agent_id}")
async def preview_agent_output(
    agent_id: int,
    workflow_input: WorkflowInput = Body(...),
    file: Optional[UploadFile] = File(None),
    config: Optional[Dict[str, Any]] = Body(None),
    db: Session = Depends(get_db),
):
    """Preview the output of a single agent."""
    from app.core.agent_registry import AgentRegistry

    try:
        # Get agent
        agent_model = db.query(Agent).filter(Agent.id == agent_id).first()
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
            "agent_name": agent_model.name,
            "input": adapted_input,
            "output": output,
        }
    except HTTPException as e:
        # Re-raise HTTP exceptions rather than wrapping them
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error previewing agent output: {str(e)}"
        )
