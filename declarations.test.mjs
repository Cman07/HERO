import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeclarationService } from './declarations.mjs';
import fips from './virginia-fips.cjs';
import localities from './localities.cjs';
const row = (overrides = {}) => ({ state: 'VA', fipsStateCode: '51', fipsCountyCode: '059', disasterNumber: 4880, declarationType: 'DR', declarationTitle: 'TEST STORM', designatedArea: 'Fairfax (County)', incidentType: 'Severe Storm', declarationDate: '2025-02-01T00:00:00.000Z', incidentBeginDate: '2025-01-01T00:00:00.000Z', incidentEndDate: null, iaProgramDeclared: false, lastRefresh: '2025-03-01T00:00:00.000Z', ...overrides });
const response = rows => Response.json({ DisasterDeclarationsSummaries: rows });

test('all Virginia localities have unique official codes; counties and cities with the same name stay distinct', () => {
  assert.deepEqual(Object.keys(fips).sort(), [...localities].sort());
  assert.equal(new Set(Object.values(fips)).size, 133);
  for (const code of Object.values(fips)) assert.match(code, /^\d{3}$/);
  assert.equal(fips['Fairfax County'], '059'); assert.equal(fips['Fairfax city'], '600');
  assert.notEqual(fips['Richmond County'], fips['Richmond city']);
});

test('fetches only the selected county, deduplicates, bounds output and caches successful checks', async () => {
  let calls = 0;
  const service = createDeclarationService({ now: () => Date.parse('2026-09-26T12:00:00Z'), fetchImpl: async (url, options) => {
    calls++; assert.equal(url.origin + url.pathname, 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries');
    assert.match(url.searchParams.get('$filter'), /fipsCountyCode eq '059'/); assert.equal(url.searchParams.get('$top'), '11');
    assert.equal(options.redirect, 'error');
    return response([row(), row()]);
  } });
  const checked = await service.lookup('Fairfax County');
  assert.equal(checked.status, 'checked'); assert.equal(checked.records.length, 1);
  assert.equal(checked.records[0].individualAssistance, false);
  assert.equal(checked.records[0].incidentEndDate, null);
  assert.equal(checked.records[0].url, 'https://www.fema.gov/disaster/4880');
  assert.equal(checked.checkedAt, '2026-09-26T12:00:00.000Z');
  assert.equal((await service.lookup('Fairfax County')).cached, true); assert.equal(calls, 1);
  await assert.rejects(service.lookup("Fairfax' or state eq 'TX")); assert.equal(calls, 1);
});

test('failures and malformed/wrong-area records produce unknown, not a false no-match result', async () => {
  for (const fetchImpl of [() => { throw new Error('offline'); }, async () => new Response('', { status: 503 }), async () => Response.json({}), async () => response([row({ fipsCountyCode: '600' })]), async () => response([row({ state: 'TX' })]), async () => response([row({ declarationDate: 'invalid' })])]) {
    const service = createDeclarationService({ fetchImpl });
    const value = await service.lookup('Fairfax County'); assert.equal(value.status, 'unknown'); assert.equal(value.checkedAt, null); assert.deepEqual(value.records, []);
  }
  const service = createDeclarationService({ fetchImpl: async () => response([]) });
  assert.equal((await service.lookup('Fairfax County')).status, 'checked');
});

test('expired cached records retain the last successful time while failure status is unknown, then recover', async () => {
  let time = Date.parse('2026-09-26T12:00:00Z'); let calls = 0;
  const service = createDeclarationService({ now: () => time, fetchImpl: () => { calls++; if (calls === 2) throw new Error('offline'); return Promise.resolve(response([row()])); } });
  const first = await service.lookup('Fairfax County'); time += 16 * 60_000;
  const stale = await service.lookup('Fairfax County'); assert.equal(stale.status, 'unknown'); assert.equal(stale.stale, true); assert.equal(stale.checkedAt, first.checkedAt); assert.equal(stale.records.length, 1);
  const recovered = await service.lookup('Fairfax County'); assert.equal(recovered.status, 'checked'); assert.notEqual(recovered.checkedAt, first.checkedAt); assert.equal(calls, 3);
});

test('concurrent lookups share one FEMA request and results never mix localities', async () => {
  let calls = 0;
  const service = createDeclarationService({ fetchImpl: async url => { calls++; const city = url.searchParams.get('$filter').includes("'600'"); return response([row({ fipsCountyCode: city ? '600' : '059', designatedArea: city ? 'Fairfax (City)' : 'Fairfax (County)' })]); } });
  const values = await Promise.all([service.lookup('Fairfax County'), service.lookup('Fairfax County'), service.lookup('Fairfax city')]);
  assert.equal(calls, 2); assert.equal(values[0].records[0].area, 'Fairfax (County)'); assert.equal(values[2].records[0].area, 'Fairfax (City)');
});
