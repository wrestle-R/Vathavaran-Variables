import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Button } from './ui/button';
import { LogOut, Lock } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useUser();

  console.log('🧭 Navbar: Rendering with user:', user?.login || 'none');

  const handleLogout = () => {
    console.log('🚪 Navbar: Logout button clicked');
    logout();
  };

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Lock className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold text-foreground">Vathavaran</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user?.login}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
