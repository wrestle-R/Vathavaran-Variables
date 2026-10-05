import test from "node:test";
import assert from "node:assert/strict";
import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { firebasePrivateKey } from "../lib/server";

const pem = generateKeyPairSync("rsa", { modulusLength: 2048 })
  .privateKey.export({ type: "pkcs8", format: "pem" })
  .toString();
const expected = createPrivateKey(pem).export({ type: "pkcs8", format: "pem" });

test("Firebase credentials work across multiline, dashboard and dotenv import formats", () => {
  for (const value of [
    pem,
    pem.replace(/\n/g, "\r\n"),
    pem.replace(/\n/g, "\\n"),
    pem.replace(/\n/g, "\\\\n"),
    pem.replace(/\n/g, "\\\n"),
    pem.replace(/\n/g, "\\r\\n"),
    '"' + pem.replace(/\n/g, "\\n") + '"',
    "'" + pem + "'",
  ]) {
    const restored = createPrivateKey(firebasePrivateKey(value)).export({
      type: "pkcs8",
      format: "pem",
    });
    assert.deepEqual(restored, expected);
  }
});

test("invalid Firebase credentials return a useful configuration error without the key", () => {
  const badKey = "incomplete-secret-key";
  assert.throws(
    () => firebasePrivateKey(badKey),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /FIREBASE_PRIVATE_KEY/);
      assert.ok(!error.message.includes(badKey));
      assert.equal((error as Error & { status: number }).status, 503);
      return true;
    },
  );
});
