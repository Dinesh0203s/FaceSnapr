import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { formatDate, truncateText } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Search, Image, MapPin, ArrowRight, CalendarDays, Loader2 } from "lucide-react";

export default function Events() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get all events
  const { data: events, isLoading, isError } = useQuery({
    queryKey: ['/api/events'],
    onError: (error) => {
      toast({
        title: "Failed to Load Events",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  });
  
  // Filter events based on search term
  const filteredEvents = events && searchTerm
    ? events.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : events;
  
  return (
    <MainLayout>
      <div className="container max-w-6xl py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Events</h1>
            <p className="text-muted-foreground">
              Browse through all the available events and their photos.
            </p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              type="text" 
              placeholder="Search events..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Events</h2>
            <p className="text-muted-foreground mb-4">
              There was a problem loading the events. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle>
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      {event.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(event.date)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {truncateText(event.description, 120)}
                    </p>
                  )}
                  {event.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Image className="h-4 w-4 mr-1" />
                    <span>View Photos</span>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/events/${event.id}`}>
                      View Event
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Events Found</h2>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `No events matching "${searchTerm}"`
                : "There are no events available at the moment."}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")}>Clear Search</Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}