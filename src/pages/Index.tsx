import { Map } from '@/components/Map';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full relative">
      <Map />
      {!user && (
        <div className="absolute top-4 left-4">
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Sign in to Add Prayer Spot
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;