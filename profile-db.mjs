import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import schema from './profile.cjs';
import localities from './localities.cjs';

export function createProfileDatabase(filename, key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('Profile encryption needs a 32-byte key.');
  const database = new DatabaseSync(filename);
  database.exec('CREATE TABLE IF NOT EXISTS household_profiles (owner TEXT PRIMARY KEY, payload TEXT NOT NULL) STRICT');
  if (filename !== ':memory:') chmodSync(filename, 0o600);
  const ownerHash = token => createHash('sha256').update(token).digest('hex');
  const validToken = token => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
  return {
    get(token) {
      if (!validToken(token)) return null;
      const owner = ownerHash(token);
      const row = database.prepare('SELECT payload FROM household_profiles WHERE owner = ?').get(owner);
      if (!row) return null;
      const packed = Buffer.from(row.payload, 'base64');
      const decipher = createDecipheriv('aes-256-gcm', key, packed.subarray(0, 12));
      decipher.setAAD(Buffer.from(owner));
      decipher.setAuthTag(packed.subarray(12, 28));
      const value = JSON.parse(Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8'));
      return { ...schema.normalizeProfile(value, localities), updatedAt: value.updatedAt };
    },
    save(token, input) {
      if (!validToken(token)) throw new Error('Invalid profile session.');
      const value = { ...schema.normalizeProfile(input, localities), updatedAt: new Date().toISOString() };
      const owner = ownerHash(token);
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(owner));
      const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
      const payload = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
      database.prepare('INSERT INTO household_profiles (owner, payload) VALUES (?, ?) ON CONFLICT(owner) DO UPDATE SET payload = excluded.payload').run(owner, payload);
      return value;
    },
    remove(token) {
      if (validToken(token)) database.prepare('DELETE FROM household_profiles WHERE owner = ?').run(ownerHash(token));
    },
    close() { database.close(); }
  };
}

export function openProfileDatabase(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const keyPath = join(directory, 'profile.key');
  const databasePath = join(directory, 'profiles.sqlite');
  if (existsSync(databasePath) && !existsSync(keyPath)) throw new Error('Profile encryption key is missing. Restore profile.key before opening the database.');
  try { writeFileSync(keyPath, randomBytes(32), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  chmodSync(keyPath, 0o600);
  return createProfileDatabase(databasePath, readFileSync(keyPath));
}
