import json
import time
from typing import Dict, Any, List, Optional
import sys


class TestVisualizer:
    """Helper class for visualizing test outputs and API responses."""

    @staticmethod
    def print_header(title: str, width: int = 80):
        """Print a formatted header."""
        print("\n" + "=" * width)
        print(f"{title.center(width)}")
        print("=" * width)

    @staticmethod
    def print_json(data: Dict[str, Any], indent: int = 2, show_all: bool = False):
        """Print formatted JSON with optional truncation for large nested objects."""
        if show_all:
            print(json.dumps(data, indent=indent))
            return

        # For large responses, abbreviate deep nested content
        def abbreviate(obj, depth=0):
            if depth > 3:  # Truncate after 3 levels of nesting
                if isinstance(obj, dict) and len(obj) > 3:
                    return {k: "..." for k in list(obj.keys())[:3]}
                elif isinstance(obj, list) and len(obj) > 3:
                    return obj[:3] + ["..."]
                return obj

            if isinstance(obj, dict):
                return {k: abbreviate(v, depth + 1) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [abbreviate(i, depth + 1) for i in obj]
            return obj

        truncated = abbreviate(data)
        print(json.dumps(truncated, indent=indent))

    @staticmethod
    def print_progress(
        current: int, total: int, prefix: str = "Progress", length: int = 50
    ):
        """Print a progress bar."""
        percent = float(current) * 100 / total
        filled_length = int(length * current // total)
        bar = "█" * filled_length + "-" * (length - filled_length)
        sys.stdout.write(f"\r{prefix}: |{bar}| {percent:.1f}% Complete")
        sys.stdout.flush()
        if current == total:
            print()

    @staticmethod
    def extract_key_results(workflow_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract the most important parts from a workflow result."""
        try:
            key_results = {
                "workflow_success": workflow_result.get("status") == "success",
                "final_output": workflow_result.get("result", {}).get(
                    "final_output", {}
                ),
                "agents_executed": len(
                    workflow_result.get("result", {})
                    .get("context", {})
                    .get("intermediate_results", {})
                ),
            }

            # Add generated knowledge if present
            knowledge = (
                workflow_result.get("result", {})
                .get("context", {})
                .get("rag_context", {})
                .get("generated_knowledge", {})
            )
            if knowledge:
                key_results["knowledge_generated"] = {
                    k: len(v) for k, v in knowledge.items()
                }

            return key_results
        except Exception as e:
            return {"error": f"Failed to extract key results: {str(e)}"}
