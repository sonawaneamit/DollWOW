import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const css = postcss.parse(readFileSync('app/globals.css', 'utf8'));
function declarations(selector: string) {
  const values: Record<string, string> = {};
  css.walkRules(selector, rule => {
    rule.walkDecls(declaration => { values[declaration.prop] = declaration.value; });
  });
  return values;
}

describe('homepage small fixes', () => {
  it('links the banner margins without changing the image width', () => {
    expect(declarations('.home-dollvue-strip__link')).toMatchObject({ width: '100%', 'padding-inline': '10%' });
    expect(declarations('.home-dollvue-strip__image')).toMatchObject({ width: '100%', height: 'auto' });
  });

  it('covers the whole home card and leaves the save button above its link', () => {
    const link = declarations('.home-product-card__link');
    expect(link).toMatchObject({ position: 'absolute', inset: '0', 'z-index': '3' });
    expect(Number(declarations('.home-heart')['z-index'])).toBeGreaterThan(Number(link['z-index']));
    expect(declarations('.home-product-card__body')['pointer-events']).toBe('none');
    expect(declarations('.home-product-card__body [role="button"]')['pointer-events']).toBe('auto');
  });

  it('sets the home title explicitly without a second site-name suffix', () => {
    const page = readFileSync('app/(store)/page.tsx', 'utf8');
    expect(page).toContain("title: { absolute: 'DollWOW | Find, compare, customize, and buy with confidence' }");
    expect(page).toContain("canonical: 'https://dollwow.com'");
  });
});
