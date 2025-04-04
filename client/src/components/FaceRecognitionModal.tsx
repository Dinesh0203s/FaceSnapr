import { useState, useRef, useCallback } from 'react';
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!isValidImage(file)) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file (JPEG, PNG, or GIF).",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Process the image with face-api.js
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        try {
          const result = await processFaceImage(file);
          
          if (result.success) {
            onFaceDetected(file);
            onClose();
          } else {
            toast({
              title: "Face Detection Failed",
              description: result.message || "No face detected in the image. Please try another photo.",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Processing Error",
            description: error instanceof Error ? error.message : "Failed to process the image. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          URL.revokeObjectURL(objectUrl);
        }
      };
      
      img.onerror = () => {
        setIsLoading(false);
        URL.revokeObjectURL(objectUrl);
        toast({
          title: "Image Error",
          description: "Failed to load the image. Please try another file.",
          variant: "destructive",
        });
      };
      
      img.src = objectUrl;
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    }
    
    // Reset the input
    if (e.target.value) {
      e.target.value = '';
    }
  };

  // Handle starting the camera
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device or browser");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing the camera:', error);
      toast({
        title: "Camera Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to access the camera. Please ensure you've granted camera permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle stopping the camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
  }, []);

  // Clean up on close
  const handleDialogClose = () => {
    stopCamera();
    onClose();
  };

  // Take a photo from the camera
  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    
    setIsLoading(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            // Create a file from the blob
            const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            try {
              // Process image with face-api
              const result = await processFaceImage(file);
              
              if (result.success) {
                stopCamera();
                onFaceDetected(file);
                onClose();
              } else {
                toast({
                  title: "Face Detection Failed",
                  description: result.message || "No face detected in the image. Please try again or upload a photo.",
                  variant: "destructive",
                });
              }
            } catch (error) {
              toast({
                title: "Processing Error",
                description: error instanceof Error ? error.message : "Failed to process the image. Please try again.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Capture Failed",
              description: "Failed to capture photo. Please try again.",
              variant: "destructive",
            });
          }
          setIsLoading(false);
        }, 'image/jpeg', 0.9);
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Your Face</DialogTitle>
          <DialogDescription>
            Take a selfie or upload a photo of yourself to find photos you appear in.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {cameraActive ? (
            <div className="relative overflow-hidden rounded-lg border bg-background">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-64 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/20">
              <div className="flex space-x-2 mb-4">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Use your webcam to take a selfie or upload a photo to find all pictures you appear in.
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            {cameraActive ? (
              <>
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="flex-1"
                  onClick={stopCamera}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  className="flex-1"
                  onClick={takePhoto}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  Take Photo
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Photo
                </Button>
                <Button 
                  type="button" 
                  className="flex-1"
                  onClick={startCamera}
                  disabled={isLoading}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Use Camera
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDialogClose}
            disabled={isLoading}
            className="mt-2 sm:mt-0"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}