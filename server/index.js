require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Firebase Admin SDK
try {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
}

const db = admin.firestore();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// GitHub OAuth Config from environment variables
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || `http://localhost:${PORT}/api/auth/github/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🔐 GitHub OAuth Configuration:');
console.log('PORT:', PORT);
console.log('CLIENT_ID:', GITHUB_CLIENT_ID ? '✓ Set' : '✗ Not set');
console.log('CLIENT_SECRET:', GITHUB_CLIENT_SECRET ? '✓ Set' : '✗ Not set');
console.log('CALLBACK_URL:', GITHUB_CALLBACK_URL);
console.log('FRONTEND_URL:', FRONTEND_URL);

// Route to initiate GitHub OAuth
app.get('/api/auth/github', (req, res) => {
  console.log('🚀 Initiating GitHub OAuth...');
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=read:user%20repo%20user:email`;
  console.log('Redirecting to:', githubAuthUrl);
  res.json({ url: githubAuthUrl });
});

// CLI OAuth - initiates GitHub OAuth for CLI
app.get('/api/auth/github/cli', (req, res) => {
  const { redirect_uri } = req.query;
  console.log('🚀 Initiating GitHub OAuth for CLI...');
  console.log('CLI Redirect URI:', redirect_uri);
  
  // Store redirect_uri in state parameter
  const state = Buffer.from(redirect_uri).toString('base64');
  
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=read:user%20repo%20user:email&state=${state}`;
  
  console.log('Redirecting to GitHub:', githubAuthUrl);
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback
app.get('/api/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  console.log('📥 Received callback with code:', code ? '✓' : '✗');

  if (!code) {
    console.error('❌ No code received from GitHub');
    return res.redirect(`${FRONTEND_URL}/auth?error=no_code`);
  }

  try {
    console.log('🔄 Exchanging code for access token...');
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token received:', accessToken ? '✓' : '✗');

    if (!accessToken) {
      console.error('❌ No access token in response:', tokenResponse.data);
      return res.redirect(`${FRONTEND_URL}/auth?error=no_token`);
    }

    console.log('🔄 Fetching user data from GitHub...');
    // Get user data
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userData = userResponse.data;
    console.log('✅ User data received:', {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: userData.email
    });

    // Check if this is CLI auth (has state parameter)
    if (state) {
      const cliRedirectUri = Buffer.from(state, 'base64').toString('utf-8');
      console.log('🔄 CLI OAuth - Redirecting to:', cliRedirectUri);
      
      const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
      const tokenEncoded = encodeURIComponent(accessToken);
      return res.redirect(`${cliRedirectUri}?user=${userDataEncoded}&token=${tokenEncoded}`);
    }

    // Regular web auth - Redirect to frontend with user data and access token
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    const tokenEncoded = encodeURIComponent(accessToken);
    res.redirect(`${FRONTEND_URL}/auth/callback?user=${userDataEncoded}&token=${tokenEncoded}`);
  } catch (error) {
    console.error('❌ GitHub OAuth Error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/auth?error=auth_failed`);
  }
});

// Get user endpoint (optional, for verifying auth)
app.get('/api/user', async (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 User verification request, token:', authHeader ? '✓' : '✗');

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ User verified:', userResponse.data.login);
    res.json(userResponse.data);
  } catch (error) {
    console.error('❌ User verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get user repositories (public and private)
app.get('/api/repositories', async (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 Fetching repositories request, token:', authHeader ? '✓' : '✗');

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    
    // Fetch repositories with all visibility types (public, private, owned)
    // Using affiliation parameter to include all owned repos
    const reposResponse = await axios.get(
      'https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated&direction=desc',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const repositories = reposResponse.data;
    console.log(`✅ Fetched ${repositories.length} repositories`);
    console.log('📚 Repositories:', repositories.map(repo => ({
      name: repo.name,
      url: repo.html_url,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count
    })));

    res.json(repositories);
  } catch (error) {
    console.error('❌ Failed to fetch repositories:', error.message);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch repositories', details: error.response?.data });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📝 Available endpoints:');
  console.log('  GET  /api/auth/github');
  console.log('  GET  /api/auth/github/callback');
  console.log('  GET  /api/user');
  console.log('  GET  /api/repositories');
  console.log('  POST /api/env/push');
  console.log('  POST /api/env/pull');
  console.log('  GET  /api/env/list');
});

// ============================================
// CLI Environment Variables API Endpoints
// ============================================

// Middleware to verify GitHub token and get user info
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    req.user = userResponse.data;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Push env file
app.post('/api/env/push', authenticateToken, async (req, res) => {
  try {
    const { repoFullName, repoName, directory, envName, content } = req.body;
    
    if (!repoFullName || !envName || !content) {
      return res.status(400).json({ error: 'Missing required fields: repoFullName, envName, content' });
    }

    // Verify user has push access to the repository
    const repoCheck = await axios.get(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        'Authorization': `Bearer ${req.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!repoCheck.data.permissions || !repoCheck.data.permissions.push) {
      return res.status(403).json({ error: 'You do not have push access to this repository' });
    }

    // Save to Firestore
    const docRef = await db.collection('envFiles').add({
      userId: req.user.id,
      userName: req.user.login,
      repoFullName,
      repoName: repoName || repoFullName.split('/')[1],
      directory: directory || '',
      envName,
      content, // Already encrypted by CLI
      isEncrypted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Env pushed: ${envName} for ${repoFullName} by ${req.user.login}`);
    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('❌ Push failed:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Pull env files (get list for a repo)
app.post('/api/env/pull', authenticateToken, async (req, res) => {
  try {
    const { repoFullName, directory } = req.body;
    
    if (!repoFullName) {
      return res.status(400).json({ error: 'Missing required field: repoFullName' });
    }

    let query = db.collection('envFiles')
      .where('userId', '==', req.user.id)
      .where('repoFullName', '==', repoFullName);
    
    if (directory !== undefined && directory !== '') {
      query = query.where('directory', '==', directory);
    }

    const snapshot = await query.get();
    
    const envFiles = [];
    snapshot.forEach(doc => {
      envFiles.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Pull: Found ${envFiles.length} env files for ${repoFullName} by ${req.user.login}`);
    res.json({ success: true, envFiles });
  } catch (error) {
    console.error('❌ Pull failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// List all env files for user
app.get('/api/env/list', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection('envFiles')
      .where('userId', '==', req.user.id)
      .get();
    
    const envFiles = [];
    snapshot.forEach(doc => {
      envFiles.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ List: Found ${envFiles.length} env files for ${req.user.login}`);
    res.json({ success: true, envFiles });
  } catch (error) {
    console.error('❌ List failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});
