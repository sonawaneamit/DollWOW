import {describe, expect, it} from 'vitest';
import {classifyAppearance, appearanceReferenceProperty} from '@/lib/dollvue/appearance';

describe('DollVue appearance classification', () => {
  it.each(['Heating','Movable jaw','Standing feet','Breathing','Extra head','Vagina color','Pubic hair'])('does not enable %s', label => {
    expect(classifyAppearance({label}, {label} ).status).toBe('excluded');
  });
  it.each(['Factory default','As shown','Random','No thanks'])('does not enable %s', label => {
    expect(classifyAppearance({label:'Hair color'}, {label}).status).toBe('excluded');
  });
  it('classifies semantic labels independently from option IDs', () => {
    expect(classifyAppearance({label:'Select Eye Color'},{label:'Blue'})).toEqual({status:'candidate',attribute:'eye-color'});
    expect(appearanceReferenceProperty('eye-color')).toBe('the visible iris color only');
  });
  it('does not pretend to visually identify a code-only swatch', () => {
    expect(classifyAppearance({label:'Eye color'},{label:'No.5'})).toEqual({status:'candidate',attribute:'eye-color'});
    expect(classifyAppearance({label:'Premium'},{label:'No.5'}).status).toBe('review');
  });
  it('classifies mixed menus one option at a time', () => {
    expect(classifyAppearance({label:'Premium'},{label:'Add freckles'}).status).toBe('candidate');
    expect(classifyAppearance({label:'Premium'},{label:'Body heating'}).status).toBe('excluded');
    expect(classifyAppearance({label:'Hair style'},{label:'Implanted human hair'}).status).toBe('review');
    const mixed = { label: 'Select Premium Head & Body Options (Multiple)' };
    expect(classifyAppearance(mixed, { label: 'Realistic Head Painting' })).toEqual({ status: 'candidate', attribute: 'makeup' });
    expect(classifyAppearance(mixed, { label: 'Hyper Realism Body Painting' }).status).toBe('review');
  });
  it('never enables unavailable options', () => {
    expect(classifyAppearance({label:'Skin tone'}, {label:'Natural',factoryExists:false}).status).toBe('excluded');
  });
  it.each(['Hairstyle For Extra Free Head','Choose a Head','Sexy Lingerie Add-On'])('rejects Jev false-enable/uncertain proposal for %s', label => {
    expect(classifyAppearance({label},{label:'No.4'}).status).toBe('excluded');
  });
});
