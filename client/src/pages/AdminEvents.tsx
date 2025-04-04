import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Search, Plus, Eye, Edit, Trash2, Loader2, Image as ImageIcon } from "lucide-react";

export default function AdminEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get all events
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/events'],
  });

  // Get photo counts
  const eventIds = events?.map(event => event.id) || [];
  const photoQueries = useQuery({
    queryKey: ['photoCountsForEvents', eventIds],
    enabled: eventIds.length > 0,
    queryFn: async () => {
      if (eventIds.length === 0) return {};
      
      // Create a map of event ID to photo count
      const photoCounts = {};
      
      // For each event, fetch its photos and count them
      await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const response = await fetch(`/api/events/${eventId}/photos`);
            if (response.ok) {
              const photos = await response.json();
              photoCounts[eventId] = photos.length;
            } else {
              photoCounts[eventId] = 0;
            }
          } catch (error) {
            console.error(`Error fetching photos for event ${eventId}:`, error);
            photoCounts[eventId] = 0;
          }
        })
      );
      
      return photoCounts;
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/events/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsDeleteDialogOpen(false);
      setDeleteEventId(null);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete the event.",
        variant: "destructive",
      });
    },
  });

  // Filter events based on search term
  const filteredEvents = events && searchTerm
    ? events.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : events;

  // Handler for delete button
  const handleDeleteClick = (id: number) => {
    setDeleteEventId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handler for delete confirmation
  const confirmDelete = () => {
    if (deleteEventId) {
      deleteMutation.mutate(deleteEventId);
    }
  };

  return (
    <AdminLayout title="Manage Events">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            type="text" 
            placeholder="Search events..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link href="/admin/events/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            A list of all events in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEvents && filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>{event.location || "-"}</TableCell>
                    <TableCell>{event.pin}</TableCell>
                    <TableCell>
                      {photoQueries.data && photoQueries.data[event.id] !== undefined 
                        ? photoQueries.data[event.id] 
                        : photoQueries.isLoading 
                          ? <Loader2 className="h-4 w-4 animate-spin" /> 
                          : "0"}
                    </TableCell>
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
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/events/${event.id}/photos`}>
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center">
                      <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-lg font-medium text-foreground mb-1">No events found</p>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm 
                          ? `No events matching "${searchTerm}"`
                          : "You haven't created any events yet"}
                      </p>
                      <Button asChild>
                        <Link href="/admin/events/add">Create your first event</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone and will also delete all associated photos.
            </DialogDescription>
          </DialogHeader>
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
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
