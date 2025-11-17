import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 Text */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Decorative Element */}
        <div className="py-6">
          <div className="relative h-32 bg-card border border-border rounded-lg flex items-center justify-center">
            <div className="text-5xl">🔍</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/')}
            className="w-full"
          >
            Go to Home
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-sm text-muted-foreground">Quick Links:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-primary hover:underline"
            >
              Dashboard
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-primary hover:underline"
            >
              Home
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => navigate('/auth')}
              className="text-sm text-primary hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
