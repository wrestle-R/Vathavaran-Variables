import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Folder, FileText, Plus, X, Copy, Check, Save, Trash2, FolderOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { validateEnvFormat, encryptEnv, decryptEnv, parseAndFormatEnv } from '../lib/envUtils';

const Repo = () => {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: userLoading } = useUser();
  
  const [repoData, setRepoData] = useState(null);
  const [directories, setDirectories] = useState([]);
  const [envFiles, setEnvFiles] = useState([]);
  const [selectedDirectory, setSelectedDirectory] = useState('');
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [envContent, setEnvContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [editingEnv, setEditingEnv] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEnvContent, setPendingEnvContent] = useState('');
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [editingValidationErrors, setEditingValidationErrors] = useState([]);

  useEffect(() => {
    // Wait for user context to finish loading before checking authentication
    if (userLoading) {
      return;
    }
    
    // Only redirect if user is definitely not authenticated after loading
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    // Fetch data if we have a user and token
    if (user && token) {
      fetchRepoData();
      fetchEnvFiles();
    }
  }, [userLoading, isAuthenticated, user, token, owner, repo]);

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

    // Define frontend and backend subdirectories to filter out
    const frontendSubdirs = ['src', 'public', 'assets', 'components', 'pages', 'hooks', 'lib', 'utils', 'styles', 'dist', 'build', 'node_modules'];
    const backendSubdirs = ['routes', 'controllers', 'models', 'middleware', 'utils', 'services', 'config', 'logs', 'dist', 'build', 'node_modules', 'venv', 'env'];

    // If root is frontend, filter out frontend subdirectories from the list
    let dirsToProcess = directories;
    if (isFrontendRoot) {
      dirsToProcess = directories.filter(d => !frontendSubdirs.includes(d.name.toLowerCase()));
    } else if (isBackendRoot) {
      dirsToProcess = directories.filter(d => !backendSubdirs.includes(d.name.toLowerCase()));
    }

    // Analyze each directory
    for (const dir of dirsToProcess) {
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
        label = dir.name;
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
        label = dir.name;
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
        label = dir.name;
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
        label = dir.name;
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
        label = dir.name;
      }
      // Default
      else {
        category = 'other';
        label = dir.name;
      }

      detectedDirs.push({
        name: label,
        path: dir.path,
        originalName: dir.name,
        category: category
      });
    }

    // Smart root handling
    if (dirsToProcess.length === 0 || detectedDirs.length === 0) {
      // No directories or all were filtered out - just show root
      if (isFrontendRoot) {
        return [{ name: 'Frontend (Root)', path: '', originalName: 'root', category: 'frontend' }];
      } else if (isBackendRoot) {
        return [{ name: 'Backend (Root)', path: '', originalName: 'root', category: 'backend' }];
      } else {
        return [{ name: 'Root', path: '', originalName: 'root', category: 'root' }];
      }
    }

    // Multi-directory project
    const hasFrontend = detectedDirs.some(d => d.category === 'frontend');
    const hasBackend = detectedDirs.some(d => d.category === 'backend');
    
    // Add root if needed
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

    return detectedDirs;
  };

  const fetchEnvFiles = async () => {
    try {
      console.log('🔍 Fetching env files with:', { repoFullName: `${owner}/${repo}` });
      
      // Query by repoFullName only to get all collaborators' env files
      const q = query(
        collection(db, 'envFiles'),
        where('repoFullName', '==', `${owner}/${repo}`)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📦 Query returned:', querySnapshot.size, 'documents');
      
      const files = [];
      querySnapshot.forEach((doc) => {
        console.log('📄 Found env file:', doc.id, doc.data());
        files.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('✅ Set env files:', files.length);
      setEnvFiles(files);
    } catch (error) {
      console.error('❌ Error fetching env files:', error);
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
      setValidationErrors(['Please enter environment variables']);
      return;
    }

    // Validate format
    const validation = validateEnvFormat(envContent);
    
    // Show warnings if any, but still allow proceeding
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }

    // Show confirmation dialog regardless of validation
    setPendingEnvContent(envContent);
    setShowConfirmDialog(true);
  };

  const handleConfirmAndStore = async () => {
    try {
      const formattedContent = parseAndFormatEnv(pendingEnvContent);
      
      // Encrypt before storing
      const encryptedContent = encryptEnv(formattedContent);
      
      // Generate env name with timestamp and username
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const username = user.login || 'Unknown';
      const envName = `.env.${day}/${month}/${year}T${hours}:${minutes} (${username})`;
      
      const envData = {
        userId: user.id,
        userName: user.login,
        repoFullName: `${owner}/${repo}`,
        repoName: repo,
        directory: selectedDirectory,
        envName: envName,
        content: encryptedContent, // Store encrypted content
        isEncrypted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'envFiles'), envData);
      
      // Reset form
      setEnvContent('');
      setShowAddEnv(false);
      setShowConfirmDialog(false);
      setPendingEnvContent('');
      
      // Refresh env files
      fetchEnvFiles();
    } catch (error) {
      console.error('Error adding env file:', error);
      alert('Failed to add environment file');
    }
  };

  const handleUpdateEnv = async (envId, newContent) => {
    try {
      // Validate format
      const validation = validateEnvFormat(newContent);
      if (!validation.isValid) {
        setEditingValidationErrors(validation.errors);
        setShowValidationPopup(true);
        return;
      }

      const formattedContent = parseAndFormatEnv(newContent);
      const encryptedContent = encryptEnv(formattedContent);
      const envRef = doc(db, 'envFiles', envId);
      
      await updateDoc(envRef, {
        content: encryptedContent,
        isEncrypted: true,
        updatedAt: new Date().toISOString()
      });
      
      setEditingEnv(null);
      setShowValidationPopup(false);
      setEditingValidationErrors([]);
      fetchEnvFiles();
    } catch (error) {
      console.error('Error updating env file:', error);
      alert('Failed to update environment file');
    }
  };

  const handleConfirmEditWithErrors = async (envId, newContent) => {
    try {
      const formattedContent = parseAndFormatEnv(newContent);
      const encryptedContent = encryptEnv(formattedContent);
      const envRef = doc(db, 'envFiles', envId);
      
      await updateDoc(envRef, {
        content: encryptedContent,
        isEncrypted: true,
        updatedAt: new Date().toISOString()
      });
      
      setEditingEnv(null);
      setShowValidationPopup(false);
      setEditingValidationErrors([]);
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

  const copyToClipboard = (envId) => {
    const env = envFiles.find(e => e.id === envId);
    if (!env) return;
    
    // Decrypt content if it's encrypted
    const content = env.isEncrypted ? decryptEnv(env.content) : env.content;
    navigator.clipboard.writeText(content);
    setCopied(envId);
    setTimeout(() => setCopied(null), 2000);
  };

  const getDecryptedContent = (env) => {
    return env.isEncrypted ? decryptEnv(env.content) : env.content;
  };

  const filteredEnvFiles = envFiles.filter(env => env.directory === selectedDirectory);

  // Show loading state while user context is loading
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background py-12 px-4 mt-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
            className="relative z-50 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-colors"
          >
            ← Back to Dashboard
          </button>
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
                
                {validationErrors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <p className="text-sm font-medium text-destructive">Format Issues Found</p>
                    </div>
                    <ul className="text-sm text-destructive space-y-1 ml-6">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
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
                    Format: KEY=VALUE (one per line). Keys should be uppercase with underscores only. Comments starting with # are supported.
                  </p>
                </div>

                <Button onClick={handleAddEnv} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Validate & Continue
                </Button>
              </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
              <div className={`rounded-lg p-6 space-y-4 border ${
                validationErrors.length > 0
                  ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
                  : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
                    validationErrors.length > 0
                      ? 'text-orange-600 dark:text-orange-500'
                      : 'text-yellow-600 dark:text-yellow-500'
                  }`} />
                  <div className="space-y-2 flex-1">
                    {validationErrors.length > 0 ? (
                      <>
                        <h3 className={`font-semibold ${
                          validationErrors.length > 0
                            ? 'text-orange-900 dark:text-orange-100'
                            : 'text-yellow-900 dark:text-yellow-100'
                        }`}>
                          Format Issues Detected - But You Can Still Save
                        </h3>
                        <p className={`text-sm ${
                          validationErrors.length > 0
                            ? 'text-orange-800 dark:text-orange-200'
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          The following format issues were found, but you can proceed anyway:
                        </p>
                        <ul className={`text-xs space-y-1 ml-4 ${
                          validationErrors.length > 0
                            ? 'text-orange-700 dark:text-orange-300'
                            : 'text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {validationErrors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Ready to Store Encrypted Environment Variables</h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Your environment variables will be encrypted and stored securely in the database.
                        </p>
                      </>
                    )}
                    <div className="mt-3 p-3 bg-background rounded border border-border max-h-32 overflow-y-auto">
                      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                        {pendingEnvContent}
                      </pre>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      setShowConfirmDialog(false);
                      setPendingEnvContent('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmAndStore}
                    className={
                      validationErrors.length > 0
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }
                  >
                    {validationErrors.length > 0 ? 'Save Anyway' : 'Confirm & Store Encrypted'}
                  </Button>
                </div>
              </div>
            )}

            {/* Validation Errors Popup Modal */}
            {showValidationPopup && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-lg p-6 space-y-4 max-w-md w-full animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold text-foreground">
                        Format Issues Found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The following format issues were detected, but you can save anyway:
                      </p>
                      <ul className="text-xs space-y-1 ml-4 text-muted-foreground border-l-2 border-orange-500 pl-3 mt-3">
                        {editingValidationErrors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      onClick={() => {
                        setShowValidationPopup(false);
                        setEditingValidationErrors([]);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const textarea = document.getElementById(`edit-${editingEnv}`);
                        handleConfirmEditWithErrors(editingEnv, textarea.value);
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      size="sm"
                    >
                      Save Anyway
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
                          {env.isEncrypted && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded">
                              🔒 Encrypted
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {new Date(env.updatedAt).toLocaleDateString()} • By {env.userName || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(env.id)}
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
                          defaultValue={getDecryptedContent(env)}
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
                          {getDecryptedContent(env)}
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
