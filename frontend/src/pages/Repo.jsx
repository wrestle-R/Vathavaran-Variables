import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Folder, FileText, Plus, X, Copy, Check, Save, Trash2, ChevronRight, FolderOpen } from 'lucide-react';
import { Button } from '../components/ui/button';

const Repo = () => {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useUser();
  
  const [repoData, setRepoData] = useState(null);
  const [directories, setDirectories] = useState([]);
  const [envFiles, setEnvFiles] = useState([]);
  const [selectedDirectory, setSelectedDirectory] = useState('root');
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [envContent, setEnvContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [editingEnv, setEditingEnv] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    fetchRepoData();
    fetchEnvFiles();
  }, [isAuthenticated, owner, repo]);

  const fetchRepoData = async () => {
    try {
      setLoading(true);
      
      // Fetch repository details from GitHub API
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      if (!repoResponse.ok) throw new Error('Failed to fetch repository');
      const repoInfo = await repoResponse.json();
      setRepoData(repoInfo);

      // Fetch root directory structure
      const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      if (!contentsResponse.ok) throw new Error('Failed to fetch repository contents');
      const contents = await contentsResponse.json();
      
      // Filter only directories
      const dirs = contents.filter(item => item.type === 'dir');
      setDirectories([{ name: 'root', path: '' }, ...dirs.map(d => ({ name: d.name, path: d.path }))]);
      
    } catch (error) {
      console.error('Error fetching repo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvFiles = async () => {
    try {
      const q = query(
        collection(db, 'envFiles'),
        where('userId', '==', user.id),
        where('repoFullName', '==', `${owner}/${repo}`)
      );
      
      const querySnapshot = await getDocs(q);
      const files = [];
      querySnapshot.forEach((doc) => {
        files.push({ id: doc.id, ...doc.data() });
      });
      
      setEnvFiles(files);
    } catch (error) {
      console.error('Error fetching env files:', error);
    }
  };

  const parseEnvContent = (content) => {
    // Parse pasted env content and format it properly
    const lines = content.split('\n');
    const formatted = [];
    
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) {
        formatted.push(line);
        return;
      }
      
      // Handle lines with = sign
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 1).trim();
        formatted.push(`${key}=${value}`);
      } else {
        formatted.push(line);
      }
    });
    
    return formatted.join('\n');
  };

  const handleAddEnv = async () => {
    if (!newEnvName.trim()) {
      alert('Please enter an environment name');
      return;
    }

    try {
      const formattedContent = parseEnvContent(envContent);
      
      const envData = {
        userId: user.id,
        userName: user.login,
        repoFullName: `${owner}/${repo}`,
        repoName: repo,
        directory: selectedDirectory,
        envName: newEnvName.trim(),
        content: formattedContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'envFiles'), envData);
      
      // Reset form
      setNewEnvName('');
      setEnvContent('');
      setShowAddEnv(false);
      
      // Refresh env files
      fetchEnvFiles();
    } catch (error) {
      console.error('Error adding env file:', error);
      alert('Failed to add environment file');
    }
  };

  const handleUpdateEnv = async (envId, newContent) => {
    try {
      const formattedContent = parseEnvContent(newContent);
      const envRef = doc(db, 'envFiles', envId);
      
      await updateDoc(envRef, {
        content: formattedContent,
        updatedAt: new Date().toISOString()
      });
      
      setEditingEnv(null);
      fetchEnvFiles();
    } catch (error) {
      console.error('Error updating env file:', error);
      alert('Failed to update environment file');
    }
  };

  const handleDeleteEnv = async (envId) => {
    if (!confirm('Are you sure you want to delete this environment file?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'envFiles', envId));
      fetchEnvFiles();
    } catch (error) {
      console.error('Error deleting env file:', error);
      alert('Failed to delete environment file');
    }
  };

  const copyToClipboard = (content, envId) => {
    navigator.clipboard.writeText(content);
    setCopied(envId);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredEnvFiles = envFiles.filter(env => env.directory === selectedDirectory);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading repository...</div>
      </div>
    );
  }

  if (!repoData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Repository not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-foreground">
            {owner}/{repo}
          </h1>
          {repoData.description && (
            <p className="text-muted-foreground">{repoData.description}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Directories */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Directories
              </h2>
              <div className="space-y-1">
                {directories.map((dir) => (
                  <button
                    key={dir.path || 'root'}
                    onClick={() => setSelectedDirectory(dir.path || 'root')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                      selectedDirectory === (dir.path || 'root')
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-card/50 text-foreground'
                    }`}
                  >
                    <Folder className="h-4 w-4 shrink-0" />
                    <span className="truncate">{dir.name}</span>
                    {filteredEnvFiles.length > 0 && selectedDirectory === (dir.path || 'root') && (
                      <span className="ml-auto bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
                        {envFiles.filter(e => e.directory === (dir.path || 'root')).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Env Files */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Environment Files
                {selectedDirectory !== 'root' && (
                  <span className="text-sm text-muted-foreground ml-2">
                    in /{selectedDirectory}
                  </span>
                )}
              </h2>
              <Button
                onClick={() => setShowAddEnv(!showAddEnv)}
                className="flex items-center gap-2"
              >
                {showAddEnv ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showAddEnv ? 'Cancel' : 'Add Env File'}
              </Button>
            </div>

            {/* Add Env Form */}
            {showAddEnv && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Create New Environment File</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Environment Name</label>
                  <input
                    type="text"
                    placeholder="e.g., .env.local, .env.production"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Environment Variables (paste your .env content)
                  </label>
                  <textarea
                    placeholder="VITE_API_KEY=your_api_key&#10;DATABASE_URL=your_database_url&#10;# Comments are supported"
                    value={envContent}
                    onChange={(e) => setEnvContent(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste your environment variables here. They will be automatically formatted.
                  </p>
                </div>

                <Button onClick={handleAddEnv} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Environment File
                </Button>
              </div>
            )}

            {/* Env Files List */}
            {filteredEnvFiles.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No environment files in this directory yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Env File" to create one.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEnvFiles.map((env) => (
                  <div key={env.id} className="bg-card border border-border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          {env.envName}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {new Date(env.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(env.content, env.id)}
                          className="p-2 hover:bg-background rounded-md transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied === env.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteEnv(env.id)}
                          className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>

                    {editingEnv === env.id ? (
                      <div className="space-y-3">
                        <textarea
                          defaultValue={env.content}
                          id={`edit-${env.id}`}
                          rows={12}
                          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              const textarea = document.getElementById(`edit-${env.id}`);
                              handleUpdateEnv(env.id, textarea.value);
                            }}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button
                            onClick={() => setEditingEnv(null)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <pre className="bg-background border border-border rounded-md p-4 text-sm font-mono overflow-x-auto">
                          {env.content}
                        </pre>
                        <Button
                          onClick={() => setEditingEnv(env.id)}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Repo;
