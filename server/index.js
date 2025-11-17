require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8000;

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
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=read:user%20repo%20user:email`;
  console.log('Redirecting to:', githubAuthUrl);
  res.json({ url: githubAuthUrl });
});

// GitHub OAuth callback
app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query;
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

    // Redirect to frontend with user data and access token
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
});
