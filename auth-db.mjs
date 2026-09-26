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
      database.prepare('INSERT INTO accounts VALUES (?, ?, ?, ?, ?)').run(user.id, username, salt, passwordHash, randomBytes(32).toString('hex'));
      return startSession(user);
    },
    async login(input) {
      const { username, password } = credentials(input);
      const user = database.prepare('SELECT * FROM accounts WHERE username = ?').get(username);
      // Unknown usernames still perform the same password derivation.
      const actual = await derive(password, user ? Buffer.from(user.salt) : Buffer.alloc(16), 64, parameters);
      const expected = user ? Buffer.from(user.password_hash) : Buffer.alloc(64);
      if (!timingSafeEqual(actual, expected) || !user) throw new AccountError('The username or password is incorrect.', 401);
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
    logout(token) { if (validToken(token)) database.prepare('DELETE FROM account_sessions WHERE token_hash = ?').run(hash(token)); },
    close() { database.close(); }
  };
}
export function openAccountDatabase(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  return createAccountDatabase(join(directory, 'accounts.sqlite'));
}
