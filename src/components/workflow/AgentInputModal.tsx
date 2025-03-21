
import React, { useState, useRef } from 'react';
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
import { Upload, File } from 'lucide-react';

interface AgentInputModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inputText: string, files: File[]) => void;
  isProcessing: boolean;
}

const AgentInputModal: React.FC<AgentInputModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
}) => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    onSubmit(inputText, files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {agent.icon && <agent.icon size={18} className={`text-${agent.color}-500`} />}
            {agent.name} Input
          </DialogTitle>
          <DialogDescription>
            Provide the information needed for the {agent.name} to process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="input-text">Text Input</Label>
            <Textarea
              id="input-text"
              placeholder={`Enter text for ${agent.name} to process...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Files (Optional)</Label>
            <div
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={triggerFileInput}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Drag & drop files here or click to select
              </p>
              {files.length > 0 ? (
                <p className="text-xs font-medium">{files.length} file(s) selected</p>
              ) : (
                <p className="text-xs text-muted-foreground">Supports documents, images, and more</p>
              )}
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files</Label>
              <div className="space-y-2 max-h-[100px] overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm bg-background p-2 rounded-md border">
                    <File size={14} />
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing || !inputText.trim()}>
            {isProcessing ? 'Processing...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentInputModal;
