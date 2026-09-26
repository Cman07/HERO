import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAccountDatabase } from './auth-db.mjs';

const credentials = { username: 'test-resident', password: 'test-only-long-passphrase' };
test('accounts and sessions persist, passwords are hashed, and signing in again restores the same profile owner', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'hero-account-test-'));
  const path = join(directory, 'accounts.sqlite');
  let store;
  try {
    store = createAccountDatabase(path);
    const registered = await store.register(credentials);
    const owner = store.userForSession(registered.token).profileToken;
    assert.deepEqual(registered.user, { username: credentials.username });
    assert.equal(store.userForSession('not-a-session'), null);
    await assert.rejects(store.register({ ...credentials, username: 'TEST-RESIDENT' }), /already in use/);
    await assert.rejects(store.login({ ...credentials, password: 'a-wrong-long-passphrase' }), /incorrect/);
    await assert.rejects(store.login({ ...credentials, username: 'unknown-resident' }), /incorrect/);
    store.close(); store = createAccountDatabase(path);
    assert.equal(store.userForSession(registered.token).profileToken, owner);
    store.logout(registered.token);
    assert.equal(store.userForSession(registered.token), null);
    const signedIn = await store.login(credentials);
    assert.notEqual(signedIn.token, registered.token);
    assert.equal(store.userForSession(signedIn.token).profileToken, owner);
    const bytes = readFileSync(path);
    assert.equal(bytes.includes(Buffer.from(credentials.password)), false);
    assert.equal(bytes.includes(Buffer.from(signedIn.token)), false);
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('sessions expire after inactivity and credential validation rejects invalid input', async () => {
  let time = 1000;
  const store = createAccountDatabase(':memory:', { now: () => time });
  try {
    for (const input of [null, { ...credentials, username: '../someone' }, { ...credentials, password: 'short' }]) await assert.rejects(store.register(input));
    const session = await store.register(credentials);
    time += 30 * 60 * 1000 + 1;
    assert.equal(store.userForSession(session.token), null);
  } finally { store.close(); }
});
