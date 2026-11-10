import 'server-only';
import {createHash} from 'node:crypto';
import type {Product} from '@/types/product';
import type {BrandCustomizationConfig} from '@/types/customization';
import type {TemplatePresetDefinition} from './template-presets';
import {templateRuntimeHash} from './template-release-registry';
import {templateConfigSignature} from './template-config-signature';
import release from './evidence/fanreal-release-nov10.json';
import scope from '@/lib/cart/evidence/fanreal-nov10-dependency-scope.json';

type Entry={productId:string;handle:string;displayName:string;runtimeHash:string;recipe:TemplatePresetDefinition};
type Release={schemaVersion:1;releaseStatus:'APPROVED'|'BLOCKED';payload:{releaseId:string;entries:Entry[]};approval:{payloadHash:string;evidenceRef:string;reviewedAt:string}|null};
export function fanrealTemplatePayloadHash(payload:Release['payload']) {return createHash('sha256').update(JSON.stringify(payload)).digest('hex');}
export function selectFanrealTemplateRecipe(input:unknown,product:Product,config:BrandCustomizationConfig):TemplatePresetDefinition|null|undefined{
 if(!Object.hasOwn(scope.parents,product.id))return undefined;
 const r=input as Release;
 if(r?.schemaVersion!==1||r.releaseStatus!=='APPROVED'||!r.approval?.evidenceRef||!Number.isFinite(Date.parse(r.approval.reviewedAt))||r.approval.payloadHash!==fanrealTemplatePayloadHash(r.payload))return null;
 const entries=r.payload.entries.filter(entry=>entry.productId===product.id);if(entries.length!==1)return null;
 const entry=entries[0];const tags=product.tags.filter(tag=>tag.startsWith('options:'));
 if(entry.handle!==product.handle||entry.displayName!==product.extended.displayName||entry.runtimeHash!==templateRuntimeHash(product,config)||tags.length!==1||entry.recipe.tag!==tags[0]||entry.recipe.signature!==templateConfigSignature(config))return null;
 if(entry.recipe.tiers.map(tier=>tier.id).join(',')!=='starter,enthusiast,collector')return null;
 return structuredClone(entry.recipe);
}
export function releasedFanrealTemplateRecipe(product:Product,config:BrandCustomizationConfig){return selectFanrealTemplateRecipe(release,product,config);}
