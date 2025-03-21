
import React from 'react';
import { Agent } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Share2 } from 'lucide-react';

interface WorkflowPreviewProps {
  selectedAgents: Agent[];
}

const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({ selectedAgents }) => {
  if (selectedAgents.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-gradient-to-b from-secondary/30 to-background p-6 mt-6">
      <div className="mb-4">
        <h3 className="font-medium text-lg mb-1">
          {selectedAgents.length > 0 
            ? `${selectedAgents[0].category} Workflow` 
            : 'Custom Workflow'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {selectedAgents.length} AI agents working together
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-medium text-sm mb-3">Workflow Summary</h4>
          <p className="text-sm text-muted-foreground">
            {selectedAgents.length > 0 
              ? `This workflow combines ${selectedAgents.map(a => a.name).join(', ')} to ${getWorkflowDescription(selectedAgents)}`
              : 'Add agents to see workflow summary'}
          </p>
        </div>
        
        {selectedAgents.length > 1 && (
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-sm mb-3">Data Flow</h4>
            <div className="space-y-2">
              {selectedAgents.slice(0, -1).map((agent, index) => (
                <div key={agent.id} className="flex items-center text-sm">
                  <span className="font-medium">{agent.name}</span>
                  <ArrowRight size={14} className="mx-2 text-muted-foreground" />
                  <span className="text-muted-foreground">{selectedAgents[index + 1].name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button className="flex-1">Deploy Workflow</Button>
        <Button variant="outline" size="icon">
          <Download size={16} />
        </Button>
        <Button variant="outline" size="icon">
          <Share2 size={16} />
        </Button>
      </div>
    </div>
  );
};

function getWorkflowDescription(agents: Agent[]): string {
  if (agents.length === 0) return '';
  
  const categories = agents.map(a => a.category);
  const uniqueCategories = [...new Set(categories)];
  
  if (uniqueCategories.includes('Marketing')) {
    return 'automate content creation, optimization, and distribution for your marketing campaigns.';
  } else if (uniqueCategories.includes('Productivity')) {
    return 'streamline repetitive tasks and enhance team communication and collaboration.';
  } else if (uniqueCategories.includes('Legal')) {
    return 'simplify document processing, research, and compliance monitoring.';
  } else {
    return 'create a powerful automation that saves time and improves accuracy.';
  }
}

export default WorkflowPreview;
