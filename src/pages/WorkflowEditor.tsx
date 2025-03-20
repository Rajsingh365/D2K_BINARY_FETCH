
import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  NodeChange,
  EdgeChange
} from '@xyflow/react';
import { toast } from 'sonner';

import '@xyflow/react/dist/style.css';
import '../styles/workflow-editor.css';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AgentNode from '@/components/workflow/AgentNode';
import AgentPanel from '@/components/workflow/AgentPanel';
import { Agent, agents } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Save, Share2, Play, ArrowLeft, Trash2, Zap } from 'lucide-react';

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

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({...params, animated: true}, eds)),
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
    // In a real app, this would save to a database
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
    toast.success('Workflow started! This would execute the workflow in a real application.');
  };

  const handleClearCanvas = () => {
    if (nodes.length > 0 || edges.length > 0) {
      setNodes([]);
      setEdges([]);
      toast.info('Canvas cleared');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-grow pt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 py-2 px-0 mr-2"
            />
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.info('Share functionality would go here')}>
                <Share2 size={16} className="mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearCanvas}>
                <Trash2 size={16} className="mr-1" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveWorkflow}>
                <Save size={16} className="mr-1" />
                Save
              </Button>
              <Button size="sm" onClick={handleRunWorkflow}>
                <Play size={16} className="mr-1" />
                Run Workflow
              </Button>
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

            <div className="md:col-span-4 border rounded-xl bg-background h-full overflow-hidden shadow-sm" ref={reactFlowWrapper}>
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
              >
                <Controls className="m-4" />
                <MiniMap className="m-4" />
                {/* Fix for TypeScript error: changed "dots" to "lines" */}
                <Background variant="lines" gap={12} size={1} />
                <Panel position="top-left" className="m-4 bg-background p-3 rounded-md shadow-sm border">
                  <p className="text-xs text-muted-foreground">
                    Drag agents from the left panel and connect them to create your workflow.
                  </p>
                </Panel>
              </ReactFlow>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WorkflowEditor;
