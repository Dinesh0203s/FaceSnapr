import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, DEFAULT_ERROR_MESSAGE } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import PhotoGrid, { Photo } from "@/components/PhotoGrid";
import FaceRecognitionModal from "@/components/FaceRecognitionModal";
import EventPinModal from "@/components/EventPinModal";
import { Loader2, Search, Map, Calendar, Camera, Users, Info } from "lucide-react";

interface EventDetailProps {
  id: number;
}

export default function EventDetail({ id }: EventDetailProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [matchingPhotos, setMatchingPhotos] = useState<Photo[] | null>(null);

  // Get event data
  const {
    data: event,
    isLoading: eventLoading,
    isError: eventError,
  } = useQuery({
    queryKey: [`/api/events/${id}`],
    onError: (error) => {
      toast({
        title: "Error Loading Event",
        description: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
        variant: "destructive"
      });
    }
  });

  // Get event photos
  const {
    data: photos,
    isLoading: photosLoading,
    isError: photosError,
    refetch: refetchPhotos,
  } = useQuery({
    queryKey: [`/api/events/${id}/photos`],
    enabled: Boolean(event),
    onError: (error) => {
      // Check if error is due to PIN requirement
      if (error instanceof Error && error.message.includes("PIN")) {
        setIsPinModalOpen(true);
      } else {
        toast({
          title: "Error Loading Photos",
          description: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
          variant: "destructive"
        });
      }
    }
  });

  // Face recognition mutation
  const faceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('selfie', file);
      
      const response = await fetch(`/api/events/${id}/face-recognition`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Face recognition failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setMatchingPhotos(data.photos);
      
      toast({
        title: `Found ${data.photos.length} matching photos`,
        description: `${data.photos.length} out of ${data.totalPhotos} photos contain your face.`,
      });

      // Invalidate photo history query if it exists
      queryClient.invalidateQueries({ queryKey: ['/api/user/photo-history'] });
    },
    onError: (error) => {
      console.error('Face recognition error:', error);
      toast({
        title: 'Face Recognition Failed',
        description: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
        variant: 'destructive',
      });
    },
  });

  const handleFaceRecognition = (file: File) => {
    faceMutation.mutate(file);
  };

  // Filtered photos
  const filteredPhotos = photos && !matchingPhotos
    ? photos.filter(photo => 
        !searchQuery || 
        photo.id.toString().includes(searchQuery))
    : matchingPhotos;

  // If no authenticated user, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (eventLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (eventError || !event) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12 space-y-4">
            <Info className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Event Not Found</h1>
            <p className="text-muted-foreground">
              The event you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/events')}>Back to Events</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {formatDate(event.date)}
            </div>
            {event.location && (
              <div className="flex items-center">
                <Map className="mr-1 h-4 w-4" />
                {event.location}
              </div>
            )}
          </div>
          {event.description && (
            <p className="text-muted-foreground mb-6 max-w-3xl">{event.description}</p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search photos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => setIsFaceModalOpen(true)}
                disabled={faceMutation.isPending}
              >
                {faceMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                Find Photos of Me
              </Button>
              
              {matchingPhotos && (
                <Button 
                  variant="ghost"
                  onClick={() => setMatchingPhotos(null)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Show All Photos
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <PhotoGrid 
          photos={filteredPhotos || []} 
          loading={photosLoading} 
          showFaceIndicator={Boolean(matchingPhotos)}
        />
      </div>
      
      <EventPinModal
        eventId={id}
        eventName={event.name}
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          refetchPhotos();
        }}
      />
      
      <FaceRecognitionModal
        eventId={id}
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onFaceDetected={handleFaceRecognition}
      />
    </MainLayout>
  );
}