import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEFAULT_ERROR_MESSAGE, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PhotoGrid, { Photo } from "@/components/PhotoGrid";
import {
  User,
  Camera,
  CalendarDays,
  Settings,
  Search,
  ImageIcon,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function UserProfile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get user's photo history
  const {
    data: photoHistory,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: ['/api/user/photo-history'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    onError: (error) => {
      toast({
        title: "Error Loading Photo History",
        description: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
        variant: "destructive",
      });
    },
  });
  
  // If no authenticated user, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Filter photos based on search query
  const filteredPhotos = photoHistory
    ? photoHistory.filter((item) =>
        searchQuery
          ? item.event?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.photo?.id.toString().includes(searchQuery)
          : true
      )
    : [];
  
  // Group photos by event
  const photosByEvent = filteredPhotos.reduce((acc, item) => {
    const eventId = item.event?.id;
    if (!eventId) return acc;
    
    if (!acc[eventId]) {
      acc[eventId] = {
        event: item.event,
        photos: [],
      };
    }
    
    if (item.photo) {
      acc[eventId].photos.push(item.photo);
    }
    
    return acc;
  }, {} as Record<string, { event: any; photos: Photo[] }>);
  
  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }
  
  return (
    <MainLayout>
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">My Profile</h1>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl">
                    {user?.name
                      ? user.name.substring(0, 2).toUpperCase()
                      : user?.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-semibold">
                    {user?.name || user?.username}
                  </h2>
                  <p className="text-muted-foreground mb-4">{user?.email}</p>
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <Button variant="outline" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="photos" className="gap-2">
              <Camera className="h-4 w-4" />
              My Photos
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="photos" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Photos Found With You</h2>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search photos..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {historyLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : historyError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Error Loading Photos</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-md">
                    There was a problem loading your photo history. Please try again later.
                  </p>
                  <Button onClick={() => window.location.reload()}>Refresh</Button>
                </CardContent>
              </Card>
            ) : filteredPhotos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Photos Found</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-md">
                    {searchQuery
                      ? `No photos matching "${searchQuery}"`
                      : "You haven't been found in any photos yet. Use face recognition in events to find photos of yourself."}
                  </p>
                  {searchQuery ? (
                    <Button onClick={() => setSearchQuery("")}>Clear Search</Button>
                  ) : (
                    <Button onClick={() => navigate("/events")}>Browse Events</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              Object.values(photosByEvent).map(({ event, photos }) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription>
                          {formatDate(event.date)}
                          {event.location ? ` • ${event.location}` : ""}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/events/${event.id}`}>
                          View Event
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <PhotoGrid photos={photos} showFaceIndicator={true} />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent interactions and photo discoveries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      There was a problem loading your activity history. Please try again later.
                    </p>
                  </div>
                ) : filteredPhotos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      You don't have any activity yet. Use face recognition in events to find photos of yourself.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Photo</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPhotos.slice(0, 10).map((item) => (
                        <TableRow key={`${item.photoId}-${item.eventId}`}>
                          <TableCell className="font-medium">
                            {formatDate(item.createdAt || "")}
                          </TableCell>
                          <TableCell>{item.event?.name}</TableCell>
                          <TableCell>
                            {item.photo ? (
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded overflow-hidden">
                                  <img
                                    src={item.photo.url}
                                    alt={`Photo ${item.photoId}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <span>Photo #{item.photoId}</span>
                              </div>
                            ) : (
                              <span>Photo #{item.photoId}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/events/${item.eventId}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}