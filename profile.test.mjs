import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import schema from './profile.cjs';
import localities from './localities.cjs';
import { openProfileDatabase, createProfileDatabase } from './profile-db.mjs';

export function exampleProfile(overrides = {}) {
  return { homeLocality: 'Albemarle County', householdSize: '3',
    ...Object.fromEntries(schema.profileQuestions.map(({ key }) => [key, 'yes'])), ...overrides };
}

test('validates profile choices and excludes arbitrary fields', () => {
  const value = schema.normalizeProfile(exampleProfile({ injected: 'private text' }), localities);
  assert.equal(value.injected, undefined);
  assert.equal(value.version, 2);
  for (const invalid of [{ homeLocality: 'Unknown' }, { householdSize: '100' }, { pregnant: 'maybe' }]) {
    assert.throws(() => schema.normalizeProfile(exampleProfile(invalid), localities));
  }
  assert.equal(schema.normalizeProfile(exampleProfile({ homeLocality: null, pregnant: 'unspecified' }), localities).homeLocality, null);
});

test('SQLite profiles persist across reopen, stay isolated, are encrypted, and can be deleted', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hero-profile-test-'));
  const token = randomBytes(32).toString('hex');
  const other = randomBytes(32).toString('hex');
  let store;
  try {
    store = openProfileDatabase(directory);
    store.save(token, exampleProfile({ completedTasks: ['power-backup'] }));
    store.save(other, exampleProfile({ homeLocality: 'Fairfax city', pregnant: 'no' }));
    store.close(); store = openProfileDatabase(directory);
    assert.equal(store.get(token).pregnant, 'yes');
    assert.deepEqual(store.get(token).completedTasks, ['power-backup']);
    assert.equal(store.get(other).homeLocality, 'Fairfax city');
    assert.equal(store.get('invalid'), null);
    const bytes = readFileSync(join(directory, 'profiles.sqlite'));
    for (const text of ['Albemarle County', 'pregnant', 'power-backup', token, 'Fairfax city']) assert.equal(bytes.includes(Buffer.from(text)), false, text);
    store.remove(token);
    assert.equal(store.get(token), null);
    assert.equal(store.get(other).pregnant, 'no');
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('encrypted payload cannot be read with a different key', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hero-key-test-'));
  const path = join(directory, 'test.sqlite');
  const token = randomBytes(32).toString('hex');
  let store;
  try {
    store = createProfileDatabase(path, randomBytes(32)); store.save(token, exampleProfile({ completedTasks: ['power-backup'] })); store.close();
    store = createProfileDatabase(path, randomBytes(32));
    assert.throws(() => store.get(token));
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});
