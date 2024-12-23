import { MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useState } from 'react';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '../AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';

type PrayerSpot = Database['public']['Tables']['prayer_spots']['Row'];

interface MapMarkersProps {
  spots: PrayerSpot[];
  onSpotUpdate: () => void;
}

export const MapMarkers = ({ spots, onSpotUpdate }: MapMarkersProps) => {
  const [selectedSpot, setSelectedSpot] = useState<PrayerSpot | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<{ is_admin: boolean } | null>(null);

  const handleDelete = async (spotId: string) => {
    try {
      const { error } = await supabase
        .from('prayer_spots')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', spotId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Prayer spot deleted successfully',
      });
      
      onSpotUpdate();
      setSelectedSpot(null);
    } catch (error) {
      console.error('Error deleting prayer spot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete prayer spot',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (spotId: string) => {
    try {
      const { error } = await supabase
        .from('prayer_spots')
        .update({ deleted_at: null })
        .eq('id', spotId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Prayer spot restored successfully',
      });
      
      onSpotUpdate();
      setSelectedSpot(null);
    } catch (error) {
      console.error('Error restoring prayer spot:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore prayer spot',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {spots.map((spot) => (
        <MarkerF
          key={spot.id}
          position={{ lat: spot.latitude, lng: spot.longitude }}
          onClick={() => setSelectedSpot(spot)}
        />
      ))}
      
      {selectedSpot && (
        <InfoWindowF
          position={{ lat: selectedSpot.latitude, lng: selectedSpot.longitude }}
          onCloseClick={() => setSelectedSpot(null)}
        >
          <div className="p-4 max-w-sm">
            <h3 className="text-lg font-semibold mb-2">{selectedSpot.name}</h3>
            {selectedSpot.address && (
              <p className="text-sm text-gray-600 mb-2">{selectedSpot.address}</p>
            )}
            {selectedSpot.description && (
              <p className="text-sm">{selectedSpot.description}</p>
            )}
            <div className="flex gap-2 mt-2">
              <Button
                variant="link"
                className="p-0"
                asChild
              >
                <a href={`/${selectedSpot.slug}`}>View Details</a>
              </Button>
              {user && (user.id === selectedSpot.created_by || userProfile?.is_admin) && (
                <Button
                  variant="link"
                  className="p-0 text-destructive"
                  onClick={() => selectedSpot.deleted_at ? 
                    handleRestore(selectedSpot.id) : 
                    handleDelete(selectedSpot.id)
                  }
                >
                  {selectedSpot.deleted_at ? 'Restore' : 'Delete'}
                </Button>
              )}
            </div>
          </div>
        </InfoWindowF>
      )}
    </>
  );
};