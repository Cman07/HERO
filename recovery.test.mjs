import test from 'node:test';
import assert from 'node:assert/strict';
import recovery from './recovery.cjs';
import { parseActionReply, storedAgentInstructions } from './chat-policy.mjs';
import { createAppServer } from './server.mjs';

test('each need has distinct ordered, bilingual actions with stable IDs and approved source provenance', () => {
  const allIds = new Set(); const firstActions = new Set();
  for (const need of recovery.needs) {
    const en = recovery.getPlan(need); const es = recovery.getPlan(need, 'es');
    assert.ok(en.length >= 3 && en.length <= 5);
    firstActions.add(en[0].title);
    assert.ok(en.some(a => a.stage === 'prepare'));
    assert.equal(en[0].stage, 'next');
    for (const [index, a] of en.entries()) {
      assert.ok(!allIds.has(a.id)); allIds.add(a.id);
      assert.ok(Object.values(recovery.sources).some(s => s.url === a.source.url));
      assert.match(a.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(a.id, es[index].id); assert.equal(a.source.url, es[index].source.url);
      for (const field of ['title', 'detail', 'reason']) { assert.ok(es[index][field]); assert.notEqual(es[index][field], a[field]); }
    }
  }
  assert.equal(firstActions.size, 5);
  assert.throws(() => recovery.getPlan('__proto__'));
});

test('progress is tied to a verified owner and matching intake and excludes private data', () => {
  const answers = { danger: 'no', need: 'A place to stay', locality: 'Fairfax city' };
  const record = recovery.progressRecord('guest', answers, ['housing-options']);
  assert.deepEqual(recovery.restoreProgress(record, 'guest', answers), ['housing-options']);
  assert.deepEqual(recovery.restoreProgress(record, 'account:guest', answers), []);
  for (const [owner, changed] of [['different-account', answers], [null, answers], ['guest', { ...answers, danger: 'yes' }], ['guest', { ...answers, need: 'In-person assistance' }], ['guest', { ...answers, locality: 'Fairfax County' }]]) assert.deepEqual(recovery.restoreProgress(record, owner, changed), []);
  assert.equal(recovery.progressRecord(null, answers, []), null);
  assert.deepEqual(recovery.restoreProgress({ ...record, completedActionIds: ['invented'] }, 'guest', answers), []);
  assert.deepEqual(Object.keys(record).sort(), ['version', 'owner', 'need', 'locality', 'completedActionIds'].sort());
  assert.throws(() => recovery.normalizeCompleted(answers.need, ['visit-locator']));
});

test('plan and helper exports preserve sources, completion, distinct locations and the chosen language', () => {
  const base = { need: 'Help after property damage', currentLocality: 'Fairfax city', damageLocality: 'Fairfax County', completedActionIds: ['damage-application'], now: new Date('2026-09-26T12:00:00Z'), homeLocality: 'Richmond city', householdSize: '3', questions: 'What should I ask next?', pregnant: 'PRIVATE_HEALTH', transport: 'PRIVATE_SUPPORT', chat: 'PRIVATE_CHAT' };
  const plan = recovery.textSnapshot(base);
  assert.doesNotMatch(plan, /Richmond|PRIVATE_|What should I ask next/);
  assert.doesNotMatch(plan, /Why this step/);
  const summary = recovery.textSnapshot({ ...base, summary: true });
  assert.match(summary, /Current locality: Fairfax city/); assert.match(summary, /Damage locality: Fairfax County/);
  assert.match(summary, /Selected saved home locality: Richmond city/); assert.match(summary, /What should I ask next/);
  assert.doesNotMatch(summary, /PRIVATE_/);
  assert.doesNotMatch(summary, /Why this step/);
  const es = recovery.textSnapshot({ ...base, summary: true, language: 'es' });
  assert.match(es, /Localidad actual: Fairfax city/); assert.match(es, /Localidad de los daños: Fairfax County/);
  assert.match(es, /\[x\] Revise la vía oficial/); assert.match(es, /911/); assert.match(es, /What should I ask next/);
  for (const source of Object.values(recovery.sources)) assert.ok(es.includes(source.url));
});

test('structured AI output rejects invented actions, extra fields, duplicate IDs, markup, URLs and excessive answers', () => {
  const ids = ['housing-options', 'housing-questions'];
  assert.deepEqual(parseActionReply(JSON.stringify({ reply: 'Review your options.', actionIds: [ids[0]] }), ids), { reply: 'Review your options.', actionIds: [ids[0]] });
  assert.ok(parseActionReply(JSON.stringify({ reply: 'Your current ZIP area may differ from the place where damage occurred. Confirm the damage location separately.', actionIds: [] }), ids));
  const invalid = [
    'Plain text', '```json\n{}\n```', 'null', '[]',
    { reply: 'Useful reply', actionIds: ['visit-locator'] },
    { reply: 'Useful reply', actionIds: [ids[0], ids[0]] },
    { reply: 'Useful reply', actionIds: [], tool: 'send-summary' },
    { reply: 'https://evil.test/', actionIds: [] },
    { reply: 'https://www.disasterassistance.gov/', actionIds: [] },
    { reply: '<img src=x onerror=alert(1)>', actionIds: [] },
    { reply: 'Do you know the address or locality of the damage?', actionIds: [] },
    { reply: 'Review wildfire-related damage in your current ZIP area.', actionIds: [] },
    { reply: 'You can visit a nearby recovery center.', actionIds: [] },
    { reply: 'Puede acudir a un centro de recuperación por desastre cercano.', actionIds: [] },
    { reply: '¿Puede compartir su dirección?', actionIds: [] },
    { reply: 'word '.repeat(121), actionIds: [] },
    { reply: '', actionIds: [] }
  ];
  for (const value of invalid) assert.equal(parseActionReply(typeof value === 'string' ? value : JSON.stringify(value), ids), null);
  assert.match(storedAgentInstructions, /server-supplied action, its source and check time/);
});

test('chat derives candidate actions on the server, accepts only valid progress, excludes helper edits and preserves fallback errors', async () => {
  let captured; let calls = 0; let invalidOutput = false;
  const server = createAppServer({ env: { AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com', AZURE_OPENAI_DEPLOYMENT: 'test', AZURE_OPENAI_API_KEY: 'test' }, fetchImpl: async (_, options) => {
    calls++; captured = JSON.parse(options.body);
    return Response.json({ choices: [{ message: { content: invalidOutput ? '{"reply":"Made up","actionIds":["invented"]}' : JSON.stringify({ reply: 'Prepare your questions for a representative.', actionIds: ['housing-questions'] }) } }] });
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/chat`;
    const body = { answers: { danger: 'no', need: 'A place to stay', locality: null }, messages: [{ role: 'user', content: 'What is next?' }], completedActionIds: ['housing-options'], helperSummary: 'PRIVATE_HELPER_EDITS', candidateActions: [{ id: 'invented' }] };
    const send = value => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    const response = await send(body);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: 'Prepare your questions for a representative.', actionIds: ['housing-questions'], mode: 'ai' });
    assert.match(captured.messages[1].content, /housing-options/);
    assert.match(captured.messages[1].content, /Resident-reported completed action IDs/);
    assert.doesNotMatch(JSON.stringify(captured), /PRIVATE_HELPER_EDITS|invented/);
    assert.equal((await send({ ...body, completedActionIds: ['visit-locator'] })).status, 400); assert.equal(calls, 1);
    invalidOutput = true;
    const failed = await send(body); assert.equal(failed.status, 502); assert.equal((await failed.json()).code, 'invalid_output');
    const emergency = await send({ ...body, completedActionIds: ['invented'], messages: [{ role: 'user', content: "I can't breathe" }] });
    assert.equal((await emergency.json()).emergency, true); assert.equal(calls, 2);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
