import { useState } from 'react';
import { 
  Download, 
  Share2, 
  Maximize2, 
  X 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/utils';

export interface Photo {
  id: number;
  url: string;
  eventId: number;
  faceData?: string | null;
  uploadedAt: string;
}

interface PhotoGridProps {
  photos: Photo[];
  loading?: boolean;
  showFaceIndicator?: boolean;
}

export default function PhotoGrid({ photos, loading = false, showFaceIndicator = false }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { toast } = useToast();

  const handleDownload = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(getImageUrl(photo.url));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Download Started',
        description: 'Your photo is being downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'There was an error downloading the photo. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if Web Share API is supported
    if (navigator.share) {
      navigator.share({
        title: 'Shared Photo from FaceFind',
        text: 'Check out this photo from the event!',
        url: window.location.href,
      })
      .then(() => {
        toast({
          title: 'Shared Successfully',
          description: 'The photo has been shared.',
        });
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        toast({
          title: 'Sharing Failed',
          description: 'There was an error sharing the photo.',
          variant: 'destructive',
        });
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast({
            title: 'Link Copied',
            description: 'Photo link copied to clipboard.',
          });
        })
        .catch(() => {
          toast({
            title: 'Copy Failed',
            description: 'Failed to copy link to clipboard.',
            variant: 'destructive',
          });
        });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative rounded-md overflow-hidden">
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-md">
        <div className="rounded-full bg-primary/10 p-3 mb-4">
          <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">No Photos Available</h3>
        <p className="text-muted-foreground mt-2">
          This event doesn't have any photos yet or you don't have access to them.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="relative group rounded-md overflow-hidden cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            {showFaceIndicator && photo.faceData && (
              <div className="absolute top-2 right-2 z-10">
                <div 
                  className="bg-primary rounded-full p-1 text-white shadow-md" 
                  title="Face detected"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            )}
            
            <img 
              src={getImageUrl(photo.url)} 
              alt="Event photo" 
              className="w-full h-auto object-cover aspect-[4/3]"
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:text-primary bg-black/20 rounded-full"
                  onClick={(e) => handleDownload(photo, e)}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:text-primary bg-black/20 rounded-full"
                    onClick={(e) => handleShare(photo, e)}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:text-primary bg-black/20 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(photo);
                    }}
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span className="sr-only">Fullscreen</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Photo modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-5xl w-full p-1 sm:p-2 md:p-6 bg-background/95 backdrop-blur-sm">
          <div className="absolute right-2 top-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          {selectedPhoto && (
            <div className="flex items-center justify-center">
              <img 
                src={getImageUrl(selectedPhoto.url)} 
                alt="Full size event photo" 
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>
          )}
          
          {selectedPhoto && (
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-muted-foreground">
                Photo #{selectedPhoto.id}
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                  onClick={(e) => handleShare(selectedPhoto, e)}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button 
                  size="sm"
                  className="flex items-center space-x-1"
                  onClick={(e) => handleDownload(selectedPhoto, e)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
