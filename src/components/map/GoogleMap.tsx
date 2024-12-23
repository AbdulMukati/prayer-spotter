import { useEffect, useState } from 'react';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../ui/use-toast';
import { Database } from '@/integrations/supabase/types';
import { MapMarkers } from './MapMarkers';
import { MapControls } from './MapControls';

type PrayerSpot = Database['public']['Tables']['prayer_spots']['Row'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 42.35,
  lng: -70.9,
};

export const Map = () => {
  const [spots, setSpots] = useState<PrayerSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [center, setCenter] = useState(defaultCenter);
  const [apiKey, setApiKey] = useState<string>('');

  // Fetch Google Maps API key from Supabase
  useEffect(() => {
    const fetchApiKey = async () => {
      const { data: { GOOGLE_MAPS_API_KEY }, error } = await supabase.functions.invoke('get-google-maps-key');
      if (error) {
        console.error('Error fetching Google Maps API key:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Google Maps',
          variant: 'destructive',
        });
        return;
      }
      setApiKey(GOOGLE_MAPS_API_KEY);
    };
    fetchApiKey();
  }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  // Fetch prayer spots
  const fetchPrayerSpots = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('prayer_spots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prayer spots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prayer spots',
        variant: 'destructive',
      });
    } else {
      setSpots(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPrayerSpots();
  }, []);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading map configuration...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full">
        Error loading maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={11}
        center={center}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        <MapMarkers spots={spots} onSpotUpdate={fetchPrayerSpots} />
      </GoogleMap>
      <MapControls onSpotAdded={fetchPrayerSpots} />
    </div>
  );
};