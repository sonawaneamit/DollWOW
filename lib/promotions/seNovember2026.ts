// DOL-285: reviewed supplier terms, not checkout entitlements or a released campaign.
export const SE_NOVEMBER_TIMING = {
  startsAt: '2026-11-01T04:00:00.000Z',
  endsAt: '2026-12-01T05:00:00.000Z',
  timeZone: 'America/New_York',
  dateLabel: '1-30 November 2026'
} as const;

export function isSeNovemberWindow(now: Date) {
  return now.getTime() >= Date.parse(SE_NOVEMBER_TIMING.startsAt)
    && now.getTime() < Date.parse(SE_NOVEMBER_TIMING.endsAt);
}

export const SE_NOVEMBER_REVIEW_TERMS = {
  tpeCustom: {
    included: ['STPE upgrade', 'EVO skeleton', 'Gel breasts', 'Fixed tongue', 'Lubricant-free vagina', 'Realistic body painting'],
    reductions: [
      { option: 'Second TPE head', percent: 50 },
      { option: 'Custom skin tone', percent: 50 },
      { option: 'LSTPE', percent: 10, bodies: ['157H', '161F', '163E'] }
    ]
  },
  siliconeProCustom: {
    included: ['Random second head', 'Realistic skin texture', 'Realistic body painting', 'Hard hands and feet', 'Realistic oral structure', 'Implanted eyebrows and eyelashes', 'Gel breasts', 'Soft vagina', 'Articulated / ultraflex fingers'],
    softBellyBodies: ['T148', 'T155', 'T159', 'T165', 'T175'],
    reductions: [{ option: 'Master makeup', percent: 10 }, { option: 'Gel butt', percent: 50 }]
  },
  siliconeTorsoCustom: {
    softBellyBodies: ['ST5', 'ST6', 'ST7', 'ST8'],
    gelButtBodies: ['ST1', 'ST2', 'ST3', 'ST4', 'ST8'],
    reductions: [{ option: 'Gel butt', percent: 50 }, { option: 'Second silicone head', percent: 50 }]
  },
  warehouse: [
    { region: 'US', material: 'Silicone Pro', suggestedMinimumRetailReductionPercent: 10, included: ['Realistic skin texture'] },
    { region: 'US', material: 'STPE', suggestedMinimumRetailReductionPercent: 20, included: [] },
    { region: 'EU', material: 'Silicone Pro', suggestedMinimumRetailReductionPercent: 10, included: ['Realistic skin texture'] },
    { region: 'EU', material: 'STPE', suggestedMinimumRetailReductionPercent: 15, included: [] }
  ]
} as const;
