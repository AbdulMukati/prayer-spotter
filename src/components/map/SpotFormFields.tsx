import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Autocomplete } from "@react-google-maps/api";

interface SpotFormFieldsProps {
  newSpot: {
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  setNewSpot: (spot: any) => void;
  searchBox: google.maps.places.Autocomplete | null;
  onLoad: (autocomplete: google.maps.places.Autocomplete) => void;
  onPlaceChanged: () => void;
  googleMapsKey: string | null;
}

export const SpotFormFields = ({
  newSpot,
  setNewSpot,
  searchBox,
  onLoad,
  onPlaceChanged,
  googleMapsKey,
}: SpotFormFieldsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={newSpot.name}
          onChange={(e) =>
            setNewSpot((prev: any) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter mosque or prayer space name"
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        {googleMapsKey ? (
          <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
            <Input
              id="address"
              value={newSpot.address}
              onChange={(e) =>
                setNewSpot((prev: any) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Start typing to search for an address"
            />
          </Autocomplete>
        ) : (
          <Input
            id="address"
            value={newSpot.address}
            onChange={(e) =>
              setNewSpot((prev: any) => ({ ...prev, address: e.target.value }))
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
            setNewSpot((prev: any) => ({
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
    </div>
  );
};