import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { NextRequest } from "next/server";
import { database } from "../lib/server";
import { GET, POST } from "../app/api/[...path]/route";

// Isolated credentials and mocked database: these tests never touch production.
process.env.FIREBASE_PROJECT_ID = "vathavaran-test-only";
process.env.FIREBASE_CLIENT_EMAIL =
  "test@vathavaran-test-only.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = generateKeyPairSync("rsa", {
  modulusLength: 2048,
})
  .privateKey.export({ type: "pkcs8", format: "pem" })
  .toString();
const db = database();
const ciphertext = "U2FsdGVkX18BAgMEBQYHCAAxGJheQoTmJI3rE4SY9tA=";
const document = {
  userId: 7,
  userName: "collaborator",
  repoFullName: "owner/repo",
  repoName: "repo",
  directory: "backend",
  envName: ".env.production",
  content: ciphertext,
  isEncrypted: true,
  createdAt: "2025-12-01T00:00:00.000Z",
  updatedAt: "2025-12-01T00:00:00.000Z",
};
function request(path: string, payload?: object) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: payload ? "POST" : "GET",
    headers: {
      authorization: "Bearer fixture-token",
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
}
function githubFixture(write: boolean, read = true) {
  return mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request) => {
      const path = new URL(
        typeof input === "string" || input instanceof URL ? input : input.url,
      ).pathname;
      if (path === "/user")
        return Response.json({ id: 10, login: "signed-in-user" });
      if (path === "/repos/owner/repo")
        return Response.json({
          id: 1,
          full_name: "owner/repo",
          private: true,
          permissions: { push: write, pull: read },
        });
      throw new Error(`Unexpected external request: ${path}`);
    },
  );
}
test("pull preserves legacy ciphertext and collaborator attribution while filtering directories", async () => {
  const fetchMock = githubFixture(false);
  const collectionMock = mock.method(
    db,
    "collection",
    () =>
      ({
        where: () => ({
          get: async () => ({
            docs: [{ id: "legacy-id", data: () => document }],
          }),
        }),
      }) as never,
  );
  try {
    const result = await POST(
      request("/api/env/pull", {
        repoFullName: "owner/repo",
        directory: "backend",
      }),
    );
    assert.equal(result.status, 200);
    assert.deepEqual((await result.json()).envFiles, [
      { ...document, id: "legacy-id" },
    ]);
    const root = await POST(
      request("/api/env/pull", { repoFullName: "owner/repo", directory: "" }),
    );
    assert.deepEqual((await root.json()).envFiles, []);
  } finally {
    fetchMock.mock.restore();
    collectionMock.mock.restore();
  }
});
test("push appends a document and ignores forged user attribution", async () => {
  const fetchMock = githubFixture(true);
  let saved: Record<string, unknown> | null = null;
  const collectionMock = mock.method(
    db,
    "collection",
    () =>
      ({
        add: async (entry: Record<string, unknown>) => {
          saved = entry;
          return { id: "new-version" };
        },
      }) as never,
  );
  try {
    const result = await POST(
      request("/api/env/push", {
        ...document,
        userId: 999,
        userName: "forged",
      }),
    );
    assert.equal(result.status, 201);
    assert.equal((await result.json()).id, "new-version");
    assert.equal(saved!["userId"], 10);
    assert.equal(saved!["userName"], "signed-in-user");
    assert.equal(saved!["content"], ciphertext);
    assert.equal(saved!["isEncrypted"], true);
  } finally {
    fetchMock.mock.restore();
    collectionMock.mock.restore();
  }
});
test("read and write permission failures never reach Firestore", async () => {
  const fetchMock = githubFixture(false, false);
  const collectionMock = mock.method(db, "collection", () => {
    throw new Error("Unauthorized database access");
  });
  try {
    const read = await POST(
      request("/api/env/list", { repoFullName: "owner/repo" }),
    );
    assert.equal(read.status, 403);
    const write = await POST(request("/api/env/push", document));
    assert.equal(write.status, 403);
    assert.equal(collectionMock.mock.callCount(), 0);
  } finally {
    fetchMock.mock.restore();
    collectionMock.mock.restore();
  }
});
test("invalid upload and repository path input fail before database access", async () => {
  const fetchMock = githubFixture(true);
  const collectionMock = mock.method(db, "collection", () => {
    throw new Error("Invalid database access");
  });
  try {
    for (const payload of [
      { ...document, content: "KEY=plaintext" },
      { ...document, repoFullName: "../repo" },
      { ...document, envName: "" },
    ]) {
      const result = await POST(request("/api/env/push", payload));
      assert.equal(result.status, 400);
    }
    const get = await GET(
      request("/api/env/list?repoFullName=owner%2Frepo%2Fother"),
    );
    assert.equal(get.status, 400);
    assert.equal(collectionMock.mock.callCount(), 0);
  } finally {
    fetchMock.mock.restore();
    collectionMock.mock.restore();
  }
});

test("repository discovery includes authorized saved repositories and preserves renamed storage paths", async () => {
  const requested: string[] = [];
  const fetchMock = mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" || input instanceof URL ? input : input.url).pathname;
    requested.push(path);
    if (path === "/user") return Response.json({ id: 10, login: "signed-in-user" });
    if (path === "/user/repos") return Response.json([{ full_name: "owner/repo" }]);
    if (path === "/repos/org/shared") return Response.json({ id: 2, full_name: "org/shared", private: true, permissions: { pull: true } });
    if (path === "/repos/owner/old-name") return Response.json({ id: 1, full_name: "owner/repo", private: true, permissions: { pull: true } });
    if (path === "/repos/revoked/project") return Response.json({}, { status: 404 });
    throw new Error(`Unexpected external request: ${path}`);
  });
  const legacy = { ...document, repoFullName: "owner/old-name" };
  const savedNames = ["org/shared", "org/shared", "owner/old-name", "revoked/project", "../invalid"];
  const collectionMock = mock.method(db, "collection", () => ({
    where: (field: string, operator: string, value: unknown) => {
      if (field === "userId") {
        assert.equal(operator, "==");
        assert.equal(value, 10);
        return { select: (selection: string) => {
          assert.equal(selection, "repoFullName");
          return { get: async () => ({ docs: savedNames.map(repoFullName => ({ data: () => ({ repoFullName }) })) }) };
        } };
      }
      assert.equal(field, "repoFullName");
      assert.equal(operator, "in");
      assert.deepEqual(value, ["owner/repo", "owner/old-name", "org/shared"]);
      return { get: async () => ({ docs: [{ id: "renamed-legacy-id", data: () => legacy }] }) };
    },
  }) as never);
  try {
    const response = await GET(request("/api/repositories"));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [
      { full_name: "owner/repo", storageNames: ["owner/old-name"] },
      { id: 2, full_name: "org/shared", private: true, permissions: { pull: true } },
    ]);
    assert.equal(requested.filter(path => path === "/repos/org/shared").length, 1);
    const list = await POST(request("/api/env/list", {}));
    assert.equal(list.status, 200);
    assert.deepEqual((await list.json()).envFiles, [{ ...legacy, id: "renamed-legacy-id" }]);
  } finally {
    fetchMock.mock.restore();
    collectionMock.mock.restore();
  }
});

test("public repository visibility alone never exposes environment files", async () => {
  let member = false;
  const repo = { id: 99, full_name: "owner/public", private: false, permissions: { pull: true, push: false } };
  const fetchMock = mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" || input instanceof URL ? input : input.url).pathname;
    if (path === "/user") return Response.json({ id: 10, login: "signed-in-user" });
    if (path === "/repos/owner/public") return Response.json(repo);
    if (path === "/user/repos") return Response.json(member ? [repo] : []);
    throw new Error(`Unexpected external request: ${path}`);
  });
  const collectionMock = mock.method(db, "collection", () => ({
    where: () => ({ get: async () => ({ docs: [] }) }),
  }) as never);
  try {
    const denied = await POST(request("/api/env/list", { repoFullName: "owner/public" }));
    assert.equal(denied.status, 403);
    assert.equal(collectionMock.mock.callCount(), 0);
    member = true;
    const allowed = await POST(request("/api/env/list", { repoFullName: "owner/public" }));
    assert.equal(allowed.status, 200);
    assert.equal(collectionMock.mock.callCount(), 1);
  } finally {
    fetchMock.mock.restore();
    collectionMock.mock.restore();
  }
});

test("workspace authenticates and discovers repositories once, returning counts without file contents", async () => {
  const paths: string[] = [];
  const fetchMock = mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    paths.push(url.pathname);
    if (url.pathname === "/user") return Response.json({ id: 10, login: "signed-in-user" });
    if (url.pathname === "/user/repos") return Response.json([{ id: 1, full_name: "owner/repo" }]);
    throw new Error("Unexpected request");
  });
  const fields: string[][] = [];
  const collectionMock = mock.method(db, "collection", () => ({
    where: (_field: string, operation: string) => ({
      select: (...selected: string[]) => {
        fields.push(selected);
        return { get: async () => ({ docs: operation === "in" ? [{ data: () => ({ repoFullName: "owner/repo" }) }] : [] }) };
      },
    }),
  }) as never);
  try {
    const response = await GET(request("/api/workspace"));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.counts, { "owner/repo": 1 });
    assert.equal(result.envFiles, undefined);
    assert.deepEqual(paths, ["/user", "/user/repos"]);
    assert.deepEqual(fields, [["repoFullName"], ["repoFullName"]]);
  } finally {
    fetchMock.mock.restore();
    collectionMock.mock.restore();
  }
});

test('search discovery paginates metadata only across repositories, aliases, and bound cursors', async () => {
  process.env.SESSION_SECRET = 'search-test-session-secret-at-least-32-characters';
  let userId = 10;
  const fetchMock = mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const path = new URL(typeof input === 'string' || input instanceof URL ? input : input.url).pathname;
    if (path === '/user') return Response.json({ id: userId, login: 'reader' });
    if (path === '/user/repos') return Response.json([{ id: 1, full_name: 'owner/repo' }, { id: 2, full_name: 'team/other' }]);
    if (path === '/repos/owner/old') return Response.json({ id: 1, full_name: 'owner/repo', private: true, permissions: { pull: true } });
    throw new Error(`Unexpected request ${path}`);
  });
  const records = Array.from({ length: 102 }, (_, i) => ({ ...document, id: `A${String(i).padStart(3, '0')}`, repoFullName: i === 0 ? 'owner/old' : 'owner/repo' }));
  const other = { ...document, id: 'B000', repoFullName: 'team/other' };
  const collectionMock = mock.method(db, 'collection', () => ({
    where: (field: string, _op: string, names: string[]) => {
      if (field === 'userId') return { select: () => ({ get: async () => ({ docs: [{ data: () => ({ repoFullName: 'owner/old' }) }] }) }) };
      let selected: string[] = [], after = '', limit = 0;
      const query = {
        select: (...fields: string[]) => { selected = fields; return query; },
        orderBy: () => query,
        limit: (value: number) => { limit = value; return query; },
        startAfter: (value: string) => { after = value; return query; },
        get: async () => {
          assert.ok(!selected.includes('content')); assert.equal(limit, 101);
          return { docs: [...records, other].filter(r => names.includes(r.repoFullName) && r.id > after).slice(0, limit).map(r => ({ id: r.id, data: () => Object.fromEntries(selected.map(key => [key, r[key as keyof typeof r]])) })) };
        },
      };
      return query;
    },
  }) as never);
  try {
    const page1 = await POST(request('/api/env/discover', {}));
    assert.equal(page1.status, 200); assert.equal(page1.headers.get('cache-control'), 'no-store');
    const first = await page1.json(); assert.equal(first.files.length, 100);
    assert.equal(first.files[0].repoFullName, 'owner/repo');
    assert.ok(!JSON.stringify(first).includes(ciphertext)); assert.equal(first.files[0].content, undefined);
    const page2 = await POST(request('/api/env/discover', { cursor: first.nextCursor }));
    const second = await page2.json(); assert.equal(second.files.length, 2);
    const page3 = await POST(request('/api/env/discover', { cursor: second.nextCursor }));
    const third = await page3.json(); assert.deepEqual(third.files.map((f: { id: string }) => f.id), ['B000']); assert.equal(third.nextCursor, null);
    assert.equal((await POST(request('/api/env/discover', { cursor: first.nextCursor, directory: 'other' }))).status, 400);
    assert.equal((await POST(request('/api/env/discover', { cursor: first.nextCursor + 'tampered' }))).status, 400);
    userId = 11;
    assert.equal((await POST(request('/api/env/discover', { cursor: first.nextCursor }))).status, 400);
  } finally { fetchMock.mock.restore(); collectionMock.mock.restore(); }
});

test('exact saved-record retrieval preserves the ID and rechecks repository access', async () => {
  let read = true, exists = true;
  const fetchMock = mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const path = new URL(typeof input === 'string' || input instanceof URL ? input : input.url).pathname;
    if (path === '/user') return Response.json({ id: 10, login: 'reader' });
    if (path === '/repos/owner/repo') return Response.json({ id: 1, full_name: 'owner/repo', private: true, permissions: { pull: read } });
    throw new Error(`Unexpected ${path}`);
  });
  const collectionMock = mock.method(db, 'collection', () => ({ doc: (id: string) => {
    assert.equal(id, 'exact-id'); return { get: async () => ({ exists, id, data: () => document }) };
  } }) as never);
  try {
    const allowed = await POST(request('/api/env/record', { id: 'exact-id' }));
    assert.equal(allowed.status, 200); assert.equal((await allowed.json()).file.id, 'exact-id');
    read = false;
    const denied = await POST(request('/api/env/record', { id: 'exact-id' }));
    assert.equal(denied.status, 404); const message = await denied.json();
    assert.ok(!JSON.stringify(message).includes('owner/repo')); assert.ok(!JSON.stringify(message).includes(ciphertext));
    exists = false;
    assert.deepEqual(await (await POST(request('/api/env/record', { id: 'exact-id' }))).json(), message);
    assert.equal((await POST(request('/api/env/record', { id: '../bad' }))).status, 400);
  } finally { fetchMock.mock.restore(); collectionMock.mock.restore(); }
});
