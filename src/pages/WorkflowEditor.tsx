
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  BackgroundVariant
} from '@xyflow/react';
import { toast } from 'sonner';

import '@xyflow/react/dist/style.css';
import '../styles/workflow-editor.css';

import AgentNode from '@/components/workflow/AgentNode';
import AgentPanel from '@/components/workflow/AgentPanel';
import AgentInputModal from '@/components/workflow/AgentInputModal';
import WorkflowResults from '@/components/workflow/WorkflowResults';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { agents, Agent } from '@/lib/data';
import { templates } from '@/lib/templateData';
import { Button } from '@/components/ui/button';
import { Save, Share2, Play, ArrowLeft, Trash2, Zap, StopCircle } from 'lucide-react';

// Define custom node types
const nodeTypes = {
  agentNode: AgentNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const WorkflowEditor = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const navigate = useNavigate();
  const location = useLocation();

  // Workflow execution state
  const {
    isRunning,
    results,
    startWorkflow,
    processAgentInput,
    stopWorkflow,
    currentAgent
  } = useWorkflowExecution(nodes, edges, agents);

  // Modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [processingInput, setProcessingInput] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  // Parse query parameters for template
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const templateId = queryParams.get('template');
    
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
      setActiveAgent(null);
    }
  }, [currentAgent]);

  // Load template function
  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      toast.error('Template not found');
      return;
    }
    
    // Set workflow name from template
    setWorkflowName(template.title);
    
    // Clear existing nodes/edges
    setNodes([]);
    setEdges([]);
    
    // Create nodes from template's agents
    const templateAgents = template.agentIds
      .map(id => agents.find(agent => agent.id === id))
      .filter(Boolean);
    
    if (templateAgents.length === 0) {
      toast.error('No valid agents found in template');
      return;
    }
    
    // Calculate positions for agents in a horizontal flow
    const newNodes = templateAgents.map((agent, index) => {
      if (!agent) return null;
      
      return {
        id: `${agent.id}-${Math.floor(Math.random() * 10000)}`,
        type: 'agentNode',
        position: { x: 250 * index + 100, y: 200 },
        data: { agent },
      };
    }).filter(Boolean) as Node[];
    
    // Create edges connecting the agents in sequence
    const newEdges: Edge[] = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({
        id: `e${newNodes[i].id}-${newNodes[i+1].id}`,
        source: newNodes[i].id,
        target: newNodes[i+1].id,
        animated: true,
      });
    }
    
    setNodes(newNodes);
    setEdges(newEdges);
    
    toast.success(`Loaded "${template.title}" template`);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({...params, animated: true}, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const agentId = event.dataTransfer.getData('application/agentNode');
      
      if (!reactFlowBounds || !agentId || !reactFlowInstance) {
        return;
      }

      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${agentId}-${Math.floor(Math.random() * 10000)}`,
        type: 'agentNode',
        position,
        data: { agent },
      };
      
      setNodes((nds) => nds.concat(newNode));
      toast.success(`Added ${agent.name} to workflow`);
    },
    [reactFlowInstance, setNodes]
  );

  const handleSaveWorkflow = () => {
    const flow = {
      name: workflowName,
      nodes,
      edges,
    };
    
    console.log('Saving workflow:', flow);
    localStorage.setItem('savedWorkflow', JSON.stringify(flow));
    toast.success('Workflow saved successfully!');
  };

  const handleRunWorkflow = () => {
    if (nodes.length === 0) {
      toast.error('Your workflow is empty. Add some agents first!');
      return;
    }
    
    startWorkflow();
  };

  const handleStopWorkflow = () => {
    stopWorkflow();
    toast.info('Workflow execution stopped');
  };

  const handleClearCanvas = () => {
    if (nodes.length > 0 || edges.length > 0) {
      setNodes([]);
      setEdges([]);
      toast.info('Canvas cleared');
    }
  };

  const handleAgentInputSubmit = (inputText: string, files: File[]) => {
    setProcessingInput(true);
    processAgentInput(inputText, files);
    setProcessingInput(false);
  };

  return (      
    <main className="flex-grow pt-20 bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate('/templates')}
            disabled={isRunning}
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Templates
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
              onClick={() => toast.info('Share functionality would go here')}
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
              <Button 
                size="sm" 
                onClick={handleRunWorkflow}
              >
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
              <AgentPanel agents={agents} />
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="border rounded-xl bg-background overflow-hidden shadow-sm flex-grow" ref={reactFlowWrapper}>
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
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Panel position="top-left" className="m-4 bg-background p-3 rounded-md shadow-sm border">
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
            {results.length > 0 && (
              <div className="border rounded-xl bg-background p-4 shadow-sm overflow-auto" style={{ maxHeight: '35vh' }}>
                <WorkflowResults results={results} agents={agents} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Input Modal */}
      {activeAgent && (
        <AgentInputModal
          agent={activeAgent}
          isOpen={showInputModal}
          onClose={() => {
            if (!processingInput) {
              handleStopWorkflow();
            }
          }}
          onSubmit={handleAgentInputSubmit}
          isProcessing={processingInput}
        />
      )}
    </main>
  );
};

export default WorkflowEditor;
