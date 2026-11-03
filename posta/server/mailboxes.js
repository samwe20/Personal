const SPECIAL = {
  '\\Inbox': 'inbox',
  '\\Sent': 'sent',
  '\\Drafts': 'drafts',
  '\\Trash': 'trash',
  '\\Junk': 'spam',
  '\\Archive': 'archive',
};

const SKIP_SPECIAL = new Set(['\\All', '\\Flagged', '\\Important']);

function flagsOf(box) {
  if (!box?.flags) return [];
  return [...box.flags].map(String);
}

function fallbackId(path) {
  const lower = String(path || '').toLowerCase();
  if (/(all mail|všechny zprávy|vsechny zpravy)/.test(lower)) return null;
  if (lower === 'inbox' || lower.endsWith('/inbox')) return 'inbox';
  if (/(^|\/)(sent|odeslan)/.test(lower) || lower.includes('sent mail') || lower.includes('odeslaná') || lower.includes('odeslana')) {
    return 'sent';
  }
  if (/(draft|koncept)/.test(lower)) return 'drafts';
  if (/(trash|deleted|koš|kos|bin)/.test(lower)) return 'trash';
  if (/(spam|junk|nevyžádan|nevyzaadan)/.test(lower)) return 'spam';
  if (/(archive|archiv)/.test(lower)) return 'archive';
  return undefined;
}

export function classifyMailbox(box) {
  const flags = flagsOf(box);
  const special = String(box?.specialUse || '');
  if (SKIP_SPECIAL.has(special)) return null;
  if (flags.includes('\\Noselect') && !SPECIAL[special]) return null;

  const path = String(box?.path || '').trim();
  if (SPECIAL[special]) {
    return { kind: 'system', id: SPECIAL[special], remotePath: path || null };
  }

  const fallback = fallbackId(path);
  if (fallback) return { kind: 'system', id: fallback, remotePath: path || null };
  if (fallback === null || !path) return null;
  if (/(^|\/)(starred|important)$/.test(path.toLowerCase()) || /\/(s hvězdičkou|důležité)$/i.test(path)) {
    return null;
  }

  const name = String(box?.name || path).replace(/^\[Gmail\]\//, '');
  return { kind: 'custom', id: `box:${path}`, name, remotePath: path };
}
