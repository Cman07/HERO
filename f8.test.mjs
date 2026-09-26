import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { translate, spanish } = require('./language.cjs');
const profile = require('./profile.cjs');
const preparation = require('./preparedness.cjs');

test('Spanish covers safety gates, profile questions, all preparedness tasks and canonical choices without changing values', () => {
  for (const text of ['Call 911', "I'm not sure", 'Are you in immediate danger or seriously injured?', 'Prefer not to say', 'Continue',
    ...profile.profileQuestions.map(q => q.label), ...preparation.getChecklist(Object.fromEntries(profile.profileQuestions.map(q => [q.key, 'yes']))).flatMap(t => [t.title, t.detail, t.source.name])]) {
    assert.ok(Object.hasOwn(spanish, text), text);
    assert.ok(spanish[text].length > 0);
  }
  assert.match(translate('Call 911', 'es'), /911/);
  assert.equal(translate('Fairfax County', 'es'), 'Fairfax County');
  assert.equal(translate('yes', 'es'), 'yes');
  assert.equal(translate('private@example.test', 'es'), 'private@example.test');
  assert.equal(translate('Arbitrary resident message', 'es'), 'Arbitrary resident message');
  assert.equal(translate('Call 911', 'en'), 'Call 911');
  assert.equal(translate('Signed in as test_user', 'es'), 'Sesión iniciada como test_user');
  assert.match(translate('Declaration status unknown for Fairfax County. FEMA data could not be checked. You can still use the official assistance resources above.', 'es'), /desconoce.*Fairfax County/);
});

test('Spanish checklist export preserves completion and every official source URL', () => {
  const original = preparation.checklistText(null, ['alerts']);
  const translated = original.split('\n').map(line => translate(line, 'es')).join('\n');
  assert.match(translated, /\[x\] Elija/);
  assert.match(translated, /911/);
  for (const task of preparation.getChecklist(null)) assert.ok(translated.includes(task.source.url));
});

test('public pages expose no-JavaScript resources and language settings, and emergency continue cannot bypass the gate', async () => {
  for (const name of ['index.html', 'plan.html', 'account.html']) {
    const html = await readFile(new URL(name, import.meta.url), 'utf8');
    assert.match(html, /<noscript>[\s\S]*https:\/\/www.disasterassistance.gov\//);
    assert.match(html, /id="language-choice"/);
    assert.doesNotMatch(html, /save-data|Save data|About language and data/);
    assert.match(html, /<main tabindex="-1"/);
    assert.doesNotMatch(html, /rel="preload"/);
  }
  const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
  const emergency = html.split('id="emergency-step"')[1].split('id="location-step"')[0];
  assert.match(emergency, /data-restart/); assert.doesNotMatch(emergency, /data-back/);
});

test('offline cache contains only public shells; APIs, posts and third parties never enter it', async () => {
  const code = await readFile(new URL('sw.js', import.meta.url), 'utf8');
  const handlers = {}; const cached = []; const notices = []; let requests = 0;
  const cache = { addAll: paths => { cached.push(...paths); return Promise.resolve(); } };
  const caches = { open: async () => cache, keys: async () => [], match: async path => new Response('cached ' + path) };
  const context = vm.createContext({ URL, Response, AbortSignal, Promise, caches,
    fetch: async () => { requests++; throw new TypeError('offline'); },
    self: { location: { origin: 'https://hero.test' }, clients: { claim: async () => {}, get: async () => ({ postMessage: message => notices.push(message) }) }, addEventListener: (name, fn) => { handlers[name] = fn; } } });
  vm.runInContext(code, context);
  let install; handlers.install({ waitUntil: value => { install = value; } }); await install;
  assert.ok(cached.includes('/index.html')); assert.ok(cached.includes('/language.cjs'));
  assert.ok(cached.every(path => !/api|account|data|font|community/.test(path)));
  for (const [url, method] of [['https://hero.test/api/profile', 'GET'], ['https://hero.test/api/chat', 'POST'], ['https://outside.test/index.html', 'GET']]) {
    let intercepted = false;
    handlers.fetch({ request: { url, method }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false);
  }
  assert.equal(requests, 0);
  let result; let background; handlers.fetch({ request: { url: 'https://hero.test/index.html', method: 'GET' }, clientId: 'test-client', waitUntil: promise => { background = promise; }, respondWith: promise => { result = promise; } });
  assert.equal(await (await result).text(), 'cached /index.html'); await background;
  assert.equal(requests, 1);
  assert.equal(notices[0].fallback, true);
  handlers.message({ data: { type: 'hero-public-status' }, source: { id: 'test-client', postMessage: message => notices.push(message) } });
  assert.equal(notices[1].fallback, true);
  let account; handlers.fetch({ request: { url: 'https://hero.test/account.html', method: 'GET', mode: 'navigate' }, respondWith: promise => { account = promise; } });
  assert.equal(await (await account).text(), 'cached /offline.html');
});
