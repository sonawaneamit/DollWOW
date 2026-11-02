import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import postcss, { type Root } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { expect, it } from 'vitest';

const globalCss = postcss.parse(fs.readFileSync('app/globals.css', 'utf8'));
const configurator = postcss.parse(fs.readFileSync('components/dollvue/configurator.css', 'utf8'));
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const owned = (value: string) => value.startsWith('dollvue-') && !/^dollvue-(pdp|access)-/.test(value);

function records(tree: Root) {
  const result: unknown[] = [];
  tree.walkRules(rule => {
    const ancestry: unknown[] = [];
    for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
      ancestry.unshift([parent.type, 'name' in parent ? parent.name : undefined, 'params' in parent ? parent.params : undefined]);
    }
    for (const selector of rule.selectors) {
      result.push([ancestry, selector, rule.nodes.map(node => node.type === 'decl'
        ? [node.prop, node.value, Boolean(node.important)] : node.toString())]);
    }
  });
  tree.walkAtRules(rule => { if (!rule.nodes) result.push([rule.name, rule.params]); });
  return result;
}

// The one-off migration proof needs the retained source, not a network request.
it.skipIf(!process.env.DOL328_CSS_BASELINE_FILE)('conserves every selector, declaration, media condition, keyframe and directive', () => {
  const before = records(postcss.parse(fs.readFileSync(process.env.DOL328_CSS_BASELINE_FILE!, 'utf8')));
  const all = [...records(globalCss), ...records(configurator)].map(record => JSON.stringify(record)).sort();
  expect(hash(before.map(record => JSON.stringify(record)).sort())).toBe('2299c48d841b69ecb6399905ae2a6f5cff4af75b47dfa4e2f33190cca9ec0758');
  expect(all).toEqual(before.map(record => JSON.stringify(record)).sort());
  expect(hash(records(globalCss))).toBe('80856338a8286274696da29a5f7aeb301e3e4ac970b0b58ac8be796f6fb83869');
});

it('preserves the ordered configurator cascade', () => {
  expect(records(configurator)).toHaveLength(201);
  expect(hash(records(configurator))).toBe('1e53080f4de72e61460a3665622c6503b14270c24fd561d1c7ce26893fb5a47a');
});

it('keeps PDP and access selectors global, never configurator-owned', () => {
  configurator.walkRules(rule => {
    for (const selector of rule.selectors) {
      let hasOwner = false;
      selectorParser(root => root.walkClasses(node => { if (owned(node.value)) hasOwner = true; })).processSync(selector);
      expect(hasOwner, selector).toBe(true);
      expect(selector).not.toMatch(/\.dollvue-(pdp|access)-/);
    }
  });
  expect(globalCss.toString()).toContain('.dollvue-pdp-entry');
  expect(globalCss.toString()).toContain('.dollvue-access-shell');
  expect(globalCss.toString()).toContain('@keyframes dollvue-star-pulse');
  configurator.walkAtRules(rule => expect(rule.name).toBe('media'));
});

it('has no remaining configurator selectors in the shared stylesheet', () => {
  globalCss.walkRules(rule => {
    selectorParser(root => root.walkClasses(node => expect(owned(node.value), node.value).toBe(false))).processSync(rule.selector);
  });
});

it('loads the stylesheet only with the real configurator component', () => {
  const component = fs.readFileSync('components/dollvue/DollVue.tsx', 'utf8');
  expect(component).toContain("import './configurator.css'");
  const ownedClasses = new Set<string>();
  configurator.walkRules(rule => {
    selectorParser(root => root.walkClasses(node => {
      if (owned(node.value)) ownedClasses.add(node.value);
    })).processSync(rule.selector);
  });
  for (const directory of ['app', 'components']) {
    for (const relative of fs.readdirSync(directory, { recursive: true }) as string[]) {
      if (!/\.(tsx?|css)$/.test(relative)) continue;
      const name = path.join(directory, relative);
      if (['components/dollvue/DollVue.tsx', 'components/dollvue/DollVue.module.css', 'components/dollvue/configurator.css'].includes(name)) continue;
      const source = fs.readFileSync(name, 'utf8');
      expect(source, name).not.toContain('configurator.css');
      for (const className of ownedClasses) {
        expect(source, `${name}: ${className}`).not.toMatch(new RegExp(`(?<![\\w-])${className}(?![\\w-])`));
      }
    }
  }
});
