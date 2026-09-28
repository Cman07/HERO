import fips from './virginia-fips.cjs';
import { bundledZip, validZip } from './zip-service.mjs';
const endpoint = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';
export const declarationSource = 'https://www.fema.gov/openfema-data-page/disaster-declarations-summaries-v2';
const ttl = 15 * 60_000;
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const text = (value, max) => typeof value === 'string' && value.length <= max ? value : null;
function normalize(row, state, stateFips, county) {
  if (row.state !== state || row.fipsStateCode !== stateFips || row.fipsCountyCode !== county || !Number.isSafeInteger(row.disasterNumber) || row.disasterNumber <= 0 || !['DR', 'EM', 'FM'].includes(row.declarationType) || !date(row.declarationDate)) throw new Error('Invalid declaration record.');
  const title = text(row.declarationTitle, 500); const area = text(row.designatedArea, 160); const incidentType = text(row.incidentType, 100);
  if (!title || !area || !incidentType) throw new Error('Invalid declaration record.');
  return { disasterNumber: row.disasterNumber, declarationType: row.declarationType, title, area, incidentType,
    declarationDate: date(row.declarationDate), incidentBeginDate: date(row.incidentBeginDate), incidentEndDate: date(row.incidentEndDate),
    individualAssistance: typeof row.iaProgramDeclared === 'boolean' ? row.iaProgramDeclared : null,
    lastRefresh: date(row.lastRefresh), url: 'https://www.fema.gov/disaster/' + row.disasterNumber };
}
export function createDeclarationService({ fetchImpl = fetch, now = Date.now } = {}) {
  const cache = new Map(); const pending = new Map();
  return {
    async lookup(input) {
      const legacy = typeof input === 'string';
      const zip = legacy ? null : input?.damageZip;
      const location = zip && validZip(zip) ? bundledZip(zip) : null;
      const chosen = legacy ? Object.hasOwn(fips, input) : Boolean(location?.counties.some(county => county.fips === input?.countyFips));
      if (!chosen) throw new Error('Confirm a county offered for the damage ZIP.');
      const locality = legacy ? input : `${zip} — ${location.counties.find(county => county.fips === input.countyFips).name}`;
      const countyFips = legacy ? `51${fips[input]}` : input.countyFips;
      const state = legacy ? 'VA' : location.state;
      const stateCode = countyFips.slice(0, 2), countyCode = countyFips.slice(2);
      const cached = cache.get(locality);
      if (cached && now() - cached.time < ttl) return { ...cached.value, cached: true };
      if (pending.has(locality)) return pending.get(locality);
      const work = Promise.resolve().then(async () => {
        try {
          const url = new URL(endpoint);
          url.searchParams.set('$filter', `state eq '${state}' and fipsStateCode eq '${stateCode}' and fipsCountyCode eq '${countyCode}'`);
          url.searchParams.set('$orderby', 'declarationDate desc,disasterNumber desc');
          url.searchParams.set('$top', '11');
          url.searchParams.set('$select', 'state,fipsStateCode,fipsCountyCode,disasterNumber,declarationType,declarationTitle,designatedArea,incidentType,declarationDate,incidentBeginDate,incidentEndDate,iaProgramDeclared,lastRefresh');
          const response = await fetchImpl(url, { signal: AbortSignal.timeout(8000), redirect: 'error', headers: { Accept: 'application/json' } });
          if (!response.ok) throw new Error('FEMA unavailable.');
          const body = await response.json();
          if (!Array.isArray(body.DisasterDeclarationsSummaries) || body.DisasterDeclarationsSummaries.length > 11) throw new Error('Invalid FEMA response.');
          const normalized = body.DisasterDeclarationsSummaries.map(row => normalize(row, state, stateCode, countyCode));
          const records = [...new Map(normalized.map(row => [row.disasterNumber, row])).values()].slice(0, 10);
          const checkedAt = new Date(now()).toISOString();
          const value = { status: 'checked', locality, checkedAt, stale: false, records, moreAvailable: normalized.length > 10, source: declarationSource };
          cache.set(locality, { time: now(), value });
          return { ...value, cached: false };
        } catch {
          return { status: 'unknown', locality, checkedAt: cached?.value.checkedAt || null, stale: Boolean(cached),
            records: cached?.value.records || [], moreAvailable: cached?.value.moreAvailable || false, source: declarationSource, cached: Boolean(cached) };
        } finally { pending.delete(locality); }
      });
      pending.set(locality, work);
      return work;
    }
  };
}
