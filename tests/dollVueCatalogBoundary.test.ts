import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { sampleProducts } from '@/lib/data/sample-products';
import * as catalog from '@/lib/dollvue/catalog';
import * as config from '@/lib/dollvue/config';

describe('lightweight DollVue catalog boundary', () => {
  it('keeps the existing config exports bound to the same predicates and constants', () => {
    for (const key of ['isDollVueProduct', 'isDollVueCatalogProduct', 'isLegacyDollVueCatalogProduct',
      'dollVueUrl', 'DOLLVUE_PRODUCT_HANDLES', 'DOLLVUE_DEFAULT_PRODUCT_HANDLE'] as const) {
      expect(config[key]).toBe(catalog[key]);
    }
  });

  it.each([
    ['irontech-existing', 'custom', undefined, undefined, true],
    ['starpery-existing', 'custom', undefined, undefined, true],
    ['lusandy-existing', 'custom', undefined, undefined, true],
    ['funwest-dolls-existing', 'custom', undefined, undefined, true],
    ['top-fire-doll-existing', 'custom', undefined, undefined, true],
    ['irontech-existing', 'ready_to_ship', undefined, undefined, false],
    ['lusandy-sex-doll-heads', 'custom', undefined, undefined, false],
    ['lusandy-torso-existing', 'custom', undefined, undefined, false],
    ['lusandy-existing', 'custom', 'torso', undefined, false],
    ['unreviewed-example', 'custom', undefined, undefined, false],
    ['irontech-existing', 'custom', undefined, false, false],
    ['reviewed-example', 'custom', undefined, true, true],
  ] as const)('retains %s catalog behavior with status %s and explicit badge %s', (handle, stockStatus, bodyType, dollVueAvailable, expected) => {
    const product = { ...sampleProducts[0], handle, dollVueAvailable,
      extended: { ...sampleProducts[0].extended, stockStatus, bodyType } };
    expect(catalog.isDollVueCatalogProduct(product)).toBe(expected);
  });

  it('keeps card/list runtime imports out of the option manifest and full validation module', () => {
    const visited = new Set<string>();
    function walk(file: string) {
      if (visited.has(file)) return;
      visited.add(file);
      expect(file).not.toMatch(/dollvue\/config\.ts$|assets\/option-assets\.mjs$|owned-option-assets\.json$/);
      if (!/\.[cm]?[jt]sx?$/.test(file)) return;
      const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX }
      }).outputText;
      for (const imported of ts.preProcessFile(code, true, true).importedFiles) {
        const name = imported.fileName;
        if (!name.startsWith('@/') && !name.startsWith('.')) continue;
        const base = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(file), name);
        const resolved = [base, ...['.ts', '.tsx', '.mjs', '.json', '/index.ts', '/index.tsx'].map(extension => base + extension)]
          .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        expect(resolved, `${file}: ${name}`).toBeDefined();
        if (resolved) walk(resolved);
      }
    }
    for (const root of ['components/HomeAlive.tsx', 'components/ProductCard.tsx', 'lib/catalog/filters.ts']) walk(path.resolve(root));
  });
});
