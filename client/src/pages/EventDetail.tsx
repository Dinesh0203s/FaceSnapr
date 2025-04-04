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
import { Loader2, Search, Map, Calendar, Camera, Users, Info } from "lucide-react";

interface EventDetailProps {
  id: number;
}

export default function EventDetail({ id }: EventDetailProps) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchingPhotos, setMatchingPhotos] = useState<Photo[] | null>(null);

  // Get event details
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: [`/api/events/${id}`],
    enabled: isAuthenticated && !!id,
  });

  // Get event photos
  const { data: photos, isLoading: photosLoading, error: photosError } = useQuery({
    queryKey: [`/api/events/${id}/photos`],
    enabled: isAuthenticated && !!id && !eventError,
  });

  // Face recognition mutation
  const faceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('selfie', file);

      const response = await fetch(`/api/events/${id}/face-recognition`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
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
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The event you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/events')}>
            Back to Events
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo Grid */}
          <div className="w-full md:w-3/4">
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Search photos..." 
                      className="w-full md:w-52 pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => setFaceModalOpen(true)}
                    disabled={faceMutation.isPending}
                    className="flex items-center"
                  >
                    {faceMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    Find My Photos
                  </Button>
                </div>
              </div>
              
              {matchingPhotos && (
                <div className="mb-4 p-3 bg-primary/10 rounded-md text-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      <span>Showing {matchingPhotos.length} photos with your face</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMatchingPhotos(null)}
                    >
                      Show All Photos
                    </Button>
                  </div>
                </div>
              )}
              
              <PhotoGrid 
                photos={filteredPhotos || []} 
                loading={photosLoading}
                showFaceIndicator
              />
            </div>
          </div>
          
          {/* Sidebar with Event Info */}
          <div className="w-full md:w-1/4">
            <div className="bg-card rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Event Details</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm text-muted-foreground">Event Date</h3>
                    <p className="text-foreground">{formatDate(event.date)}</p>
                  </div>
                </div>
                
                {event.location && (
                  <div className="flex items-start">
                    <Map className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm text-muted-foreground">Location</h3>
                      <p className="text-foreground">{event.location}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <Camera className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm text-muted-foreground">Photos</h3>
                    <p className="text-foreground">{photos ? photos.length : 0} photos</p>
                  </div>
                </div>
                
                {event.description && (
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm text-muted-foreground">Description</h3>
                      <p className="text-foreground text-sm">{event.description}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  className="w-full mb-3"
                  onClick={() => setFaceModalOpen(true)}
                  disabled={faceMutation.isPending}
                >
                  {faceMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  Find My Photos
                </Button>
                
                {photos && photos.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Download functionality will be available in a future update.",
                      });
                    }}
                  >
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FaceRecognitionModal
        eventId={id}
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        onFaceDetected={handleFaceRecognition}
      />
    </MainLayout>
  );
}
