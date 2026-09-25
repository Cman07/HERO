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
    assert.match(await page.text(), /DisasterAssistance.gov/);
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
