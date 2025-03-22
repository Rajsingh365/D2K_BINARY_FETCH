import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import { toast } from "sonner";

import "@xyflow/react/dist/style.css";
import "../styles/workflow-editor.css";

import AgentNode from "@/components/workflow/AgentNode";
import AgentPanel from "@/components/workflow/AgentPanel";
import InputModal from "@/components/workflow/InputModal";
import WorkflowResults from "@/components/workflow/WorkflowResults";
import { useWorkflowExecution } from "@/hooks/useWorkflowExecution";
import { Agent } from "@/lib/marketPlaceData";
import { templates } from "@/lib/templateData";
import { Button } from "@/components/ui/button";
import {
  Save,
  Share2,
  Play,
  ArrowLeft,
  Trash2,
  Zap,
  StopCircle,
  Mic,
  Upload,
} from "lucide-react";
import { useWorkflows, Workflow } from "@/context/WorkflowContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Define custom node types
const nodeTypes = {
  agentNode: AgentNode,
};

const WorkflowEditor = () => {
  // Existing states
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(
    null
  );
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useState(new URLSearchParams(location.search));
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // New state for initial run modal
  const [initialRunModal, setInitialRunModal] = useState(false);
  const [initialInputText, setInitialInputText] = useState("");
  const [initialFiles, setInitialFiles] = useState<File[]>([]);

  const { addWorkflow, updateWorkflow, getWorkflow } = useWorkflows();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_FAST_API_BACKEND_URL}/api/marketplace/agents/`
        );
        const data = await response.json();
        console.log("data", data);

        setAgents(data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchAgents();
  }, []);

  // Workflow execution state
  const {
    isRunning,
    results,
    showResults,
    startWorkflow,
    processAgentInput,
    continueWorkflow,
    modifyCurrentStep,
    goBackOneStep,
    stopWorkflow,
    currentAgent,
    currentAgentIndex,
    executionSequence,
  } = useWorkflowExecution(nodes, edges, agents);

  // Modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [processingInput, setProcessingInput] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  console.log('Nodes', nodes);
  // Load workflow from ID in URL params
  useEffect(() => {
    const workflowId = searchParams.get("id");
    const shouldRun = searchParams.get("run") === "true";

    if (workflowId) {
      const workflow = getWorkflow(workflowId);

      if (workflow) {
        // Load workflow data
        setCurrentWorkflowId(workflowId);
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || "");
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);

        // If the run parameter is present, start the workflow after a short delay
        if (shouldRun && workflow.nodes.length > 0) {
          setTimeout(() => {
            startWorkflow();
          }, 500);
        }
      } else {
        // Create a new workflow with this ID if it doesn't exist
        const newWorkflow: Workflow = {
          id: workflowId,
          name: workflowName,
          description: workflowDescription || "A custom workflow",
          status: "Draft",
          lastRun: "Never run",
          category: "Custom",
          agents: 0,
          thumbnail: `linear-gradient(to right, #4ade80, #22d3ee)`,
          favorite: false,
          nodes: [],
          edges: [],
        };

        addWorkflow(newWorkflow);
        setCurrentWorkflowId(workflowId);
      }
    }
  }, [searchParams, getWorkflow, addWorkflow]);

  // Parse query parameters for template
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const templateId = queryParams.get("template");

    if (templateId) {
      loadTemplate(templateId);
    }
  }, [location]);

  // Watch for changes in current agent and show input modal
  useEffect(() => {
    const agent = currentAgent();
    if (agent) {
      setActiveAgent(agent);
      setShowInputModal(true);
    } else {
      setShowInputModal(false);
    }
  }, [currentAgent, showResults]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setAudioBlob(audioBlob);

        // Close all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording completed");
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      toast.error("Template not found");
      return;
    }

    // Set workflow name from template
    setWorkflowName(template.title);

    // Clear existing nodes/edges
    setNodes([]);
    setEdges([]);

    // Create nodes from template's agents
    const templateAgents = template.agentIds
      .map((id) => agents.find((agent) => agent.id === id))
      .filter(Boolean);

    if (templateAgents.length === 0) {
      toast.error("No valid agents found in template");
      return;
    }

    // Calculate positions for agents in a horizontal flow
    const newNodes = templateAgents
      .map((agent, index) => {
        if (!agent) return null;

        return {
          id: `${agent.id}-${Math.floor(Math.random() * 10000)}`,
          type: "agentNode",
          position: { x: 250 * index + 100, y: 200 },
          data: { agent },
        };
      })
      .filter(Boolean) as Node[];

    // Create edges connecting the agents in sequence
    const newEdges: Edge[] = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({
        id: `e${newNodes[i].id}-${newNodes[i + 1].id}`,
        source: newNodes[i].id,
        target: newNodes[i + 1].id,
        animated: true,
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);

    toast.success(`Loaded "${template.title}" template`);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      // Debug all available formats
      console.log("Drop event triggered");
      console.log("Available agents:", agents);

      // Get the ReactFlow bounds
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) {
        console.error("Missing ReactFlow bounds or instance");
        return;
      }

      // Try different approaches to get agent data
      let agent: Agent | undefined = undefined;

      // Approach 1: Try to get full agent data from JSON
      try {
        const jsonData = event.dataTransfer.getData("application/json");
        if (jsonData) {
          const parsedData = JSON.parse(jsonData);
          console.log("Parsed JSON data:", parsedData);

          // Find the agent by ID in the agents array
          if (parsedData.id) {
            agent = agents.find(
              (a) => a.id === parseInt(parsedData.id) || a.id === parsedData.id
            );
            console.log("Found agent by JSON ID:", agent);

            // If agent not found by ID but we have enough data in parsedData,
            // we could construct a minimal agent object as fallback
            if (!agent && parsedData.name) {
              console.log("Creating fallback agent from JSON data");
              agent = parsedData as Agent;
            }
          }
        }
      } catch (e) {
        console.warn("Error parsing JSON data:", e);
      }

      // Approach 2: If no agent found yet, try with direct ID
      if (!agent) {
        const agentIdStr =
          event.dataTransfer.getData("application/agentNode") ||
          event.dataTransfer.getData("text/plain");

        if (agentIdStr) {
          console.log("Got agent ID as string:", agentIdStr);

          // Try as both string and number
          const agentIdNum = parseInt(agentIdStr);

          // Log all agent IDs for debugging
          console.log(
            "Available agent IDs:",
            agents.map((a) => `${a.id} (${typeof a.id})`)
          );

          // Find by either string or numeric ID
          agent = agents.find(
            (a) =>
              a.id === agentIdNum ||
              a.id === agentIdStr ||
              String(a.id) === agentIdStr
          );

          console.log("Found agent by direct ID lookup:", agent);
        }
      }

      // Final check - do we have an agent?
      if (!agent) {
        console.error("Agent not found after all lookup attempts");
        toast.error("Could not find the agent. Please try again.");
        return;
      }

      // Position the node where it was dropped
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create the new node with a unique ID
      const newNode = {
        id: `${agent.id}-${Math.floor(Math.random() * 10000)}`,
        type: "agentNode",
        position,
        data: { agent },
      };

      // Add the node to the flow
      setNodes((nds) => nds.concat(newNode));
      toast.success(`Added ${agent.name} to workflow`);
    },
    [reactFlowInstance, setNodes, agents, toast]
  );

  const handleSaveWorkflow = () => {
    if (!currentWorkflowId) {
      // Generate a new ID if one doesn't exist
      setCurrentWorkflowId(`wf-${Date.now()}`);
    }

    const workflowId = currentWorkflowId || `wf-${Date.now()}`;

    // Update or create workflow in context
    const workflow: Workflow = {
      id: workflowId,
      name: workflowName,
      description: workflowDescription || "A custom workflow",
      status: nodes.length > 0 ? "Active" : "Draft",
      lastRun: new Date().toLocaleString(),
      category: "Custom",
      agents: nodes.length,
      thumbnail: `linear-gradient(to right, #4ade80, #22d3ee)`,
      favorite: getWorkflow(workflowId)?.favorite || false,
      nodes,
      edges,
    };

    if (getWorkflow(workflowId)) {
      updateWorkflow(workflow);
    } else {
      addWorkflow(workflow);
      setCurrentWorkflowId(workflowId);
    }

    toast.success("Workflow saved successfully!");

    // Update URL to include workflow ID if not already there
    if (!searchParams.get("id")) {
      navigate(`/workflow-editor?id=${workflowId}`, { replace: true });
    }
  };

  // Modified run workflow handler
  const handleRunWorkflow = () => {
    if (nodes.length === 0) {
      toast.error("Your workflow is empty. Add some agents first!");
      return;
    }

    // Update last run time before starting
    if (currentWorkflowId) {
      const workflow = getWorkflow(currentWorkflowId);
      if (workflow) {
        updateWorkflow({
          ...workflow,
          lastRun: new Date().toLocaleString(),
        });
      }
    }
    

    // Show the initial run modal instead of starting workflow directly
    setInitialRunModal(true);
  };

  const startWorkflowExecution = (inputText: string, files: File[]) => {
    // Display the submitted data
    console.log("Starting workflow with:", { inputText, files });

    // Store the initial input for potential use later
    setInitialInputText(inputText);
    setInitialFiles(files);

    // Close the modal and start the workflow
    setInitialRunModal(false);
    startWorkflow();
  };
  console.log('nodes: ', nodes);
  console.log('edges', edges)

  const handleInitialSubmit = (formData: FormData) => {
    // Extract content (text input)
    const inputText = formData.get("content") as string;

    // Extract files
    const files: File[] = [];
    formData.getAll("file").forEach((file) => {
      if (file instanceof File) {
        files.push(file);
      }
    });

    // Add audio recording if available
    if (audioBlob) {
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });
      files.push(audioFile);
      setAudioBlob(null); // Clear the audio blob after using it
    }
   

    const executionSequence= nodes.map((node) => Number(node.id.split('-')[0]));

    console.log("Execution sequence:", executionSequence);

    console.log("Initial workflow input:", {
      text: inputText,
      files: files.map((f) => f.name),
    });

    startWorkflowExecution(inputText, files);
  };

  const handleStopWorkflow = () => {
    stopWorkflow();
    toast.info("Workflow execution stopped");
  };

  const handleClearCanvas = () => {
    if (nodes.length > 0 || edges.length > 0) {
      setNodes([]);
      setEdges([]);
      toast.info("Canvas cleared");
    }
  };

  const handleFormSubmit = (formData: FormData) => {
    setProcessingInput(true);

    // Extract content (text input)
    const inputText = formData.get("content") as string;

    // Extract files
    const files: File[] = [];
    formData.getAll("file").forEach((file) => {
      if (file instanceof File) {
        files.push(file);
      }
    });

    // Add audio recording if available
    if (audioBlob) {
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });
      files.push(audioFile);
      setAudioBlob(null); // Clear the audio blob after using it
    }

    console.log("Submitting form data:", {
      text: inputText,
      files: files.map((f) => f.name),
    });

    // Process the input using the workflow execution
    processAgentInput(inputText, files);

    setTimeout(() => {
      setProcessingInput(false);
    }, 3000);
  };

  return (
    <main className="flex-grow pt-20 bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => navigate("/my-workflows")}
            disabled={isRunning}
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Workflows
          </Button>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 py-2 px-0 mr-2"
            disabled={isRunning}
          />
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Share functionality would go here")}
              disabled={isRunning}
            >
              <Share2 size={16} className="mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCanvas}
              disabled={isRunning}
            >
              <Trash2 size={16} className="mr-1" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveWorkflow}
              disabled={isRunning}
            >
              <Save size={16} className="mr-1" />
              Save
            </Button>
            {isRunning ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStopWorkflow}
              >
                <StopCircle size={16} className="mr-1" />
                Stop Workflow
              </Button>
            ) : (
              <Button size="sm" onClick={handleRunWorkflow}>
                <Play size={16} className="mr-1" />
                Run Workflow
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-[calc(100vh-240px)]">
          <div className="md:col-span-1 bg-background rounded-xl overflow-hidden shadow-sm border">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                Available Agents
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Drag and drop agents into the canvas
              </p>
            </div>
            <div className="p-4 h-[calc(100%-64px)]">
              <AgentPanel />
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-4">
            <div
              className="border rounded-xl bg-background overflow-hidden shadow-sm flex-grow"
              ref={reactFlowWrapper}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                nodesDraggable={!isRunning}
                nodesConnectable={!isRunning}
                elementsSelectable={!isRunning}
              >
                <Controls className="m-4" />
                <MiniMap className="m-4" />
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={12}
                  size={1}
                />
                <Panel
                  position="top-left"
                  className="m-4 bg-background p-3 rounded-md shadow-sm border"
                >
                  <p className="text-xs text-muted-foreground">
                    {isRunning
                      ? "Workflow is running. Please provide input for each agent when prompted."
                      : nodes.length === 0
                      ? "Drag agents from the left panel and connect them to create your workflow."
                      : `Your workflow has ${nodes.length} agents and ${edges.length} connections.`}
                  </p>
                </Panel>
              </ReactFlow>
            </div>

            {/* Results section */}
            {results.length > 0 && !showResults && !showInputModal && (
              <div
                className="border rounded-xl bg-background p-4 shadow-sm overflow-auto"
                style={{ maxHeight: "35vh" }}
              >
                <WorkflowResults results={results} agents={agents} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Initial run modal */}
      <Dialog
        open={initialRunModal}
        onOpenChange={(open) => !isRunning && setInitialRunModal(open)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start Workflow</DialogTitle>
            <DialogDescription>
              Enter your initial input for the workflow. Files and voice
              recording are optional.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleInitialSubmit(formData);
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="content">Input Text</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Enter your text here..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Files (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="file"
                      id="file"
                      name="file"
                      multiple
                      accept=".pdf,.txt,.jpg,.jpeg,.png,.wav,.mp3"
                      className="hidden"
                    />
                    <Label
                      htmlFor="file"
                      className="flex h-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-muted-foreground/20 p-2 text-center hover:bg-muted/50"
                    >
                      <div className="flex flex-col items-center gap-1 text-sm">
                        <Upload size={16} />
                        <span>Upload files</span>
                        <span className="text-xs text-muted-foreground">
                          PDF, TXT, Images, Audio
                        </span>
                      </div>
                    </Label>
                  </div>

                  <div>
                    <div className="flex h-24 flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/20 p-2 text-center">
                      {isRecording ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={stopRecording}
                        >
                          <StopCircle size={14} />
                          Stop Recording
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={startRecording}
                        >
                          <Mic size={14} />
                          Record Voice
                        </Button>
                      )}
                      {audioBlob && (
                        <span className="mt-1 text-xs text-green-500 font-medium">
                          Recording ready to use
                        </span>
                      )}
                      {!audioBlob && !isRecording && (
                        <span className="mt-1 text-xs text-muted-foreground">
                          Voice input is optional
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInitialRunModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Start Workflow</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Input Modal for agent interactions */}
      <InputModal
        isOpen={showInputModal}
        onClose={() => {
          if (!processingInput) {
            handleStopWorkflow();
          }
        }}
        onSubmit={handleFormSubmit}
        isProcessing={processingInput}
        title={activeAgent ? `Input for ${activeAgent.name}` : "Workflow Input"}
        description={
          activeAgent
            ? activeAgent.description
            : "Provide information for this workflow to process."
        }
      />
    </main>
  );
};

export default WorkflowEditor;
