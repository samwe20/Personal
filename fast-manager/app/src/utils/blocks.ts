import type { Block, BlockType, NodeRecord } from '../types';

export function newBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyBlock(type: BlockType = 'paragraph'): Block {
  return {
    id: newBlockId(),
    type,
    text: '',
    level: type === 'heading' ? 2 : undefined,
    checked: type === 'todo' ? false : undefined,
  };
}

export function lineToBlock(line: string): Block {
  const todo = line.match(/^\s*-\s\[( |x|X)\]\s?(.*)$/);
  if (todo) {
    return { id: newBlockId(), type: 'todo', text: todo[2] ?? '', checked: todo[1].toLowerCase() === 'x' };
  }
  const bullet = line.match(/^\s*[-*]\s+(.*)$/);
  if (bullet) return { id: newBlockId(), type: 'bullet', text: bullet[1] ?? '' };
  const heading = line.match(/^(#{1,3})\s+(.*)$/);
  if (heading) {
    return {
      id: newBlockId(),
      type: 'heading',
      level: heading[1].length as 1 | 2 | 3,
      text: heading[2] ?? '',
    };
  }
  const quote = line.match(/^>\s?(.*)$/);
  if (quote) return { id: newBlockId(), type: 'quote', text: quote[1] ?? '' };
  return { id: newBlockId(), type: 'paragraph', text: line };
}

export function splitContent(content: string): { title: string; blocks: Block[] } {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const title = (lines[0] ?? '').trim();
  const rest = lines.slice(1);
  const blocks = rest.length > 0 ? rest.map(lineToBlock) : [emptyBlock()];
  return { title, blocks };
}

export function mirrorContent(title: string, blocks: Block[]): string {
  const body = blocks
    .filter((block) => block.text.trim() || block.type === 'todo')
    .map((block) => {
      if (block.type === 'todo') return `- [${block.checked ? 'x' : ' '}] ${block.text}`;
      if (block.type === 'bullet') return `- ${block.text}`;
      if (block.type === 'heading') return `${'#'.repeat(block.level ?? 2)} ${block.text}`;
      if (block.type === 'quote') return `> ${block.text}`;
      return block.text;
    })
    .join('\n');
  if (!title.trim()) return body;
  if (!body) return title;
  return `${title}\n${body}`;
}

export function blockPlainText(blocks: Block[] | undefined): string {
  return (blocks ?? []).map((block) => block.text).join('\n');
}

const LINK_RE = /\[\[([0-9a-fA-F-]{8,})\]\]/g;

export function extractLinkIds(text: string): string[] {
  return [...text.matchAll(LINK_RE)].map((match) => match[1]);
}

export function linkIdsInNode(node: NodeRecord): string[] {
  const fromContent = extractLinkIds(node.content);
  const fromBlocks = (node.blocks ?? []).flatMap((block) => extractLinkIds(block.text));
  return [...new Set([...fromContent, ...fromBlocks])];
}

export function objectTitle(node: Pick<NodeRecord, 'title' | 'content' | 'id'> | undefined): string {
  if (!node) return '';
  const title = node.title?.trim();
  if (title) return title;
  const line = node.content.split('\n')[0]?.trim() ?? '';
  return line;
}

export function splitIds(value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  return value.split('|').map((part) => part.trim()).filter(Boolean);
}

export function joinIds(ids: string[]): string {
  return [...new Set(ids.filter(Boolean))].join('|');
}
