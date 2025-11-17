import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 UserContext: Checking for stored user...');
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ UserContext: Found stored user:', parsedUser.login);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ UserContext: Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    } else {
      console.log('ℹ️ UserContext: No stored user found');
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    console.log('🔐 UserContext: Logging in user:', userData.login);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ UserContext: User stored in localStorage');
  };

  const logout = () => {
    console.log('🚪 UserContext: Logging out user');
    setUser(null);
    localStorage.removeItem('user');
    console.log('✅ UserContext: User removed from localStorage');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  console.log('🔄 UserContext: Current state:', {
    hasUser: !!user,
    loading,
    username: user?.login || 'none'
  });

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
