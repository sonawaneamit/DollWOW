"""Read the approved v4 workbook without exporting private costs to the app."""
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

source, destination = map(Path, sys.argv[1:3])
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
with zipfile.ZipFile(source) as archive:
    strings = ["".join(t.itertext()) for t in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    sheets = workbook.find("s:sheets", ns)
    index = next(i for i, sheet in enumerate(sheets, 1) if sheet.attrib["name"] == "FunWest proposal v4")
    xml = ET.fromstring(archive.read(f"xl/worksheets/sheet{index}.xml"))
    rows = []
    for row in xml.findall("s:sheetData/s:row", ns):
        values = {}
        for cell in row:
            value = cell.findtext("s:v", default="", namespaces=ns)
            values[''.join(c for c in cell.attrib['r'] if c.isalpha())] = strings[int(value)] if cell.attrib.get('t') == 's' else value
        rows.append(values)
assert rows[0]['M'] == 'Proposed v4 price $'
prices = []
for row in rows[1:]:
    if not row.get('A'):
        continue
    handle = urlparse(row['A']).path.removeprefix('/products/')
    before, after, cost, minimum = [float(row[key]) for key in ('C', 'M', 'D', 'F')]
    assert handle.startswith('funwest-') and '/' not in handle
    assert after - before > 100 and after >= minimum and (after - cost) / after >= .3
    prices.append({'handle': handle, 'title': row['B'], 'before': before, 'after': after, 'floorLift': row.get('S') == 'YES'})
assert len(prices) == 164 and len({row['handle'] for row in prices}) == 164
assert sum(row['floorLift'] for row in prices) == 16
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(prices, indent=2) + '\n')
print(json.dumps({'rows': len(prices), 'floorLifts': 16, 'output': str(destination)}))
