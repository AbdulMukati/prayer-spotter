import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Database } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

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
  const [newSpot, setNewSpot] = useState({
    name: '',
    description: '',
    address: '',
    latitude: 0,
    longitude: 0,
  });
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch prayer spots
  useEffect(() => {
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

    fetchPrayerSpots();
  }, [toast]);

  // Initialize map
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

        // Add click handler for new spots
        map.current.on('click', (e) => {
          if (isAddingSpot) {
            setNewSpot(prev => ({
              ...prev,
              latitude: e.lngLat.lat,
              longitude: e.lngLat.lng
            }));
          }
        });
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
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([spot.longitude, spot.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current[spot.id] = marker;
    });
  }, [prayerSpots, searchTerm]);

  const handleAddPrayerSpot = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add a prayer spot',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('prayer_spots')
        .insert([{
          ...newSpot,
          created_by: user.id,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Prayer spot added successfully!',
      });

      // Refresh prayer spots
      const { data } = await supabase
        .from('prayer_spots')
        .select('*')
        .order('created_at', { ascending: false });

      setPrayerSpots(data || []);
      setNewSpot({
        name: '',
        description: '',
        address: '',
        latitude: 0,
        longitude: 0,
      });
      setIsAddingSpot(false);
    } catch (error) {
      console.error('Error adding prayer spot:', error);
      toast({
        title: 'Error',
        description: 'Failed to add prayer spot',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Search Bar - Centered at the top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search prayer spots by name, address, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 w-full h-12 text-lg shadow-lg"
          />
        </div>
      </div>

      {/* Add Spot Button - Bottom right */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                if (!user) {
                  toast({
                    title: 'Authentication Required',
                    description: 'Please sign in to add a prayer spot',
                    variant: 'destructive',
                  });
                  return;
                }
                setIsAddingSpot(true);
              }}
              className="bg-primary text-white hover:bg-primary/90 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Spot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Prayer Spot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newSpot.name}
                  onChange={(e) => setNewSpot(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newSpot.address}
                  onChange={(e) => setNewSpot(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newSpot.description}
                  onChange={(e) => setNewSpot(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Click on the map to set the location
              </p>
              {newSpot.latitude !== 0 && (
                <p className="text-sm">
                  Selected location: {newSpot.latitude.toFixed(6)}, {newSpot.longitude.toFixed(6)}
                </p>
              )}
              <Button
                onClick={handleAddPrayerSpot}
                disabled={!newSpot.name || newSpot.latitude === 0}
                className="w-full"
              >
                Add Prayer Spot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
      <div className="absolute bottom-4 left-4 bg-white/90 px-4 py-2 rounded shadow-lg text-sm">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
    </div>
  );
};