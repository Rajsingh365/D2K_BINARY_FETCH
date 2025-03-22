
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
  const [showResults, setShowResults] = useState(false);

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
      const agentData = node.data?.agent as Agent | undefined;
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
    setShowResults(false);
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
    
    // Simulate processing delay (5 seconds) - this would be replaced with actual API call
    setTimeout(() => {
      // Update results with output from the API
      setResults(prev => {
        const updated = [...prev];
        updated[currentAgentIndex].status = 'completed';
        
        // Simulate different outputs based on the agent type
        const currentNodeData = executionSequence[currentAgentIndex]?.data;
        const currentAgentData = currentNodeData?.agent as Agent | undefined;
        
        if (currentAgentData) {
          switch(currentAgentData.id) {
            case 'text-generator':
              updated[currentAgentIndex].output = `Generated text based on your input: "${inputText}"\n\nHere's a creative expansion: ${inputText} is just the beginning of what we can explore together. Let me help you develop this further with some additional ideas and perspectives.`;
              break;
            case 'code-assistant':
              updated[currentAgentIndex].output = `Here's some code based on your request:\n\n\`\`\`javascript\n// Implementation for: ${inputText}\nfunction processInput(data) {\n  // Parse the input\n  const parsed = JSON.parse(data);\n  \n  // Process the data\n  const result = parsed.map(item => item.value * 2);\n  \n  return result;\n}\n\`\`\``;
              break;
            case 'data-analyzer':
              updated[currentAgentIndex].output = `Analysis of your input:\n\n• Key themes identified: ${inputText.split(' ').slice(0, 3).join(', ')}\n• Sentiment: Positive\n• Recommendations: Consider exploring related topics such as X, Y, and Z.`;
              break;
            default:
              updated[currentAgentIndex].output = `Processed your input: "${inputText}"\n\nHere's my response based on my capabilities. I've analyzed the content and prepared relevant information that addresses your needs.`;
          }
        } else {
          updated[currentAgentIndex].output = `Processed: ${inputText}`;
        }
        
        return updated;
      });
      
      // Show results after processing
      setShowResults(true);
    }, 5000);
  }, [currentAgentIndex, executionSequence]);

  const continueWorkflow = useCallback(() => {
    setShowResults(false);
    
    // Move to next agent
    if (currentAgentIndex < executionSequence.length - 1) {
      setCurrentAgentIndex(prev => prev + 1);
    } else {
      // Workflow completed
      setIsRunning(false);
      toast.success('Workflow execution completed!');
    }
  }, [currentAgentIndex, executionSequence]);

  const modifyCurrentStep = useCallback(() => {
    // Allow re-processing of the current agent
    setShowResults(false);
    
    // Keep the same agent index, just reset its status
    setResults(prev => {
      const updated = [...prev];
      updated[currentAgentIndex].status = 'waiting';
      return updated;
    });
  }, [currentAgentIndex]);

  const goBackOneStep = useCallback(() => {
    if (currentAgentIndex <= 0) return;
    
    setShowResults(false);
    
    // Go back to previous agent
    setCurrentAgentIndex(prev => prev - 1);
    
    // Reset the status of the current and previous agent
    setResults(prev => {
      const updated = [...prev];
      if (currentAgentIndex < updated.length) {
        updated[currentAgentIndex].status = 'waiting';
      }
      updated[currentAgentIndex - 1].status = 'waiting';
      return updated;
    });
  }, [currentAgentIndex]);

  const stopWorkflow = useCallback(() => {
    setIsRunning(false);
    setCurrentAgentIndex(-1);
    setResults([]);
    setExecutionSequence([]);
    setShowResults(false);
  }, []);

  // Get the current agent being processed
  const currentAgent = useCallback(() => {
    if (currentAgentIndex < 0 || !executionSequence[currentAgentIndex]) return null;
    
    const nodeData = executionSequence[currentAgentIndex].data;
    if (!nodeData) return null;
    
    // Properly type-cast the agent data
    const agentData = nodeData.agent as Agent;
    if (!agentData) return null;
    
    return allAgents.find(a => a.id === agentData.id) || null;
  }, [currentAgentIndex, executionSequence, allAgents]);

  return {
    isRunning,
    currentAgentIndex,
    results,
    executionSequence,
    showResults,
    startWorkflow,
    processAgentInput,
    continueWorkflow,
    modifyCurrentStep,
    goBackOneStep,
    stopWorkflow,
    currentAgent,
  };
};
