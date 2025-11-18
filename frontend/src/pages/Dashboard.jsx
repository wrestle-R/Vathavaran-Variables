import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { User, Mail, MapPin, Link as LinkIcon, Calendar, Building, Github, Star, Lock, Search } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useUser();
  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'public', 'collab', 'private'
  const [searchQuery, setSearchQuery] = useState('');
  const [envCounts, setEnvCounts] = useState({});
  
  const reposPerPage = 16;

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
      
      // Fetch env file counts
      fetchEnvCounts();
      
      // Refresh env counts every 30 seconds
      const interval = setInterval(fetchEnvCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, navigate, user, token]);

  const fetchEnvCounts = async () => {
    try {
      if (!user?.id) return;
      
      const q = query(
        collection(db, 'envFiles'),
        where('userId', '==', user.id)
      );
      
      const querySnapshot = await getDocs(q);
      const counts = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const repoFullName = data.repoFullName;
        counts[repoFullName] = (counts[repoFullName] || 0) + 1;
      });
      
      setEnvCounts(counts);
    } catch (error) {
      console.error('Error fetching env counts:', error);
    }
  };

  // Update filtered repos when repositories, filter, or search query changes
  useEffect(() => {
    let filtered = repositories;
    
    // Filter by type
    if (filterType === 'public') {
      filtered = filtered.filter(r => !r.private && r.owner.login === user.login);
    } else if (filterType === 'collab') {
      filtered = filtered.filter(r => r.owner.login !== user.login);
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
  }, [repositories, filterType, searchQuery, user]);

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
    <div className="min-h-screen bg-background py-12 px-4 mt-12">
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
          <h2 className="text-2xl font-bold text-foreground">Repositories</h2>

          {loadingRepos && !filteredRepos.length && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
              </div>
              <p className="text-muted-foreground text-sm animate-pulse">Loading repositories...</p>
            </div>
          )}

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
                Public ({repositories.filter(r => !r.private && r.owner.login === user.login).length})
              </button>
              <button
                onClick={() => setFilterType('collab')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'collab'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-card/80'
                }`}
              >
                Collaborations ({repositories.filter(r => r.owner.login !== user.login).length})
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
                  <button
                    key={repo.id}
                    onClick={() => navigate(`/repo/${repo.owner.login}/${repo.name}`)}
                    className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:bg-card/50 transition-colors space-y-3 group flex flex-col h-full text-left"
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
                        {repo.owner.login !== user.login && (
                          <a
                            href={repo.owner.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary hover:underline mt-1 block"
                          >
                            by {repo.owner.login}
                          </a>
                        )}
                      </div>
                      {repo.stargazers_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 ml-2">
                          <Star className="h-4 w-4" />
                          {repo.stargazers_count}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border mt-auto">
                      {repo.language && (
                        <span className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                          {repo.language}
                        </span>
                      )}
                      <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {envCounts[`${repo.owner.login}/${repo.name}`] || 0} env files
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Simple Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 p-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
