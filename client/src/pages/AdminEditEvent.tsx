import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Key, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn, formatDate, generateRandomPin } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { insertEventSchema } from "@shared/schema";

// Extend the event schema for the form
const formSchema = insertEventSchema
  .omit({ createdBy: true }) // This will be set from the user's ID
  .extend({
    date: z.date({ required_error: "Event date is required" }),
  });

type FormValues = z.infer<typeof formSchema>;

interface AdminEditEventProps {
  id: number;
}

export default function AdminEditEvent({ id }: AdminEditEventProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);

  // Get event details
  const { data: event, isLoading, isError } = useQuery({
    queryKey: [`/api/events/${id}`],
  });

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      pin: "",
      date: new Date(),
    },
  });

  // Set form values when event data loads
  useEffect(() => {
    if (event) {
      form.reset({
        name: event.name,
        description: event.description || "",
        location: event.location || "",
        pin: event.pin,
        date: new Date(event.date),
      });
    }
  }, [event, form]);

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const eventData = {
        ...data,
        createdBy: event?.createdBy || user?.id || 0,
      };
      
      return apiRequest('PUT', `/api/events/${id}`, eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event Updated",
        description: "Your event has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
      navigate('/admin/events');
    },
    onError: (error) => {
      toast({
        title: "Event Update Failed",
        description: error instanceof Error ? error.message : "There was an error updating the event.",
        variant: "destructive",
      });
    },
  });

  // Generate random PIN
  const handleGeneratePin = () => {
    setIsGeneratingPin(true);
    setTimeout(() => {
      form.setValue("pin", generateRandomPin());
      setIsGeneratingPin(false);
    }, 500);
  };

  // Form submission
  const onSubmit = (data: FormValues) => {
    updateEventMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Edit Event">
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError || !event) {
    return (
      <AdminLayout title="Edit Event">
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
    <AdminLayout title={`Edit Event: ${event.name}`}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Annual Corporate Party" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Grand Hyatt Hotel, New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the event..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access PIN</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGeneratePin}
                        disabled={isGeneratingPin}
                      >
                        {isGeneratingPin ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4 mr-2" />
                        )}
                        Generate
                      </Button>
                    </div>
                    <FormDescription>
                      This PIN will be required for users to access event photos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin/events')}
                  disabled={updateEventMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateEventMutation.isPending}
                >
                  {updateEventMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Update Event
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}