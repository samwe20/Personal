import type { NodeRecord } from '../types';
import { linkIdsInNode, objectTitle, splitIds } from './blocks';

export interface TaggedBlockHit {
  nodeId: string;
  blockId: string;
  text: string;
}

export { objectTitle };

export function searchNodes(nodes: NodeRecord[], query: string): NodeRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return nodes.filter((node) => {
    if (objectTitle(node).toLowerCase().includes(q)) return true;
    if ((node.aliases ?? []).some((alias) => alias.toLowerCase().includes(q))) return true;
    if (node.content.toLowerCase().includes(q)) return true;
    if ((node.blocks ?? []).some((block) => block.text.toLowerCase().includes(q))) return true;
    const typeIds = [node.typeId, ...node.supertagIds].filter(Boolean) as string[];
    for (const tagId of typeIds) {
      if (tagId.toLowerCase().includes(q)) return true;
      const fields = node.fieldValues[tagId] ?? {};
      for (const val of Object.values(fields)) {
        if (String(val).toLowerCase().includes(q)) return true;
      }
    }
    return false;
  });
}

function fieldPointsAt(value: string | number | boolean, targetId: string): boolean {
  if (value === targetId) return true;
  return splitIds(value).includes(targetId);
}

export function getBacklinks(nodes: NodeRecord[], targetId: string): NodeRecord[] {
  return nodes.filter((node) => {
    if (node.id === targetId) return false;
    if ((node.tagIds ?? []).includes(targetId)) return true;
    if ((node.blocks ?? []).some((block) => (block.tagIds ?? []).includes(targetId))) return true;
    for (const fields of Object.values(node.fieldValues)) {
      for (const val of Object.values(fields)) {
        if (fieldPointsAt(val, targetId)) return true;
      }
    }
    return linkIdsInNode(node).includes(targetId);
  });
}

export function blocksWithTag(nodes: NodeRecord[], tagId: string): TaggedBlockHit[] {
  const hits: TaggedBlockHit[] = [];
  for (const node of nodes) {
    if (node.deleted) continue;
    for (const block of node.blocks ?? []) {
      if ((block.tagIds ?? []).includes(tagId)) {
        hits.push({ nodeId: node.id, blockId: block.id, text: block.text });
      }
    }
  }
  return hits;
}

export function getUnlinkedMentions(nodes: NodeRecord[], target: NodeRecord): NodeRecord[] {
  const names = [objectTitle(target), ...(target.aliases ?? [])]
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length >= 3);
  if (!names.length) return [];
  return nodes.filter((node) => {
    if (node.id === target.id) return false;
    if (linkIdsInNode(node).includes(target.id)) return false;
    const haystack = `${objectTitle(node)}\n${node.content}\n${(node.blocks ?? []).map((block) => block.text).join('\n')}`.toLowerCase();
    return names.some((name) => haystack.includes(name));
  });
}

export function resolveLinks(text: string, nodes: NodeRecord[]): string {
  return text.replace(/\[\[([0-9a-fA-F-]{8,})\]\]/g, (_, id: string) => {
    const target = nodes.find((item) => item.id === id);
    const title = objectTitle(target).trim();
    if (!title || /^\[\[[0-9a-fA-F-]{8,}\]\]$/.test(title)) return id.slice(0, 8);
    return title;
  });
}

export function displayTitle(nodes: NodeRecord[], node: NodeRecord | undefined): string {
  return resolveLinks(objectTitle(node), nodes);
}

export function resolveNodeTitle(nodes: NodeRecord[], nodeId: string): string {
  if (!nodeId) return '—';
  const node = nodes.find((n) => n.id === nodeId);
  return displayTitle(nodes, node) || nodeId.slice(0, 8);
}

export function getReferenceCandidates(
  nodes: NodeRecord[],
  referenceSupertag?: string,
): NodeRecord[] {
  if (!referenceSupertag) return nodes;
  return nodes.filter((n) => n.typeId === referenceSupertag || n.supertagIds.includes(referenceSupertag));
}
