import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "../AuthProvider";
import { useToast } from "../ui/use-toast";
import { useState } from "react";
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
      
      const { error } = await supabase.from("prayer_spots").insert([
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
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prayer spot added successfully!",
      });

      onSpotAdded();
      setNewSpot({
        name: "",
        description: "",
        address: "",
        latitude: 0,
        longitude: 0,
        city: "",
        country: "",
      });
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            if (!user) {
              navigate("/auth");
              return;
            }
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
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
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
                />
              </Autocomplete>
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