"""Build the bundled ZIP-area lookup from public GeoNames and Census downloads.

Download the six GeoNames archives and the 2020 ZCTA/county relationship file to
/private/tmp/hero-zip-source before running this script. ZIPs and ZCTAs are
approximate areas, not addresses or proof of a resident's county.
"""
import csv
import json
import zipfile
from pathlib import Path

source = Path('/private/tmp/hero-zip-source')
target = Path(__file__).resolve().parents[1] / 'data'
target.mkdir(exist_ok=True)
postal = {}
supported = set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR AS GU MP VI'.split())
for country in ('US', 'PR', 'AS', 'GU', 'MP', 'VI'):
    with zipfile.ZipFile(source / f'{country}.zip') as archive:
        rows = archive.read(f'{country}.txt').decode('utf-8').splitlines()
    for row in csv.reader(rows, delimiter='\t'):
        if len(row) < 11 or not row[1].isdigit() or len(row[1]) != 5:
            continue
        try:
            latitude, longitude = round(float(row[9]), 5), round(float(row[10]), 5)
        except ValueError:
            continue
        state = country if country != 'US' else row[4]
        if state not in supported:
            continue
        postal.setdefault(row[1], [row[2], state, latitude, longitude])

counties = {}
with (source / 'zcta_county.txt').open(encoding='utf-8-sig') as source_file:
    for row in csv.DictReader(source_file, delimiter='|'):
        zip_code = row['GEOID_ZCTA5_20']
        fips = row['GEOID_COUNTY_20']
        name = row['NAMELSAD_COUNTY_20']
        if len(zip_code) == 5 and len(fips) == 5 and name:
            counties.setdefault(zip_code, {})[fips] = name

(target / 'postal-codes.json').write_text(json.dumps(postal, ensure_ascii=False, separators=(',', ':')))
(target / 'zcta-counties.json').write_text(json.dumps({key: sorted(value.items()) for key, value in counties.items()}, ensure_ascii=False, separators=(',', ':')))
print(f'{len(postal)} ZIPs; {len(counties)} ZCTAs with county candidates')
