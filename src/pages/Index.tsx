import { Map } from '@/components/Map';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="h-screen w-full relative">
      <Map />
      {!user && (
        <div className="fixed bottom-4 left-4 z-10">
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-primary text-white hover:bg-primary/90"
            size={isMobile ? "icon" : "default"}
          >
            {isMobile ? (
              <LogIn className="h-4 w-4" />
            ) : (
              "Sign in to Add Prayer Spot"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;