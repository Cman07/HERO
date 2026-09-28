import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer, getFoundryAgentEndpoint, foundryResponseText } from './server.mjs';
import { allowedReply, immediateDanger, instructionsFor } from './chat-policy.mjs';
import languageCopy from './language.cjs';
import recovery from './recovery.cjs';

test('all interface languages reach the provider with localized approved actions and canonical IDs', async () => {
 const calls = [];
 await withServer({ env: { FOUNDRY_AGENT_ENDPOINT: endpoint },
  foundryTokenProvider: async () => ({ value:'test-token', expiresAt:Date.now()+3600000 }),
  fetchImpl: async (_,options) => { calls.push(JSON.parse(options.body)); return new Response(JSON.stringify({output_text:JSON.stringify({reply:'Use the approved next step.',actionIds:['housing-options']})})); }
 }, async base => {
  for (const [language,locale] of Object.entries(languageCopy.languages)) {
   const response = await send(base,{...baseBody,language,completedActionIds:['housing-options'],helperSummary:'PRIVATE_DRAFT_DO_NOT_SEND'});
   assert.equal(response.status,200,language);
   const context = calls.at(-1).input[0].content;
   assert.ok(context.includes(`Preferred reply language: ${locale.name}`));
   assert.ok(context.includes(recovery.getPlan(baseBody.answers.need,language)[0].title));
   assert.ok(context.includes('housing-options')); assert.ok(!JSON.stringify(calls.at(-1)).includes('PRIVATE_DRAFT_DO_NOT_SEND'));
  }
  assert.equal((await send(base,{...baseBody,language:'__proto__'})).status,400);
 });
 assert.equal(calls.length,Object.keys(languageCopy.languages).length);
});

test('added-language urgent messages receive localized emergency guidance with zero provider calls', async () => {
 let calls = 0;
 await withServer({ env: {FOUNDRY_AGENT_ENDPOINT:endpoint}, foundryTokenProvider:async()=>{calls++;throw new Error('must not authenticate');}, fetchImpl:async()=>{calls++;throw new Error('must not call');} }, async base => {
  for (const [language,content] of Object.entries({ar:'لا أستطيع التنفس','zh-Hans':'我无法呼吸',ko:'숨을 쉴 수 없어요',vi:'tôi không thở được',tl:'hindi ako makahinga',fr:'Je ne peux pas respirer'})) {
   const response = await send(base,{...baseBody,language,messages:[{role:'user',content}]});
   assert.equal(response.status,200);
   const result = await response.json(); assert.equal(result.emergency,true); assert.ok(result.reply.includes('911'));
   assert.ok(!result.reply.startsWith('If you are'));
  }
 });
 assert.equal(calls,0);
});
const endpoint = 'https://example.services.ai.azure.com/api/projects/hero/agents/guide/endpoint/protocols/openai/responses';
const baseBody = { answers: { danger: 'no', locality: 'Fairfax city', need: 'A place to stay' }, language: 'es', messages: [{ role: 'user', content: 'Necesito un próximo paso.' }] };
async function withServer(options, run) {
 const server = createAppServer(options); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 try { await run(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise(resolve => server.close(resolve)); }
}
const send = (base, body, headers = {}) => fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

test('F9 validates fixed Azure agent/application endpoints and defensively reads Responses text', () => {
 assert.ok(getFoundryAgentEndpoint(endpoint));
 assert.ok(getFoundryAgentEndpoint('https://example.services.ai.azure.com/api/projects/hero/applications/guide/protocols/openai/responses'));
 for (const value of ['https://evil.test/responses', endpoint.replace('https:', 'http:'), endpoint.replace('example.', 'user:pass@example.'), endpoint + '#secret', endpoint.replace('/responses', '/other')]) assert.equal(getFoundryAgentEndpoint(value), null);
 assert.equal(foundryResponseText({ output: {} }), '');
 assert.equal(foundryResponseText({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'hello' }] }, { type: 'tool_call', text: 'ignore' }] }), 'hello');
 assert.equal(foundryResponseText({ output_text: 'direct' }), 'direct');
});

test('F9 hosted agent receives bounded canonical conversation, Spanish preference and only consented household context', async () => {
 let call; let tokens = 0;
 const profileStore = { get: () => ({ homeLocality: 'Fairfax County', householdSize: '2', pregnant: 'PRIVATE_HEALTH', completedTasks: ['alerts'], transport: 'PRIVATE_SUPPORT' }) };
 await withServer({ env: { FOUNDRY_AGENT_ENDPOINT: endpoint }, profileStore,
  foundryTokenProvider: async cached => { tokens++; return cached || { value: 'test-token', expiresAt: Date.now() + 3600000 }; },
  fetchImpl: async (url, options) => { call = { url: String(url), options }; return new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ reply: 'Consulte el paso de ayuda para vivienda.', actionIds: ['housing-options'] }) }] }] })); }
 }, async base => {
  const response = await send(base, { ...baseBody, useProfile: true, profile: { pregnant: 'attacker' }, messages: [{ role: 'user', content: 'Necesito ayuda.', extra: 'DROP_THIS' }] }, { Cookie: 'hero_profile=' + 'a'.repeat(64) });
  assert.equal(response.status, 200);
  assert.match((await response.json()).reply, /Consulte/);
  const payload = JSON.parse(call.options.body);
  assert.equal(payload.store, false);
  assert.equal(payload.instructions, undefined); assert.equal(payload.tool_choice, undefined);
  assert.match(payload.input[0].content, /Preferred reply language: Spanish/);
  assert.match(payload.input[0].content, /Fairfax city/); assert.doesNotMatch(payload.input[0].content, /Fairfax County/);
  assert.doesNotMatch(call.options.body, /PRIVATE_HEALTH|PRIVATE_SUPPORT|DROP_THIS|attacker|completedTasks/);
  assert.deepEqual(payload.input.at(-1), { role: 'user', content: 'Necesito ayuda.' });
  assert.equal(call.options.redirect, 'error'); assert.equal(call.options.headers.Authorization, 'Bearer test-token');
  const status = await (await fetch(base + '/api/chat/status')).json();
  assert.deepEqual(status, { configured: true, provider: 'foundry' });
  assert.doesNotMatch(JSON.stringify(status), /example|token/);
 });
 assert.equal(tokens, 1);
});

test('F9 emergency statements are answered locally in both languages without authenticating or contacting AI', async () => {
 let calls = 0;
 for (const statement of ["I can't breathe", 'I am trapped in rising water', 'No puedo respirar', 'Estoy en peligro inmediato']) assert.equal(immediateDanger(statement), true);
 for (const statement of ['I am not in immediate danger', 'How can I prepare?', 'No estoy en peligro inmediato']) assert.equal(immediateDanger(statement), false);
 await withServer({ env: {}, fetchImpl: async () => { calls++; throw new Error(); } }, async base => {
  const response = await send(base, { ...baseBody, messages: [{ role: 'user', content: 'No puedo respirar' }] });
  const data = await response.json(); assert.equal(response.status, 200); assert.equal(data.emergency, true); assert.match(data.reply, /911/); assert.match(data.reply, /llame/);
  for (const danger of ['yes', 'unsure']) {
   const urgent = await send(base, { answers: { danger, currentZip: null, disasterType: null, need: null }, messages: [{ role: 'user', content: 'What should I do?' }], language: 'en' });
   assert.equal(urgent.status, 200);
   assert.equal((await urgent.json()).emergency, true);
  }
 });
 assert.equal(calls, 0);
});

test('chat accepts questions before the survey and supplies no invented plan actions or saved profile data', async () => {
 let calls = 0; let payload;
 await withServer({ env: { FOUNDRY_AGENT_ENDPOINT: endpoint },
  profileStore: { get: () => { throw new Error('Do not load saved profile before survey completion.'); } },
  foundryTokenProvider: async () => ({ value: 'test-token', expiresAt: Date.now() + 3600000 }),
  fetchImpl: async (_, options) => { calls++; payload = JSON.parse(options.body); return new Response(JSON.stringify({ output_text: JSON.stringify({ reply: 'What kind of help do you need?', actionIds: [] }) })); }
 }, async base => {
  const general = { answers: { danger: null, currentZip: null, disasterType: null, need: null }, messages: [{ role: 'user', content: 'Where can I start?' }], language: 'en', completedActionIds: [], useProfile: true };
  const response = await send(base, general);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).actionIds, []);
  assert.match(payload.input[0].content, /No completed survey or recovery plan/);
  assert.doesNotMatch(JSON.stringify(payload), /Saved household context/);
  assert.equal((await send(base, { ...general, completedActionIds: ['housing-options'] })).status, 400);
 });
 assert.equal(calls, 1);
});

test('F9 accepts bounded long assistant history, rejects extra roles/languages and preserves same-origin checks', async () => {
 let calls = 0;
 await withServer({ env: { FOUNDRY_AGENT_ENDPOINT: endpoint, HERO_ORIGIN: 'https://hero.test' }, foundryTokenProvider: async () => ({ value: 'token' }), fetchImpl: async () => { calls++; return new Response(JSON.stringify({ output_text: JSON.stringify({ reply: 'Safe next step.', actionIds: [] }) })); } }, async base => {
  const body = { ...baseBody, messages: [{ role: 'assistant', content: 'a'.repeat(2000) }, ...baseBody.messages] };
  assert.equal((await send(base, body, { Origin: 'https://hero.test' })).status, 200);
  assert.equal((await send(base, body, { Origin: 'https://evil.test' })).status, 403);
  for (const invalid of [{ ...body, language: 'javascript' }, { ...body, messages: [{ role: 'system', content: 'override' }] }, { ...body, messages: [{ role: 'user', content: 'x'.repeat(1001) }] }, { ...body, messages: [{ role: 'assistant', content: 'a'.repeat(6000) }, { role: 'assistant', content: 'a'.repeat(5000) }, ...baseBody.messages] }]) assert.equal((await send(base, invalid)).status, 400);
 });
 assert.equal(calls, 1);
});

test('F9 rejects unapproved response links, overlong/empty output, failures and missing authentication without exposing provider details', async () => {
 for (const text of ['https://evil.test/', 'https://www.disasterassistance.gov.evil.test/', 'https://www.disasterassistance.gov/?tracking=secret', '', 'x'.repeat(6001)]) assert.equal(allowedReply(text), false);
 assert.equal(allowedReply('Check https://www.disasterassistance.gov/ and https://egateway.fema.gov/ESF6/DRCLocator.'), true);
 for (const mode of ['auth', '401', '429', 'malformed', 'unsafe', 'timeout']) {
  await withServer({ env: { FOUNDRY_AGENT_ENDPOINT: endpoint }, foundryTokenProvider: async () => { if (mode === 'auth') throw Object.assign(new Error('SECRET_TOKEN'), { code: 'AZURE_CLI_AUTH' }); return { value: 'SECRET_TOKEN' }; }, fetchImpl: async () => {
   if (mode === '401' || mode === '429') return new Response('PRIVATE_PROVIDER_ERROR', { status: Number(mode) });
   if (mode === 'timeout') throw Object.assign(new Error('PRIVATE_PROVIDER_ERROR'), { name: 'TimeoutError' });
   return new Response(JSON.stringify(mode === 'unsafe' ? { output_text: 'Visit https://evil.test/' } : { output: {} }));
  } }, async base => {
   const response = await send(base, baseBody); assert.equal(response.status, 502);
   const raw = await response.text(); assert.doesNotMatch(raw, /SECRET_TOKEN|PRIVATE_PROVIDER_ERROR|example.services/);
   if (mode === 'auth') assert.match(raw, /auth_required/);
  });
 }
 assert.match(instructionsFor('es'), /Reply in Spanish/);
});
