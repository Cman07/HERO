import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

const derive = promisify(scrypt);
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const idleLifetime = 30 * 60 * 1000;
const hash = token => createHash('sha256').update(token).digest('hex');
const validToken = token => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
const parameters = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export class AccountError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function credentials(input) {
  const username = typeof input?.username === 'string' ? input.username.trim().toLowerCase() : '';
  const password = input?.password;
  if (!/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(username)) throw new AccountError('Use a username with 3–32 letters, numbers, dots, underscores, or hyphens.');
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new AccountError('Use a password with 12–128 characters.');
  return { username, password };
}

export function createAccountDatabase(filename, { now = Date.now } = {}) {
  const database = new DatabaseSync(filename);
  database.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE,
      salt BLOB NOT NULL, password_hash BLOB NOT NULL,
      profile_token TEXT NOT NULL UNIQUE
    ) STRICT;
    CREATE TABLE IF NOT EXISTS account_sessions (
      token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL, last_seen INTEGER NOT NULL
    ) STRICT;`);
  if (!database.prepare('PRAGMA table_info(accounts)').all().some(column => column.name === 'password_enabled')) {
    database.exec('ALTER TABLE accounts ADD COLUMN password_enabled INTEGER NOT NULL DEFAULT 1');
  }
  database.exec(`CREATE TABLE IF NOT EXISTS google_identities (
    subject TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id), email TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS google_challenges (
    nonce_hash TEXT PRIMARY KEY, owner TEXT, expires_at INTEGER NOT NULL
  ) STRICT;`);
  if (filename !== ':memory:') chmodSync(filename, 0o600);
  function startSession(user) {
    const token = randomBytes(32).toString('hex');
    const time = now();
    database.prepare('DELETE FROM account_sessions WHERE expires_at <= ? OR last_seen <= ?').run(time, time - idleLifetime);
    database.prepare('INSERT INTO account_sessions VALUES (?, ?, ?, ?)').run(hash(token), user.id, time + sessionLifetime, time);
    return { token, user: { username: user.username } };
  }
  return {
    async register(input) {
      const { username, password } = credentials(input);
      const salt = randomBytes(16);
      const passwordHash = await derive(password, salt, 64, parameters);
      if (database.prepare('SELECT id FROM accounts WHERE username = ?').get(username)) throw new AccountError('That username is already in use. Choose another or sign in.', 409);
      const user = { id: randomBytes(16).toString('hex'), username };
      database.prepare('INSERT INTO accounts (id, username, salt, password_hash, profile_token) VALUES (?, ?, ?, ?, ?)').run(user.id, username, salt, passwordHash, randomBytes(32).toString('hex'));
      return startSession(user);
    },
    async login(input) {
      const { username, password } = credentials(input);
      const user = database.prepare('SELECT * FROM accounts WHERE username = ?').get(username);
      // Unknown usernames still perform the same password derivation.
      const actual = await derive(password, user ? Buffer.from(user.salt) : Buffer.alloc(16), 64, parameters);
      const expected = user ? Buffer.from(user.password_hash) : Buffer.alloc(64);
      if (!timingSafeEqual(actual, expected) || !user?.password_enabled) throw new AccountError('The username or password is incorrect.', 401);
      return startSession(user);
    },
    userForSession(token) {
      if (!validToken(token)) return null;
      const tokenHash = hash(token);
      const time = now();
      const row = database.prepare(`SELECT a.username, a.profile_token AS profileToken, s.expires_at AS expiresAt, s.last_seen AS lastSeen
        FROM account_sessions s JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ?`).get(tokenHash);
      if (!row) return null;
      if (row.expiresAt <= time || row.lastSeen <= time - idleLifetime) {
        database.prepare('DELETE FROM account_sessions WHERE token_hash = ?').run(tokenHash);
        return null;
      }
      database.prepare('UPDATE account_sessions SET last_seen = ? WHERE token_hash = ?').run(time, tokenHash);
      return { username: row.username, profileToken: row.profileToken };
    },
    googleDetails(owner) {
      return database.prepare('SELECT g.email FROM google_identities g JOIN accounts a ON a.id = g.account_id WHERE a.profile_token = ?').get(owner)?.email || null;
    },
    googleChallenge(owner = null) {
      const nonce = randomBytes(32).toString('hex');
      database.prepare('DELETE FROM google_challenges WHERE expires_at <= ?').run(now());
      database.prepare('INSERT INTO google_challenges VALUES (?, ?, ?)').run(hash(nonce), owner, now() + 600_000);
      return nonce;
    },
    consumeGoogleChallenge(nonce, owner = null) {
      if (!validToken(nonce)) throw new AccountError('Reload the account page and try Google again.', 403);
      const challenge = database.prepare('DELETE FROM google_challenges WHERE nonce_hash = ? RETURNING *').get(hash(nonce));
      if (!challenge || challenge.expires_at <= now() || challenge.owner !== owner) throw new AccountError('Your sign-in changed or expired. Reload the account page.', 403);
    },
    googleSignIn({ sub, email }, owner = null) {
      if (typeof sub !== 'string' || !sub || sub.length > 255 || typeof email !== 'string' || !email || email.length > 320) throw new AccountError('Google identity is invalid.', 401);
      const existing = database.prepare('SELECT a.* FROM google_identities g JOIN accounts a ON a.id = g.account_id WHERE g.subject = ?').get(sub);
      if (owner) {
        const account = database.prepare('SELECT * FROM accounts WHERE profile_token = ?').get(owner);
        if (!account) throw new AccountError('Sign in again before linking Google.', 401);
        if (existing && existing.id !== account.id) throw new AccountError('This Google account already belongs to another HERO account. Sign out to use it; profiles will not be merged.', 409);
        const linked = database.prepare('SELECT subject FROM google_identities WHERE account_id = ?').get(account.id);
        if (linked && linked.subject !== sub) throw new AccountError('A different Google account is already linked.', 409);
        database.prepare('INSERT INTO google_identities VALUES (?, ?, ?) ON CONFLICT(subject) DO UPDATE SET email = excluded.email').run(sub, account.id, email);
        return startSession(account);
      }
      if (existing) {
        database.prepare('UPDATE google_identities SET email = ? WHERE subject = ?').run(email, sub);
        return startSession(existing);
      }
      const account = { id: randomBytes(16).toString('hex'), username: 'google-' + randomBytes(8).toString('hex') };
      database.exec('BEGIN');
      try {
        database.prepare('INSERT INTO accounts VALUES (?, ?, ?, ?, ?, 0)').run(account.id, account.username, randomBytes(16), randomBytes(64), randomBytes(32).toString('hex'));
        database.prepare('INSERT INTO google_identities VALUES (?, ?, ?)').run(sub, account.id, email);
        database.exec('COMMIT');
      } catch (error) { database.exec('ROLLBACK'); throw error; }
      return startSession(account);
    },
    logout(token) { if (validToken(token)) database.prepare('DELETE FROM account_sessions WHERE token_hash = ?').run(hash(token)); },
    close() { database.close(); }
  };
}
export function openAccountDatabase(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  return createAccountDatabase(join(directory, 'accounts.sqlite'));
}
