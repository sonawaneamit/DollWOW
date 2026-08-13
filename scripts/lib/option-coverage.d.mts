export type OptionCoverageGroup = {
  label?: string;
  options?: Array<{ label?: string }>;
};

export type OptionCoverageResult = {
  complete: boolean;
  sourceGroupCount: number;
  storedGroupCount: number;
  matchedGroups: number;
  matchedOptions: number;
  missingSourceGroups: Array<{ label: string; sourceOptionCount: number }>;
  missingSourceOptions: Array<{ group: string; option: string }>;
  extraStoredGroups: Array<{ label: string; storedOptionCount: number }>;
  extraStoredOptions: Array<{ group: string; option: string }>;
};

export function compareOptionCoverage(
  storedGroups?: OptionCoverageGroup[],
  sourceGroups?: OptionCoverageGroup[],
): OptionCoverageResult;
