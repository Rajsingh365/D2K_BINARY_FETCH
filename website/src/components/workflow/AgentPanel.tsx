
import React from 'react';
import { Agent } from '@/lib/marketPlaceData';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, ChevronRight } from 'lucide-react';
import { useAuthUser } from '@/context/AuthUserContext';

const AgentPanel = () => {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, agent: Agent) => {
    // Convert agent.id to string to ensure data transfer works correctly
    event.dataTransfer.setData('application/agentNode', String(agent.id));
    event.dataTransfer.effectAllowed = 'move';
  };

  const { usersAgent } = useAuthUser();
  console.log('usersAgent', usersAgent);

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-3">
        {usersAgent?.map((agent: Agent) => (
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
              {agent.icon && typeof agent.icon === "function" ? (
                <agent.icon size={18} className={`text-${agent.color}-500`} />
              ) : (
                <Bot 
                  size={18} 
                  className={`text-${agent.color}`}
                />
              )}
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
