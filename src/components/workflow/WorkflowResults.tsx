
import React from 'react';
import { Agent } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Circle } from 'lucide-react';

export interface AgentResult {
  agentId: string;
  input: string;
  output: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
}

interface WorkflowResultsProps {
  results: AgentResult[];
  agents: Agent[];
}

const WorkflowResults: React.FC<WorkflowResultsProps> = ({ results, agents }) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-medium">Workflow Results</h3>
      <div className="space-y-4">
        {results.map((result) => {
          const agent = agents.find(a => a.id === result.agentId);
          if (!agent) return null;

          return (
            <Card key={result.agentId} className="overflow-hidden">
              <CardHeader className={`bg-${agent.color}-50/50 py-3`}>
                <CardTitle className="text-sm flex items-center gap-2">
                  {result.status === 'completed' ? (
                    <Check size={16} className="text-green-500" />
                  ) : result.status === 'processing' ? (
                    <Circle size={16} className="text-blue-500 animate-pulse" />
                  ) : (
                    <Circle size={16} className="text-gray-300" />
                  )}
                  {agent.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {result.status === 'waiting' ? (
                  <p className="text-sm text-muted-foreground">Waiting to process...</p>
                ) : result.status === 'processing' ? (
                  <p className="text-sm text-muted-foreground">Processing...</p>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Input:</div>
                    <p className="text-sm p-2 bg-muted/30 rounded-md">{result.input}</p>
                    
                    <div className="text-xs text-muted-foreground mt-4">Output:</div>
                    <p className="text-sm p-2 bg-muted/30 rounded-md">{result.output}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowResults;
