import React, { useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { User, LogOut, ExternalLink } from 'lucide-react';

const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const Navbar = () => {
  const ref = useRef(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useUser();
  const navigate = useNavigate();
  
  const navItems = [
   
  ];

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  const scrollToSection = (sectionId) => {
    if (sectionId.startsWith("/")) {
      navigate(sectionId);
    } else {
      const element = document.querySelector(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Sun icon SVG
  const SunIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  // Moon icon SVG
  const MoonIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );

  // Menu icon SVG
  const MenuIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );

  // Close icon SVG
  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <motion.div
      ref={ref}
      className="fixed inset-x-0 top-0 z-40 max-w-6xl mx-auto md:mb-0"
    >
      {/* Desktop Navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(16px)" : "none",
          border: visible ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          width: visible ? "65%" : "80%",
          y: visible ? 16 : 0,
          backgroundColor: visible
            ? "rgba(0, 0, 0, 0.1)"
            : "transparent",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          duration: 0.3,
        }}
        style={{
          minWidth: visible ? "700px" : "600px",
        }}
        className="relative z-60 mx-auto hidden w-full max-w-6xl flex-row items-center justify-between rounded-full px-8 py-3 mb-16 md:flex"
      >
        <div className="flex w-full items-center justify-between">
          <Link to="/">
            <motion.div
              animate={{
                scale: visible ? 0.85 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="cursor-pointer flex items-center gap-2"
            >
              <img src="/logo_dark_bg.png" alt="Vathavaran" className="h-8 w-8" />
              <span style={{ color: 'oklch(var(--foreground))' }} className="text-lg font-bold tracking-wider">Vathavaran</span>
            </motion.div>
          </Link>

          <motion.nav
            animate={{
              opacity: 1,
              scale: visible ? 0.9 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="absolute left-1/2 flex -translate-x-1/2 items-center space-x-1"
          >
            {isAuthenticated && navItems.map((item, idx) => (
              <NavItem key={idx} item={item} onNavigate={scrollToSection} />
            ))}
          </motion.nav>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <motion.button
              onClick={handleThemeToggle}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 25,
              }}
              animate={{
                scale: visible ? 0.9 : 1,
              }}
              className="p-2 rounded-full"
              style={{ 
                backgroundColor: 'oklch(var(--muted))',
                color: 'oklch(var(--foreground))'
              }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </motion.button>

            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                  animate={{
                    scale: visible ? 0.9 : 1,
                  }}
                  className="px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 tracking-wide"
                  style={{
                    backgroundColor: 'oklch(var(--primary))',
                    color: 'oklch(var(--primary-foreground))'
                  }}
                >
                  <User className="h-4 w-4" />
                  {user?.login}
                </motion.button>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute right-0 mt-2 w-48 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden z-50"
                      style={{
                        backgroundColor: 'oklch(var(--card))',
                        border: '1px solid oklch(var(--border))'
                      }}
                    >
                      <a
                        href={`https://github.com/${user?.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors"
                        style={{ color: 'oklch(var(--foreground))' }}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View Profile</span>
                      </a>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                        style={{ 
                          color: '#ef4444',
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={() => navigate('/auth')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 25,
                }}
                animate={{
                  scale: visible ? 0.9 : 1,
                }}
                className="px-4 py-2 rounded-full text-sm font-medium tracking-wide"
                style={{
                  backgroundColor: 'oklch(var(--primary))',
                  color: 'oklch(var(--primary-foreground))'
                }}
              >
                Sign In
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mobile navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(16px)" : "none",
          border: visible ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          y: visible ? 16 : 0,
          backgroundColor: visible
            ? "rgba(0, 0, 0, 0.1)"
            : "transparent",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
        }}
        className="md:hidden flex items-center justify-between px-6 py-3 mt-4 mx-6 rounded-full"
      >
        <Link to="/">
          <motion.div
            animate={{
              scale: visible ? 0.85 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="cursor-pointer flex items-center gap-2"
          >
            <img src="/logo_dark_bg.png" alt="Vathavaran" className="h-8 w-8" />
            <span style={{ color: 'oklch(var(--foreground))' }} className="text-lg font-extrabold tracking-wider">Vathavaran</span>
          </motion.div>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button for Mobile */}
          <motion.button
            onClick={handleThemeToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
            }}
            className="p-1.5 rounded-full"
            style={{ 
              backgroundColor: 'oklch(var(--muted))',
              color: 'oklch(var(--foreground))'
            }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </motion.button>

          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-xl p-1"
            style={{ color: 'oklch(var(--foreground))' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
            }}
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            className="md:hidden absolute top-full left-0 right-0 mt-2 mx-6"
          >
            <div 
              className="backdrop-blur-xl rounded-2xl p-4 space-y-2 shadow-2xl"
              style={{
                backgroundColor: 'oklch(var(--muted) / 0.5)',
                border: '1px solid oklch(var(--border))'
              }}
            >
              {isAuthenticated && navItems.map((item, idx) => (
                <motion.a
                  key={idx}
                  href={item.link}
                  onClick={(e) => {
                    if (!item.external) {
                      e.preventDefault();
                      scrollToSection(item.link);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="block w-full text-left py-2 px-3 rounded-xl transition-colors tracking-wide"
                  style={{ color: 'oklch(var(--foreground))' }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ x: 4 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                >
                  {item.name}
                </motion.a>
              ))}

              {isAuthenticated ? (
                <>
                  <a
                    href={`https://github.com/${user?.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left py-2 px-3 rounded-xl transition-colors tracking-wide flex items-center gap-2"
                    style={{ color: 'oklch(var(--foreground))' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Profile
                  </a>
                  <motion.button
                    onClick={handleLogout}
                    className="w-full mt-3 px-4 py-2 rounded-xl text-center font-medium tracking-wide flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </motion.button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full mt-3 px-4 py-2 rounded-xl text-center font-medium tracking-wide"
                  style={{
                    backgroundColor: 'oklch(var(--primary))',
                    color: 'oklch(var(--primary-foreground))'
                  }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Navigation Item with hover effect
const NavItem = ({ item, onNavigate }) => {
  return (
    <motion.a
      href={item.link}
      onClick={(e) => {
        if (!item.external) {
          e.preventDefault();
          onNavigate(item.link);
        }
      }}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      className="relative px-3 py-2 text-sm font-medium tracking-wide"
      style={{ color: 'oklch(var(--foreground))' }}
      whileHover="hover"
      initial="initial"
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
      }}
    >
      <span className="relative z-10">{item.name}</span>
      <motion.span 
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: 'oklch(var(--muted))' }}
        initial={{ scale: 0.8, opacity: 0 }}
        variants={{
          initial: { scale: 0.8, opacity: 0 },
          hover: { scale: 1, opacity: 1 }
        }}
        transition={{ 
          type: "spring",
          stiffness: 500,
          damping: 25,
        }}
      />
    </motion.a>
  );
};

export default Navbar;
