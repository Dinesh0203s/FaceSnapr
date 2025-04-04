import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DownloadCloud, 
  Share2, 
  X, 
  Loader2, 
  ImageOff,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";

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
  const { toast } = useToast();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Handle photo click to open modal
  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsDialogOpen(true);
  };

  // Handle download button click
  const handleDownload = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAction("download");
    
    try {
      const response = await fetch(getImageUrl(photo.url));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your photo download has started.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle share button click
  const handleShare = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAction("share");
    
    try {
      if (navigator.share) {
        navigator.share({
          title: "Shared Photo",
          text: "Check out this photo!",
          url: getImageUrl(photo.url),
        })
        .then(() => {
          toast({
            title: "Shared Successfully",
            description: "The photo has been shared.",
          });
        })
        .catch((error) => {
          console.error("Error sharing:", error);
          toast({
            title: "Share Failed",
            description: "Failed to share the photo.",
            variant: "destructive",
          });
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(getImageUrl(photo.url))
          .then(() => {
            toast({
              title: "Link Copied",
              description: "Photo link copied to clipboard.",
            });
          })
          .catch(() => {
            toast({
              title: "Copy Failed",
              description: "Failed to copy the link to clipboard.",
              variant: "destructive",
            });
          });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Failed to share the photo.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse"></div>
            <CardContent className="p-3">
              <div className="h-4 bg-muted animate-pulse rounded-full w-2/3 mb-2"></div>
              <div className="h-4 bg-muted animate-pulse rounded-full w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ImageOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Photos Available</h3>
        <p className="text-muted-foreground max-w-md mt-2">
          There are no photos available for this event yet. Check back later or try another event.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card 
            key={photo.id} 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handlePhotoClick(photo)}
          >
            <div className="relative aspect-square">
              <img
                src={getImageUrl(photo.url)}
                alt={`Photo ${photo.id}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Face indicator icon */}
              {showFaceIndicator && photo.faceData && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-md">
                  <User className="h-4 w-4" />
                </div>
              )}
              
              {/* Action buttons */}
              <div className="absolute bottom-2 right-2 flex space-x-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full opacity-90"
                  onClick={(e) => handleDownload(photo, e)}
                  disabled={loadingAction === "download"}
                >
                  {loadingAction === "download" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DownloadCloud className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full opacity-90"
                  onClick={(e) => handleShare(photo, e)}
                  disabled={loadingAction === "share"}
                >
                  {loadingAction === "share" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Full-size photo dialog */}
      {selectedPhoto && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Photo #{selectedPhoto.id}</DialogTitle>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-4"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="relative">
              <img
                src={getImageUrl(selectedPhoto.url)}
                alt={`Photo ${selectedPhoto.id}`}
                className="w-full object-contain max-h-[70vh]"
              />
            </div>
            <DialogFooter>
              <div className="flex justify-between w-full">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={(e) => handleShare(selectedPhoto, e)}
                    disabled={loadingAction === "share"}
                  >
                    {loadingAction === "share" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Share2 className="mr-2 h-4 w-4" />
                    )}
                    Share
                  </Button>
                  <Button
                    onClick={(e) => handleDownload(selectedPhoto, e)}
                    disabled={loadingAction === "download"}
                  >
                    {loadingAction === "download" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DownloadCloud className="mr-2 h-4 w-4" />
                    )}
                    Download
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}