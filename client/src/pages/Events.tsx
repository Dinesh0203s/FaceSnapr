import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import EventCard from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Calendar, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function Events() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/events'],
    enabled: isAuthenticated
  });

  // Filter events based on search term
  const filteredEvents = events ? events.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">Browse Events</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore our collection of events and find photos from your favorite moments.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Search events by name, location, or description..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button>Search</Button>
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-12 bg-card rounded-lg shadow-md">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4">
              <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Login Required</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Please log in to browse events and access photos. Create an account if you don't have one yet.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild>
                <a href="/login">Login</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/register">Register</a>
              </Button>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg shadow-md">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Events Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm 
                ? `No events matching "${searchTerm}". Try different search terms.` 
                : "There are no events available at the moment. Please check back later."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  date={event.date}
                  description={event.description}
                  location={event.location}
                  photoCount={0} // We would need an API call to get this count
                />
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
