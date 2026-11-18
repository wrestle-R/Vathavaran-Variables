import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { variableNames, searchVariables, type FileMetadata } from '../../shared/env-search';
const fixtures = JSON.parse(readFileSync(new URL('../../fixtures/env-search.json', import.meta.url), 'utf8'));
for (const fixture of fixtures) test(`parser: ${fixture.name}`, () => {
  if (fixture.error) assert.throws(() => variableNames(fixture.text));
  else assert.deepEqual(variableNames(fixture.text), fixture.names);
});
const file = (id: string, envName = '.env', repoFullName = 'owner/repo'): FileMetadata => ({ id, repoFullName, directory: '', envName, updatedAt: `2026-01-0${id}T00:00:00Z`, createdAt: '', isEncrypted: true });
test('latest selection spans pages and keeps distinct filenames, repositories and history', async () => {
  const run = (history = false) => searchVariables({ query: 'grok', history }, {
    page: async cursor => cursor ? { files: [file('3'), file('4', '.env.prod'), file('5', '.env', 'team/other')], nextCursor: null } : { files: [file('1')], nextCursor: 'next' },
    plaintext: async f => f.id === '3' ? 'OTHER=secret' : 'GROK_API_KEY=never-display-this', signal: new AbortController().signal,
  });
  const current = await run();
  assert.deepEqual(current.matches.map(m => m.id), ['5', '4']);
  assert.equal(current.eligible, 3);
  assert.ok(!JSON.stringify(current).includes('never-display-this'));
  const history = await run(true);
  assert.equal(history.matches.find(m => m.id === '1')?.historical, true);
});
test('exact matching, root filtering, legacy files, partial scans and safe errors', async () => {
  const result = await searchVariables({ query: 'GROK', exact: true, directory: '' }, {
    page: async () => ({ files: [file('1'), file('2', '.env.prod'), { ...file('3', '.env.dev'), directory: 'backend' }], nextCursor: null }),
    plaintext: async f => { if (f.id === '2') throw new Error('PRIVATE=must-not-leak'); return 'GROK=hidden\nGROK_API_KEY=hidden'; }, signal: new AbortController().signal,
  });
  assert.equal(result.status, 'partial');
  assert.deepEqual(result.matches[0].names, ['GROK']);
  assert.equal(result.eligible, 2);
  assert.ok(!JSON.stringify(result).includes('must-not-leak'));
});
test('failed discovery never searches an incomplete set; cancellation drops in-flight matches', async () => {
  let decrypted = false;
  const partial = await searchVariables({ query: 'KEY' }, {
    page: async cursor => { if (cursor) throw new Error('offline'); return { files: [file('1')], nextCursor: 'next' }; },
    plaintext: async () => { decrypted = true; return ''; }, signal: new AbortController().signal,
  });
  assert.equal(partial.status, 'partial'); assert.equal(decrypted, false);
  const controller = new AbortController();
  const cancelled = await searchVariables({ query: 'KEY' }, {
    page: async () => ({ files: [file('1')], nextCursor: null }),
    plaintext: async () => { controller.abort(); return 'KEY=secret'; }, signal: controller.signal,
  });
  assert.equal(cancelled.status, 'cancelled'); assert.deepEqual(cancelled.matches, []);
});

test('client decryption distinguishes an empty saved file from a damaged short record', async () => {
  const { decrypt } = await import('../lib/client');
  const { default: CryptoJS } = await import('crypto-js');
  const encryptionKey = 'synthetic-test-key';
  const loadKey = async () => ({ encryptionKey });
  const record = {
    id: 'empty',
    repoFullName: 'test/repo',
    repoName: 'repo',
    userId: 1,
    userName: 'tester',
    directory: '',
    envName: '.env',
    createdAt: '',
    updatedAt: '',
    isEncrypted: true,
    content: CryptoJS.AES.encrypt('', encryptionKey).toString(),
  };
  assert.equal(await decrypt(record, loadKey), '');
  const zeroBlock = CryptoJS.lib.WordArray.create([0, 0, 0, 0], 16);
  const malformed = CryptoJS.AES.encrypt(zeroBlock, encryptionKey, { padding: CryptoJS.pad.NoPadding });
  await assert.rejects(decrypt({ ...record, content: malformed.toString() }, loadKey), /Could not decrypt/);
});
