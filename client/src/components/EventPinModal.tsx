import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, LockKeyhole } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Form schema
const pinSchema = z.object({
  pin: z.string().min(4, "PIN must be at least 4 characters").max(10, "PIN cannot exceed 10 characters"),
});

type PinFormValues = z.infer<typeof pinSchema>;

interface EventPinModalProps {
  eventId: number;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventPinModal({ eventId, eventName, isOpen, onClose }: EventPinModalProps) {
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(false);

  // Create form
  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: "",
    },
  });

  // PIN verification mutation
  const pinMutation = useMutation({
    mutationFn: async (data: PinFormValues) => {
      console.log(`Verifying PIN for event ${eventId} with PIN ${data.pin}`);
      
      // Using fetch directly for debugging purposes
      const response = await fetch('/api/events/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId, 
          pin: data.pin 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("PIN verification failed:", errorData);
        throw new Error(errorData.message || "Failed to verify PIN");
      }
      
      const result = await response.json();
      console.log("PIN verification successful:", result);
      return result;
    },
    onSuccess: () => {
      setIsVerified(true);
      toast({
        title: "Access Granted",
        description: "You now have access to view the event photos.",
      });
      
      // Close modal and reload page after a short delay
      setTimeout(() => {
        onClose();
        // We don't use window.location.reload() here to avoid a full page reload
        // The parent component should handle refreshing the data
      }, 1500);
    },
    onError: (error) => {
      console.error("PIN verification error:", error);
      toast({
        title: "Access Denied",
        description: error instanceof Error 
          ? error.message 
          : "The PIN you entered is incorrect. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (data: PinFormValues) => {
    pinMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Event PIN</DialogTitle>
          <DialogDescription>
            This event requires a PIN for access. Please enter the PIN provided by the event organizer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isVerified ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-900/20">
                <LockKeyhole className="h-8 w-8" />
              </div>
              <p className="text-center font-medium">Access granted to "{eventName}"</p>
              <p className="text-sm text-muted-foreground text-center">
                You can now view all photos from this event.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event PIN</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="Enter PIN"
                              className="pl-9"
                              type="text"
                              autoComplete="off"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="sm:justify-between px-0 pb-0">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={onClose}
                    disabled={pinMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={pinMutation.isPending}
                  >
                    {pinMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Verify PIN
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}