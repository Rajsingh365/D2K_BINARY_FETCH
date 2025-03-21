
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Agent } from '@/lib/data';
import { Plus } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
  selected?: boolean;
  className?: string;
}

const AgentCard: React.FC<AgentCardProps> = ({ 
  agent, 
  onClick, 
  selected = false,
  className 
}) => {
  return (
    <div 
      className={cn(
        'agent-card group',
        selected && 'ring-2 ring-primary ring-offset-2',
        className
      )}
      onClick={() => onClick?.(agent)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div 
            className={cn(
              "rounded-lg w-12 h-12 flex items-center justify-center", 
              `bg-${agent.color}-50`
            )}
          >
            {agent.icon && <agent.icon className={`text-${agent.color}-500`} size={24} />}
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {agent.category}
          </Badge>
        </div>

        <h3 className="font-medium text-lg mb-1">{agent.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
          {agent.description}
        </p>

        <div className="space-y-2">
          {agent.features?.slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 border-t bg-secondary/40 flex items-center justify-between">
        <div className="text-xs font-medium">{agent.type}</div>
        <Button 
          variant={selected ? "secondary" : "default"} 
          size="sm" 
          className="gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(agent);
          }}
        >
          <Plus size={14} />
          <span>{selected ? 'Added' : 'Add to Flow'}</span>
        </Button>
      </div>
    </div>
  );
};

export default AgentCard;
