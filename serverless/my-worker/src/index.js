/**
 * Cloudflare Worker for GitHub OAuth and API
 * Handles GitHub authentication, repository fetching, and environment variable management
 */

// Helper function to handle CORS
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Firebase service account authentication
async function getFirebaseAccessToken(env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY;
  
  // Create JWT for service account
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  
  // For now, we'll use an alternative approach with unauthenticated access
  // You can enable public read/write in Firestore rules for testing
  // Production: Implement JWT signing or use Firebase Admin REST API key
  return null;
}

// Firebase Firestore REST API helpers
async function firestoreRequest(env, method, path, body = null) {
  const projectId = env.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents${path}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firestore request failed: ${response.status} ${error}`);
  }
  
  return response.json();
}

// Convert Firestore document to plain object
function firestoreDocToObject(doc) {
  if (!doc.fields) return null;
  
  const obj = {};
  for (const [key, value] of Object.entries(doc.fields)) {
    if (value.stringValue !== undefined) obj[key] = value.stringValue;
    else if (value.integerValue !== undefined) obj[key] = parseInt(value.integerValue);
    else if (value.booleanValue !== undefined) obj[key] = value.booleanValue;
    else if (value.timestampValue !== undefined) obj[key] = value.timestampValue;
  }
  
  // Extract ID from document name
  const nameParts = doc.name.split('/');
  obj.id = nameParts[nameParts.length - 1];
  
  return obj;
}

// Convert plain object to Firestore fields format
function objectToFirestoreFields(obj) {
  const fields = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: value.toString() };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    }
  }
  
  return fields;
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

  // Route: CLI GitHub OAuth
  if (path === '/api/auth/github/cli' && request.method === 'GET') {
    return handleGitHubAuthCLI(request, env);
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

  // Route: Push env file
  if (path === '/api/env/push' && request.method === 'POST') {
    return handleEnvPush(request, env, origin);
  }

  // Route: Pull env files
  if (path === '/api/env/pull' && request.method === 'POST') {
    return handleEnvPull(request, env, origin);
  }

  // Route: Get encryption key
  if (path === '/api/encryption-key' && request.method === 'GET') {
    return handleGetEncryptionKey(env, origin);
  }

  // Route: List env files
  if (path === '/api/env/list' && request.method === 'POST') {
    return handleEnvList(request, env, origin);
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

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=read:user%20repo%20user:email`;

  return new Response(JSON.stringify({ url: githubAuthUrl }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

// Handler: CLI GitHub OAuth
function handleGitHubAuthCLI(request, env) {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirect_uri');
  
  console.log('🚀 Initiating GitHub OAuth for CLI...');
  console.log('CLI Redirect URI:', redirectUri);
  
  const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID;
  const GITHUB_CALLBACK_URL = env.GITHUB_CALLBACK_URL;
  
  // Store redirect_uri in state parameter
  const state = btoa(redirectUri);
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=read:user%20repo%20user:email&state=${state}`;
  
  console.log('Redirecting to GitHub:', githubAuthUrl);
  return Response.redirect(githubAuthUrl, 302);
}

// Handler: GitHub OAuth callback
async function handleGitHubCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const FRONTEND_URL = env.FRONTEND_URL || 'http://localhost:5173';

  console.log('📥 GitHub OAuth Callback:', {
    hasCode: !!code,
    hasState: !!state,
    hasClientId: !!env.GITHUB_CLIENT_ID,
    hasClientSecret: !!env.GITHUB_CLIENT_SECRET,
    callbackUrl: env.GITHUB_CALLBACK_URL,
    frontendUrl: FRONTEND_URL
  });

  if (!code) {
    console.error('❌ No code provided in callback');
    return Response.redirect(`${FRONTEND_URL}/auth?error=no_code`, 302);
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    console.error('Missing GitHub credentials in environment');
    console.error('GITHUB_CLIENT_ID:', env.GITHUB_CLIENT_ID ? 'Set' : 'NOT SET');
    console.error('GITHUB_CLIENT_SECRET:', env.GITHUB_CLIENT_SECRET ? 'Set' : 'NOT SET');
    return Response.redirect(`${FRONTEND_URL}/auth?error=missing_credentials`, 302);
  }

  try {
    // Exchange code for access token
    console.log('Exchanging code for access token...');
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
    console.log('Token response:', { hasAccessToken: !!tokenData.access_token, error: tokenData.error });
    
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('No access token received:', tokenData);
      console.error('Full token response:', JSON.stringify(tokenData, null, 2));
      return Response.redirect(`${FRONTEND_URL}/auth?error=no_token&details=${encodeURIComponent(tokenData.error || 'unknown')}`, 302);
    }

    // Get user data
    console.log('Fetching user data...');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Cloudflare-Worker',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('GitHub API error:', userResponse.status, errorText);
      return Response.redirect(`${FRONTEND_URL}/auth?error=github_api_error`, 302);
    }

    const userData = await userResponse.json();
    console.log('✅ User data received:', { login: userData.login, id: userData.id, name: userData.name, email: userData.email });

    // Check if this is CLI auth (has state parameter)
    if (state) {
      const cliRedirectUri = atob(state);
      console.log('🔄 CLI OAuth - Redirecting to:', cliRedirectUri);
      
      const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
      const tokenEncoded = encodeURIComponent(accessToken);
      return Response.redirect(`${cliRedirectUri}?user=${userDataEncoded}&token=${tokenEncoded}`, 302);
    }

    // Regular web auth - Redirect to frontend with user data and access token
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    const tokenEncoded = encodeURIComponent(accessToken);
    
    console.log('Redirecting to frontend with user data');
    return Response.redirect(`${FRONTEND_URL}/auth/callback?user=${userDataEncoded}&token=${tokenEncoded}`, 302);
  } catch (error) {
    console.error('GitHub OAuth Error:', error.message, error.stack);
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

  console.log('Get repositories request:', { hasAuth: !!authHeader, origin });

  if (!authHeader) {
    console.error('No authorization header');
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
    console.log('Fetching repositories from GitHub...');
    
    // Fetch repositories
    const reposResponse = await fetch(
      'https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated&direction=desc',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Cloudflare-Worker',
        },
      }
    );

    console.log('GitHub API response status:', reposResponse.status);

    if (!reposResponse.ok) {
      const errorText = await reposResponse.text();
      console.error('GitHub API error:', reposResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch repositories',
        status: reposResponse.status,
        details: errorText 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }

    const repositories = await reposResponse.json();
    console.log('Successfully fetched repositories:', repositories.length);

    return new Response(JSON.stringify(repositories), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    console.error('Error in handleGetRepositories:', error.message, error.stack);
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

// ============================================
// Authentication Middleware
// ============================================
async function authenticateToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No authorization token provided', status: 401 };
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Cloudflare-Worker',
      }
    });

    if (!userResponse.ok) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    const user = await userResponse.json();
    return { user, token };
  } catch (error) {
    return { error: 'Authentication failed', status: 401 };
  }
}

// ============================================
// Environment Variables API Handlers
// ============================================

// Handler: Push env file
async function handleEnvPush(request, env, origin) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }

  try {
    const { repoFullName, repoName, directory, envName, content } = await request.json();
    
    if (!repoFullName || !envName || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields: repoFullName, envName, content' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }

    // Verify user has push access to the repository
    const repoCheck = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cloudflare-Worker',
      }
    });

    if (!repoCheck.ok) {
      return new Response(JSON.stringify({ error: 'Repository not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }

    const repoData = await repoCheck.json();
    if (!repoData.permissions || !repoData.permissions.push) {
      return new Response(JSON.stringify({ error: 'You do not have push access to this repository' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }

    // Save to Firebase Firestore
    const data = {
      userId: auth.user.id,
      userName: auth.user.login,
      repoFullName,
      repoName: repoName || repoFullName.split('/')[1],
      directory: directory || '',
      envName,
      content, // Already encrypted by CLI
      isEncrypted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const firestoreDoc = {
      fields: objectToFirestoreFields(data)
    };

    const result = await firestoreRequest(env, 'POST', '/envFiles', firestoreDoc);
    const docId = result.name.split('/').pop();

    console.log(`✅ Env pushed: ${envName} for ${repoFullName} by ${auth.user.login}`);
    return new Response(JSON.stringify({ success: true, id: docId }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    console.error('❌ Push failed:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }
}

// Handler: Pull env files
async function handleEnvPull(request, env, origin) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }

  try {
    const { repoFullName, directory } = await request.json();
    
    if (!repoFullName) {
      return new Response(JSON.stringify({ error: 'Missing required field: repoFullName' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }

    // Query Firebase Firestore for env files
    const projectId = env.FIREBASE_PROJECT_ID;
    
    // Build structured query to filter by repoFullName and directory only
    // This allows all collaborators to access env files for the repository
    const structuredQuery = {
      structuredQuery: {
        from: [{ collectionId: 'envFiles' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: 'repoFullName' },
                  op: 'EQUAL',
                  value: { stringValue: repoFullName }
                }
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'directory' },
                  op: 'EQUAL',
                  value: { stringValue: directory || '' }
                }
              }
            ]
          }
        }
      }
    };

    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    const queryResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(structuredQuery)
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.error(`Firestore query failed: ${queryResponse.status}`, errorText);
      throw new Error(`Firestore query failed: ${queryResponse.status} ${errorText}`);
    }

    const results = await queryResponse.json();
    const envFiles = [];

    // Parse query results
    if (Array.isArray(results)) {
      for (const result of results) {
        if (result.document) {
          const envFile = firestoreDocToObject(result.document);
          if (envFile) {
            envFiles.push(envFile);
          }
        }
      }
    }

    console.log(`✅ Pull: Found ${envFiles.length} env files for ${repoFullName} by ${auth.user.login}`);
    return new Response(JSON.stringify({ success: true, envFiles }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    console.error('❌ Pull failed:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }
}

// Handler: List all env files
async function handleEnvList(request, env, origin) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }

  try {
    // Parse optional request body
    const body = await request.json().catch(() => ({}));
    const { repoFullName } = body;
    
    // Query Firebase Firestore for env files
    const projectId = env.FIREBASE_PROJECT_ID;
    const userId = auth.user.id;
    
    let envFiles = [];

    if (repoFullName) {
      // If repo specified, show ALL files for that repo (including collaborators)
      const structuredQuery = {
        structuredQuery: {
          from: [{ collectionId: 'envFiles' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'repoFullName' },
              op: 'EQUAL',
              value: { stringValue: repoFullName }
            }
          }
        }
      };

      const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
      const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structuredQuery)
      });

      if (!queryResponse.ok) {
        const errorText = await queryResponse.text();
        console.error(`Firestore query failed: ${queryResponse.status}`, errorText);
        throw new Error(`Firestore query failed: ${queryResponse.status} ${errorText}`);
      }

      const results = await queryResponse.json();

      // Parse query results
      if (Array.isArray(results)) {
        for (const result of results) {
          if (result.document) {
            const envFile = firestoreDocToObject(result.document);
            if (envFile) {
              envFiles.push(envFile);
            }
          }
        }
      }
    } else {
      // If no repo specified, find ALL repos user has access to (owned + collaborated)
      // Then fetch env files from all those repos
      
      try {
        // Get user's repositories (owned)
        const reposResponse = await fetch('https://api.github.com/user/repos?type=owner&per_page=100', {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'User-Agent': 'Cloudflare-Worker',
          },
        });

        if (!reposResponse.ok) {
          console.error('Failed to fetch user repos:', reposResponse.status);
          throw new Error('Failed to fetch repositories');
        }

        const userRepos = await reposResponse.json();
        const repoFullNames = userRepos.map(r => r.full_name);

        console.log(`Found ${repoFullNames.length} owned repositories for ${auth.user.login}`);

        // Get collaborated repositories (where user is a collaborator but not owner)
        const collaboratedResponse = await fetch('https://api.github.com/user/repos?type=collaborator&per_page=100', {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'User-Agent': 'Cloudflare-Worker',
          },
        });

        if (collaboratedResponse.ok) {
          const collaboratedRepos = await collaboratedResponse.json();
          const collaboratedNames = collaboratedRepos.map(r => r.full_name);
          repoFullNames.push(...collaboratedNames);
          console.log(`Found ${collaboratedNames.length} collaborated repositories for ${auth.user.login}`);
        }

        console.log(`Total repositories to search: ${repoFullNames.length}`, repoFullNames);

        // Query Firestore for env files from all these repos
        // Firestore IN operator supports max 30 values, so we need to batch if more
        if (repoFullNames.length > 0) {
          const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
          
          // Batch repos into chunks of 30 (Firestore IN limit)
          const batchSize = 30;
          for (let i = 0; i < repoFullNames.length; i += batchSize) {
            const batch = repoFullNames.slice(i, i + batchSize);
            
            const structuredQuery = {
              structuredQuery: {
                from: [{ collectionId: 'envFiles' }],
                where: {
                  fieldFilter: {
                    field: { fieldPath: 'repoFullName' },
                    op: 'IN',
                    value: { 
                      arrayValue: { 
                        values: batch.map(name => ({ stringValue: name }))
                      }
                    }
                  }
                }
              }
            };

            console.log(`Querying batch ${Math.floor(i/batchSize) + 1} with ${batch.length} repos`);

            const queryResponse = await fetch(queryUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(structuredQuery)
            });

            if (!queryResponse.ok) {
              const errorText = await queryResponse.text();
              console.error(`Firestore query failed: ${queryResponse.status}`, errorText);
              continue; // Try next batch instead of failing completely
            }

            const results = await queryResponse.json();

            // Parse query results
            if (Array.isArray(results)) {
              for (const result of results) {
                if (result.document) {
                  const envFile = firestoreDocToObject(result.document);
                  if (envFile) {
                    envFiles.push(envFile);
                  }
                }
              }
            }
          }
        }
      } catch (gitError) {
        console.error('GitHub API error:', gitError.message);
        // Fall back to returning just the user's files
        const structuredQuery = {
          structuredQuery: {
            from: [{ collectionId: 'envFiles' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'userId' },
                op: 'EQUAL',
                value: { integerValue: userId.toString() }
              }
            }
          }
        };

        const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
        const queryResponse = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(structuredQuery)
        });

        if (queryResponse.ok) {
          const results = await queryResponse.json();
          if (Array.isArray(results)) {
            for (const result of results) {
              if (result.document) {
                const envFile = firestoreDocToObject(result.document);
                if (envFile) {
                  envFiles.push(envFile);
                }
              }
            }
          }
        }
      }
    }

    console.log(`✅ List: Found ${envFiles.length} env files for ${auth.user.login}`);
    return new Response(JSON.stringify({ success: true, envFiles }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    console.error('❌ List failed:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }
}

// Handler: Get encryption key (public endpoint - no auth needed)
function handleGetEncryptionKey(env, origin) {
  if (!env.ENCRYPTION_KEY) {
    return new Response(JSON.stringify({ 
      error: 'Encryption key not configured. Please set it using: wrangler secret put ENCRYPTION_KEY'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }
  
  return new Response(JSON.stringify({ 
    encryptionKey: env.ENCRYPTION_KEY
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
