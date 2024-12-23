import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Google Maps API key not configured',
          details: 'The API key is missing from environment variables'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Add detailed logging
    console.log('Google Maps API key found:', {
      keyLength: GOOGLE_MAPS_API_KEY.length,
      keyStart: GOOGLE_MAPS_API_KEY.substring(0, 5),
      keyEnd: GOOGLE_MAPS_API_KEY.substring(GOOGLE_MAPS_API_KEY.length - 5)
    });

    return new Response(
      JSON.stringify({ 
        GOOGLE_MAPS_API_KEY,
        status: 'success'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in get-google-maps-key function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});