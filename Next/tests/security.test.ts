import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { validCallback, validRepository } from "../lib/contracts";
import { seal, unseal, tokenFrom } from "../lib/server";
import { GET, POST } from "../app/api/[...path]/route";
process.env.SESSION_SECRET =
  "test-session-secret-that-is-at-least-32-characters";
process.env.APP_URL = "http://localhost:3000";
process.env.GITHUB_CLIENT_ID = "test-client";
process.env.GITHUB_CALLBACK_URL =
  "http://localhost:3000/api/auth/github/callback";
test("native redirects cannot exfiltrate GitHub tokens to arbitrary sites", () => {
  for (const value of [
    "https://evil.test/callback",
    "http://localhost.evil.test/callback",
    "http://user:pass@localhost:8080/callback",
    "vathavaran://evil/callback",
    "javascript:alert(1)",
    "http://localhost:8080/other",
  ])
    assert.equal(validCallback(value), false, value);
  for (const value of [
    "http://127.0.0.1:9812/callback",
    "http://localhost:9812/callback",
    "vathavaran://auth/callback",
  ])
    assert.equal(validCallback(value), true, value);
});
test("repository identifiers do not permit URL or Firestore path injection", () => {
  assert.equal(validRepository("owner/project"), true);
  for (const value of [
    "owner/project/extra",
    "../repo",
    "owner/repo?x=1",
    "https://github.com/owner/repo",
    null,
  ])
    assert.equal(validRepository(value), false);
});
test("session encryption round trip rejects tampering and expiration", () => {
  const session = seal({ token: "test-token", expires: Date.now() + 60000 });
  assert.equal(unseal<{ token: string }>(session)?.token, "test-token");
  const damaged = Buffer.from(session, "base64url");
  damaged[30] ^= 1;
  assert.equal(unseal(damaged.toString("base64url")), null);
  assert.throws(
    () =>
      tokenFrom(
        new NextRequest("http://localhost:3000/api/user", {
          headers: {
            cookie: `varte_session=${seal({ token: "test-token", expires: Date.now() - 1 })}`,
          },
        }),
      ),
    /Sign in/,
  );
});
test("cookie writes require the configured origin while bearer clients work", () => {
  const cookie = `varte_session=${seal({ token: "test-token", expires: Date.now() + 60000 })}`;
  assert.throws(
    () =>
      tokenFrom(
        new NextRequest("http://localhost:3000/api/env/push", {
          method: "POST",
          headers: { cookie, origin: "https://evil.test" },
        }),
      ),
    /origin/,
  );
  assert.equal(
    tokenFrom(
      new NextRequest("http://localhost:3000/api/env/push", {
        method: "POST",
        headers: { cookie, origin: "http://localhost:3000" },
      }),
    ),
    "test-token",
  );
  assert.equal(
    tokenFrom(
      new NextRequest("http://localhost:3000/api/env/push", {
        method: "POST",
        headers: { authorization: "Bearer native-token" },
      }),
    ),
    "native-token",
  );
});
test("environment and encryption-key endpoints reject anonymous requests", async () => {
  for (const path of ["/api/encryption-key", "/api/env/list", "/api/user"]) {
    const result = await GET(new NextRequest("http://localhost:3000" + path));
    assert.equal(result.status, 401, path);
  }
  const result = await POST(
    new NextRequest("http://localhost:3000/api/env/push", {
      method: "POST",
      body: "{}",
    }),
  );
  assert.equal(result.status, 401);
});
test("OAuth start issues a short-lived bound cookie; callback requires it", async () => {
  const start = await GET(
    new NextRequest(
      "http://localhost:3000/api/auth/github/cli?redirect_uri=" +
        encodeURIComponent("http://127.0.0.1:9000/callback"),
    ),
  );
  assert.equal(start.status, 307);
  assert.match(start.headers.get("set-cookie") || "", /HttpOnly/);
  const callback = await GET(
    new NextRequest(
      "http://localhost:3000/api/auth/github/callback?code=fake&state=fake",
    ),
  );
  assert.equal(callback.status, 400);
  const invalid = await GET(
    new NextRequest(
      "http://localhost:3000/api/auth/github/cli?redirect_uri=https://evil.test/callback",
    ),
  );
  assert.equal(invalid.status, 400);
});
