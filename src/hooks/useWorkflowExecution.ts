
import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Agent } from '@/lib/data';
import { toast } from 'sonner';
import { AgentResult } from '@/components/workflow/WorkflowResults';

export const useWorkflowExecution = (nodes: Node[], edges: Edge[], allAgents: Agent[]) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [results, setResults] = useState<AgentResult[]>([]);
  const [executionSequence, setExecutionSequence] = useState<Node[]>([]);

  // Determine the execution sequence of nodes based on the graph
  const prepareExecutionSequence = useCallback(() => {
    if (nodes.length === 0) return [];
    
    // Find starting nodes (those with no incoming edges)
    const nodeWithIncomingEdges = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(node => !nodeWithIncomingEdges.has(node.id));
    
    if (startNodes.length === 0 && nodes.length > 0) {
      // If no clear starting node, just use the first node
      return [nodes[0]];
    }
    
    // Start with first starting node for simplicity
    const sequence: Node[] = [startNodes[0]];
    const visited = new Set([startNodes[0].id]);
    
    // Follow the edges to build sequence
    let currentNode = startNodes[0];
    while (true) {
      // Find outgoing edges
      const outgoingEdges = edges.filter(e => e.source === currentNode.id);
      if (outgoingEdges.length === 0) break;
      
      // Get the next node
      const nextNodeId = outgoingEdges[0].target;
      const nextNode = nodes.find(n => n.id === nextNodeId);
      
      if (!nextNode || visited.has(nextNodeId)) break;
      
      sequence.push(nextNode);
      visited.add(nextNodeId);
      currentNode = nextNode;
    }
    
    return sequence;
  }, [nodes, edges]);

  const startWorkflow = useCallback(() => {
    const sequence = prepareExecutionSequence();
    
    if (sequence.length === 0) {
      toast.error('Unable to determine workflow execution sequence');
      return;
    }
    
    setExecutionSequence(sequence);
    
    // Initialize results for all nodes in sequence
    const initialResults = sequence.map(node => {
      const agentData = node.data?.agent;
      return {
        agentId: agentData?.id || '',
        input: '',
        output: '',
        status: 'waiting' as const
      };
    });
    
    setResults(initialResults);
    setIsRunning(true);
    setCurrentAgentIndex(0);
  }, [prepareExecutionSequence]);

  const processAgentInput = useCallback((inputText: string, files: File[]) => {
    if (currentAgentIndex < 0 || !executionSequence[currentAgentIndex]) return;
    
    // Update status of current agent to processing
    setResults(prev => {
      const updated = [...prev];
      updated[currentAgentIndex].status = 'processing';
      updated[currentAgentIndex].input = inputText;
      return updated;
    });
    
    // Simulate processing delay (5 seconds)
    setTimeout(() => {
      // Update results with output (same as input for now)
      setResults(prev => {
        const updated = [...prev];
        updated[currentAgentIndex].status = 'completed';
        updated[currentAgentIndex].output = inputText;
        return updated;
      });
      
      // Move to next agent
      if (currentAgentIndex < executionSequence.length - 1) {
        setCurrentAgentIndex(prev => prev + 1);
      } else {
        // Workflow completed
        setIsRunning(false);
        toast.success('Workflow execution completed!');
      }
    }, 5000);
  }, [currentAgentIndex, executionSequence]);

  const stopWorkflow = useCallback(() => {
    setIsRunning(false);
    setCurrentAgentIndex(-1);
    setResults([]);
    setExecutionSequence([]);
  }, []);

  // Get the current agent being processed
  const currentAgent = useCallback(() => {
    if (currentAgentIndex < 0 || !executionSequence[currentAgentIndex]) return null;
    
    const nodeData = executionSequence[currentAgentIndex].data;
    if (!nodeData || !nodeData.agent) return null;
    
    return allAgents.find(a => a.id === nodeData.agent.id) || null;
  }, [currentAgentIndex, executionSequence, allAgents]);

  return {
    isRunning,
    currentAgentIndex,
    results,
    executionSequence,
    startWorkflow,
    processAgentInput,
    stopWorkflow,
    currentAgent,
  };
};
