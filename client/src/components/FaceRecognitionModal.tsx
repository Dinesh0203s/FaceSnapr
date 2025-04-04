import { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Image as ImageIcon, Upload } from 'lucide-react';
import { isValidImage } from '@/lib/utils';
import { processFaceImage } from '@/lib/face-api';

interface FaceRecognitionModalProps {
  eventId: number;
  isOpen: boolean;
  onClose: () => void;
  onFaceDetected: (file: File) => void;
}

export default function FaceRecognitionModal({ 
  eventId, 
  isOpen, 
  onClose,
  onFaceDetected
}: FaceRecognitionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!isValidImage(selectedFile)) {
      setError('Please upload a valid image file (JPG, JPEG, or PNG)');
      return;
    }
    
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (!isValidImage(droppedFile)) {
        setError('Please upload a valid image file (JPG, JPEG, or PNG)');
        return;
      }
      
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a selfie first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if face is detected in the image
      const result = await processFaceImage(file);
      
      if (!result.success) {
        setError(result.message || 'Failed to detect face. Please try another photo.');
        return;
      }
      
      // Pass the file to the parent component
      onFaceDetected(file);
      
      // Close the modal
      onClose();
      
      toast({
        title: 'Face Detected',
        description: 'Your face is being analyzed to find matching photos.',
      });
    } catch (err) {
      console.error('Face detection error:', err);
      let message = 'Failed to process image. Please try another photo.';
      
      if (err instanceof Error) {
        message = err.message;
      }
      
      setError(message);
      
      toast({
        title: 'Face Detection Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetFile();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Face Recognition</DialogTitle>
          <DialogDescription>
            Upload a selfie to find photos of you in this event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6">
          {!previewUrl ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={triggerFileInput}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-2">
                  Click to upload a selfie<br />or drag and drop
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                />
                <Button 
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="relative mx-auto max-h-48 max-w-full">
                <img 
                  src={previewUrl} 
                  alt="Selfie preview" 
                  className="max-h-48 mx-auto rounded-md object-contain"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={resetFile}
                disabled={loading}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Change photo
              </Button>
            </div>
          )}
          
          {error && (
            <p className="mt-2 text-sm text-destructive text-center">{error}</p>
          )}
        </div>
        
        <DialogFooter className="flex space-x-2 sm:space-x-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            disabled={!file || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Find Photos'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
