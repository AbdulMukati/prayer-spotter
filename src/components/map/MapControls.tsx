import { useState } from 'react';
import { SearchBar } from './SearchBar';
import { useAuth } from '../AuthProvider';
import { Button } from '../ui/button';
import { LogIn, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MapControlsProps {
  onSpotAdded: () => void;
}

export const MapControls = ({ onSpotAdded }: MapControlsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <div className="fixed bottom-[116px] right-4 z-50 flex gap-2">
        <Button
          onClick={() => {
            if (!user) {
              navigate("/auth");
              return;
            }
            navigate("/add");
          }}
          size="icon"
          className="bg-primary text-white hover:bg-primary/90 shadow-lg"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {!user && (
        <div className="fixed bottom-[116px] left-4 z-50">
          <Button
            onClick={() => navigate('/auth')}
            size="icon"
            className="bg-primary text-white hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
};