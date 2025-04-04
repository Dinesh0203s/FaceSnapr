import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { cn, formatDate, generateRandomPin } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { insertEventSchema } from "@shared/schema";

// Extend the event schema for the form
const formSchema = insertEventSchema
  .omit({ createdBy: true }) // This will be set from the user's ID
  .extend({
    date: z.date({ required_error: "Event date is required" }),
  });

type FormValues = z.infer<typeof formSchema>;

export default function AdminAddEvent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      pin: generateRandomPin(),
      date: new Date(),
    },
  });

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const eventData = {
        ...data,
        createdBy: user?.id || 0, // Fallback to 0 if no user ID (should never happen)
      };
      
      return apiRequest('POST', '/api/events', eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Your event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      navigate('/admin/events');
    },
    onError: (error) => {
      toast({
        title: "Event Creation Failed",
        description: error instanceof Error ? error.message : "There was an error creating the event.",
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
    addEventMutation.mutate(data);
  };

  return (
    <AdminLayout title="Add New Event">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create a New Event</CardTitle>
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
                  disabled={addEventMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addEventMutation.isPending}
                >
                  {addEventMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create Event
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
