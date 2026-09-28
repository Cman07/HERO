import { exampleLocation } from './zip-service.mjs';

const feeds = [
  { id: 'hospital', category: 'Hospital directory location', source: 'USGS National Map', url: 'https://carto.nationalmap.gov/arcgis/rest/services/structures/MapServer/49/query' },
  { id: 'fire', category: 'Fire/EMS directory location', source: 'USGS National Map', url: 'https://carto.nationalmap.gov/arcgis/rest/services/structures/MapServer/51/query' },
  { id: 'shelter', category: 'Reported open shelter — confirm availability', source: 'FEMA National Shelter System', url: 'https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/FeatureServer/0/query' },
  { id: 'center', category: 'Reported open recovery center — confirm details', source: 'FEMA Disaster Recovery Centers', url: 'https://gis.fema.gov/arcgis/rest/services/FEMA/DRC/FeatureServer/0/query' }
];
const safeText = (value, limit = 150) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
function bounds(location) {
  const lat = location.latitude, lon = location.longitude;
  const dLon = Math.min(0.45, 0.19 / Math.max(0.4, Math.cos(lat * Math.PI / 180)));
  return { xmin: lon - dLon, ymin: lat - 0.19, xmax: lon + dLon, ymax: lat + 0.19, spatialReference: { wkid: 4326 } };
}
function normalize(feature, feed, checkedAt, location) {
  const a = feature?.attributes || {};
  const field = (...names) => {
    for (const name of names) {
      const value = a[name] ?? a[name.toLowerCase()] ?? a[name.toUpperCase()];
      if (value !== undefined && value !== null) return value;
    }
    return null;
  };
  const latitude = Number(feature?.geometry?.y ?? a.latitude);
  const longitude = Number(feature?.geometry?.x ?? a.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude - location.latitude) > 0.2 || Math.abs(longitude - location.longitude) > 0.47) return null;
  const name = safeText(field('NAME', 'drc_name', 'shelter_name'), 120);
  if (!name) return null;
  const address = [field('ADDRESS', 'street_1', 'address_1'), field('CITY'), field('STATE'), field('ZIPCODE', 'zip')].map(value => safeText(value, 100)).filter(Boolean).join(', ');
  const key = `${feed.id}:${safeText(String(field('PERMANENT_IDENTIFIER', 'drc_id', 'shelter_id', 'OBJECTID') ?? `${name}:${address}`), 150)}`;
  return { id: key, name, category: feed.category, kind: feed.id, address, latitude, longitude, source: feed.source, checkedAt,
    status: feed.id === 'hospital' || feed.id === 'fire' ? 'Directory location; availability is not verified.' : 'Reported by FEMA; confirm current hours, services, and availability before traveling.' };
}
export function createLocalResourceService({ fetchImpl = fetch, now = Date.now } = {}) {
  const cache = new Map();
  return { async lookup(location = exampleLocation) {
    const key = location.zip || 'charlottesville-example';
    const cached = cache.get(key);
    if (cached && now() - cached.time < 5 * 60_000) return { ...cached.value, cached: true };
    const envelope = bounds(location);
    const checkedAt = new Date(now()).toISOString();
    const results = await Promise.allSettled(feeds.map(async feed => {
      const url = new URL(feed.url);
      for (const [param, value] of Object.entries({ f: 'json', where: '1=1', geometry: JSON.stringify(envelope), geometryType: 'esriGeometryEnvelope', inSR: '4326', spatialRel: 'esriSpatialRelIntersects', outFields: '*', outSR: '4326', returnGeometry: 'true', resultRecordCount: '35' })) url.searchParams.set(param, value);
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(6500), redirect: 'error', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`${feed.source} unavailable`);
      const body = await response.json();
      if (!Array.isArray(body.features)) throw new Error(`${feed.source} returned invalid features`);
      return body.features.slice(0, 35).map(feature => normalize(feature, feed, checkedAt, location)).filter(Boolean);
    }));
    const rank = { center: 0, shelter: 1, hospital: 2, fire: 3 };
    const distance = pin => (pin.latitude - location.latitude) ** 2 + ((pin.longitude - location.longitude) * Math.cos(location.latitude * Math.PI / 180)) ** 2;
    const unique = [...new Map(results.flatMap(result => result.status === 'fulfilled' ? result.value : []).map(pin => [pin.id, pin])).values()];
    const pins = Object.keys(rank).flatMap(kind => unique.filter(pin => pin.kind === kind).sort((a, b) => distance(a) - distance(b)).slice(0, 10))
      .sort((a, b) => rank[a.kind] - rank[b.kind] || distance(a) - distance(b));
    const sources = feeds.map((feed, index) => ({ name: feed.source, category: feed.id, status: results[index].status === 'fulfilled' ? 'checked' : 'unavailable', checkedAt: results[index].status === 'fulfilled' ? checkedAt : null }));
    const value = { location, pins, sources, checkedAt, partialFailure: results.some(result => result.status === 'rejected'), example: !location.zip, cached: false };
    if (results.some(result => result.status === 'fulfilled')) cache.set(key, { time: now(), value });
    return value;
  } };
}
