import test from "node:test";
import assert from "node:assert/strict";
import { groupFilesByDirectory } from "../lib/env-files";
import type { EnvFile } from "../lib/contracts";

test("latest uploads are grouped by directory across different filenames without losing history", () => {
  const files = [
    { id: "old", directory: "Next", envName: ".env.local", updatedAt: "2026-10-05T15:00:00+05:30" },
    { id: "new", directory: "Next", envName: ".env.vercel", updatedAt: "2026-10-05T10:00:00Z" },
    { id: "root", directory: "", updatedAt: "invalid" },
    { id: "server", directory: "server", updatedAt: "2025-12-01T00:00:00Z" },
  ] as EnvFile[];
  const original = [...files];
  const groups = groupFilesByDirectory(files);
  assert.equal(groups.length, 3);
  assert.equal(groups[1].latest.id, "new");
  assert.deepEqual(groups[1].history.map(file => file.id), ["old"]);
  assert.equal(groups[0].latest.id, "root");
  assert.deepEqual(files, original);
});
