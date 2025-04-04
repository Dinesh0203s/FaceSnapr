import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EventPinModalProps {
  eventId: number;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventPinModal({ eventId, eventName, isOpen, onClose }: EventPinModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      setError('Please enter the event PIN');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await apiRequest('POST', '/api/events/access', { eventId, pin });
      
      toast({
        title: 'Access Granted',
        description: 'You now have access to this event\'s photos.',
      });
      
      onClose();
      setLocation(`/events/${eventId}`);
    } catch (err) {
      let message = 'Invalid PIN. Please try again.';
      
      if (err instanceof Error) {
        message = err.message;
      }
      
      setError(message);
      toast({
        title: 'Access Denied',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      if (!loading) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Event PIN</DialogTitle>
          <DialogDescription>
            Please enter the secret PIN to access photos from "{eventName}".
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="my-6">
            <Label htmlFor="event-pin" className="block text-sm font-medium mb-1">
              Event PIN
            </Label>
            <Input
              id="event-pin"
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={error ? 'border-destructive' : ''}
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
