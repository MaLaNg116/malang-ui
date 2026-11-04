export interface HierarchyNode { value: string; label: string; children?: readonly HierarchyNode[] }
export interface HierarchyEntry<T extends HierarchyNode> { item: T; ancestors: string[]; children: HierarchyEntry<T>[]; level: number }

// Values are stable identities throughout one navigation instance. Keep the first
// occurrence so malformed duplicate or cyclic input cannot create duplicate IDs.
export function navigationHierarchy<T extends HierarchyNode>(items: readonly T[]) {
  const seen = new Set<string>();
  const all: HierarchyEntry<T>[] = [];
  function visit(nodes: readonly T[], ancestors: string[]): HierarchyEntry<T>[] {
    const result: HierarchyEntry<T>[] = [];
    for (const item of nodes) {
      if (seen.has(item.value)) continue;
      seen.add(item.value);
      const entry: HierarchyEntry<T> = { item, ancestors, children: [], level: ancestors.length + 1 };
      all.push(entry); result.push(entry);
      entry.children = visit((item.children ?? []) as readonly T[], [...ancestors, item.value]);
    }
    return result;
  }
  return { roots: visit(items, []), all };
}
