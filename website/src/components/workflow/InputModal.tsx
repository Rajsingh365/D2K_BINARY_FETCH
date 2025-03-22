
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, Mic, StopCircle } from 'lucide-react';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isProcessing: boolean;
  title: string;
  description: string;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
  title,
  description,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  const removeAudio = () => {
    setAudioBlob(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    
    // Add text input
    if (textareaRef.current) {
      formData.append('content', textareaRef.current.value);
    }
    
    // Add files
    files.forEach(file => {
      formData.append('file', file);
    });
    
    // Add audio recording if available
    if (audioBlob) {
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      formData.append('file', audioFile);
    }
    
    onSubmit(formData);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Close all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="content">Your Input</Label>
            <Textarea 
              id="content" 
              ref={textareaRef}
              placeholder="Type your message here..."
              rows={4}
              disabled={isProcessing}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="file">Attachments</Label>
              <div className="flex gap-2">
                {isRecording ? (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    onClick={stopRecording}
                  >
                    <StopCircle size={16} className="mr-1" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={startRecording}
                    disabled={isProcessing || !!audioBlob}
                  >
                    <Mic size={16} className="mr-1" />
                    Record Voice
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload size={16} className="mr-1" />
                  Upload
                </Button>
              </div>
            </div>
            <Input
              id="file"
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
            
            {/* Display selected files */}
            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted-foreground">Selected files:</p>
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center bg-muted/50 rounded px-2 py-1 text-xs">
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => removeFile(file)} 
                        className="ml-1 text-muted-foreground hover:text-destructive"
                        disabled={isProcessing}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Display audio recording */}
            {audioBlob && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted-foreground">Voice recording:</p>
                <div className="flex items-center bg-muted/50 rounded px-2 py-1 text-xs">
                  <span className="truncate max-w-[150px]">recording.wav</span>
                  <button 
                    type="button" 
                    onClick={removeAudio} 
                    className="ml-1 text-muted-foreground hover:text-destructive"
                    disabled={isProcessing}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="mr-2" 
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InputModal;
