import express from 'express';
import open from 'open';
import chalk from 'chalk';

const CLI_CALLBACK_PORT = 3456;
// Use environment variables for production deployment
const BACKEND_URL = process.env.VATHAVARAN_BACKEND_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.VATHAVARAN_FRONTEND_URL || 'http://localhost:5173';

export async function githubOAuthLogin() {
  return new Promise((resolve, reject) => {
    const app = express();
    let server;

    // Handle OAuth callback from backend
    app.get('/callback', async (req, res) => {
      const { user, token } = req.query;

      if (!token || !user) {
        // Redirect to website on failure
        res.redirect(`${FRONTEND_URL}/?auth=failed`);
        
        setTimeout(() => {
          server.close();
          reject(new Error('Authentication failed'));
        }, 100);
        return;
      }

      // Redirect to website on success
      res.redirect(`${FRONTEND_URL}/?auth=success`);
      
      // Parse user data
      const userData = JSON.parse(decodeURIComponent(user));
      const authData = { 
        userId: userData.id, 
        userName: userData.login,
        token: decodeURIComponent(token)
      };
      
      // Close server and resolve after sending response
      setTimeout(() => {
        server.closeAllConnections?.(); // Close all connections immediately
        server.close(() => {
          resolve(authData);
        });
        // Fallback: resolve even if server doesn't close gracefully
        setTimeout(() => resolve(authData), 500);
      }, 100);
    });

    // Start local server
    server = app.listen(CLI_CALLBACK_PORT, async () => {
      console.log(chalk.blue('\n🔐 Opening GitHub authentication in your browser...\n'));
      
      // Encode the CLI callback URL
      const cliCallbackUrl = `http://localhost:${CLI_CALLBACK_PORT}/callback`;
      const encodedCallback = encodeURIComponent(cliCallbackUrl);
      
      // Open browser to backend's CLI auth endpoint
      const authUrl = `${BACKEND_URL}/api/auth/github/cli?redirect_uri=${encodedCallback}`;
      
      console.log(chalk.gray(`Auth URL: ${authUrl}\n`));
      
      await open(authUrl);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timeout - please try again'));
    }, 300000);
  });
}
