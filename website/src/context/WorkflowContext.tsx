
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Edge, Node } from '@xyflow/react';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Paused' | 'Draft';
  lastRun: string;
  category: string;
  agents: number;
  thumbnail: string;
  favorite: boolean;
  nodes: Node[];
  edges: Edge[];
}

interface WorkflowContextType {
  workflows: Workflow[];
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getWorkflow: (id: string) => Workflow | undefined;
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflows = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflows must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  // Load workflows from localStorage on initial render
  useEffect(() => {
    const savedWorkflows = localStorage.getItem('workflows');
    if (savedWorkflows) {
      try {
        setWorkflows(JSON.parse(savedWorkflows));
      } catch (error) {
        console.error('Error parsing workflows from localStorage:', error);
      }
    }
  }, []);

  // Save workflows to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('workflows', JSON.stringify(workflows));
  }, [workflows]);

  const addWorkflow = (workflow: Workflow) => {
    setWorkflows(prevWorkflows => [...prevWorkflows, workflow]);
  };

  const updateWorkflow = (workflow: Workflow) => {
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(wf => wf.id === workflow.id ? workflow : wf)
    );
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(prevWorkflows => prevWorkflows.filter(wf => wf.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(wf => 
        wf.id === id ? { ...wf, favorite: !wf.favorite } : wf
      )
    );
  };

  const getWorkflow = (id: string) => {
    return workflows.find(wf => wf.id === id);
  };

  return (
    <WorkflowContext.Provider value={{ 
      workflows, 
      addWorkflow, 
      updateWorkflow, 
      deleteWorkflow, 
      toggleFavorite, 
      getWorkflow,
      setWorkflows 
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
