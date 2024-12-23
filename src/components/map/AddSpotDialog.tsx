import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "../AuthProvider";
import { useToast } from "../ui/use-toast";
import { useState, useEffect } from "react";
import { geocodeAddress } from "@/utils/geocoding";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AddSpotDialogProps {
  onSpotAdded: () => void;
}

export const AddSpotDialog = ({ onSpotAdded }: AddSpotDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newSpot, setNewSpot] = useState({
    name: "",
    description: "",
    address: "",
    latitude: 0,
    longitude: 0,
    city: "",
    country: "",
  });

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${process.env.MAPBOX_TOKEN}`
            );
            const data = await response.json();
            if (data.features?.length > 0) {
              const feature = data.features[0];
              setNewSpot(prev => ({
                ...prev,
                address: feature.place_name,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                city: feature.context?.find((c: any) => c.id.startsWith('place'))?.text || '',
                country: feature.context?.find((c: any) => c.id.startsWith('country'))?.text || '',
              }));
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleAddressChange = async (address: string) => {
    setNewSpot(prev => ({ ...prev, address }));
    
    if (address.length > 3) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_TOKEN}`
        );
        const data = await response.json();
        setAddressSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      }
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectAddress = (feature: any) => {
    setNewSpot(prev => ({
      ...prev,
      address: feature.place_name,
      latitude: feature.center[1],
      longitude: feature.center[0],
      city: feature.context?.find((c: any) => c.id.startsWith('place'))?.text || '',
      country: feature.context?.find((c: any) => c.id.startsWith('country'))?.text || '',
    }));
    setShowSuggestions(false);
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

    try {
      setIsLoading(true);
      const slug = createSlug(newSpot.name, newSpot.city, newSpot.country);
      
      const { error } = await supabase.from("prayer_spots").insert([
        {
          name: newSpot.name,
          description: newSpot.description,
          address: newSpot.address,
          latitude: newSpot.latitude,
          longitude: newSpot.longitude,
          created_by: user.id,
          slug,
          city: newSpot.city,
          country: newSpot.country,
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
          className="bg-primary text-white hover:bg-primary/90 shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Spot
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
            <div className="relative">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newSpot.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg">
                  <Command>
                    <CommandInput placeholder="Search address..." />
                    <CommandEmpty>No address found.</CommandEmpty>
                    <CommandGroup>
                      {addressSuggestions.map((feature) => (
                        <CommandItem
                          key={feature.id}
                          onSelect={() => handleSelectAddress(feature)}
                        >
                          {feature.place_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </div>
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
              />
            </div>
            {newSpot.latitude !== 0 && (
              <p className="text-sm text-muted-foreground">
                Location found: {newSpot.city}, {newSpot.country}
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