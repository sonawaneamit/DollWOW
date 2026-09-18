import type { ExactUpgradeBinding } from './exact-upgrade-lines';

type Line = {
  id: string;
  quantity: number;
  attributes: Array<{ key: string; value: string }>;
  merchandise: { id: string; product: { title: string } };
  parentRelationship: { parent: { id: string } } | null;
};

/** Read a fresh, complete cart snapshot. Never reconstruct paid choices from parent text. */
export function namedUpgradeBuilds(
  snapshot: { lines: { nodes: Line[]; pageInfo: { hasNextPage: boolean } } },
  bindings: ExactUpgradeBinding[]
) {
  if (snapshot.lines.pageInfo.hasNextPage) throw new Error('Incomplete configured cart.');
  const lines = snapshot.lines.nodes;
  if (new Set(lines.map(line => line.id)).size !== lines.length ||
      lines.some(line => !Number.isInteger(line.quantity) || line.quantity < 1)) {
    throw new Error('Invalid configured quantities or duplicate lines.');
  }
  const parents = lines.filter(line => !line.parentRelationship);
  for (const line of lines.filter(line => line.parentRelationship)) {
    if (!parents.some(parent => parent.id === line.parentRelationship!.parent.id)) {
      throw new Error('An upgrade has no doll.');
    }
  }
  return parents.map(parent => {
    if (!parent.attributes.some(a => a.key === '_DollWOW_checkout_model' && a.value === 'named-upgrades-v1') ||
        !bindings.some(binding => binding.parentVariantId === parent.merchandise.id)) {
      throw new Error('Unrecognized named-upgrade build.');
    }
    const children = lines.filter(line => line.parentRelationship?.parent.id === parent.id);
    const seen = new Set<string>();
    const upgrades = children.map(child => {
      const matches = bindings.filter(binding => binding.parentVariantId === parent.merchandise.id &&
        binding.merchandiseId === child.merchandise.id && binding.productTitle === child.merchandise.product.title);
      if (matches.length !== 1) throw new Error('Unverified or duplicate upgrade.');
      const binding = matches[0];
      let choice = binding.label;
      if (binding.choiceLabels) {
        const attributes = child.attributes.filter(attribute => attribute.key === 'Customization');
        const prefix = `${binding.group}: `;
        if (attributes.length !== 1 || !attributes[0].value.startsWith(prefix)) throw new Error('Missing or ambiguous upgrade choice.');
        choice = attributes[0].value.slice(prefix.length);
        if (!binding.choiceLabels.includes(choice)) throw new Error('Unverified upgrade choice.');
      }
      const identity = JSON.stringify([child.merchandise.id, choice]);
      const positions = child.attributes.filter(attribute => attribute.key === 'Tattoo position');
      if (binding.tattooPositions ? positions.length !== 1 || !binding.tattooPositions.includes(positions[0].value) : positions.length !== 0) {
        throw new Error('Missing or unverified tattoo placement.');
      }
      if (seen.has(identity)) throw new Error('Unverified or duplicate upgrade.');
      if (child.quantity !== parent.quantity) throw new Error('Upgrade quantities do not match the dolls. Review the build.');
      seen.add(identity);
      return { lineId: child.id, merchandiseId: child.merchandise.id, title: matches[0].productTitle,
        group: binding.group, choice, quantity: child.quantity,
        ...(positions.length ? { tattooPosition: positions[0].value } : {}) };
    });
    return {
      lineId: parent.id, merchandiseId: parent.merchandise.id, quantity: parent.quantity,
      includedChoices: parent.attributes.filter(a => a.key.startsWith('Included: ')),
      upgrades
    };
  });
}
