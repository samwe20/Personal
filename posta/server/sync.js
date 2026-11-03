import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import { formatAddress } from './addresses.js';
import { classifyMailbox } from './mailboxes.js';
import { sanitizeMailHtml } from './sanitize.js';

const DEFAULT_LIMIT = 40;
const MAX_SOURCE = 3_000_000;

export function explainMailError(error, secret = '') {
  const text = String(error?.message || error || '');
  if (secret && text.includes(secret)) return 'Spojení se nezdařilo.';
  if (error?.authenticationFailed || /auth|invalid credentials|535|username and password/i.test(text)) {
    return 'Přihlášení neprošlo. U Gmailu patří do pole hesla heslo aplikace, ne heslo k účtu.';
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|timed out|timeout|certificate/i.test(text)) {
    return 'Server se neozval. Zkontroluj adresu, port a zabezpečení.';
  }
  return 'Spojení se nezdařilo. Zkontroluj e-mail, heslo a server.';
}

function clientOptions(account) {
  return {
    host: account.imapHost,
    port: Number(account.imapPort) || 993,
    secure: account.imapSecure !== false,
    auth: {
      user: account.username || account.email,
      pass: account.password,
    },
    logger: false,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  };
}

function people(address) {
  return (address?.value || [])
    .map((item) => ({ name: item.name || '', email: item.address || '' }))
    .filter((item) => item.email);
}

function threadKey(parsed, fallback) {
  const references = Array.isArray(parsed.references)
    ? parsed.references
    : (parsed.references ? [parsed.references] : []);
  return references[0] || parsed.inReplyTo || parsed.messageId || fallback;
}

function plainFromHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function withImap(account, fn) {
  if (!account?.password || !account.imapHost || !account.email) {
    throw new Error('Nejdřív vyplň e-mail a heslo aplikace.');
  }
  const client = new ImapFlow(clientOptions(account));
  client.on('error', () => {});
  try {
    await client.connect();
    return await fn(client);
  } catch (error) {
    throw new Error(explainMailError(error, account.password));
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function checkLogin(account) {
  const mailboxes = await withImap(account, async (client) => client.list());
  return { mailboxes: mailboxes.length };
}

export async function downloadMail(account, { limit = DEFAULT_LIMIT } = {}) {
  return withImap(account, async (client) => {
    const listed = await client.list();
    const entries = [];
    for (const box of listed) {
      const classified = classifyMailbox(box);
      if (!classified?.remotePath) continue;
      let lock;
      try {
        lock = await client.getMailboxLock(classified.remotePath);
      } catch {
        continue;
      }
      try {
        const exists = client.mailbox?.exists || 0;
        if (!exists) continue;
        const uidNext = client.mailbox?.uidNext || exists + 1;
        const fromUid = Math.max(1, uidNext - limit);
        for await (const msg of client.fetch(`${fromUid}:*`, {
          uid: true,
          flags: true,
          source: true,
          internalDate: true,
        }, { uid: true })) {
          entries.push(await toEntry(msg, classified));
        }
      } finally {
        lock.release();
      }
    }
    return entries;
  });
}

async function toEntry(msg, classified) {
  const flags = msg.flags ? [...msg.flags].map(String) : [];
  const fallbackId = `<remote-${classified.remotePath}-${msg.uid}@posta.local>`;
  let parsed = null;
  if (msg.source && msg.source.length <= MAX_SOURCE) {
    parsed = await simpleParser(msg.source);
  }
  const messageId = parsed?.messageId || fallbackId;
  const text = parsed?.text || plainFromHtml(parsed?.html) || (msg.source?.length > MAX_SOURCE
    ? 'Zpráva je moc velká, takže je tu jen hlavička.'
    : '');
  return {
    classified,
    record: {
      id: crypto.randomUUID(),
      threadId: threadKey(parsed || {}, messageId),
      messageId,
      inReplyTo: parsed?.inReplyTo || null,
      references: Array.isArray(parsed?.references)
        ? parsed.references
        : (parsed?.references ? [parsed.references] : []),
      from: people(parsed?.from)[0] || { name: '', email: '' },
      to: people(parsed?.to),
      cc: people(parsed?.cc),
      bcc: [],
      subject: parsed?.subject || '(bez předmětu)',
      text,
      html: sanitizeMailHtml(parsed?.html || ''),
      date: (parsed?.date || msg.internalDate || new Date()).toISOString(),
      unread: !flags.includes('\\Seen'),
      starred: flags.includes('\\Flagged'),
      demo: false,
      localOnly: false,
      remoteUid: msg.uid,
      remoteMailbox: classified.remotePath,
      attachments: (parsed?.attachments || []).map((item) => ({
        filename: item.filename || 'příloha',
        contentType: item.contentType || 'application/octet-stream',
        size: item.size || item.content?.length || 0,
      })),
    },
  };
}

export async function deliverMail(account, message) {
  if (!account?.password || !account.smtpHost) {
    throw new Error('Odeslání není nastavené.');
  }
  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: Number(account.smtpPort) || 465,
    secure: account.smtpSecure !== false,
    auth: {
      user: account.username || account.email,
      pass: account.password,
    },
  });
  try {
    await transporter.sendMail({
      from: formatAddress({ name: account.name, email: account.email }),
      to: message.to.map(formatAddress),
      cc: message.cc.length ? message.cc.map(formatAddress) : undefined,
      bcc: message.bcc.length ? message.bcc.map(formatAddress) : undefined,
      subject: message.subject,
      text: message.text,
      html: message.html,
      messageId: message.messageId,
      inReplyTo: message.inReplyTo || undefined,
      references: message.references?.length ? message.references : undefined,
    });
  } catch (error) {
    throw new Error(explainMailError(error, account.password));
  }
}
