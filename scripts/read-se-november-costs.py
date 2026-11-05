"""Read the original BIFF .xls with xlrd; never modify the supplier workbook."""
import hashlib
import json
from pathlib import Path
import xlrd

directory = Path('data/exports/dol-285-2026-10-29')
source = directory / 'quotation-tpe-original.xls'
book = xlrd.open_workbook(source)
sheet = book.sheet_by_name('TPE dolls')


def observed(row, column, label):
    cell = sheet.cell(row - 1, column - 1)
    if cell.ctype != xlrd.XL_CELL_NUMBER:
        raise ValueError(f'Expected numeric source at row {row}, column {column}')
    return {'sheet': sheet.name, 'row': row, 'column': column,
            'label': label, 'value': cell.value}


facts = {
    'model150Label': sheet.cell_value(17, 0).strip(),
    'model150Unit': observed(18, 3, '150CM unit, excludes shipping'),
    'model150USFreightReference': observed(18, 9, 'US shipping reference'),
    'model150EUAirTaxIncludedReference': observed(18, 6, 'EU air with tax reference'),
    'regularCustomSkin': observed(43, 2, 'Reseller custom skin, regular'),
    'suggestedMinimumCustomSkinRegular': observed(43, 4, 'Suggested minimum retail, regular'),
    'regularEVO': observed(29, 2, 'EVO reseller, regular'),
    'regularBodyPainting': observed(31, 2, 'Body painting reseller, regular'),
    'regularSTPE': observed(33, 2, 'STPE reseller, regular'),
    'regularFixedTongue': observed(39, 2, 'Fixed tongue reseller, regular'),
    'regularGelBreasts': observed(40, 2, 'Gel breasts reseller, regular'),
    'regularLubricantFree': observed(45, 2, 'Lubricant-free reseller, regular'),
    'freightQualification': {'sheet': sheet.name, 'cell': 'A76',
                            'text': sheet.cell_value(75, 0)}
}
assert facts['model150Label'] == '150CM'
assert facts['regularCustomSkin']['value'] == 100
assert 'reference only' in facts['freightQualification']['text']
catalog = json.loads((directory / 'review-comparison-private.json').read_text())
carry = next(row for row in catalog['rows'] if row['handle'] == 'sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o')
color = next(row for row in carry['quotes'] if row['groupId'] == 'skin-tone' and row['optionId'] == 'custom-color')
skin_cost = facts['regularCustomSkin']['value'] * 0.5
skin_contribution = color['proposed'] - skin_cost
output = {
    'sourceDriveId': '1Z8tzvr1pZcplmoc9b6-dZQSsndTnWTLu',
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'sourceVersion': '2026 factory quotation, copy received 3 October',
    'facts': facts,
    'skinOptionOnly': {
        'supplierNovemberPriceSource': 'Gmail 1a18089fd3f0238d, 28 October, explicitly reseller 100 -> 50',
        'catalogRetail': color['current'], 'proposedRetail': color['proposed'],
        'novemberSupplierCost': skin_cost,
        'contributionBeforeUnverifiedCosts': skin_contribution,
        'contributionPercentBeforeUnverifiedCosts': 100 * skin_contribution / color['proposed'],
        'qualifications': ['Not whole-order landed margin or net profit',
                           'Incremental freight, taxes and payment fees are unverified',
                           'Quotation regular suggested retail is not a November MAP approval']
    },
    'wholeOrderMarginVerified': False,
    'limitations': [
        'Height-level 150CM quotation is not an exact construction/variant cost match',
        'Freight varies with order date; no automatic use as a delivery promise',
        'No assumed HALLOWEEN299 membership or redemption',
        'Regular paid option costs must not be silently treated as November costs',
        'Silicone Pro and torso cost folders return authenticated connector 404; accessible current copies needed'
    ],
    'shopifyWrites': 0
}
(directory / 'tpe-cost-evidence-private.json').write_text(json.dumps(output, indent=2) + '\n')
print(json.dumps({'sourceHash': output['sourceSha256'], 'referencedNumericCells': 11,
                  'skinOptionContributionPercentBeforeUnverifiedCosts': 60,
                  'wholeOrderMarginVerified': False, 'shopifyWrites': 0}))
