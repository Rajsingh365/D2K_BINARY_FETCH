
import React from 'react';
import { Agent } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight } from 'lucide-react';

interface AgentPanelProps {
  agents: Agent[];
}

const AgentPanel: React.FC<AgentPanelProps> = ({ agents }) => {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, agent: Agent) => {
    event.dataTransfer.setData('application/agentNode', agent.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="agent-panel-item bg-background rounded-lg p-3 flex items-center gap-3 cursor-grab hover:shadow-sm transition-all border border-muted hover:border-primary/20 relative group"
            draggable
            onDragStart={(event) => onDragStart(event, agent)}
          >
            <div className={cn(
              "rounded-md w-10 h-10 flex items-center justify-center",
              `bg-${agent.color}-50`
            )}>
              {agent.icon && <agent.icon size={18} className={`text-${agent.color}-500`} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{agent.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{agent.type}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 absolute right-2 text-muted-foreground transition-opacity">
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default AgentPanel;
