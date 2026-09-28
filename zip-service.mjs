import postal from './data/postal-codes.json' with { type: 'json' };
import relationships from './data/zcta-counties.json' with { type: 'json' };

export const exampleLocation = Object.freeze({ zip: null, place: 'Charlottesville', state: 'VA', label: 'Charlottesville, Virginia', latitude: 38.0293, longitude: -78.4767, source: 'example', counties: [] });
export const validZip = value => typeof value === 'string' && /^\d{5}$/.test(value);
const stateNames = new Intl.DisplayNames(['en'], { type: 'region' });
const territoryNames = { AS: 'American Samoa', GU: 'Guam', MP: 'Northern Mariana Islands', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands', DC: 'District of Columbia' };
function regionName(code) {
  return territoryNames[code] || ({ AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' })[code] || stateNames.of('US');
}
function location(zip, place, state, latitude, longitude, source) {
  const counties = (relationships[zip] || []).map(([fips, name]) => ({ fips, name }));
  return { zip, place, state, region: regionName(state), label: `${place}, ${state} ${zip}`, latitude, longitude, source, counties };
}
export function bundledZip(zip) {
  if (!validZip(zip)) return null;
  const row = postal[zip];
  return row ? location(zip, ...row, 'GeoNames') : null;
}
export function createZipService({ fetchImpl = fetch } = {}) {
  const cache = new Map();
  return { async lookup(zip) {
    if (!validZip(zip)) return null;
    const local = bundledZip(zip);
    if (local) return local;
    if (cache.has(zip)) return cache.get(zip);
    let value = null;
    try {
      const response = await fetchImpl(`https://api.zippopotam.us/us/${zip}`, { signal: AbortSignal.timeout(4500), redirect: 'error', headers: { Accept: 'application/json' } });
      if (response.ok) {
        const body = await response.json();
        const first = body?.places?.[0];
        const lat = Number(first?.latitude), lon = Number(first?.longitude);
        if (body['post code'] === zip && typeof first?.['place name'] === 'string' && first['place name'].length <= 100 && /^[A-Z]{2}$/.test(first['state abbreviation'] || '') && Number.isFinite(lat) && Number.isFinite(lon) && lat >= -15 && lat <= 72 && lon >= -180 && lon <= 180) {
          value = location(zip, first['place name'], first['state abbreviation'], lat, lon, 'Zippopotam.us');
        }
      }
    } catch { /* A failed fallback leaves location unknown. */ }
    cache.set(zip, value);
    return value;
  } };
}
