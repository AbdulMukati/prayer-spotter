import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "../AuthProvider";
import { useToast } from "../ui/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Autocomplete } from "@react-google-maps/api";

interface AddSpotDialogProps {
  onSpotAdded: () => void;
}

export const AddSpotDialog = ({ onSpotAdded }: AddSpotDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState<string | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.Autocomplete | null>(null);
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

    if (isOpen) {
      fetchGoogleMapsKey();
    }
  }, [isOpen, toast]);

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

  const handleAddSpot = async () => {
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

      onSpotAdded();
      setIsOpen(false);
      setNewSpot({
        name: "",
        description: "",
        address: "",
        latitude: 0,
        longitude: 0,
        city: "",
        country: "",
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

  const createSlug = (name: string, city: string, country: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanCity = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanCountry = country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${cleanCountry}/${cleanCity}/${cleanName}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            if (!user) {
              navigate("/auth");
              return;
            }
            setIsOpen(true);
          }}
          size="icon"
          className="bg-primary text-white hover:bg-primary/90 shadow-lg"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      {user && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Prayer Spot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newSpot.name}
                onChange={(e) =>
                  setNewSpot((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter mosque or prayer space name"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              {googleMapsKey ? (
                <Autocomplete
                  onLoad={onLoad}
                  onPlaceChanged={onPlaceChanged}
                >
                  <Input
                    id="address"
                    value={newSpot.address}
                    onChange={(e) =>
                      setNewSpot((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Start typing to search for an address"
                  />
                </Autocomplete>
              ) : (
                <Input
                  id="address"
                  value={newSpot.address}
                  onChange={(e) =>
                    setNewSpot((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Loading address search..."
                  disabled
                />
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSpot.description}
                onChange={(e) =>
                  setNewSpot((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the prayer space, facilities, and any important information"
              />
            </div>
            {newSpot.latitude !== 0 && (
              <p className="text-sm text-muted-foreground">
                Location found: {newSpot.city || 'Unknown city'}, {newSpot.country || 'Unknown country'}
              </p>
            )}
            <Button
              onClick={handleAddSpot}
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
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};