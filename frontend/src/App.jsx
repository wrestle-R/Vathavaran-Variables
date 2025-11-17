import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Repo from './pages/Repo';
import NotFound from './pages/NotFound';

console.log('🚀 App: Application starting...');

function App() {
  console.log('🎨 App: Rendering main application');
  
  return (
    <Router>
      <UserProvider>
        <div className="dark min-h-screen bg-background text-foreground">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/repo/:owner/:repo" element={<Repo />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;
