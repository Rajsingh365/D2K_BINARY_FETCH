import os
import sys
import json
import asyncio
from typing import Dict, Any
import httpx
from app.db.database import SessionLocal
from app.db.models import Agent, Workflow, WorkflowAgent
from app.core.workflow_engine import WorkflowEngine
from app.models.execution import WorkflowInput
from app.utils.test_helpers import TestVisualizer
from app.core.agent_registry import AgentRegistry

# Base URL for the API if running locally
BASE_URL = "http://localhost:8000/api"


async def create_test_workflow(db_session) -> int:
    """Create a workflow that includes all agents in the codebase"""
    # Get all agents from the database
    agents = db_session.query(Agent).all()

    if not agents:
        print("No agents found in the database. Have you run setup_data.py?")
        sys.exit(1)

    # Create a workflow including all agents
    workflow = Workflow(
        name="All Agents Test Workflow",
        description="A test workflow that includes all available agents",
        category="test",
        is_template=False,
    )

    db_session.add(workflow)
    db_session.flush()  # Get the ID

    # Add agents to the workflow in a logical sequence
    # Find agents by name
    meeting_summarizer = next(
        (a for a in agents if a.name == "Meeting Summarizer"), None
    )
    seo_optimizer = next((a for a in agents if a.name == "SEO Optimizer"), None)
    email_manager = next((a for a in agents if a.name == "Smart Email Manager"), None)
    grammar_checker = next(
        (a for a in agents if a.name == "Grammar and Style Checker"), None
    )

    # Define the order and configurations
    agent_configs = []
    if meeting_summarizer:
        agent_configs.append(
            (
                meeting_summarizer,
                1,
                {"summary_length": "medium", "extract_actions": True},
            )
        )

    if grammar_checker:
        agent_configs.append(
            (grammar_checker, 2, {"model_name": "models/gemini-1.5-pro"})
        )

    if seo_optimizer:
        agent_configs.append((seo_optimizer, 3, {"collection_name": "seo_knowledge"}))

    if email_manager:
        agent_configs.append(
            (
                email_manager,
                4,
                {"mode": "draft_response", "response_tone": "professional"},
            )
        )

    # Add all available agents to the workflow
    for agent, order, config in agent_configs:
        workflow_agent = WorkflowAgent(
            workflow_id=workflow.id, agent_id=agent.id, order=order, config=config
        )
        db_session.add(workflow_agent)

    db_session.commit()

    print(
        f"Created test workflow with ID {workflow.id} including {len(agent_configs)} agents"
    )
    return workflow.id


async def test_workflow_direct(workflow_id: int, db_session):
    """Test workflow using direct engine execution"""
    TestVisualizer.print_header("TESTING WORKFLOW DIRECTLY WITH ENGINE")

    # Sample meeting transcript
    with open("sample_inputs/meeting_transcript.txt", "r") as f:
        meeting_transcript = f.read()

    # Create workflow input
    workflow_input = {
        "content": meeting_transcript,
        "variables": {
            "summary_type": "detailed",
            "keywords": "product,development,roadmap,features",
        },
        "context": {
            "user_prompt": "Summarize this meeting and prepare a professional email response"
        },
    }

    # Execute workflow
    engine = WorkflowEngine(db_session)
    start_time = asyncio.get_event_loop().time()

    print("Executing workflow...")
    result = engine.execute_workflow(workflow_id, workflow_input)

    execution_time = asyncio.get_event_loop().time() - start_time
    print(f"Workflow executed in {execution_time:.2f} seconds")

    # Print key results
    TestVisualizer.print_header("WORKFLOW RESULTS SUMMARY")
    summary = TestVisualizer.extract_key_results(
        {"status": "success", "result": result}
    )
    TestVisualizer.print_json(summary)

    # Print final output
    TestVisualizer.print_header("FINAL OUTPUT")
    final_output = result.get("final_output", {})

    # Check if we have a response body (from email manager)
    if "response_body" in final_output:
        print("\nEMAIL RESPONSE:")
        print("-" * 80)
        print(final_output["response_body"])
        print("-" * 80)
    else:
        TestVisualizer.print_json(final_output)

    return result


async def test_workflow_api(workflow_id: int):
    """Test workflow using the API (if server is running)"""
    TestVisualizer.print_header("TESTING WORKFLOW VIA API")

    # Sample meeting transcript
    with open("sample_inputs/meeting_transcript.txt", "r") as f:
        meeting_transcript = f.read()

    # Prepare form data for the API request
    form_data = {
        "content": meeting_transcript,
        "variables": json.dumps(
            {
                "summary_type": "detailed",
                "keywords": "product,development,roadmap,features",
            }
        ),
        "context": json.dumps(
            {
                "user_prompt": "Summarize this meeting and prepare a professional email response"
            }
        ),
    }

    # Execute workflow through API
    try:
        async with httpx.AsyncClient() as client:
            print(
                f"Sending request to {BASE_URL}/execution/workflows/{workflow_id}/execute"
            )
            response = await client.post(
                f"{BASE_URL}/execution/workflows/{workflow_id}/execute",
                data=form_data,
                timeout=60.0,  # Increase timeout for longer processing
            )

            if response.status_code == 200:
                result = response.json()
                TestVisualizer.print_header("API RESPONSE")
                TestVisualizer.print_json(result)
                return result
            else:
                print(f"API Error: {response.status_code}")
                print(response.text)
                return None

    except httpx.RequestError as e:
        print(f"API Request Error: {e}")
        print(
            "Is the FastAPI server running? Start it with: uvicorn app.main:app --reload"
        )
        return None


async def main():
    """Main test function"""
    TestVisualizer.print_header("ALL AGENTS WORKFLOW TEST")

    # Create a database session
    db = SessionLocal()

    try:
        # Create the test workflow
        workflow_id = await create_test_workflow(db)

        # Test the workflow directly
        await test_workflow_direct(workflow_id, db)

        # Test via API (optional - only works if the server is running)
        try_api = input(
            "\nDo you want to test via API as well? (server must be running) [y/N]: "
        )
        if try_api.lower() == "y":
            await test_workflow_api(workflow_id)

    finally:
        db.close()


if __name__ == "__main__":
    # Check if sample files exist
    if not os.path.exists("sample_inputs/meeting_transcript.txt"):
        print(
            "Error: Sample input file 'sample_inputs/meeting_transcript.txt' not found"
        )
        print(
            "Please make sure the sample files are available in the sample_inputs directory"
        )
        sys.exit(1)

    asyncio.run(main())
