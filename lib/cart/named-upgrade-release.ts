import 'server-only';
import { createHash } from 'node:crypto';
import registry from './evidence/named-upgrades-release.json';
import type { ExactUpgradeBinding } from './exact-upgrade-lines';
import { createVerifiedNamedUpgradeCart, type InputLine, type Request } from './exact-upgrade-pilot';

export type NamedUpgradeRelease = {
  schemaVersion: 1;
  releaseStatus: 'BLOCKED' | 'APPROVED';
  payload: { releaseId: string; parents: Record<string, string>; groups: Record<string, Omit<ExactUpgradeBinding, 'parentVariantId'>[]> };
  approval: null | { payloadHash: string; evidenceRef: string; reviewedAt: string };
};

export function namedUpgradePayloadHash(payload: NamedUpgradeRelease['payload']) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function releasedNamedBindings(input: unknown, parentIds: string[]): ExactUpgradeBinding[] {
  const release = input as NamedUpgradeRelease;
  if (release?.schemaVersion !== 1 || release.releaseStatus !== 'APPROVED' || !release.payload ||
      !release.approval?.evidenceRef?.trim() || !Number.isFinite(Date.parse(release.approval.reviewedAt)) ||
      release.approval.payloadHash !== namedUpgradePayloadHash(release.payload)) {
    throw new Error('Named checkout release has not passed its release checks.');
  }
  const output: ExactUpgradeBinding[] = [];
  for (const parentVariantId of [...new Set(parentIds)]) {
    const groupKey = release.payload.parents[parentVariantId];
    const group = release.payload.groups[groupKey];
    if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(parentVariantId) || !Array.isArray(group) || !group.length) {
      throw new Error('This doll needs a verified checkout configuration. Please contact our team.');
    }
    for (const binding of group) {
      if (!binding.productTitle?.trim() || !binding.group?.trim() || !binding.label?.trim() ||
          !Number.isFinite(binding.unitAmount) || binding.unitAmount <= 0 || binding.currencyCode !== 'USD' ||
          !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(binding.merchandiseId) ||
          (binding.choiceLabels && (!Array.isArray(binding.choiceLabels) || !binding.choiceLabels.length || binding.choiceLabels.some(label => !label?.trim())))) {
        throw new Error('Invalid released checkout mapping.');
      }
      output.push({ ...binding, parentVariantId });
    }
  }
  return output;
}

export async function createReleasedNamedUpgradeCart(lines: InputLine[], discountCodes: string[], request: Request,
  legacyCharges?: (charge: InputLine['customizationCharge']) => Array<{ merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] }>) {
  const release = registry as NamedUpgradeRelease;
  const mapped = lines.filter(line => Object.hasOwn(release.payload.parents, line.merchandiseId));
  const unmapped = lines.filter(line => !Object.hasOwn(release.payload.parents, line.merchandiseId));
  // Deferred brands retain their existing checkout; reviewed parents never fall back.
  if (!mapped.length) return undefined;
  const deferred = unmapped.filter(line => (line.customizationCharge?.amount ?? 0) > 0);
  if (deferred.length && !legacyCharges) throw new Error('This doll needs a verified checkout configuration. Please contact our team.');
  const preserved = deferred.map(line => ({ parent: line,
    charges: legacyCharges!(line.customizationCharge) }));
  const bindings = releasedNamedBindings(release, mapped.map(line => line.merchandiseId));
  return createVerifiedNamedUpgradeCart(lines.filter(line => !deferred.includes(line)).map(line => ({ ...line,
    namedUpgradeAttributes: line.namedUpgradeAttributes ?? (!line.customizationCharge ? line.attributes ?? [] : undefined)
  })), discountCodes, request, bindings, true, preserved);
}

export function loadReleasedNamedUpgradeBindings(parentIds: string[]) {
  return releasedNamedBindings(registry, parentIds);
}
