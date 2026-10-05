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
          full_name: "owner/repo",
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
