import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, isValidImage, getImageUrl } from "@/lib/utils";
import { Photo } from "@/components/PhotoGrid";
import { 
  Loader2,
  UploadCloud,
  ArrowLeft,
  Trash2,
  PlusCircle,
  ImageOff,
  Search
} from "lucide-react";

interface AdminEventPhotosProps {
  id: number;
}

export default function AdminEventPhotos({ id }: AdminEventPhotosProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get event details
  const { 
    data: event, 
    isLoading: eventLoading, 
    isError: eventError 
  } = useQuery({
    queryKey: [`/api/events/${id}`],
  });

  // Get event photos
  const { 
    data: photos, 
    isLoading: photosLoading, 
    isError: photosError 
  } = useQuery({
    queryKey: [`/api/events/${id}/photos`],
  });

  // Upload photo mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch(`/api/events/${id}/photos`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload photo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo Uploaded",
        description: "The photo has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/photos`] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading the photo.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Delete photo mutation
  const deleteMutation = useMutation({
    mutationFn: async (photoId: number) => {
      return apiRequest('DELETE', `/api/photos/${photoId}`);
    },
    onSuccess: () => {
      toast({
        title: "Photo Deleted",
        description: "The photo has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/photos`] });
      setIsDeleteDialogOpen(false);
      setSelectedPhoto(null);
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "There was an error deleting the photo.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    setIsUploading(true);
    uploadMutation.mutate(file);
    
    // Reset the input
    if (e.target.value) {
      e.target.value = '';
    }
  };

  // Handle file upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle photo delete
  const handleDeleteClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPhoto) {
      deleteMutation.mutate(selectedPhoto.id);
    }
  };

  // Filter photos by search query
  const filteredPhotos = photos ? photos.filter(photo => 
    photo.id.toString().includes(searchQuery)
  ) : [];

  if (eventLoading) {
    return (
      <AdminLayout title="Event Photos">
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (eventError || !event) {
    return (
      <AdminLayout title="Event Photos">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load event details. The event may have been deleted or you don't have permission to view it.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/admin/events')}>Back to Events</Button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Photos: ${event.name}`}>
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/events')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              {formatDate(event.date)} {event.location ? `• ${event.location}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Access PIN: {event.pin}</p>
                <p className="text-sm text-muted-foreground">Total Photos: {photos?.length || 0}</p>
              </div>
              <Button onClick={handleUploadClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Photo
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
        
        {isUploading && (
          <div className="mb-6 p-4 flex items-center justify-center border rounded-md">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            <span>Uploading photo...</span>
          </div>
        )}
        
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {photosLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : photosError ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load photos. Please try again later.
            </AlertDescription>
          </Alert>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ImageOff className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Photos Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No photos match your search." : "This event doesn't have any photos yet."}
            </p>
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            ) : (
              <Button onClick={handleUploadClick}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload First Photo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map(photo => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={getImageUrl(photo.url)}
                    alt={`Photo ${photo.id}`}
                    className="object-cover w-full h-full"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
                    onClick={() => handleDeleteClick(photo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">
                    ID: {photo.id} • {formatDate(photo.uploadedAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div className="py-4">
              <img
                src={getImageUrl(selectedPhoto.url)}
                alt="Photo to delete"
                className="w-full h-48 object-contain border rounded-md"
              />
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}