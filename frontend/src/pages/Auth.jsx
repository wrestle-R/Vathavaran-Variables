import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/button';
import { Github } from 'lucide-react';
import axios from 'axios';
import LiquidEther from '../components/LiquidEther';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🔐 Auth: Page loaded');

  useEffect(() => {
    console.log('🔍 Auth: Checking authentication status');
    
    // Check if user is already authenticated
    if (isAuthenticated) {
      console.log('✅ Auth: User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    // Check for error in URL
    const errorParam = searchParams.get('error');
    if (errorParam) {
      console.error('❌ Auth: Error in URL params:', errorParam);
      setError('Authentication failed. Please try again.');
      return;
    }

    // Check for user data in URL (from callback)
    const userParam = searchParams.get('user');
    const tokenParam = searchParams.get('token');
    if (userParam && tokenParam) {
      try {
        console.log('📦 Auth: User data and token received in URL');
        const userData = JSON.parse(decodeURIComponent(userParam));
        const accessToken = decodeURIComponent(tokenParam);
        console.log('✅ Auth: Parsed user data:', {
          id: userData.id,
          login: userData.login,
          name: userData.name
        });
        console.log('✅ Auth: Access token received');
        
        login(userData, accessToken);
        console.log('🔀 Auth: User logged in, redirecting to dashboard');
        navigate('/dashboard');
      } catch (err) {
        console.error('❌ Auth: Error parsing user data or token:', err);
        setError('Failed to process authentication. Please try again.');
      }
    }
  }, [isAuthenticated, navigate, searchParams, login]);

  const handleGitHubLogin = async () => {
    console.log('🚀 Auth: GitHub login button clicked');
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Auth: Requesting GitHub OAuth URL from server');
      const response = await axios.get('http://localhost:8000/api/auth/github');
      console.log('✅ Auth: Received OAuth URL:', response.data.url);
      
      console.log('🔀 Auth: Redirecting to GitHub...');
      window.location.href = response.data.url;
    } catch (err) {
      console.error('❌ Auth: Error initiating GitHub OAuth:', err);
      setError('Failed to connect to authentication server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 mt-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <img src="/logo_dark_bg.png" alt="Vathavaran" className="h-12 w-12 mx-auto" />
          <h2 className="text-3xl font-bold text-foreground">
            Welcome Back
          </h2>
          <p className="text-muted-foreground">
            Sign in to access your encrypted environment variables
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-6"
            size="lg"
          >
            <Github className="h-5 w-5" />
            <span>{loading ? 'Connecting...' : 'Continue with GitHub'}</span>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              console.log('🔙 Auth: Back to home clicked');
              navigate('/');
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
