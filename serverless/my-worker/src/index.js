/**
 * Cloudflare Worker for GitHub OAuth and API
 * Handles GitHub authentication and repository fetching
 */

// Helper function to handle CORS
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Helper function to parse URL and route requests
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = request.headers.get('Origin');

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders(origin),
    });
  }

  // Route: Initiate GitHub OAuth
  if (path === '/api/auth/github' && request.method === 'GET') {
    return handleGitHubAuth(env, origin);
  }

  // Route: GitHub OAuth callback
  if (path === '/api/auth/github/callback' && request.method === 'GET') {
    return handleGitHubCallback(request, env);
  }

  // Route: Get user
  if (path === '/api/user' && request.method === 'GET') {
    return handleGetUser(request, origin);
  }

  // Route: Get repositories
  if (path === '/api/repositories' && request.method === 'GET') {
    return handleGetRepositories(request, origin);
  }

  // 404 for unknown routes
  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders(origin),
  });
}

// Handler: Initiate GitHub OAuth
function handleGitHubAuth(env, origin) {
  const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID;
  const GITHUB_CALLBACK_URL = env.GITHUB_CALLBACK_URL;

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=read:user%20repo%20user:email`;

  return new Response(JSON.stringify({ url: githubAuthUrl }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

// Handler: GitHub OAuth callback
async function handleGitHubCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const FRONTEND_URL = env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return Response.redirect(`${FRONTEND_URL}/auth?error=no_code`, 302);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return Response.redirect(`${FRONTEND_URL}/auth?error=no_token`, 302);
    }

    // Get user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    // Redirect to frontend with user data and access token
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    const tokenEncoded = encodeURIComponent(accessToken);
    
    return Response.redirect(`${FRONTEND_URL}/auth/callback?user=${userDataEncoded}&token=${tokenEncoded}`, 302);
  } catch (error) {
    return Response.redirect(`${FRONTEND_URL}/auth?error=auth_failed`, 302);
  }
}

// Handler: Get user
async function handleGetUser(request, origin) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = await userResponse.json();

    return new Response(JSON.stringify(userData), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }
}

// Handler: Get repositories
async function handleGetRepositories(request, origin) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    
    // Fetch repositories
    const reposResponse = await fetch(
      'https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated&direction=desc',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const repositories = await reposResponse.json();

    return new Response(JSON.stringify(repositories), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch repositories',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
