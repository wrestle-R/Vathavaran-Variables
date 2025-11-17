import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { User, Mail, MapPin, Link as LinkIcon, Calendar, Building } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();

  console.log('📊 Dashboard: Rendering with user:', user?.login || 'none');

  useEffect(() => {
    console.log('🔍 Dashboard: Checking authentication');
    if (!isAuthenticated) {
      console.log('❌ Dashboard: Not authenticated, redirecting to auth');
      navigate('/auth');
    } else {
      console.log('✅ Dashboard: User authenticated');
      console.log('👤 Dashboard: User details:', {
        id: user?.id,
        login: user?.login,
        name: user?.name,
        email: user?.email,
        avatar: user?.avatar_url,
        bio: user?.bio,
        location: user?.location,
        company: user?.company,
        blog: user?.blog,
        public_repos: user?.public_repos,
        followers: user?.followers,
        following: user?.following,
        created_at: user?.created_at
      });
    }
  }, [isAuthenticated, navigate, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name || user.login}!</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <div className="flex items-center space-x-6">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="h-24 w-24 rounded-full border-2 border-primary"
            />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {user.name || user.login}
              </h2>
              <p className="text-muted-foreground">@{user.login}</p>
            </div>
          </div>

          {user.bio && (
            <div className="pt-4 border-t border-border">
              <p className="text-foreground">{user.bio}</p>
            </div>
          )}

          {/* User Details Grid */}
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
            {user.email && (
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user.email}</span>
              </div>
            )}

            {user.location && (
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user.location}</span>
              </div>
            )}

            {user.company && (
              <div className="flex items-center space-x-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user.company}</span>
              </div>
            )}

            {user.blog && (
              <div className="flex items-center space-x-3 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.blog}
                </a>
              </div>
            )}

            {user.created_at && (
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            )}

            {user.html_url && (
              <div className="flex items-center space-x-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View GitHub Profile
                </a>
              </div>
            )}
          </div>

          {/* Stats */}
          {(user.public_repos !== undefined || user.followers !== undefined || user.following !== undefined) && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              {user.public_repos !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{user.public_repos}</div>
                  <div className="text-sm text-muted-foreground">Repositories</div>
                </div>
              )}
              {user.followers !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{user.followers}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
              )}
              {user.following !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{user.following}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coming Soon Section */}
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Environment Variables Management
          </h3>
          <p className="text-muted-foreground">
            Coming soon! You'll be able to store and manage your encrypted environment files here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
