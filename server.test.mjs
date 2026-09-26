import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from './server.mjs';

const env = {
  AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com',
  AZURE_OPENAI_DEPLOYMENT: 'flood-chat',
  AZURE_OPENAI_API_KEY: 'test-key'
};
const validBody = {
  answers: { danger: 'no', locality: 'Albemarle County', need: 'A place to stay' },
  messages: [{ role: 'user', content: 'Please suggest a next step.' }]
};

async function withServer(options, callback) {
  const server = createAppServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('keeps official resources available when chat is not configured', async () => {
  await withServer({ env: {} }, async base => {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    const homePage = await page.text();
    assert.match(homePage, /DisasterAssistance.gov/);
    assert.match(homePage, /href="\.\/plan.html"/);
    assert.doesNotMatch(homePage, /id="profile-form"/);
    const plan = await fetch(`${base}/plan.html`);
    assert.equal(plan.status, 200);
    assert.match(await plan.text(), /id="profile-form"/);
    for (const asset of ['styles.css', 'app.js', 'plan.js', 'localities.cjs', 'referrals.cjs', 'profile.cjs']) {
      const response = await fetch(`${base}/${asset}`);
      assert.equal(response.status, 200, `${asset} should be served`);
      assert.match(response.headers.get('content-type'), /(?:javascript|css)/);
    }
    const chat = await fetch(`${base}/api/chat`, { method: 'POST' });
    assert.equal(chat.status, 503);
  });
});

test('passes questionnaire context and chat to Azure without exposing the key in the response', async () => {
  let call;
  await withServer({ env, fetchImpl: async (url, options) => {
    call = { url: String(url), options };
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Open the official assistance site.' } }] }), { status: 200 });
  } }, async base => {
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validBody)
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: 'Open the official assistance site.' });
  });
  assert.equal(call.url, 'https://example.openai.azure.com/openai/v1/chat/completions');
  assert.equal(call.options.headers['api-key'], 'test-key');
  const payload = JSON.parse(call.options.body);
  assert.equal(payload.model, 'flood-chat');
  assert.match(payload.messages[1].content, /Albemarle County/);
  assert.equal(payload.messages.at(-1).content, 'Please suggest a next step.');
});

test('does not send immediate-danger answers to the model', async () => {
  let called = false;
  await withServer({ env, fetchImpl: async () => { called = true; throw new Error('Should not be called'); } }, async base => {
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, answers: { ...validBody.answers, danger: 'yes' } })
    });
    assert.equal(response.status, 400);
  });
  assert.equal(called, false);
});

test('accepts only a selected Virginia county or independent city', async () => {
  let calls = 0;
  await withServer({ env, fetchImpl: async () => {
    calls++;
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Check the official site.' } }] }), { status: 200 });
  } }, async base => {
    const list = await fetch(`${base}/localities.cjs`);
    assert.equal(list.status, 200);
    assert.match(await list.text(), /Charlottesville city/);
    for (const locality of ['Charlottesville city', 'Albemarle County', 'Fairfax city']) {
      const response = await fetch(`${base}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, answers: { ...validBody.answers, locality } })
      });
      assert.equal(response.status, 200);
    }
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, answers: { ...validBody.answers, locality: 'Made Up County' } })
    });
    assert.equal(response.status, 400);
  });
  assert.equal(calls, 3);
});

test('profile endpoints isolate browsers, reject cross-origin writes, and exclude private fields from Azure', async () => {
  const { randomBytes } = await import('node:crypto');
  const { createProfileDatabase } = await import('./profile-db.mjs');
  const { default: schema } = await import('./profile.cjs');
  const store = createProfileDatabase(':memory:', randomBytes(32));
  const profile = { homeLocality: 'Fairfax city', householdSize: '4',
    ...Object.fromEntries(schema.profileQuestions.map(({ key }) => [key, 'yes'])) };
  const calls = [];
  try {
    await withServer({ env, profileStore: store, fetchImpl: async (url, options) => {
      calls.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Check the official resources.' } }] }));
    } }, async base => {
      const headers = { 'Content-Type': 'application/json', 'X-HERO-Profile': '1' };
      const save = async (body, extra = {}) => fetch(`${base}/api/profile`, { method: 'PUT', headers: { ...headers, ...extra }, body: JSON.stringify(body) });
      const read = async cookie => (await fetch(`${base}/api/profile`, { headers: cookie ? { Cookie: cookie } : {} })).json();
      assert.deepEqual(await read(), { profile: null });
      assert.equal((await save(profile, { Origin: 'https://unrelated.example' })).status, 403);
      assert.equal((await fetch(`${base}/api/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })).status, 403);
      const first = await save({ ...profile, id: 'someone-else', privateText: 'not part of the schema' });
      assert.equal(first.status, 200);
      assert.match(first.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
      const cookieA = first.headers.get('set-cookie').split(';')[0];
      const second = await save({ ...profile, homeLocality: 'Richmond city', pregnant: 'no' });
      const cookieB = second.headers.get('set-cookie').split(';')[0];
      assert.notEqual(cookieA, cookieB);
      assert.equal((await read(cookieA)).profile.homeLocality, 'Fairfax city');
      assert.equal((await read(cookieB)).profile.pregnant, 'no');
      assert.equal((await read(cookieA)).profile.privateText, undefined);
      assert.deepEqual(await read(), { profile: null });
      const chat = async (cookie, useProfile) => fetch(`${base}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify({ ...validBody, useProfile, profile: { homeLocality: 'INJECTED', pregnant: 'yes' } })
      });
      assert.equal((await chat(cookieA, true)).status, 200);
      assert.match(calls.at(-1).messages[1].content, /Albemarle County/);
      assert.match(calls.at(-1).messages[1].content, /Fairfax city/);
      assert.match(calls.at(-1).messages[1].content, /"householdSize":"4"/);
      for (const { key } of schema.profileQuestions) assert.equal(JSON.stringify(calls.at(-1)).includes(`"${key}"`), false, `${key} must remain local`);
      assert.doesNotMatch(JSON.stringify(calls.at(-1)), /INJECTED|someone-else|not part of the schema/);
      assert.equal((await chat(cookieB, true)).status, 200);
      assert.match(calls.at(-1).messages[1].content, /Richmond city/);
      assert.doesNotMatch(calls.at(-1).messages[1].content, /Fairfax city/);
      assert.equal((await chat(cookieA, false)).status, 200);
      assert.doesNotMatch(calls.at(-1).messages[1].content, /Saved household context|Fairfax city/);
      assert.equal((await chat(null, true)).status, 200);
      assert.doesNotMatch(calls.at(-1).messages[1].content, /Saved household context/);
      const updated = await save({ ...profile, children: 'unspecified' }, { Cookie: cookieA });
      assert.equal(updated.status, 200);
      assert.equal((await read(cookieA)).profile.children, 'unspecified');
      const deleted = await fetch(`${base}/api/profile`, { method: 'DELETE', headers: { ...headers, Cookie: cookieA } });
      assert.equal(deleted.status, 200);
      assert.match(deleted.headers.get('set-cookie'), /Max-Age=0/);
      assert.equal((await read(cookieA)).profile, null);
      assert.equal((await read(cookieB)).profile.homeLocality, 'Richmond city');
      for (const path of ['/plan', '/plan/']) assert.equal((await fetch(base + path)).status, 200);
      for (const path of ['/.data/profiles.sqlite', '/.data/profile.key', '/profile-db.mjs']) assert.equal((await fetch(base + path)).status, 404);
    });
  } finally { store.close(); }
});

test('signed-in profiles are private, survive new sessions, and keep sensitive fields out of AI', async () => {
  const { randomBytes } = await import('node:crypto');
  const { createProfileDatabase } = await import('./profile-db.mjs');
  const { createAccountDatabase } = await import('./auth-db.mjs');
  const { default: schema } = await import('./profile.cjs');
  const profiles = createProfileDatabase(':memory:', randomBytes(32));
  const accounts = createAccountDatabase(':memory:');
  const profile = { homeLocality: 'Fairfax city', householdSize: '3', consent: true,
    ...Object.fromEntries(schema.profileQuestions.map(({ key }) => [key, 'yes'])) };
  const password = 'test-only-long-passphrase';
  let payload;
  try {
    await withServer({ env: { ...env, NODE_ENV: 'production' }, profileStore: profiles, accountStore: accounts,
      fetchImpl: async (url, options) => { payload = JSON.parse(options.body); return Response.json({ choices: [{ message: { content: 'Check the official site.' } }] }); }
    }, async base => {
      const headers = { 'Content-Type': 'application/json', 'X-HERO-Account': '1', 'X-HERO-Profile': '1' };
      const post = (path, body = {}, cookie, extra = {}) => fetch(base + path, { method: 'POST', headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}), ...extra }, body: JSON.stringify(body) });
      const read = async cookie => (await fetch(base + '/api/profile', { headers: cookie ? { Cookie: cookie } : {} })).json();
      const save = (body, cookie, extra = {}) => fetch(base + '/api/profile', { method: 'PUT', headers: { ...headers, Cookie: cookie, ...extra }, body: JSON.stringify(body) });
      const register = async username => {
        const response = await post('/api/account/register', { username, password });
        assert.equal(response.status, 201);
        assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict;.*Secure/);
        assert.deepEqual(await response.json(), { user: { username } });
        return response.headers.get('set-cookie').split(';')[0];
      };
      assert.equal((await fetch(base + '/account.html')).status, 200);
      assert.equal((await fetch(base + '/account.js')).status, 200);
      assert.equal((await post('/api/account/register', { username: 'resident-a', password }, null, { Origin: 'https://evil.example' })).status, 403);
      const noHeader = await fetch(base + '/api/account/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'resident-a', password }) });
      assert.equal(noHeader.status, 403);
      const cookieA = await register('resident-a');
      const cookieB = await register('resident-b');
      assert.equal((await save({ ...profile, id: 'resident-b' }, cookieA)).status, 200);
      assert.equal((await save({ ...profile, homeLocality: 'Richmond city' }, cookieB)).status, 200);
      assert.equal((await read()).profile, null);
      assert.equal((await read(cookieA)).profile.homeLocality, 'Fairfax city');
      assert.equal((await read(cookieB)).profile.homeLocality, 'Richmond city');
      assert.equal((await read(cookieA)).user.username, 'resident-a');
      assert.equal((await save({ ...profile, householdSize: '4' }, cookieA, { 'X-HERO-Profile-Owner': 'resident-b' })).status, 409);
      assert.equal((await read(cookieA)).profile.householdSize, '3');
      assert.equal((await save({ ...profile, householdSize: '4' }, cookieA)).status, 200);
      assert.equal((await post('/api/chat', { ...validBody, useProfile: true, accountId: 'resident-b' }, cookieA)).status, 200);
      assert.match(payload.messages[1].content, /Fairfax city/);
      assert.match(payload.messages[1].content, /"householdSize":"4"/);
      assert.doesNotMatch(JSON.stringify(payload), /resident-a|resident-b|Richmond city/);
      for (const { key } of schema.profileQuestions) assert.equal(JSON.stringify(payload).includes(`"${key}"`), false);
      assert.equal((await post('/api/account/login', { username: 'resident-a', password: 'incorrect-password-long' })).status, 401);
      assert.equal((await post('/api/account/logout', {}, cookieA)).status, 200);
      assert.equal((await read(cookieA)).profile, null);
      assert.equal((await save(profile, cookieA)).status, 401);
      const signedInAgain = await post('/api/account/login', { username: 'resident-a', password });
      assert.equal(signedInAgain.status, 200);
      const newCookieA = signedInAgain.headers.get('set-cookie').split(';')[0];
      assert.notEqual(newCookieA, cookieA);
      assert.equal((await read(newCookieA)).profile.householdSize, '4');
      const deleted = await fetch(base + '/api/profile', { method: 'DELETE', headers: { ...headers, Cookie: newCookieA } });
      assert.equal(deleted.status, 200);
      assert.equal((await read(newCookieA)).profile, null);
      assert.equal((await read(newCookieA)).user.username, 'resident-a');
      assert.equal((await read(cookieB)).profile.homeLocality, 'Richmond city');
      for (const path of ['/.data/accounts.sqlite', '/auth-db.mjs']) assert.equal((await fetch(base + path)).status, 404);
    });
  } finally { profiles.close(); accounts.close(); }
});

test('moving a browser profile requires consent and never overwrites another account profile', async () => {
  const { randomBytes } = await import('node:crypto');
  const { createProfileDatabase } = await import('./profile-db.mjs');
  const { createAccountDatabase } = await import('./auth-db.mjs');
  const { default: schema } = await import('./profile.cjs');
  const profiles = createProfileDatabase(':memory:', randomBytes(32));
  const accounts = createAccountDatabase(':memory:');
  const browserToken = randomBytes(32).toString('hex');
  profiles.save(browserToken, { homeLocality: 'Fairfax city', householdSize: '2', consent: true,
    ...Object.fromEntries(schema.profileQuestions.map(({ key }) => [key, 'unspecified'])) });
  try {
    await withServer({ env: {}, profileStore: profiles, accountStore: accounts }, async base => {
      const response = await fetch(base + '/api/account/register', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-HERO-Account': '1' }, body: JSON.stringify({ username: 'move-resident', password: 'test-only-long-passphrase' }) });
      const accountCookie = response.headers.get('set-cookie').split(';')[0];
      const cookie = accountCookie + '; hero_profile=' + browserToken;
      const move = consent => fetch(base + '/api/profile/import', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-HERO-Profile': '1', Cookie: cookie }, body: JSON.stringify({ consent }) });
      const read = async () => (await fetch(base + '/api/profile', { headers: { Cookie: cookie } })).json();
      assert.equal((await read()).profile, null, 'Sign-in must not silently load the browser profile');
      assert.equal((await move(false)).status, 400);
      assert.equal((await read()).profile, null);
      assert.equal((await move(true)).status, 200);
      assert.equal((await read()).profile.homeLocality, 'Fairfax city');
      assert.equal(profiles.get(browserToken), null);
      assert.equal((await move(true)).status, 409);
      assert.equal((await read()).profile.homeLocality, 'Fairfax city');
    });
  } finally { profiles.close(); accounts.close(); }
});
