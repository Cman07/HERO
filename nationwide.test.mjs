import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createAppServer } from './server.mjs';
import { bundledZip, createZipService, exampleLocation } from './zip-service.mjs';
import { createLocalResourceService } from './local-resources.mjs';
import { createDeclarationService } from './declarations.mjs';
import { createProfileDatabase } from './profile-db.mjs';
import schema from './profile.cjs';
import localities from './localities.cjs';
import recovery from './recovery.cjs';
import language from './language.cjs';
import packs from './locales.cjs';
import { readFile } from 'node:fs/promises';

async function withServer(options, run) {
  const server = createAppServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { return await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('bundled postal data keeps leading zeros and covers states, DC, and inhabited ZIP territories', () => {
  const expected = { '22902':'VA', '10001':'NY', '99501':'AK', '96813':'HI', '20001':'DC', '00601':'PR', '00802':'VI', '96799':'AS', '96910':'GU', '96950':'MP' };
  for (const [zip, state] of Object.entries(expected)) {
    const area = bundledZip(zip);
    assert.equal(area.zip, zip);
    assert.equal(area.state, state);
    assert.equal(area.source, 'GeoNames');
    assert.ok(Number.isFinite(area.latitude) && Number.isFinite(area.longitude));
  }
  assert.equal(bundledZip('99999'), null);
  assert.equal(bundledZip('2290'), null);
  assert.equal(bundledZip('2290x'), null);
  assert.deepEqual(bundledZip('22902').counties.map(county => county.name), ['Albemarle County', 'Fluvanna County', 'Charlottesville city']);
});

test('unmatched ZIP falls back only to a bounded keyless lookup and remains unknown on failure', async () => {
  const calls = [];
  const service = createZipService({ fetchImpl: async url => { calls.push(String(url)); return new Response('missing', { status: 404 }); } });
  assert.equal(await service.lookup('99999'), null);
  assert.equal(await service.lookup('99999'), null);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^https:\/\/api\.zippopotam\.us\/us\/99999$/);
  assert.equal((await service.lookup('00601')).zip, '00601');
  assert.equal(calls.length, 1);
});

test('ZIP and resource APIs accept only resolved server-side areas and a fixed example', async () => {
  const seen = [];
  const resourceService = { lookup: async location => { seen.push(location); return { location, pins: [], sources: [], checkedAt: '2026-09-27T00:00:00Z', partialFailure: false, example: !location.zip }; } };
  await withServer({ resourceService, zipService: createZipService({ fetchImpl: async () => new Response('', { status: 404 }) }) }, async base => {
    assert.equal((await fetch(`${base}/api/locations/zip?zip=00601`)).status, 200);
    const puertoRico = await (await fetch(`${base}/api/locations/zip?zip=00601`)).json();
    assert.equal(puertoRico.state, 'PR'); assert.equal(puertoRico.zip, '00601');
    assert.equal((await fetch(`${base}/api/locations/zip?zip=0060`)).status, 400);
    assert.equal((await fetch(`${base}/api/locations/zip?zip=99999`)).status, 404);
    const example = await (await fetch(`${base}/api/local-resources?example=charlottesville`)).json();
    assert.deepEqual(example.location, exampleLocation);
    assert.equal(example.example, true);
    const other = await (await fetch(`${base}/api/local-resources?zip=10001`)).json();
    assert.equal(other.location.state, 'NY');
    assert.equal((await fetch(`${base}/api/local-resources?zip=99999`)).status, 404);
    assert.equal((await fetch(`${base}/api/local-resources?lat=38&lon=-78`)).status, 400);
    assert.equal(seen.length, 2);
  });
});

test('resource service bounds, deduplicates and labels directory pins; empty and failed FEMA feeds stay truthful', async () => {
  const feature = { attributes: { name: 'Example Hospital', address: '100 Main Street', city: 'Charlottesville', state: 'VA', permanent_identifier: 'h-1' }, geometry: { x: -78.48, y: 38.03 } };
  const calls = [];
  const service = createLocalResourceService({ now: () => Date.parse('2026-09-27T12:00:00Z'), fetchImpl: async url => {
    calls.push(String(url));
    if (String(url).includes('/DRC/')) throw new Error('DRC feed down');
    if (String(url).includes('/49/')) return Response.json({ features: [feature, feature] });
    return Response.json({ features: [] });
  } });
  const result = await service.lookup(exampleLocation);
  assert.equal(calls.length, 4);
  assert.equal(result.pins.length, 1);
  assert.equal(result.pins[0].kind, 'hospital');
  assert.match(result.pins[0].status, /availability is not verified/);
  assert.equal(result.partialFailure, true);
  assert.equal(result.sources.find(source => source.category === 'shelter').status, 'checked');
  assert.equal(result.sources.find(source => source.category === 'center').status, 'unavailable');
  assert.equal((await service.lookup(exampleLocation)).cached, true);
  assert.equal(calls.length, 4);
});

test('national declaration check uses the resident-confirmed candidate county only', async () => {
  const calls = [];
  const declarations = createDeclarationService({ fetchImpl: async url => { calls.push(String(url)); return Response.json({ DisasterDeclarationsSummaries: [] }); } });
  await assert.rejects(() => declarations.lookup({ damageZip: '22902', countyFips: '00000' }));
  const result = await declarations.lookup({ damageZip: '00601', countyFips: '72001' });
  assert.equal(result.status, 'checked');
  assert.equal(result.records.length, 0);
  assert.equal(new URL(calls[0]).searchParams.get('$filter'), "state eq 'PR' and fipsStateCode eq '72' and fipsCountyCode eq '001'");
});

test('legacy profile location is read-only and does not imply a home ZIP', () => {
  const store = createProfileDatabase(':memory:', randomBytes(32));
  const token = randomBytes(32).toString('hex');
  try {
    const old = { version: 2, homeLocality: 'Albemarle County', householdSize: '3', completedTasks: ['alerts'], ...Object.fromEntries(schema.profileQuestions.map(({ key }) => [key, 'unspecified'])) };
    store.save(token, old);
    const migrated = store.get(token);
    assert.equal(migrated.version, 3);
    assert.equal(migrated.homeZip, null);
    assert.equal(migrated.legacyHomeLocality, 'Albemarle County');
    assert.deepEqual(migrated.completedTasks, ['alerts']);
    store.save(token, { ...migrated, homeZip: '22902' });
    assert.equal(store.get(token).homeZip, '22902');
  } finally { store.close(); }
});

test('new recovery progress is owner, ZIP, need and disaster scoped; FEMA listing action links internally', () => {
  const listing = { id: 'shelter:42', kind: 'shelter', name: 'FEMA test shelter', address: 'Test street', category: 'Reported open shelter — confirm availability', status: 'Reported by FEMA; confirm availability before traveling.', source: 'FEMA', checkedAt: '2026-09-27T12:00:00Z' };
  const context = { currentZip: '10001', placeLabel: 'New York, NY 10001', disasterType: 'flood', localListing: listing };
  const actions = recovery.getPlan('A place to stay', 'en', context);
  assert.equal(actions[0].id, 'confirm-reported-listing');
  assert.equal(actions.length, 5);
  assert.ok(actions.some(action => action.id === 'disaster-followup'));
  assert.ok(actions.every(action => action.source.url.startsWith('#resource-') || Object.values(recovery.sources).some(source => source.url === action.source.url)));
  const answers = { danger: 'no', currentZip: '10001', disasterType: 'flood', need: 'A place to stay' };
  const record = recovery.progressRecord('account:example', answers, ['confirm-reported-listing'], context);
  assert.equal(record.version, 2);
  assert.deepEqual(recovery.restoreProgress(record, 'account:example', answers, context), ['confirm-reported-listing']);
  const mixedRecord = recovery.progressRecord('account:example', answers, ['confirm-reported-listing', 'housing-options'], context);
  assert.deepEqual(recovery.restoreProgress(mixedRecord, 'account:example', answers, { ...context, localListing: null }), ['housing-options']);
  for (const changed of [{ ...answers, currentZip: '22902' }, { ...answers, disasterType: 'wildfire' }, { ...answers, need: 'In-person assistance' }]) assert.deepEqual(recovery.restoreProgress(record, 'account:example', changed, context), []);
  assert.deepEqual(recovery.restoreProgress(record, 'account:other', answers, context), []);
  const summary = recovery.textSnapshot({ need: answers.need, currentZip: answers.currentZip, disasterType: answers.disasterType, localListing: listing, selectedListing: listing, summary: true, completedActionIds: [], language: 'en' });
  assert.match(summary, /Current ZIP: 10001/); assert.match(summary, /Disaster type: flood/); assert.match(summary, /Selected local listing: FEMA test shelter/); assert.match(summary, /confirm availability before traveling/);
});

test('new public ZIP and map copy is present in all eight language packs', async () => {
  const profilePage = await readFile(new URL('./plan.html', import.meta.url), 'utf8');
  assert.match(profilePage, /<select[^>]+id="household-size"/);
  assert.match(profilePage, /<option value="5\+">5 or more<\/option>/);
  const added = JSON.parse(await readFile(new URL('./docs/localization-new-source.json', import.meta.url), 'utf8'));
  for (const key of added) {
    assert.ok(language.spanish[key]?.trim(), `Spanish: ${key}`);
    for (const code of ['ar', 'zh-Hans', 'ko', 'vi', 'tl', 'fr']) assert.ok(packs[code][key]?.trim(), `${code}: ${key}`);
  }
  for (const code of Object.keys(language.languages)) assert.equal(language.translate('10001', code), '10001');
});

test('national ZIP and disaster context reaches AI with only curated actions; urgent text bypasses AI', async () => {
  const shelter = { id: 'shelter:42', kind: 'shelter', name: 'Reported test shelter', address: 'Test street', source: 'FEMA National Shelter System', checkedAt: '2026-09-27T12:00:00Z', latitude: 40.75, longitude: -73.99 };
  let providerCalls = 0, payload, output = { reply: 'Confirm the reported listing with FEMA.', actionIds: ['confirm-reported-listing'] };
  const resourceService = { lookup: async location => ({ location, pins: [shelter], sources: [], checkedAt: shelter.checkedAt, partialFailure: false }) };
  const profileStore = { get: () => ({ homeZip: '22902', householdSize: '2', disability: 'PRIVATE_ACCESS', pregnant: 'PRIVATE_HEALTH', transport: 'PRIVATE_SUPPORT' }) };
  await withServer({ env: { AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com', AZURE_OPENAI_DEPLOYMENT: 'test', AZURE_OPENAI_API_KEY: 'test' }, resourceService, profileStore,
    fetchImpl: async (_url, options) => { providerCalls++; payload = JSON.parse(options.body); return Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] }); }
  }, async base => {
    const body = { answers: { danger: 'no', currentZip: '10001', disasterType: 'flood', need: 'A place to stay' }, completedActionIds: [], useProfile: true, language: 'en', messages: [{ role: 'user', content: 'What should I check first?' }], helperSummary: 'PRIVATE_SUMMARY' };
    const post = input => fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `hero_profile=${'a'.repeat(64)}` }, body: JSON.stringify(input) });
    const response = await post(body);
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).actionIds, ['confirm-reported-listing']);
    const context = payload.messages[1].content;
    assert.match(context, /10001 \(New York, NY 10001; approximate GeoNames area\)/);
    assert.match(context, /disaster type: flood/);
    assert.match(context, /confirm-reported-listing/);
    assert.match(context, /"homeZip":"22902"/);
    assert.doesNotMatch(JSON.stringify(payload), /PRIVATE_ACCESS|PRIVATE_HEALTH|PRIVATE_SUPPORT|PRIVATE_SUMMARY/);
    output = { reply: 'Try an invented action.', actionIds: ['invented'] };
    assert.equal((await post(body)).status, 502);
    const beforeEmergency = providerCalls;
    const emergency = await post({ ...body, messages: [{ role: 'user', content: 'I cannot breathe' }] });
    assert.equal(emergency.status, 200);
    assert.equal((await emergency.json()).emergency, true);
    assert.equal(providerCalls, beforeEmergency);
  });
});
