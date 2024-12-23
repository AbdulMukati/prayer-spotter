import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SpotFormFields } from '@/components/map/SpotFormFields';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const AddPrayerSpot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState<string | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.Autocomplete | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [newSpot, setNewSpot] = useState({
    name: "",
    description: "",
    address: "",
    latitude: 0,
    longitude: 0,
    city: "",
    country: "",
  });

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setNewSpot(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Fetch Google Maps API key
    const fetchGoogleMapsKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        
        if (data.GOOGLE_MAPS_API_KEY) {
          setGoogleMapsKey(data.GOOGLE_MAPS_API_KEY);
        } else {
          throw new Error('No API key returned');
        }
      } catch (error) {
        console.error('Error fetching Google Maps key:', error);
        toast({
          title: "Error",
          description: "Failed to load address search functionality",
          variant: "destructive",
        });
      }
    };

    fetchGoogleMapsKey();
  }, []);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setSearchBox(autocomplete);
  };

  const onPlaceChanged = () => {
    if (searchBox) {
      const place = searchBox.getPlace();
      if (place.geometry?.location) {
        const addressComponents = place.address_components || [];
        const city = addressComponents.find(component => 
          component.types.includes('locality'))?.long_name || '';
        const country = addressComponents.find(component => 
          component.types.includes('country'))?.long_name || '';

        setNewSpot(prev => ({
          ...prev,
          address: place.formatted_address || '',
          latitude: place.geometry!.location!.lat(),
          longitude: place.geometry!.location!.lng(),
          city: city || 'unknown',
          country: country || 'unknown',
        }));
      }
    }
  };

  const createSlug = (name: string, city: string, country: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanCity = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanCountry = country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${cleanCountry}/${cleanCity}/${cleanName}`;
  };

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!newSpot.latitude || !newSpot.longitude) {
      toast({
        title: "Error",
        description: "Please enter a valid address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const slug = createSlug(newSpot.name, newSpot.city || 'unknown', newSpot.country || 'unknown');
      
      const { data: spot, error } = await supabase.from("prayer_spots").insert([
        {
          name: newSpot.name,
          description: newSpot.description,
          address: newSpot.address,
          latitude: newSpot.latitude,
          longitude: newSpot.longitude,
          created_by: user.id,
          slug,
          city: newSpot.city || 'unknown',
          country: newSpot.country || 'unknown',
        },
      ]).select().single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prayer spot added successfully!",
      });
      
      if (spot) {
        navigate(`/${spot.slug}`);
      }
    } catch (error) {
      console.error("Error adding prayer spot:", error);
      toast({
        title: "Error",
        description: "Failed to add prayer spot",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Add New Prayer Spot</h1>
      <form onSubmit={handleAddSpot} className="space-y-6">
        <SpotFormFields
          newSpot={newSpot}
          setNewSpot={setNewSpot}
          searchBox={searchBox}
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          googleMapsKey={googleMapsKey}
        />
        <Button
          type="submit"
          disabled={!newSpot.name || !newSpot.address || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Prayer Spot"
          )}
        </Button>
      </form>
    </div>
  );
};

export default AddPrayerSpot;