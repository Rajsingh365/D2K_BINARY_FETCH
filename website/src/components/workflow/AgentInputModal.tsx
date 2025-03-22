
import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, FileText, Paperclip, Send, Upload, File } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  type: 'input' | 'output';
  content: string;
  agent?: Agent;
  files?: File[];
}

interface AgentInputModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inputText: string, files: File[]) => void;
  isProcessing: boolean;
  result?: { input: string; output: string };
  onContinue?: () => void;
  onModify?: () => void;
  onGoBack?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  showResults?: boolean;
}

const AgentInputModal: React.FC<AgentInputModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
  result,
  onContinue,
  onModify,
  onGoBack,
  isFirstStep = true,
  isLastStep = false,
  showResults = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize message history when agent changes or results are shown
  useEffect(() => {
    if (isOpen) {
      // Add initial agent message
      if (!showResults && messages.length === 0) {
        setMessages([{
          type: 'output',
          content: `Hi! I'm the ${agent.name}. Please provide the information you'd like me to process.`,
          agent
        }]);
      }
      
      // When showing results, add the result to messages
      if (showResults && result && (messages.length === 0 || messages[messages.length - 1].content !== result.output)) {
        setMessages(prev => {
          // Only add if not already added
          if (prev.find(m => m.type === 'input' && m.content === result.input) && 
              prev.find(m => m.type === 'output' && m.content === result.output)) {
            return prev;
          }
          
          const updatedMessages = [...prev];
          
          // Add input message if it doesn't exist
          if (!prev.find(m => m.type === 'input' && m.content === result.input)) {
            updatedMessages.push({
              type: 'input',
              content: result.input,
              files: files.length > 0 ? files : undefined
            });
          }
          
          // Add output message if it doesn't exist
          if (!prev.find(m => m.type === 'output' && m.content === result.output)) {
            updatedMessages.push({
              type: 'output',
              content: result.output,
              agent
            });
          }
          
          return updatedMessages;
        });
      }
    } else {
      // Reset messages when modal closes
      setMessages([]);
      setInputText('');
      setFiles([]);
    }
  }, [agent, isOpen, showResults, result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() && files.length === 0) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'input',
      content: inputText,
      files: files.length > 0 ? files : undefined
    }]);
    
    // Add temporary processing message
    setMessages(prev => [...prev, {
      type: 'output',
      content: 'Processing...',
      agent
    }]);
    
    // Submit to parent component
    onSubmit(inputText, files);
    
    // Clear input
    setInputText('');
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isProcessing && inputText.trim()) {
        handleSubmit();
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Format content with spacing for better readability
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col" onClick={focusInput}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {agent.icon && <agent.icon size={18} className={`text-${agent.color}-500`} />}
            Chat with {agent.name}
          </DialogTitle>
          <DialogDescription>
            {showResults 
              ? "Review the generated output and decide what to do next." 
              : `Provide information for the ${agent.name} to process.`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow pr-4 my-4 max-h-[400px]">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.type === 'input' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    rounded-lg p-3 max-w-[80%] shadow-sm
                    ${message.type === 'input' 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : `bg-muted`}
                  `}
                >
                  {message.agent && message.type === 'output' && (
                    <div className="flex items-center gap-1 mb-1 text-xs font-medium text-muted-foreground">
                      {message.agent.icon && <message.agent.icon size={12} className={`text-${message.agent.color}-500`} />}
                      {message.agent.name}
                    </div>
                  )}
                  
                  <div className="text-sm whitespace-pre-wrap">
                    {formatContent(message.content)}
                  </div>
                  
                  {message.files && message.files.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                      <div className="flex items-center gap-1 text-xs">
                        <Paperclip size={10} />
                        <span>{message.files.length} file(s) attached</span>
                      </div>
                      
                      {message.files.map((file, fileIndex) => (
                        <div key={fileIndex} className="flex items-center gap-1 text-xs mt-1">
                          <FileText size={10} />
                          <span className="truncate">{file.name}</span>
                          <span className="ml-auto opacity-70">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>

        {showResults ? (
          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onGoBack} 
                disabled={isFirstStep || isProcessing}
                size="sm"
              >
                ← Back
              </Button>
              <Button 
                variant="outline" 
                onClick={onModify}
                disabled={isProcessing}
                size="sm"
              >
                Modify
              </Button>
            </div>
            <Button 
              onClick={onContinue}
              disabled={isProcessing}
              size="sm"
            >
              {isLastStep ? 'Finish' : 'Continue →'}
            </Button>
          </DialogFooter>
        ) : (
          <div className="border rounded-md flex items-end">
            <Textarea
              ref={inputRef}
              placeholder={`Type your message for ${agent.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[80px]"
            />
            <div className="p-2 flex flex-col gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                type="button" 
                className="h-8 w-8" 
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept=".pdf,.txt,.jpg,.jpeg,.png"
                />
                <Paperclip size={18} className={files.length > 0 ? 'text-primary' : ''} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                type="submit" 
                className="h-8 w-8" 
                onClick={handleSubmit}
                disabled={isProcessing || (!inputText.trim() && files.length === 0)}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        )}
        
        {files.length > 0 && !showResults && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center">
            <Paperclip size={12} className="mr-1" />
            <span>{files.length} file(s) attached</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 ml-auto text-xs"
              onClick={() => setFiles([])}
            >
              Clear
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgentInputModal;
