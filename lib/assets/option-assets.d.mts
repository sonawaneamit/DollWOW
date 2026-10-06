import type { CustomizationGroup } from '../../types/customization';
export function optionAssetKey(value: string): string;
export function isMigratedOptionAsset(value: string): boolean;
export function isOwnedOptionAsset(value: unknown): boolean;
export function ownedOptionAsset(value: string): string | undefined;
export function catalogOptionAsset(namespace: string, path: string): string;
export function ownedOptionGroups<T extends CustomizationGroup[] | undefined>(groups: T): T;
export function optionAssetViolations(groups: CustomizationGroup[] | undefined): Array<{groupId: string; optionId: string; source: string}>;
