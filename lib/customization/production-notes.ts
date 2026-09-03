import type { CustomizationOption } from "@/types/customization";

type ProductionNoteSignals = NonNullable<CustomizationOption["sourceProductionNoteSignals"]>;
type ProductionNoteSignal = keyof ProductionNoteSignals;

const CUSTOMER_SAFE_NOTE_OPENING = /^(?:adds?|additional|approximately|available|compatible|default selection|electronic|final|includes?|increases?|may|not compatible|production time|requires?|ships?|this (?:feature|option|selection|upgrade))\b/i;
const INTERNAL_LANGUAGE = /\b(?:codex|factory\s+note|internal|launch(?:ed|ing)?|ops|phoebe|reseller|supplier|ticket|wholesale)\b/i;
const STAFF_INSTRUCTION = /^(?:please\s+)?(?:add|ask|check|confirm|contact|do not|don't|ensure|exclude|include|keep|mark|remove|replace|select|set|update|use|verify)\b/i;
const PERSON_CALLOUT = /^[A-Z][a-z]+(?:'s)?\s+(?:(?:\w+|[-–—])\s+){0,3}(?:approved|asked|confirmed|list|note|requested|said)\b/;

export function importedProductionNoteSignals(note: string | undefined): ProductionNoteSignals | undefined {
  if (!note) return undefined;

  const signals: ProductionNoteSignals = {};
  if (/default supplier selection/i.test(note)) signals.defaultSupplierSelection = true;
  if (/no paid add-on/i.test(note)) signals.noPaidAddOn = true;
  if (/photographed product configuration/i.test(note)) signals.photographedProductConfiguration = true;
  return Object.keys(signals).length ? signals : undefined;
}

export function sanitizeImportedProductionNote(note: string | undefined): string | undefined {
  const value = note?.trim();
  if (!value || value.length > 140 || /[\r\n\t]/.test(value)) return undefined;
  if (/\$\s*\d/.test(value)) return undefined;
  if (/\b[A-Z][A-Z0-9]{1,9}-\d+\b/.test(value)) return undefined;
  if (/(?:https?:\/\/|www\.|\b[\w-]+\.(?:com|net|org|co|io|cn|us|uk|shop|store)\b|\S+@\S+)/i.test(value)) return undefined;
  if (INTERNAL_LANGUAGE.test(value) || STAFF_INSTRUCTION.test(value) || PERSON_CALLOUT.test(value)) return undefined;
  if (/\b(?:do not|don't)\s+(?:also\s+)?add\b|\bconfirm\s+before\b/i.test(value)) return undefined;

  // Imported notes are untrusted operations data. A note must also match a
  // deliberately narrow set of customer-facing informational sentence forms.
  return CUSTOMER_SAFE_NOTE_OPENING.test(value) ? value : undefined;
}

export function hasSourceProductionNoteSignal(
  option: Pick<CustomizationOption, "sourceProductionNoteSignals">,
  ...signals: ProductionNoteSignal[]
) {
  return signals.some((signal) => option.sourceProductionNoteSignals?.[signal] === true);
}
