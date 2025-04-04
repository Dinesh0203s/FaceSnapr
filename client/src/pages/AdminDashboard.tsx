import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Calendar, Image, Users, Activity, Edit, Trash2, Eye, Plus } from "lucide-react";

export default function AdminDashboard() {
  // Get events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events'],
  });

  // Mock data for dashboard stats
  const stats = {
    totalPhotos: 0, // This would come from an API call
    activeEvents: events?.length || 0,
    activeUsers: 0, // This would come from an API call
    faceLookups: 0, // This would come from an API call
  };

  // Activities would come from an API call
  const activities = [
    {
      id: 1,
      type: 'upload',
      text: 'Uploaded 57 photos to Summer Beach Party',
      time: '2 hours ago',
      icon: <Image className="h-4 w-4" />,
      color: 'text-primary',
    },
    {
      id: 2,
      type: 'event',
      text: 'Created new event Annual Corporate Party',
      time: '5 hours ago',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-500',
    },
    {
      id: 3,
      type: 'user',
      text: 'New user John Smith registered',
      time: '1 day ago',
      icon: <Users className="h-4 w-4" />,
      color: 'text-pink-500',
    },
    {
      id: 4,
      type: 'edit',
      text: 'Updated event Wedding Reception',
      time: '2 days ago',
      icon: <Edit className="h-4 w-4" />,
      color: 'text-amber-500',
    },
  ];

  return (
    <AdminLayout title="Dashboard Overview">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary/20 text-primary">
                <Image className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-muted-foreground text-sm font-medium">Total Photos</p>
                <p className="text-foreground text-2xl font-semibold">{stats.totalPhotos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500/20 text-purple-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-muted-foreground text-sm font-medium">Active Events</p>
                <p className="text-foreground text-2xl font-semibold">{stats.activeEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-pink-500/20 text-pink-500">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-muted-foreground text-sm font-medium">Active Users</p>
                <p className="text-foreground text-2xl font-semibold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500/20 text-green-500">
                <Activity className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-muted-foreground text-sm font-medium">Face Lookups</p>
                <p className="text-foreground text-2xl font-semibold">{stats.faceLookups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Events Table */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Manage your recent events</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/events/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : events && events.length > 0 ? (
                events.slice(0, 5).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>0</TableCell> {/* This would come from an API call */}
                    <TableCell>{event.pin}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/events/${event.id}`}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/events/edit/${event.id}`}>
                            <Edit className="h-4 w-4 text-primary" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No events found. Create your first event!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {events && events.length > 5 && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" asChild>
                <Link href="/admin/events">View All Events</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <div className={`h-8 w-8 rounded-full bg-card flex items-center justify-center ${activity.color}`}>
                  {activity.icon}
                </div>
                <div className="ml-3">
                  <p className="text-foreground text-sm">{activity.text}</p>
                  <p className="text-muted-foreground text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
