import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Clock, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';

const PrayerSpot = () => {
  const { slug } = useParams();
  const { user } = useAuth();

  const { data: spot, isLoading } = useQuery({
    queryKey: ['prayer-spot', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_spots')
        .select(`
          *,
          profiles:created_by (
            full_name,
            username
          )
        `)
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
        <p className="text-gray-600 mb-4">The prayer spot you're looking for doesn't exist.</p>
        <Link to="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{spot.name}</h1>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {spot.address}
          </div>
        </div>

        {/* Description */}
        {spot.description && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              About
            </h2>
            <p className="text-gray-700">{spot.description}</p>
          </div>
        )}

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