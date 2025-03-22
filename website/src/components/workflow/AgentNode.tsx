
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Agent } from '@/lib/marketPlaceData';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentNodeProps {
  data: {
    agent: Agent;
  };
  selected: boolean;
  id: string;
}

const AgentNode = memo(({ data, selected, id }: AgentNodeProps) => {
  const { agent } = data;
  
  return (
    <div className={cn(
      "bg-white p-0 rounded-lg border transition-all duration-200",
      selected ? "shadow-md ring-2 ring-primary ring-offset-2" : "shadow"
    )}>
      <div className={cn(
        "p-3 rounded-t-lg flex items-center gap-3",
        `bg-${agent.color}-50/50`
      )}>
        <div className={cn(
          "rounded-md w-8 h-8 flex items-center justify-center",
          `bg-${agent.color}-100`
        )}>
          {agent.icon && typeof agent.icon !== 'string' && <agent.icon size={16} className={`text-${agent.color}-500`} />}
        </div>
        <div>
          <h4 className="font-medium text-sm">{agent.name}</h4>
          <p className="text-xs text-muted-foreground">{agent.type}</p>
        </div>
        <button 
          className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
          onClick={() => {
            // In a real app, you would handle removal through the reactflow state
            console.log('Remove node:', agent.id);
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="p-3 text-xs">
        <p className="text-muted-foreground mb-2 line-clamp-2">{agent.description}</p>
        
        {agent.features && agent.features.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {agent.features[0]}
          </div>
        )}
      </div>

      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: '#555' }}
      />
    </div>
  );
});

AgentNode.displayName = 'AgentNode';

export default AgentNode;
