import { serve } from 'https://deno.fresh.dev/server/mod.ts';

serve(async (req) => {
  const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
  
  if (!GOOGLE_MAPS_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Google Maps API key not configured' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({ GOOGLE_MAPS_API_KEY }),
    { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Expose-Headers': 'Content-Length, X-JSON',
      }
    }
  );
});