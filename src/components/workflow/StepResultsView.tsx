
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Agent } from '@/lib/data';
import { ArrowRight, Edit, ArrowLeft } from 'lucide-react';

interface StepResultsViewProps {
  agent: Agent | null;
  result: {
    input: string;
    output: string;
  };
  onContinue: () => void;
  onModify: () => void;
  onGoBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const StepResultsView: React.FC<StepResultsViewProps> = ({
  agent,
  result,
  onContinue,
  onModify,
  onGoBack,
  isFirstStep,
  isLastStep,
}) => {
  if (!agent) return null;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className={`bg-${agent.color}-50/50`}>
        <CardTitle className="flex items-center gap-2 text-lg">
          {agent.icon && <agent.icon size={20} className={`text-${agent.color}-500`} />}
          {agent.name} Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Input:</h4>
          <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{result.input}</div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Output:</h4>
          <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">{result.output}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={onGoBack} 
            disabled={isFirstStep}
            className="mr-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
          <Button 
            variant="outline" 
            onClick={onModify}
          >
            <Edit size={16} className="mr-1" />
            Modify
          </Button>
        </div>
        <Button 
          onClick={onContinue}
        >
          {isLastStep ? 'Finish' : 'Continue'}
          {!isLastStep && <ArrowRight size={16} className="ml-1" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StepResultsView;
