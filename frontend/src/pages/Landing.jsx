import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useEffect, useState } from 'react';
import LiquidEther from '../components/LiquidEther';
import { EncryptedText } from '../components/ui/encrypted-text';
import MagicBento from '../components/ui/MagicBento';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authMessage, setAuthMessage] = useState(null);

  console.log('🏠 Landing: Rendering page, authenticated:', isAuthenticated);

  useEffect(() => {
    // Check for CLI auth status
    const authStatus = searchParams.get('auth');
    if (authStatus === 'success') {
      setAuthMessage({ type: 'success', text: '✅ CLI Authentication Successful! You can close this window and return to your terminal.' });
      // Clear the query param after 5 seconds
      setTimeout(() => {
        setSearchParams({});
        setAuthMessage(null);
      }, 5000);
    } else if (authStatus === 'failed') {
      setAuthMessage({ type: 'error', text: '❌ CLI Authentication Failed. Please try again in your terminal.' });
      setTimeout(() => {
        setSearchParams({});
        setAuthMessage(null);
      }, 5000);
    }
  }, [searchParams, setSearchParams]);

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
    <div className="h-screen bg-background flex flex-col items-center justify-center px-4 mt-12 relative overflow-hidden">
      {/* CLI Auth Message */}
      {authMessage && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg ${
          authMessage.type === 'success' 
            ? 'bg-green-500/20 border border-green-500 text-green-100' 
            : 'bg-red-500/20 border border-red-500 text-red-100'
        } backdrop-blur-sm animate-slide-down`}>
          <p className="text-center font-medium">{authMessage.text}</p>
        </div>
      )}

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

      <div className="max-w-6xl w-full relative z-10 flex flex-col">
        {/* Hero Section */}
        <div className="text-center space-y-2 mb-4">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground">
            <EncryptedText 
              text="Vathavaran"
              className="text-5xl md:text-7xl font-bold"
              revealDelayMs={100}
              flipDelayMs={30}
            />
          </h1>
          
          <div className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            <EncryptedText 
              text="Securely store and manage your environment variables"
              className="text-xl md:text-2xl"
              revealDelayMs={50}
              flipDelayMs={40}
            />
          </div>
        </div>

        {/* Magic Bento */}
        <MagicBento 
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          glowColor="132, 0, 255"
        />
      </div>
    </div>
  );
};

export default Landing;
