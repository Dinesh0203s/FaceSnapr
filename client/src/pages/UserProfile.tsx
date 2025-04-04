import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Loader2, User, Clock, Image as ImageIcon } from "lucide-react";
import PhotoGrid, { Photo } from "@/components/PhotoGrid";

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("account");

  // Get user's photo history
  const { data: photoHistory, isLoading } = useQuery({
    queryKey: ['/api/user/photo-history'],
    enabled: !!user,
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return user.username?.substring(0, 1).toUpperCase() || 'U';
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 bg-card rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 bg-gradient-to-r from-primary to-purple-500 text-3xl">
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {user.name || user.username}
              </h1>
              <p className="text-muted-foreground mb-4">{user.email}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="photos">Photo History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your personal account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Username</p>
                    <p className="text-foreground">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p className="text-foreground">{user.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                    <p className="text-foreground">{user.isAdmin ? 'Administrator' : 'User'}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Password</p>
                    <p className="text-foreground">••••••••</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/forgot-password">Change Password</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Photo History
                </CardTitle>
                <CardDescription>
                  Photos you have viewed or found with face recognition
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !photoHistory || photoHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-primary/10 rounded-full p-3 inline-flex mb-4">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Photo History</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You haven't viewed any photos yet. Use face recognition to find photos of yourself in events.
                    </p>
                    <Button className="mt-4" asChild>
                      <a href="/events">Browse Events</a>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-muted-foreground">
                        Showing {photoHistory.length} photo{photoHistory.length !== 1 ? 's' : ''} from your history
                      </p>
                    </div>
                    <PhotoGrid photos={photoHistory} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
