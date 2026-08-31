import type { NodeRecord } from '../types';

export function searchNodes(nodes: NodeRecord[], query: string): NodeRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return nodes.filter((node) => {
    if (node.content.toLowerCase().includes(q)) return true;
    for (const tagId of node.supertagIds) {
      if (tagId.toLowerCase().includes(q)) return true;
      const fields = node.fieldValues[tagId] ?? {};
      for (const val of Object.values(fields)) {
        if (String(val).toLowerCase().includes(q)) return true;
      }
    }
    return false;
  });
}

export function getBacklinks(nodes: NodeRecord[], targetId: string): NodeRecord[] {
  return nodes.filter((node) => {
    if (node.id === targetId) return false;
    for (const fields of Object.values(node.fieldValues)) {
      for (const val of Object.values(fields)) {
        if (val === targetId) return true;
      }
    }
    if (node.content.includes(`[[${targetId}]]`)) return true;
    return false;
  });
}

export function resolveNodeTitle(nodes: NodeRecord[], nodeId: string): string {
  if (!nodeId) return '—';
  const node = nodes.find((n) => n.id === nodeId);
  return node?.content.trim() || nodeId.slice(0, 8);
}

export function getReferenceCandidates(
  nodes: NodeRecord[],
  referenceSupertag?: string,
): NodeRecord[] {
  if (!referenceSupertag) return nodes;
  return nodes.filter((n) => n.supertagIds.includes(referenceSupertag));
}
