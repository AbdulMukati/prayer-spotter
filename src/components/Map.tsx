import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Database } from '@/integrations/supabase/types';
import { SearchBar } from './map/SearchBar';
import { AddSpotDialog } from './map/AddSpotDialog';
import { useAuth } from './AuthProvider';

type PrayerSpot = Database['public']['Tables']['prayer_spots']['Row'];

export const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);
  const [searchTerm, setSearchTerm] = useState('');
  const [prayerSpots, setPrayerSpots] = useState<PrayerSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      setPrayerSpots(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPrayerSpots();
  }, []);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current || map.current) return;

      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: zoom
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('move', () => {
          if (!map.current) return;
          setLng(Number(map.current.getCenter().lng.toFixed(4)));
          setLat(Number(map.current.getCenter().lat.toFixed(4)));
          setZoom(Number(map.current.getZoom().toFixed(2)));
        });

        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (map.current) {
                map.current.flyTo({
                  center: [position.coords.longitude, position.coords.latitude],
                  zoom: 12
                });
              }
            },
            (error) => {
              console.error('Error getting location:', error);
            }
          );
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize map',
          variant: 'destructive',
        });
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ is_admin: boolean } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, [user]);

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
      
      fetchPrayerSpots();
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
      
      fetchPrayerSpots();
    } catch (error) {
      console.error('Error restoring prayer spot:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore prayer spot',
        variant: 'destructive',
      });
    }
  };

  // Update markers when prayer spots change or search term changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Filter prayer spots based on search term
    const filteredSpots = prayerSpots.filter(spot => 
      spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (spot.address && spot.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (spot.description && spot.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Add new markers
    filteredSpots.forEach(spot => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors';
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a7 7 0 00-7 7c0 3.866 7 10 7 10s7-6.134 7-10a7 7 0 00-7-7zm0 9a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-4 max-w-sm">
          <h3 class="text-lg font-semibold mb-2">${spot.name}</h3>
          ${spot.address ? `<p class="text-sm text-gray-600 mb-2">${spot.address}</p>` : ''}
          ${spot.description ? `<p class="text-sm">${spot.description}</p>` : ''}
          <div class="flex gap-2 mt-2">
            <a href="/${spot.slug}" class="text-primary hover:underline">View Details</a>
            ${user && (user.id === spot.created_by || userProfile?.is_admin) ? `
              <button 
                onclick="window.handleSpotAction('${spot.id}', '${spot.deleted_at ? 'restore' : 'delete'}')"
                class="text-destructive hover:underline"
              >
                ${spot.deleted_at ? 'Restore' : 'Delete'}
              </button>
            ` : ''}
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([spot.longitude, spot.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current[spot.id] = marker;
    });

    // Add global handler for delete/restore actions
    window.handleSpotAction = async (spotId: string, action: 'delete' | 'restore') => {
      if (action === 'delete') {
        await handleDelete(spotId);
      } else {
        await handleRestore(spotId);
      }
    };
  }, [prayerSpots, searchTerm, user, userProfile]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Add Spot Button - Moved higher */}
      <div className="fixed bottom-[116px] right-4 z-50 flex gap-2">
        <AddSpotDialog onSpotAdded={fetchPrayerSpots} />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading prayer spots...</span>
          </div>
        </div>
      )}

      {/* Coordinates Display */}
      <div className="fixed bottom-4 left-4 z-50 bg-white/90 px-4 py-2 rounded shadow-lg text-sm">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
    </div>
  );
};
