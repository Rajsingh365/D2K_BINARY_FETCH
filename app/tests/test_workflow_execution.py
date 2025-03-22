import sys, os
import json
from typing import Any, Dict

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.main import app
from app.core.workflow_engine import WorkflowEngine
from app.models.execution import WorkflowInput
from app.core.sample_data import load_sample_agents, load_sample_workflows

client = TestClient(app)


def get_dummy_db():
    return {"agents": load_sample_agents(), "workflows": load_sample_workflows()}


# Utility functions for pretty output
def print_section(title: str, width: int = 80):
    """Print a nicely formatted section header"""
    print("\n" + "=" * width)
    print(f" {title} ".center(width, "="))
    print("=" * width)


def print_result(label: str, content: Any, indent: int = 0):
    """Print a labeled result with proper indentation"""
    indent_str = " " * indent
    if isinstance(content, dict):
        print(f"{indent_str}{label}:")
        for k, v in content.items():
            if isinstance(v, dict) and len(str(v)) > 100:
                print(f"{indent_str}  - {k}:")
                for sub_k, sub_v in v.items():
                    print(f"{indent_str}    · {sub_k}: {sub_v}")
            else:
                print(f"{indent_str}  - {k}: {v}")
    elif isinstance(content, str) and len(content) > 100:
        # Format long text with line breaks
        print(f"{indent_str}{label}:")
        print(f"{indent_str}  {content[:100]}...")
        print(f"{indent_str}  [Total length: {len(content)} chars]")
    else:
        print(f"{indent_str}{label}: {content}")


def test_single_agent_workflow():
    """Test workflow with Meeting Summarizer agent"""
    print_section("SINGLE AGENT WORKFLOW TEST")

    # Initialize test data
    workflow_input = WorkflowInput(
        content="Meeting Transcript:\nJohn: Let's discuss the project timeline.\nJane: I think we need two weeks for testing.",
        variables={},
        context={},
    )

    # Create workflow spec with single agent
    workflow_spec = {
        "name": "Test Meeting Summary",
        "description": "Test workflow",
        "category": "test",
        "is_template": False,
        "agents": [{"agent_id": 2, "order": 1, "config": {"summary_length": "short"}}],
    }

    print_result("Workflow Name", workflow_spec["name"])
    print_result("Input", workflow_input.content)

    # Execute test workflow
    response = client.post(
        "/api/execution/test-workflow",
        data={
            "workflow_spec": json.dumps(workflow_spec),
            "content": workflow_input.content,
            "variables": "{}",
            "context": "{}",
        },
    )

    assert response.status_code == 200
    result = response.json()

    # Verify structure of response
    assert "status" in result
    assert "result" in result
    assert "context" in result["result"]
    assert "intermediate_results" in result["result"]["context"]

    # Print formatted results
    print_result("Status", result["status"])
    print_result("Final Output", result["result"]["final_output"])

    print("\n📊 Intermediate Results:")
    for step, output in result["result"]["context"]["intermediate_results"].items():
        print(f"\n  📝 Step {step}:")
        if isinstance(output, dict):
            if "input" in output:
                print_result("Input", output["input"], indent=4)
            if "output" in output:
                print_result("Output", output["output"], indent=4)
        else:
            print_result("Result", output, indent=4)

    print("\n✅ Test completed successfully")


def test_multi_agent_workflow():
    """Test workflow with Meeting Summarizer -> Email Manager chain"""
    print_section("MULTI-AGENT WORKFLOW TEST")

    # Initialize test data
    workflow_input = WorkflowInput(
        content="Meeting Transcript:\nTeam discussed Q4 goals.\nAction items: Update roadmap, Schedule follow-ups.",
        variables={},
        context={},
    )

    # Create workflow spec with multiple agents
    workflow_spec = {
        "name": "Meeting Summary and Email",
        "description": "Summarize meeting and draft follow-up email",
        "category": "productivity",
        "is_template": False,
        "agents": [
            {"agent_id": 2, "order": 1, "config": {"summary_length": "short"}},
            {"agent_id": 3, "order": 2, "config": {"mode": "draft_response"}},
        ],
    }

    print_result("Workflow Name", workflow_spec["name"])
    print_result("Number of Agents", len(workflow_spec["agents"]))
    print_result("Input Content", workflow_input.content)

    # Execute test workflow
    response = client.post(
        "/api/execution/test-workflow",
        data={
            "workflow_spec": json.dumps(workflow_spec),
            "content": workflow_input.content,
            "variables": "{}",
            "context": "{}",
        },
    )

    assert response.status_code == 200
    result = response.json()

    # Print formatted results
    print_result("Status", result["status"])

    print("\n🔄 Execution Steps:")
    for step, output in result["result"]["context"]["intermediate_results"].items():
        print(f"\n  🔹 Step {step}:")
        if isinstance(output, dict):
            if "input" in output:
                print_result("Input", output["input"], indent=4)
            if "output" in output:
                print_result("Output", output["output"], indent=4)
        else:
            print_result("Result", output, indent=4)

    print("\n📋 Final Output:")
    print("-" * 60)
    print(result["result"]["final_output"])
    print("-" * 60)

    print("\n✅ Test completed successfully")


def test_workflow_with_error_handling():
    """Test workflow error handling with invalid input"""
    print_section("ERROR HANDLING TEST")

    # Create workflow spec with invalid configuration
    workflow_spec = {
        "name": "Invalid Config Test",
        "description": "Test error handling",
        "category": "test",
        "is_template": False,
        "agents": [{"agent_id": 2, "order": 1, "config": {"invalid_param": "value"}}],
    }

    print_result("Testing", "Workflow with invalid configuration")
    print_result("Agent ID", workflow_spec["agents"][0]["agent_id"])
    print_result("Invalid Config", workflow_spec["agents"][0]["config"])

    response = client.post(
        "/api/execution/test-workflow",
        data={
            "workflow_spec": json.dumps(workflow_spec),
            "content": "Test content",
            "variables": "{}",
            "context": "{}",
        },
    )

    result = response.json()

    print("\n⚠️ Expected Error Response:")
    print("-" * 60)

    # Verify error handling
    if response.status_code != 200:
        assert "detail" in result
        print_result("Status Code", response.status_code)
        print_result("Error Details", result["detail"])
    else:
        assert "errors" in result["result"]["context"]
        print_result("Status Code", response.status_code)
        print_result("Status", result.get("status", "N/A"))
        print_result("Workflow Errors", result["result"]["context"]["errors"])

    print("-" * 60)
    print("\n✅ Error handling test completed")


if __name__ == "__main__":
    # Run all tests and display results with tracking
    print_section("WORKFLOW EXECUTION TESTS", width=100)

    tests_run = 0
    tests_passed = 0

    try:
        test_single_agent_workflow()
        tests_run += 1
        tests_passed += 1
    except Exception as e:
        print(f"\n❌ Single agent test failed: {str(e)}")
        tests_run += 1

    try:
        test_multi_agent_workflow()
        tests_run += 1
        tests_passed += 1
    except Exception as e:
        print(f"\n❌ Multi-agent test failed: {str(e)}")
        tests_run += 1

    try:
        test_workflow_with_error_handling()
        tests_run += 1
        tests_passed += 1
    except Exception as e:
        print(f"\n❌ Error handling test failed: {str(e)}")
        tests_run += 1

    # Print test summary
    print_section("TEST SUMMARY", width=100)
    print(f"Tests Run: {tests_run}")
    print(f"Tests Passed: {tests_passed}")
    print(f"Success Rate: {tests_passed / tests_run * 100:.1f}%")

    if tests_passed == tests_run:
        print("\n✅ All tests passed successfully!")
    else:
        print(f"\n⚠️ {tests_run - tests_passed} test(s) failed.")
