import { useRef, useEffect, useCallback, useState } from 'react';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const cardData = [
  {
    title: 'Encrypted Storage',
    description: 'Your environment files are encrypted on the backend for maximum security.',
    label: 'Security'
  },
  {
    title: 'Easy Access',
    description: 'Access your env files from anywhere with GitHub authentication.',
    label: 'Access'
  },
  {
    title: 'Version Control',
    description: 'Keep track of your environment variables across different projects.',
    label: 'Tracking'
  },
  {
    title: 'Team Collaboration',
    description: 'Share and manage environment variables seamlessly with your team.',
    label: 'Teamwork'
  }
];

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const ParticleCard = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    particlesRef.current.forEach(particle => {
      particle.style.transition = 'all 0.3s ease';
      particle.style.transform = 'scale(0)';
      particle.style.opacity = '0';
      setTimeout(() => particle.parentNode?.removeChild(particle), 300);
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        clone.style.animation = 'particleFloat 3s ease-in-out infinite';
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations]);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
};

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      transition: opacity 0.3s ease, left 0.1s ease, top 0.1s ease;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = e => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current;
      const rect = section.getBoundingClientRect();
      const mouseInside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (mouseInside) {
        spotlight.style.left = `${e.clientX}px`;
        spotlight.style.top = `${e.clientY}px`;
        spotlight.style.opacity = '1';
      } else {
        spotlight.style.opacity = '0';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const MagicBento = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  useEffect(() => {
    const applyPrefers = (isDark) => {
      document.documentElement.classList.toggle('dark', isDark);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyPrefers(mediaQuery.matches);

    const handleChange = (e) => applyPrefers(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div
      className="transition-colors duration-300"
    >
      <style>{`
        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
          25% { transform: translate(20px, -20px) rotate(90deg); opacity: 1; }
          50% { transform: translate(-20px, 20px) rotate(180deg); opacity: 0.5; }
          75% { transform: translate(20px, 20px) rotate(270deg); opacity: 1; }
        }
      `}</style>
      
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <div 
        ref={gridRef}
        className="grid gap-2 p-3 max-w-4xl mx-auto
          grid-cols-1 
          sm:grid-cols-2"
      >
        {cardData.map((card, index) => {
          const cardClasses = `
            relative flex flex-col justify-between
            min-h-[140px] w-full p-4 rounded-3xl
            border
            transition-all duration-300 ease-in-out
            hover:-translate-y-1 hover:shadow-xl
            overflow-hidden
            ${index === 0 ? 'sm:col-span-1 sm:row-span-2' : ''}
            ${index === 1 ? 'sm:col-span-1' : ''}
            ${index === 2 ? 'sm:col-span-1' : ''}
            ${index === 3 ? 'sm:col-span-2' : ''}
            ${enableBorderGlow ? 'hover:shadow-purple-500/20 dark:hover:shadow-purple-500/30' : ''}
          `;

          const cardStyle = {
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--color-card-foreground)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          };

          const CardWrapper = enableStars ? ParticleCard : 'div';
          const wrapperProps = {
            style: cardStyle,
            ...(enableStars ? {
              disableAnimations: shouldDisableAnimations,
              particleCount,
              glowColor,
              enableTilt,
              clickEffect,
              enableMagnetism
            } : {})
          };

          return (
            <CardWrapper
              key={index}
              className={cardClasses}
              {...wrapperProps}
            >
              <div className="flex justify-between items-start gap-3 relative z-10">
                <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-medium">
                  {card.label}
                </div>
              </div>
              
              <div className="flex flex-col relative z-10">
                <h2 className={`font-normal text-lg mb-1 line-clamp-1`}>
                  {card.title}
                </h2>
                <p className={`text-sm leading-tight opacity-90 line-clamp-2`}>
                  {card.description}
                </p>
              </div>

              {enableBorderGlow && (
                <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(132, 0, 255, 0.15), transparent 40%)',
                    border: '1px solid rgba(132, 0, 255, 0.3)'
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                  }}
                />
              )}
            </CardWrapper>
          );
        })}
      </div>
    </div>
  );
};

export default MagicBento;
