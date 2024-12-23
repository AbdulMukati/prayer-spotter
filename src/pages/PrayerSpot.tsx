import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const PrayerSpot = () => {
  const { slug } = useParams();

  const { data: spot, isLoading } = useQuery({
    queryKey: ['prayer-spot', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_spots')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

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
        <p className="text-gray-600">The prayer spot you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{spot.name}</h1>
      {spot.address && (
        <p className="text-gray-600 mb-4">{spot.address}</p>
      )}
      {spot.description && (
        <p className="text-gray-800 mb-6">{spot.description}</p>
      )}
      <div className="text-sm text-gray-500">
        Location: {spot.city}, {spot.country}
      </div>
    </div>
  );
};

export default PrayerSpot;