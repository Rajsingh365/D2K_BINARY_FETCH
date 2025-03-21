
import React, { useState, useEffect } from 'react';
import { Agent } from '@/lib/data';
import { X, Trash2, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkflowBuilderProps {
  selectedAgents: Agent[];
  onRemove: (agentId: string) => void;
  onClear: () => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ 
  selectedAgents,
  onRemove,
  onClear
}) => {
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    if (selectedAgents.length > 0) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(true);
    }
  }, [selectedAgents.length]);

  if (selectedAgents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 rounded-xl border-2 border-dashed border-muted">
        <div className="text-center max-w-xs mx-auto">
          <h3 className="font-medium mb-2">Build Your Workflow</h3>
          <p className="text-sm text-muted-foreground">
            Add AI agents from the marketplace to create your custom workflow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border bg-white p-4 h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">Your AI Workflow</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs text-muted-foreground"
          onClick={onClear}
        >
          <Trash2 size={14} className="mr-1" />
          Clear All
        </Button>
      </div>

      <div className="relative overflow-x-auto pb-4 px-2">
        <div className="flex items-center gap-4 min-w-max">
          {selectedAgents.map((agent, index) => (
            <React.Fragment key={agent.id}>
              <div 
                className={cn(
                  "workflow-node min-w-[180px]",
                  `border-${agent.color}-200 bg-${agent.color}-50/30`
                )}
              >
                <button 
                  className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm p-0.5"
                  onClick={() => onRemove(agent.id)}
                >
                  <X size={14} />
                </button>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className={`rounded-md w-8 h-8 flex items-center justify-center bg-${agent.color}-100`}>
                    {agent.icon && <agent.icon size={16} className={`text-${agent.color}-500`} />}
                  </div>
                  <h4 className="font-medium text-sm">{agent.name}</h4>
                </div>
                
                <p className="text-xs text-muted-foreground">{agent.type}</p>
              </div>
              
              {index < selectedAgents.length - 1 && (
                <div className="flex-shrink-0">
                  <MoveRight size={20} className="text-muted-foreground/50" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {showTooltip && selectedAgents.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 max-w-xs animate-fade-in border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Great start!</span> Continue adding agents to build your complete workflow.
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
