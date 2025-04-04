import { useState } from 'react';
import { Link } from 'wouter';
import { formatDate, truncateText } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EventPinModal from './EventPinModal';

interface EventCardProps {
  id: number;
  name: string;
  date: string;
  description?: string;
  location?: string;
  photoCount?: number;
  thumbnail?: string;
}

export default function EventCard({ 
  id, 
  name, 
  date, 
  description, 
  location, 
  photoCount = 0, 
  thumbnail 
}: EventCardProps) {
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const defaultThumbnail = `https://source.unsplash.com/random/500x300/?event,${encodeURIComponent(name)}`;
  
  return (
    <>
      <Card className="overflow-hidden group h-full bg-card/60 hover:shadow-md transition-shadow duration-300">
        <div className="relative h-48 overflow-hidden">
          <img 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            src={thumbnail || defaultThumbnail}
            alt={`${name} thumbnail`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-semibold">{name}</h3>
            <p className="text-gray-300 text-sm">{formatDate(date)}</p>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{photoCount} photos</span>
            <Button 
              size="sm" 
              variant="secondary"
              className="text-xs rounded-full"
              onClick={() => setPinModalOpen(true)}
            >
              Enter PIN
            </Button>
          </div>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {truncateText(description, 100)}
            </p>
          )}
        </CardContent>
      </Card>

      <EventPinModal 
        eventId={id}
        eventName={name}
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
      />
    </>
  );
}
