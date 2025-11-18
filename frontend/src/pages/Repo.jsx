import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Folder, FileText, Plus, X, Copy, Check, Save, Trash2, FolderOpen, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';

const Repo = () => {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useUser();
  
  const [repoData, setRepoData] = useState(null);
  const [directories, setDirectories] = useState([]);
  const [envFiles, setEnvFiles] = useState([]);
  const [selectedDirectory, setSelectedDirectory] = useState('');
  const [showAddEnv, setShowAddEnv] = useState(false);
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

  // Auto-select first directory when directories load
  useEffect(() => {
    if (directories.length > 0 && !selectedDirectory) {
      setSelectedDirectory(directories[0].path);
    }
  }, [directories]);

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
      
      // Detect project structure intelligently
      const detectedDirs = await detectProjectStructure(contents, dirs);
      setDirectories(detectedDirs);
      
    } catch (error) {
      console.error('Error fetching repo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectProjectStructure = async (rootContents, directories) => {
    const detectedDirs = [];
    
    // Helper function to check if directory contains specific files
    const checkDirectoryContents = async (dirPath) => {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json'
            }
          }
        );
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    };

    // Check if root is a frontend project (Vite/React/Next/etc)
    const rootFiles = rootContents.filter(item => item.type === 'file').map(f => f.name);
    const isFrontendRoot = 
      rootFiles.includes('vite.config.js') ||
      rootFiles.includes('vite.config.ts') ||
      rootFiles.includes('next.config.js') ||
      rootFiles.includes('next.config.ts') ||
      rootFiles.includes('package.json');

    // Check if root is a backend project
    const isBackendRoot = 
      rootFiles.includes('requirements.txt') || // Python
      rootFiles.includes('go.mod') || // Go
      rootFiles.includes('Cargo.toml') || // Rust
      (rootFiles.includes('package.json') && rootFiles.includes('index.js')) || // Node
      rootFiles.includes('pom.xml') || // Java Maven
      rootFiles.includes('build.gradle'); // Java Gradle

    // Analyze each directory
    for (const dir of directories) {
      const dirName = dir.name.toLowerCase();
      const dirContents = await checkDirectoryContents(dir.path);
      const dirFiles = dirContents.filter(item => item.type === 'file').map(f => f.name);
      
      let category = dirName;
      let label = dir.name;

      // Frontend detection
      if (
        dirName === 'frontend' ||
        dirName === 'client' ||
        dirName === 'web' ||
        dirName === 'ui' ||
        dirName === 'app' ||
        dirFiles.includes('vite.config.js') ||
        dirFiles.includes('vite.config.ts') ||
        dirFiles.includes('next.config.js') ||
        dirFiles.includes('next.config.ts') ||
        dirFiles.includes('webpack.config.js')
      ) {
        category = 'frontend';
        label = 'Frontend';
      }
      // Backend detection
      else if (
        dirName === 'backend' ||
        dirName === 'server' ||
        dirName === 'api' ||
        dirName === 'serverless' ||
        dirFiles.includes('requirements.txt') ||
        dirFiles.includes('go.mod') ||
        dirFiles.includes('Cargo.toml') ||
        (dirFiles.includes('package.json') && dirFiles.includes('index.js'))
      ) {
        category = 'backend';
        label = 'Backend';
      }
      // Database/Config detection
      else if (
        dirName === 'database' ||
        dirName === 'db' ||
        dirName === 'migrations' ||
        dirName === 'config' ||
        dirName === 'configuration'
      ) {
        category = 'config';
        label = dir.name.charAt(0).toUpperCase() + dir.name.slice(1);
      }
      // Mobile app detection
      else if (
        dirName === 'mobile' ||
        dirName === 'android' ||
        dirName === 'ios' ||
        dirFiles.includes('pubspec.yaml') || // Flutter
        dirFiles.includes('build.gradle') // Android
      ) {
        category = 'mobile';
        label = 'Mobile';
      }
      // Docs/Assets
      else if (
        dirName === 'docs' ||
        dirName === 'documentation' ||
        dirName === 'assets' ||
        dirName === 'public' ||
        dirName === 'static'
      ) {
        category = 'other';
        label = dir.name.charAt(0).toUpperCase() + dir.name.slice(1);
      }
      // Default
      else {
        category = 'other';
        label = dir.name.charAt(0).toUpperCase() + dir.name.slice(1);
      }

      detectedDirs.push({
        name: label,
        path: dir.path,
        originalName: dir.name,
        category: category
      });
    }

    // Smart root handling
    if (directories.length === 0) {
      // Single directory project - just show root
      if (isFrontendRoot) {
        detectedDirs.unshift({ name: 'Frontend (Root)', path: '', originalName: 'root', category: 'frontend' });
      } else if (isBackendRoot) {
        detectedDirs.unshift({ name: 'Backend (Root)', path: '', originalName: 'root', category: 'backend' });
      } else {
        detectedDirs.unshift({ name: 'Root', path: '', originalName: 'root', category: 'root' });
      }
    } else {
      // Multi-directory project
      const hasFrontend = detectedDirs.some(d => d.category === 'frontend');
      const hasBackend = detectedDirs.some(d => d.category === 'backend');
      
      // Only show root if it's a monorepo with env files at root level
      // or if we can't clearly categorize it
      if (!hasFrontend && !hasBackend) {
        // Project structure unclear, show root
        if (isFrontendRoot) {
          detectedDirs.unshift({ name: 'Frontend (Root)', path: '', originalName: 'root', category: 'frontend' });
        } else if (isBackendRoot) {
          detectedDirs.unshift({ name: 'Backend (Root)', path: '', originalName: 'root', category: 'backend' });
        } else {
          detectedDirs.unshift({ name: 'Project Root', path: '', originalName: 'root', category: 'root' });
        }
      } else if (isFrontendRoot && !hasFrontend) {
        // Root is frontend but no frontend folder detected
        detectedDirs.unshift({ name: 'Frontend (Root)', path: '', originalName: 'root', category: 'frontend' });
      } else if (isBackendRoot && !hasBackend) {
        // Root is backend but no backend folder detected
        detectedDirs.unshift({ name: 'Backend (Root)', path: '', originalName: 'root', category: 'backend' });
      }
      // Otherwise, don't show root - use categorized folders only
    }

    return detectedDirs;
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
    if (!envContent.trim()) {
      alert('Please enter environment variables');
      return;
    }

    try {
      const formattedContent = parseEnvContent(envContent);
      
      // Generate env name from timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const envName = `.env.${timestamp}`;
      
      const envData = {
        userId: user.id,
        userName: user.login,
        repoFullName: `${owner}/${repo}`,
        repoName: repo,
        directory: selectedDirectory,
        envName: envName,
        content: formattedContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'envFiles'), envData);
      
      // Reset form
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
    <div className="min-h-screen bg-background py-12 px-4 mt-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            ← Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {owner}/{repo}
              </h1>
              {repoData.description && (
                <p className="text-muted-foreground">{repoData.description}</p>
              )}
            </div>
            <a
              href={repoData?.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-primary/10 rounded-md transition-colors text-muted-foreground hover:text-primary"
              title="View on GitHub"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
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
                {directories.map((dir) => {
                  const envCount = envFiles.filter(e => e.directory === dir.path).length;
                  return (
                    <button
                      key={dir.path}
                      onClick={() => setSelectedDirectory(dir.path)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                        selectedDirectory === dir.path
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-card/50 text-foreground'
                      }`}
                    >
                      <Folder className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1">{dir.name}</span>
                      {envCount > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          selectedDirectory === dir.path
                            ? 'bg-primary-foreground text-primary'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {envCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Content - Env Files */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Environment Files
                {selectedDirectory && directories.find(d => d.path === selectedDirectory) && (
                  <span className="text-sm text-muted-foreground ml-2">
                    in {directories.find(d => d.path === selectedDirectory)?.name}
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
                  <label className="text-sm font-medium text-foreground">
                    Environment Variables
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
