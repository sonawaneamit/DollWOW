import fs from 'node:fs';
import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireflyDraftPreviewProducts, fireflyDraftPreviewProduct, fireflyDraftRecipe } from '@/lib/catalog/fireflyDraftPreview';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { getDefaultSelections } from '@/lib/customization/resolve';

function preview() {
  vi.stubEnv('VERCEL_ENV','preview');
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV','preview');
  vi.stubEnv('NEXT_PUBLIC_DOL262_PREVIEW','1');
}
afterEach(()=>vi.unstubAllEnvs());

describe('Firefly isolated draft review',()=>{
  it('never exposes snapshots in production, even with a stray review flag',()=>{
    preview();vi.stubEnv('VERCEL_ENV','production');
    expect(fireflyDraftPreviewProducts()).toEqual([]);
    expect(fireflyDraftPreviewProduct('firefly-mary-160cm-max-silicone-companion-doll')).toBeNull();
  });
  it('requires the explicit flag on preview',()=>{
    preview();vi.stubEnv('NEXT_PUBLIC_DOL262_PREVIEW','');
    expect(fireflyDraftPreviewProducts()).toEqual([]);
  });
  it('retains only the four exact existing draft identities and marks all variants unavailable',()=>{
    preview();const rows=fireflyDraftPreviewProducts();
    expect(rows.map(p=>p.id.split('/').at(-1))).toEqual(['10639456305336','10639456960696','10639457059000','10639457124536']);
    expect(rows.reduce((n,p)=>n+p.images.length,0)).toBe(24);
    for(const p of rows){expect(p.variants.every(v=>!v.availableForSale)).toBe(true);expect(p.dollVueAvailable).toBe(false);expect(p.extended.customizationGroups).toHaveLength(39);}
    expect(fireflyDraftPreviewProduct('firefly-unreviewed')).toBeNull();
  });
  it('shows exact body-version and delivery holds without silently rewriting Shopify',()=>{
    preview();const rows=fireflyDraftPreviewProducts();
    expect(rows[1].extended.qcNote).toContain('36kg differs');
    expect(rows[1].extended.qcNote).toContain('MAP of $2,600');
    expect(rows[2].extended.qcNote).toContain('37.5kg/D-Cup');
    expect(rows.every(p=>p.extended.qcNote?.includes('transit and duties remain unconfirmed'))).toBe(true);
  });
  it.each([0,1,2,3])('revalidates the inherited three-tier recipe against current menu for row%s',index=>{
    preview();const p=fireflyDraftPreviewProducts()[index];const config=getCustomizationConfig(p);
    const presets=templateConfigurationPresets(fireflyDraftRecipe(p,config),config,config,Number(p.variants[0].price.amount),getDefaultSelections(config));
    expect(presets.map(t=>t.label)).toEqual(['Starter','Enthusiast','Collector']);
    expect(presets[0].totalPrice).toBe(Number(p.variants[0].price.amount));
    expect(presets[1].totalPrice).toBeGreaterThan(presets[0].totalPrice);
    expect(presets[2].totalPrice).toBeGreaterThan(presets[1].totalPrice);
  });
  it('preserves the exact supplier authorization original',()=>{
    expect(crypto.createHash('sha256').update(fs.readFileSync('public/images/authorizations/firefly-doll-authorized.png')).digest('hex'))
      .toBe('19cbfcb52b27a9b3aca5cfc7d753558428103801fee0f27400cad71785aa11fd');
  });
  it('keeps Firefly hidden from production navigation and authorizations',async()=>{
    vi.resetModules();vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV','production');vi.stubEnv('NEXT_PUBLIC_DOL262_PREVIEW','1');
    const brands=await import('@/lib/catalog/brands');const auth=await import('@/lib/catalog/authorizations');
    expect(brands.isHiddenCatalogBrand('firefly')).toBe(true);
    expect(brands.brandFilterOptions().some(b=>b.value==='firefly')).toBe(false);
    expect(auth.getBrandAuthorization('Firefly Diary')).toBeNull();
  });
  it('protects every private draft from hero purchase, tracking and public offer schema',()=>{
    const source=fs.readFileSync('app/(store)/products/[handle]/page.tsx','utf8');
    expect(source).toContain('isPrivateDraft ? <a href="#build-studio"');
    expect(source).toContain('!isPrivateDraft && !promotionPreview ? <PdpTrackers');
    expect(source).toContain('!isPrivateDraft && !promotionPreview ? <script');
    expect(source).toContain('draftPreview={isPrivateDraft || promotionPreview}');
  });
});
