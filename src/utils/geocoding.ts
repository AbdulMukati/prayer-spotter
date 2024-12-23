import { supabase } from "@/integrations/supabase/client";

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; city: string; country: string } | null> {
  try {
    const { data: { token } } = await supabase.functions.invoke('get-mapbox-token');
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${token}`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.center;
      
      // Extract city and country from the context
      const city = feature.context?.find((c: any) => c.id.startsWith('place'))?.text || 'unknown';
      const country = feature.context?.find((c: any) => c.id.startsWith('country'))?.text || 'unknown';
      
      return { lat, lng, city, country };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}