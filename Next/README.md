# Next

The single server for Vathavaran: web UI, GitHub OAuth, repository authorization,
encrypted environment versions, and the authenticated encryption-key route.

Requires Node.js 22+. Run `npm ci`, configure `.env.local` from `.env.example`, then
`npm run dev`. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`
before deploying. All private responses use `Cache-Control: no-store`.

Deploy with Vercel Root Directory `Next`. Runtime environment variables must include
the existing storage credentials and encryption passphrase. GitHub's callback,
GITHUB_CALLBACK_URL, and APP_URL must agree on the production origin.

Use the private-key variable named in `.env.example` and paste its value with real
PEM line breaks in the Vercel dashboard. For a .env import, quote the value and use
a single literal `\n` between PEM lines.
The server accepts multiline and escaped variants and reports invalid PEM keys as
configuration errors without exposing their contents. Redeploy after changing vars.

The route handler is `app/api/[...path]/route.ts`; server-only helpers are in
`lib/server.ts`. API contracts are in `lib/contracts.ts`. Detailed documentation
content is maintained in `lib/documentation.ts` and rendered as static `/docs` pages.

Tests use isolated credentials and a mocked storage instance, never production
writes. Manual legacy compatibility checks should be read-only.
