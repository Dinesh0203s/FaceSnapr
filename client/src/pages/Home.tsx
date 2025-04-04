import { Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import EventCard from "@/components/EventCard";
// Temporarily comment out useAuth to debug error
// import { useAuth } from "@/context/AuthContext";

export default function Home() {
  // Temporarily use a hardcoded value instead of useAuth to debug
  const isAuthenticated = false;
  
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/events'],
    enabled: isAuthenticated
  });

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                <span className="block">Find Your Photos</span>
                <span className="block text-primary">With Face Recognition</span>
              </h1>
              <p className="mt-3 text-xl text-muted-foreground sm:mt-5 sm:max-w-xl">
                Instantly locate photos of yourself from events using our advanced face recognition technology. No more scrolling through hundreds of photos.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4">
                <Button size="lg" asChild className="mb-4 sm:mb-0">
                  <Link href="/events">
                    Browse Events
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works">
                    How It Works
                  </a>
                </Button>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 lg:w-1/2">
              <div className="relative">
                <img 
                  className="w-full rounded-lg shadow-xl"
                  src="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="People enjoying at an event"
                />
                <div className="absolute -bottom-4 -right-4 bg-card p-3 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                        alt="User avatar"
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-foreground">Face Detected!</div>
                      <div className="text-xs text-muted-foreground">4 photos found</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div id="how-it-works" className="mt-24">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">1. Enter Event PIN</h3>
                <p className="text-muted-foreground">Get access to event photos using the secret PIN provided by the event organizer.</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">2. Upload a Selfie</h3>
                <p className="text-muted-foreground">Take or upload a clear selfie to use for face recognition.</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">3. Find Your Photos</h3>
                <p className="text-muted-foreground">Our AI instantly identifies and displays all photos containing you.</p>
              </div>
            </div>
          </div>

          {/* Recent Events Section */}
          {isAuthenticated && (
            <div className="mt-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-foreground">Recent Events</h2>
                <Link href="/events" className="text-primary hover:text-primary/80 font-medium flex items-center">
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg animate-pulse">
                      <div className="h-48 bg-muted"></div>
                      <div className="p-4">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : events && events.length > 0 ? (
                  events.slice(0, 4).map((event) => (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      name={event.name}
                      date={event.date}
                      description={event.description}
                      location={event.location}
                      photoCount={0} // We would need an API call to get this count
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No recent events available.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
