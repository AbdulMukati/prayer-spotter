import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

export const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current || map.current) return;

      // Get Mapbox token
      const { data } = await supabase.functions.invoke('get-mapbox-token');
      mapboxgl.accessToken = data.token;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: zoom
      });

      map.current.on('move', () => {
        if (!map.current) return;
        setLng(Number(map.current.getCenter().lng.toFixed(4)));
        setLat(Number(map.current.getCenter().lat.toFixed(4)));
        setZoom(Number(map.current.getZoom().toFixed(2)));
      });

      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (map.current) {
              map.current.flyTo({
                center: [position.coords.longitude, position.coords.latitude],
                zoom: 12
              });
            }
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-2 right-2 bg-white/90 px-4 py-2 rounded shadow">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
    </div>
  );
};