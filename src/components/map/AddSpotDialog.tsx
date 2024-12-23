import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useAuth } from "../AuthProvider";
import { useToast } from "../ui/use-toast";

interface AddSpotDialogProps {
  isAddingSpot: boolean;
  setIsAddingSpot: (isAdding: boolean) => void;
  newSpot: {
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  setNewSpot: (spot: any) => void;
  onAddSpot: () => Promise<void>;
}

export const AddSpotDialog = ({
  isAddingSpot,
  setIsAddingSpot,
  newSpot,
  setNewSpot,
  onAddSpot,
}: AddSpotDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            if (!user) {
              toast({
                title: "Authentication Required",
                description: "Please sign in to add a prayer spot",
                variant: "destructive",
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
              onChange={(e) =>
                setNewSpot((prev: any) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={newSpot.address}
              onChange={(e) =>
                setNewSpot((prev: any) => ({ ...prev, address: e.target.value }))
              }
            />
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
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Click on the map to set the location
          </p>
          {newSpot.latitude !== 0 && (
            <p className="text-sm">
              Selected location: {newSpot.latitude.toFixed(6)},{" "}
              {newSpot.longitude.toFixed(6)}
            </p>
          )}
          <Button
            onClick={onAddSpot}
            disabled={!newSpot.name || newSpot.latitude === 0}
            className="w-full"
          >
            Add Prayer Spot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};