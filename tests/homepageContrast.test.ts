import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {expect, it} from 'vitest';

it('uses the readable theme token for homepage card metadata in both themes', () => {
  const css = postcss.parse(readFileSync('app/globals.css', 'utf8'));
  for (const selector of ['.home-feed-grid .home-product-card__body p', '.home-feed-grid .home-spec-row span']) {
    const colors: string[] = [];
    css.walkRules(selector, rule => {rule.walkDecls('color', declaration => {colors.push(declaration.value);});});
    expect(colors.at(-1)).toBe('rgb(var(--color-text-dim))');
  }
  for (const selector of [':root', ':root[data-theme="dark"]']) {
    const tokens = new Map<string,string>();
    css.walkRules(selector, rule => {rule.walkDecls(declaration => {tokens.set(declaration.prop, declaration.value);});});
    const luminance = (token: string) => tokens.get(token)!.split(/\s+/).map(Number).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const text = luminance('--color-text-dim');
    const background = luminance('--color-surface');
    expect((Math.max(text,background) + 0.05) / (Math.min(text,background) + 0.05)).toBeGreaterThanOrEqual(4.5);
  }
});
