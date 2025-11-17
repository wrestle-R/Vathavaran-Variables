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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 UserContext: Checking for stored user and token...');
    // Check if user and token are stored in localStorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ UserContext: Found stored user:', parsedUser.login);
        setUser(parsedUser);
        setToken(storedToken);
        console.log('✅ UserContext: Found stored token');
      } catch (error) {
        console.error('❌ UserContext: Error parsing stored data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      console.log('ℹ️ UserContext: No stored user/token found');
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken) => {
    console.log('🔐 UserContext: Logging in user:', userData.login);
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', accessToken);
    console.log('✅ UserContext: User and token stored in localStorage');
  };

  const logout = () => {
    console.log('🚪 UserContext: Logging out user');
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('✅ UserContext: User and token removed from localStorage');
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token
  };

  console.log('🔄 UserContext: Current state:', {
    hasUser: !!user,
    hasToken: !!token,
    loading,
    username: user?.login || 'none'
  });

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

