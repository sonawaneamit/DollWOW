import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { sampleProducts } from '@/lib/data/sample-products';
import { publicCustomizationConfig, publicProductPayload, homepageCardPayload } from '@/lib/catalog/publicPayload';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { productPublicTitle } from '@/lib/catalog/naming';
import { catalogLookOptions, productMatchesLook } from '@/lib/catalog/lookTags';
import type { BrandCustomizationConfig } from '@/types/customization';

const evidence = { sourceUrl: 'https://supplier.test/private', observedAt: 'internal-date', responseHash: 'internal-hash', releaseHolds: ['internal-review'], approvalNote: 'Owner confirmed internal approval' };

describe('customer payload boundaries', () => {
  it('drops unknown nested evidence without mutating source or breaking checkout signatures', () => {
    const config: BrandCustomizationConfig = {
      id: 'fixture', brandLabel: 'Fixture', leadTimeNote: '', ...evidence,
      groups: [{ id: 'finish', label: 'Finish', required: true, display: 'cards', ...evidence,
        resources: [
          { label: 'Public citation', href: 'https://manufacturer.test/reference' },
          { label: 'Internal', href: 'https://drive.google.com/drive/folders/private' },
          { label: 'Internal', href: 'gmail:private' }
        ],
        options: [{ id: 'default', label: 'Default', priceDelta: 0, ...evidence,
          productionNote: 'Owner confirmed all listed heads compatible',
          sourceProductionNoteSignals: { defaultSupplierSelection: true },
          swatch: { kind: 'color', value: '#ffffff', ...evidence }
        }]
      }], rules: []
    };
    const before = structuredClone(config);
    const clean = publicCustomizationConfig(config);
    const serialized = JSON.stringify(clean);
    for (const key of Object.keys(evidence)) expect(serialized).not.toContain(key);
    expect(serialized).not.toMatch(/gmail:|drive\.google|Owner confirmed/);
    expect(clean.groups[0].resources).toEqual([{ label: 'Public citation', href: 'https://manufacturer.test/reference' }]);
    expect(templateConfigSignature(clean)).toBe(templateConfigSignature(config));
    expect(resolveCustomization(clean, getDefaultSelections(clean), 1000)).toEqual(resolveCustomization(config, getDefaultSelections(config), 1000));
    expect(config).toEqual(before);
  });

  it('projects product metadata and all homepage cards without option payloads', () => {
    const product = structuredClone(sampleProducts[0]);
    product.extended.customizationGroups = [{ id: 'finish', label: 'Finish', display: 'cards', ...evidence,
      options: [{ id: 'default', label: 'Default', priceDelta: 0, ...evidence }] }];
    const original = structuredClone(product);
    expect(JSON.stringify(publicProductPayload(product))).not.toMatch(/sourceUrl|observedAt|responseHash|releaseHolds|approvalNote/);
    const card = homepageCardPayload(product);
    expect(card.extended.customizationGroups).toBeUndefined();
    expect(card.variants).toEqual([]);
    expect(card.media).toBeUndefined();
    expect(card.images.length).toBeLessThanOrEqual(1);
    expect(productPublicTitle(card)).toBe(productPublicTitle(product));
    for (const look of catalogLookOptions) expect(productMatchesLook(card, look.value)).toBe(productMatchesLook(product, look.value));
    expect(product).toEqual(original);
  });

  it('maps or removes third-party swatch URLs before serializing product data', () => {
    const product = structuredClone(sampleProducts[0]);
    product.extended.customizationGroups = [{ id: 'finish', label: 'Finish', display: 'swatches', options: [
      { id: 'reference', label: 'Reference', swatch: { kind: 'image', value: 'https://unmapped-supplier.test/private-reference.jpg' } }
    ] }];
    expect(JSON.stringify(publicProductPayload(product))).not.toContain('unmapped-supplier.test');
    expect(product.extended.customizationGroups[0].options[0].swatch?.value).toContain('unmapped-supplier.test');
  });

  it('wires every homepage list and PDP promotion through public projection', () => {
    const home = fs.readFileSync('app/(store)/page.tsx', 'utf8');
    expect(home.match(/\.map\(homepageCardPayload\)/g)).toHaveLength(3);
    const pdp = fs.readFileSync('app/(store)/products/[handle]/page.tsx', 'utf8');
    expect(pdp).toContain('publicProductPayload(withProtectedProductImages(product))');
    expect(pdp).toContain('publicCustomizationConfig(getCustomizationConfig(product))');
    expect(pdp).toContain('config={customizationConfig}');
    for (const component of ['SeDollPdpFreebieBlock', 'IrontechAutumnPdpPromotion', 'FanrealSeptemberPdpPromotion', 'JinsanOctoberPdpPromotion']) {
      expect(pdp).toContain(`<${component} product={publicProduct}`);
    }
  });

  it('preserves sample menu default selection, totals and preset identity', () => {
    for (const product of sampleProducts) {
      const original = getCustomizationConfig(product);
      const clean = publicCustomizationConfig(original);
      expect(templateConfigSignature(clean)).toBe(templateConfigSignature(original));
      expect(getDefaultSelections(clean)).toEqual(getDefaultSelections(original));
      expect(resolveCustomization(clean, getDefaultSelections(clean), 1000)).toEqual(resolveCustomization(original, getDefaultSelections(original), 1000));
    }
  });

  it('keeps generated public promotion data current', () => {
    expect(() => execFileSync(process.execPath, ['scripts/generate-public-promotion-data.mjs', '--check'])).not.toThrow();
    const privateSource = fs.readFileSync('lib/promotions/october2026Draft.ts', 'utf8');
    expect(privateSource).toContain('gmail:');
    expect(privateSource).toContain('releaseHolds');
    const library = JSON.parse(fs.readFileSync('data/promotions/se-silicone-head-library.json', 'utf8'));
    const publicLibrary = JSON.parse(fs.readFileSync('data/promotions/se-silicone-head-public.json', 'utf8'));
    expect(library.approval).toBeDefined();
    expect(Object.keys(publicLibrary)).toEqual(['heads']);
    expect(publicLibrary.heads).toEqual(library.heads.map((head: { id: string; label: string; ros: boolean; image: string }) => ({
      id: head.id, label: head.label, ros: head.ros, imagePath: new URL(head.image).pathname
    })));
    expect(JSON.stringify(publicLibrary)).not.toMatch(/https?:|source|approval|reviewedAt/);
  });

  it('excludes internal evidence and config builders from the client dependency graph', () => {
    const visited = new Set<string>();
    function walk(file: string) {
      if (visited.has(file)) return;
      visited.add(file);
      const source = fs.readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/gmail:|drive\.google\.com\/drive\/folders|Owner confirmed|releaseHolds|responseHash|observedAt/);
      expect(file).not.toMatch(/customization\/configs\.ts$|october2026Draft\.ts$|se-october-2026-reviewed\.json$/);
      if (file.endsWith('.json')) return;
      // Transpile first so type-only dependencies do not look like shipped code.
      const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
      const parsed = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
      function visit(node: ts.Node) {
        let specifier: string | undefined;
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) specifier = node.moduleSpecifier.text;
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) specifier = node.arguments[0].text;
        if (specifier?.startsWith('@/') || specifier?.startsWith('.')) {
          const base = specifier.startsWith('@/') ? path.resolve(specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
          const target = [base, ...['.ts', '.tsx', '.json', '.mjs', '/index.ts', '/index.tsx'].map(extension => base + extension)].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
          expect(target, `${file}: ${specifier}`).toBeDefined();
          if (target) walk(target);
        }
        ts.forEachChild(node, visit);
      }
      visit(parsed);
    }
    for (const root of ['components/ProductOptions.tsx', 'components/HomeAlive.tsx', 'components/dollvue/DollVue.tsx',
      ...['SeDollSeptemberPromotion', 'IrontechAutumnPromotion', 'FanrealSeptemberPromotion', 'JinsanOctoberPromotion']
        .map(name => `components/promotions/${name}.tsx`)]) walk(path.resolve(root));
  });
});
