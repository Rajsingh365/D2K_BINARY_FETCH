
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Paperclip, Send, FileText } from 'lucide-react';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isProcessing: boolean;
  title?: string;
  description?: string;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
  title = "Input",
  description = "Provide information to process",
}) => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() && files.length === 0) return;
    
    // Create FormData to send
    const formData = new FormData();
    formData.append('content', inputText);
    
    // Append files if any
    files.forEach(file => {
      formData.append('file', file);
    });
    
    // Submit to parent component
    onSubmit(formData);
    
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

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col" onClick={focusInput}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md flex items-end mt-4">
          <Textarea
            ref={inputRef}
            placeholder="Type your message..."
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
        
        {files.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center">
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
            {/* File list */}
            <div className="mt-1 space-y-1">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <FileText size={10} />
                  <span className="truncate">{file.name}</span>
                  <span className="ml-auto opacity-70">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || (!inputText.trim() && files.length === 0)}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InputModal;
