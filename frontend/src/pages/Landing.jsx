import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/button';
import { Lock, Shield, Key, FileKey } from 'lucide-react';
import { useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();

  console.log('🏠 Landing: Rendering page, authenticated:', isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔀 Landing: User is authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    console.log('▶️ Landing: Get Started clicked');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 mt-20">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Vathavaran
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Securely store and manage your environment variables with end-to-end encryption
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Encrypted Storage
            </h3>
            <p className="text-sm text-muted-foreground">
              All your environment files are encrypted on the backend for maximum security
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <Key className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Easy Access
            </h3>
            <p className="text-sm text-muted-foreground">
              Access your env files from anywhere with GitHub authentication
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <FileKey className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Version Control
            </h3>
            <p className="text-sm text-muted-foreground">
              Keep track of your environment variables across different projects
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-8">
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="text-lg px-8 py-6"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
