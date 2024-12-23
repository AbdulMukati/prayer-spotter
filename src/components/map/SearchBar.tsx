import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

export const SearchBar = () => {
  const [searchBox, setSearchBox] = useState<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setSearchBox(autocomplete);
  };

  const onPlaceChanged = () => {
    if (searchBox) {
      const place = searchBox.getPlace();
      if (place.geometry?.location) {
        // You can handle the selected place here
        console.log('Selected place:', place);
      }
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[70%] px-4 z-10">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
        >
          <Input
            type="text"
            placeholder="Search prayer spots..."
            className="pl-10 pr-4 w-full h-10 text-base shadow-lg"
          />
        </Autocomplete>
      </div>
    </div>
  );
};