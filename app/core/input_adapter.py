from typing import Dict, Any, Optional, List, Union
import os
from tempfile import NamedTemporaryFile
from fastapi import UploadFile
import json
import logging

from app.models.execution import WorkflowInput
from app.db.models import Agent

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InputAdapter:
    """Adapts standardized workflow inputs to agent-specific inputs"""

    @staticmethod
    async def adapt_input(
        workflow_input: WorkflowInput,
        first_agent: Agent,
        file: Optional[UploadFile] = None,
    ) -> Dict[str, Any]:
        """
        Transform standard input to match the expected input format of the first agent

        Args:
            workflow_input: Standardized workflow input
            first_agent: The first agent in the workflow
            file: Optional file uploaded by the user

        Returns:
            Transformed input data matching the agent's expected schema
        """
        try:
            # Log input for debugging
            logger.info(f"Adapting input for agent: {first_agent.name}")
            logger.info(f"Input content type: {type(workflow_input.content)}")
            logger.info(f"File provided: {file is not None}")

            # Get agent's input schema
            agent_input_schema = first_agent.input_schema

            # Start with a base transformed input
            transformed_input = {}

            # Process file if provided
            file_content = None
            file_path = None
            if file:
                # Create a temp file to store the uploaded content
                try:
                    with NamedTemporaryFile(
                        delete=False, suffix=os.path.splitext(file.filename)[1]
                    ) as temp_file:
                        file_path = temp_file.name
                        # Write the file content to the temp file
                        content = await file.read()
                        temp_file.write(content)

                    # Reset file pointer for potential reuse
                    await file.seek(0)

                    # For text files, read the content
                    if file.content_type and "text" in file.content_type:
                        file_content = content.decode("utf-8")
                        logger.info(f"File content length: {len(file_content)}")
                except Exception as e:
                    logger.error(f"Error processing file: {str(e)}")
                    # Continue without file content - don't fail completely

            # Ensure we have content as a string
            main_content = ""
            if file_content:
                main_content = file_content
            elif workflow_input.content:
                main_content = workflow_input.content

            logger.info(f"Main content length: {len(main_content)}")
            logger.info(
                f"Agent input schema properties: {list(agent_input_schema.get('properties', {}).keys())}"
            )

            # Handle different agent types based on their input schemas
            properties = agent_input_schema.get("properties", {})

            # For transcript-based agents (like MeetingSummarizer)
            if "transcript" in properties:
                transformed_input["transcript"] = main_content
                logger.info("Adapting for transcript-based agent")

            # For content-based agents (like SEOOptimizer)
            elif "content" in properties:
                transformed_input["content"] = main_content
                logger.info("Adapting for content-based agent")

                # Check if the agent accepts keywords
                if "keywords" in properties and workflow_input.variables.get(
                    "keywords"
                ):
                    keywords_str = workflow_input.variables.get("keywords", "")
                    if isinstance(keywords_str, str):
                        transformed_input["keywords"] = [
                            k.strip() for k in keywords_str.split(",")
                        ]
                    elif isinstance(keywords_str, list):
                        transformed_input["keywords"] = keywords_str

            # For email-based agents
            elif "email" in properties:
                logger.info("Adapting for email-based agent")
                # Create basic email structure
                transformed_input["email"] = {
                    "subject": workflow_input.variables.get("subject", "No Subject"),
                    "body": main_content,
                    "sender": workflow_input.variables.get(
                        "sender", "user@example.com"
                    ),
                    "sender_name": workflow_input.variables.get("sender_name", "User"),
                }

            # For any other agent type, use content as generic input
            else:
                logger.info("Adapting for generic agent")
                transformed_input["input"] = main_content

                # Add any variables as additional fields
                for key, value in workflow_input.variables.items():
                    transformed_input[key] = value

                # If file was uploaded, add its path
                if file_path:
                    transformed_input["file_path"] = file_path

            # Add any context
            if workflow_input.context:
                transformed_input["context"] = workflow_input.context

            # Make sure required fields are present
            for required_field in agent_input_schema.get("required", []):
                if required_field not in transformed_input:
                    # Try to find the field in another place
                    if required_field in workflow_input.variables:
                        transformed_input[required_field] = workflow_input.variables[
                            required_field
                        ]
                    elif (
                        required_field == "content"
                        and "transcript" in transformed_input
                    ):
                        transformed_input["content"] = transformed_input["transcript"]
                    elif (
                        required_field == "transcript"
                        and "content" in transformed_input
                    ):
                        transformed_input["transcript"] = transformed_input["content"]
                    else:
                        # Create an empty value based on the schema
                        field_schema = properties.get(required_field, {})
                        field_type = field_schema.get("type", "string")

                        if field_type == "string":
                            transformed_input[required_field] = ""
                        elif field_type == "array":
                            transformed_input[required_field] = []
                        elif field_type == "object":
                            transformed_input[required_field] = {}
                        elif field_type == "number":
                            transformed_input[required_field] = 0
                        elif field_type == "boolean":
                            transformed_input[required_field] = False

            logger.info(
                f"Final transformed input keys: {list(transformed_input.keys())}"
            )
            return transformed_input

        except Exception as e:
            logger.error(f"Error in adapt_input: {str(e)}", exc_info=True)
            # Rethrow with more context
            raise ValueError(f"Failed to adapt input: {str(e)}")
