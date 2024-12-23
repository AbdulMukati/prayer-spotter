import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Clock, Calendar, Info, Image, Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PrayerSpot = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: spot, isLoading, refetch } = useQuery({
    queryKey: ['prayer-spot', slug],
    queryFn: async () => {
      const { data: spotData, error: spotError } = await supabase
        .from('prayer_spots')
        .select(`
          *,
          profiles:created_by (
            full_name,
            username
          ),
          prayer_spot_images (
            id,
            image_url,
            is_primary
          )
        `)
        .eq('slug', slug)
        .single();

      if (spotError) throw spotError;
      return spotData;
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${spot.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('prayer-spot-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prayer-spot-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('prayer_spot_images')
        .insert({
          prayer_spot_id: spot.id,
          image_url: publicUrl,
          is_primary: !spot.prayer_spot_images?.length
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('prayer_spot_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Prayer Spot Not Found</h1>
        <p className="text-gray-600 mb-4">The prayer spot you're looking for doesn't exist.</p>
        <Link to="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    );
  }

  const canEdit = user?.id === spot.created_by;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header with Cover Image */}
        <div className="relative rounded-lg overflow-hidden h-64 bg-gray-100">
          {spot.prayer_spot_images?.find(img => img.is_primary)?.image_url ? (
            <img
              src={spot.prayer_spot_images.find(img => img.is_primary)?.image_url}
              alt={spot.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <Image className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{spot.name}</h1>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {spot.address}
          </div>
        </div>

        {/* Description */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              About
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            <p className="text-gray-700">{spot.description}</p>
          </CollapsibleContent>
        </Collapsible>

        {/* Image Gallery */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Image className="h-5 w-5" />
            Gallery
          </h2>
          {canEdit && (
            <div className="mb-4">
              <Label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Image
                </div>
              </Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spot.prayer_spot_images?.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.image_url}
                  alt=""
                  className="w-full h-48 object-cover rounded-lg"
                />
                {canEdit && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          <div className="space-y-2">
            <p className="text-gray-600">City: {spot.city}</p>
            <p className="text-gray-600">Country: {spot.country}</p>
            <div className="mt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  View on Google Maps
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Added by */}
        <div className="text-sm text-gray-500">
          Added by: {spot.profiles?.username || spot.profiles?.full_name || 'Anonymous'}
        </div>
      </div>
    </div>
  );
};

export default PrayerSpot;