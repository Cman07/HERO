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

test('Google identities use stable subjects, link explicitly, and cannot take over another profile', async () => {
  const store = createAccountDatabase(':memory:');
  try {
    const local = await store.register(credentials);
    const owner = store.userForSession(local.token).profileToken;
    const google = { sub: 'google-subject-a', email: 'resident@example.test' };
    const linked = store.googleSignIn(google, owner);
    assert.equal(store.userForSession(linked.token).profileToken, owner);
    assert.equal(store.googleDetails(owner), google.email);
    const returning = store.googleSignIn({ ...google, email: 'changed@example.test' });
    assert.equal(store.userForSession(returning.token).profileToken, owner);
    assert.equal(store.userForSession((await store.login(credentials)).token).profileToken, owner);
    const separate = store.googleSignIn({ sub: 'google-subject-b', email: 'changed@example.test' });
    const otherOwner = store.userForSession(separate.token).profileToken;
    assert.notEqual(otherOwner, owner, 'Matching emails never merge accounts');
    assert.throws(() => store.googleSignIn(google, otherOwner), /another HERO account/);
    assert.throws(() => store.googleSignIn({ sub: 'third', email: 'third@example.test' }, owner), /different Google account/);
    const nonce = store.googleChallenge(owner);
    store.consumeGoogleChallenge(nonce, owner);
    assert.throws(() => store.consumeGoogleChallenge(nonce, owner), /expired/);
    assert.throws(() => store.consumeGoogleChallenge(store.googleChallenge(owner), otherOwner), /changed/);
  } finally { store.close(); }
});

test('existing account schema migrates without changing credentials or profile owners', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const directory = mkdtempSync(join(tmpdir(), 'hero-google-migrate-'));
  const path = join(directory, 'accounts.sqlite');
  let store;
  try {
    const old = new DatabaseSync(path);
    old.exec('CREATE TABLE accounts (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, salt BLOB NOT NULL, password_hash BLOB NOT NULL, profile_token TEXT NOT NULL UNIQUE) STRICT');
    old.close();
    store = createAccountDatabase(path);
    const session = await store.register(credentials);
    const owner = store.userForSession(session.token).profileToken;
    store.googleSignIn({ sub: 'migrate-google', email: 'test@example.test' }, owner);
    store.close(); store = createAccountDatabase(path);
    assert.equal(store.userForSession((await store.login(credentials)).token).profileToken, owner);
    assert.equal(store.userForSession(store.googleSignIn({ sub: 'migrate-google', email: 'test@example.test' }).token).profileToken, owner);
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});
