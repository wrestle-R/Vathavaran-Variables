import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { User, Mail, MapPin, Link as LinkIcon, Calendar, Building, Github, Star, Lock, Search } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useUser();
  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'public', 'private'
  const [searchQuery, setSearchQuery] = useState('');
  
  const reposPerPage = 10;

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
      
      // Try to load from cache first
      const cachedRepos = localStorage.getItem('cachedRepositories');
      if (cachedRepos) {
        console.log('📦 Dashboard: Loading repositories from cache');
        setRepositories(JSON.parse(cachedRepos));
      }
      
      // Fetch repositories
      fetchRepositories();
    }
  }, [isAuthenticated, navigate, user, token]);

  // Update filtered repos when repositories, filter, or search query changes
  useEffect(() => {
    let filtered = repositories;
    
    // Filter by type
    if (filterType === 'public') {
      filtered = filtered.filter(r => !r.private);
    } else if (filterType === 'private') {
      filtered = filtered.filter(r => r.private);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.language?.toLowerCase().includes(query)
      );
    }
    
    setFilteredRepos(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [repositories, filterType, searchQuery]);

  const fetchRepositories = async () => {
    setLoadingRepos(true);
    setError(null);
    try {
      console.log('🔄 Dashboard: Fetching repositories...');
      const response = await fetch('http://localhost:8000/api/repositories', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repos = await response.json();
      console.log('✅ Dashboard: Repositories fetched successfully:', repos);
      console.log('📚 Total repositories:', repos.length);
      console.log('📊 Repository summary:', {
        total: repos.length,
        public: repos.filter(r => !r.private).length,
        private: repos.filter(r => r.private).length,
        languages: [...new Set(repos.map(r => r.language).filter(Boolean))]
      });
      setRepositories(repos);
      // Store repos in localStorage
      localStorage.setItem('cachedRepositories', JSON.stringify(repos));
      localStorage.setItem('cachedRepositoriesTimestamp', Date.now().toString());
    } catch (err) {
      console.error('❌ Dashboard: Error fetching repositories:', err);
      // Try to load from cache if fetch fails
      const cachedRepos = localStorage.getItem('cachedRepositories');
      if (cachedRepos) {
        console.log('📦 Dashboard: Loading repositories from cache');
        setRepositories(JSON.parse(cachedRepos));
      } else {
        setError(err.message);
      }
    } finally {
      setLoadingRepos(false);
    }
  };
  

  // Pagination logic
  const totalPages = Math.ceil(filteredRepos.length / reposPerPage);
  const startIndex = (currentPage - 1) * reposPerPage;
  const endIndex = startIndex + reposPerPage;
  const currentRepos = filteredRepos.slice(startIndex, endIndex);

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


        {/* User Profile Card - Compact */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-4">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="h-20 w-20 rounded-full border-2 border-primary shrink-0"
            />
            <div className="flex-1 space-y-1">
              <h2 className="text-2xl font-bold text-foreground">
                {user.name || user.login}
              </h2>
              <p className="text-base text-muted-foreground">@{user.login}</p>
              {user.bio && <p className="text-sm text-foreground pt-1">{user.bio}</p>}
            </div>
          </div>

          {/* User Details - Compact Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            {user.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground truncate">{user.email}</span>
              </div>
            )}


          </div>

          {/* Stats - Compact */}
          {(user.public_repos !== undefined || user.followers !== undefined || user.following !== undefined) && (
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              {user.public_repos !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{repositories.length}</div>
                  <div className="text-sm text-muted-foreground">Repos</div>
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

        {/* Repositories Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Repositories</h2>
            {loadingRepos && (
              <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
            )}
          </div>

          {/* Search Bar */}
          {repositories.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search repositories by name, description, or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Filter Buttons */}
          {repositories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-card/80'
                }`}
              >
                All ({repositories.length})
              </button>
              <button
                onClick={() => setFilterType('public')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'public'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-card/80'
                }`}
              >
                Public ({repositories.filter(r => !r.private).length})
              </button>
              <button
                onClick={() => setFilterType('private')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'private'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-card/80'
                }`}
              >
                Private ({repositories.filter(r => r.private).length})
              </button>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <p className="text-destructive text-sm">Error: {error}</p>
            </div>
          )}

          {filteredRepos.length === 0 && !loadingRepos && !error && (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No repositories found</p>
            </div>
          )}

          {filteredRepos.length > 0 && (
            <>
              {/* Repositories Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {currentRepos.map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:bg-card/50 transition-colors space-y-3 group flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Github className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {repo.name}
                          </h3>
                          {repo.private && (
                            <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-500 shrink-0" />
                          )}
                        </div>
                      </div>
                      {repo.stargazers_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 ml-2">
                          <Star className="h-4 w-4" />
                          {repo.stargazers_count}
                        </div>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{repo.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border mt-auto">
                      {repo.language && (
                        <span className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                          {repo.language}
                        </span>
                      )}
                      <span>{repo.private ? '🔒 Private' : '🌐 Public'}</span>
                    </div>
                  </a>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 p-4 bg-card border border-border rounded-lg">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border border-border text-foreground hover:bg-card'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              <div className="text-center text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredRepos.length)} of {filteredRepos.length} repositories
              </div>
            </>
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
