import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isEmail, parseAddressList } from './addresses.js';
import { sanitizeMailHtml, textToHtml } from './sanitize.js';

export const SYSTEM_FOLDERS = [
  { id: 'inbox', name: 'Doručená', order: 0 },
  { id: 'sent', name: 'Odeslaná', order: 1 },
  { id: 'drafts', name: 'Koncepty', order: 2 },
  { id: 'archive', name: 'Archiv', order: 3 },
  { id: 'spam', name: 'Nevyžádané', order: 4 },
  { id: 'trash', name: 'Koš', order: 5 },
];

const SYSTEM_IDS = new Set(SYSTEM_FOLDERS.map((folder) => folder.id));

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function message(fields) {
  return {
    cc: [],
    bcc: [],
    html: '',
    unread: false,
    starred: false,
    demo: true,
    localOnly: false,
    inReplyTo: null,
    references: [],
    remoteUid: null,
    remoteMailbox: null,
    attachments: [],
    ...fields,
  };
}

export function demoMessages() {
  const rentId = 'demo-rent';
  const rentMessageId = '<demo-rent@posta.local>';
  const notesId = 'demo-notes';
  const notesMessageId = '<demo-notes@posta.local>';
  const replyId = 'demo-notes-reply';
  return [
    message({
      id: 'demo-cafe',
      folderId: 'inbox',
      threadId: 'thread-cafe',
      messageId: '<demo-cafe@posta.local>',
      from: { name: 'Eva Hrubá', email: 'eva.hruba@example.com' },
      to: [{ name: 'Já', email: 'ja@posta.local' }],
      subject: 'Čtvrtek v kavárně',
      text: 'Ahoj,\n\nstavím se ve čtvrtek kolem čtvrté do Libuše. Kdybys nestíhal, napiš ještě zítra dopoledne.\n\nEva',
      date: hoursAgo(1.2),
      unread: true,
    }),
    message({
      id: 'demo-photos',
      folderId: 'inbox',
      threadId: 'thread-photos',
      messageId: '<demo-photos@posta.local>',
      from: { name: 'Marek Svoboda', email: 'marek.svoboda@example.com' },
      to: [{ name: 'Já', email: 'ja@posta.local' }],
      subject: 'Fotky z víkendu',
      text: 'Ahoj, posílám odkaz na fotky z Berounky.\n\nhttps://example.com/berounka\n\nTy od jezu jsou tvoje, jestli je chceš do alba. Marek',
      date: hoursAgo(5),
      unread: true,
      starred: true,
    }),
    message({
      id: rentId,
      folderId: 'inbox',
      threadId: 'thread-rent',
      messageId: rentMessageId,
      from: { name: 'Alena Králová', email: 'alena.kralova@example.com' },
      to: [{ name: 'Já', email: 'ja@posta.local' }],
      subject: 'Nájem na prosinec',
      text: 'Dobrý den,\n\npřipomínám nájem za prosinec, splatný do 5. 12. Číslo účtu zůstává stejné.\n\nDíky,\nAlena Králová',
      date: hoursAgo(26),
      unread: false,
    }),
    message({
      id: 'demo-rent-draft',
      folderId: 'drafts',
      threadId: 'thread-rent',
      messageId: '<demo-rent-draft@posta.local>',
      inReplyTo: rentMessageId,
      references: [rentMessageId],
      from: { name: 'Já', email: 'ja@posta.local' },
      to: [{ name: 'Alena Králová', email: 'alena.kralova@example.com' }],
      subject: 'Re: Nájem na prosinec',
      text: 'Dobrý den,\n\nděkuji za připomínku, nájem pošlu do pátku.\n\n',
      date: hoursAgo(3),
      unread: false,
    }),
    message({
      id: notesId,
      folderId: 'inbox',
      threadId: 'thread-notes',
      messageId: notesMessageId,
      from: { name: 'Martin Říha', email: 'martin.riha@example.com' },
      to: [{ name: 'Já', email: 'ja@posta.local' }],
      cc: [{ name: 'Eva Hrubá', email: 'eva.hruba@example.com' }],
      subject: 'Poznámky k prázdným domům',
      text: 'Ahoj,\n\nprošel jsem seznam z minulého týdne. U tří domů na Žižkově chybí rok stavby, doplním to večer. Koukni na to prosím taky.\n\nMartin',
      date: hoursAgo(30),
      unread: false,
    }),
    message({
      id: replyId,
      folderId: 'sent',
      threadId: 'thread-notes',
      messageId: '<demo-notes-reply@posta.local>',
      inReplyTo: notesMessageId,
      references: [notesMessageId],
      from: { name: 'Já', email: 'ja@posta.local' },
      to: [{ name: 'Martin Říha', email: 'martin.riha@example.com' }],
      cc: [{ name: 'Eva Hrubá', email: 'eva.hruba@example.com' }],
      subject: 'Re: Poznámky k prázdným domům',
      text: 'Ahoj Martine,\n\ndíky, Žižkov se podívám zítra. U domu na Rokycanově mám v poznámkách rok 1911, můžu ho doplnit.\n',
      date: hoursAgo(20),
      unread: false,
    }),
    message({
      id: 'demo-library',
      folderId: 'archive',
      threadId: 'thread-library',
      messageId: '<demo-library@posta.local>',
      from: { name: 'Městská knihovna', email: 'vypujcky@example.com' },
      to: [{ name: 'Já', email: 'ja@posta.local' }],
      subject: 'Výpůjčka končí v pátek',
      text: 'Dobrý den,\n\nvýpůjčka „Praha neznámá“ končí v pátek. Prodlužte ji v katalogu, nebo knihu vraťte na kteroukoliv pobočku.\n',
      date: hoursAgo(80),
      unread: false,
    }),
    message({
      id: 'demo-spam',
      folderId: 'spam',
      threadId: 'thread-spam',
      messageId: '<demo-spam@posta.local>',
      from: { name: 'Cestovka', email: 'vyhra@example.net' },
      to: [{ name: 'Já', email: 'ja@posta.local' }],
      subject: 'Vyhráli jste zájezd',
      text: 'Gratulujeme, vaše adresa byla vylosována. Klikněte na odkaz a zadejte heslo k účtu.\n\nhttps://example.net/vyhra',
      date: hoursAgo(12),
      unread: true,
    }),
    message({
      id: 'demo-trash',
      folderId: 'trash',
      threadId: 'thread-trash',
      messageId: '<demo-trash@posta.local>',
      from: { name: 'Novinky', email: 'novinky@example.com' },
      to: [{ name: 'Já', email: 'ja@posta.local' }],
      subject: 'Týdenní přehled',
      text: 'Tohle jsi vyhodil do koše. Z koše jde smazat natrvalo.',
      date: hoursAgo(50),
      unread: false,
    }),
  ];
}

function emptyData() {
  return {
    account: null,
    folders: SYSTEM_FOLDERS.map((folder) => ({
      ...folder,
      system: true,
      remotePath: null,
    })),
    messages: [],
  };
}

function snippetOf(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function summaryOf(item) {
  return {
    id: item.id,
    folderId: item.folderId,
    threadId: item.threadId,
    from: item.from,
    to: item.to,
    subject: item.subject,
    snippet: snippetOf(item.text),
    date: item.date,
    unread: item.unread,
    starred: item.starred,
    localOnly: item.localOnly,
    demo: item.demo,
    attachments: item.attachments.length,
  };
}

export function publicAccount(account) {
  if (!account) {
    return {
      connected: false,
      hasPassword: false,
      name: '',
      email: '',
      provider: 'gmail',
    };
  }
  return {
    connected: Boolean(account.password && account.smtpHost && account.email),
    hasPassword: Boolean(account.password),
    name: account.name || '',
    email: account.email || '',
    username: account.username || account.email || '',
    provider: account.provider || 'gmail',
    imapHost: account.imapHost || '',
    imapPort: account.imapPort || 993,
    imapSecure: account.imapSecure !== false,
    smtpHost: account.smtpHost || '',
    smtpPort: account.smtpPort || 465,
    smtpSecure: account.smtpSecure !== false,
  };
}

export function mergeAccount(previous, patch = {}) {
  const provider = patch.provider || previous?.provider || 'gmail';
  const email = String(patch.email ?? previous?.email ?? '').trim();
  if (!isEmail(email)) throw new Error('Vyplň platný e-mail účtu.');
  const name = String(patch.name ?? previous?.name ?? '').trim() || email;
  const username = String(patch.username ?? previous?.username ?? email).trim() || email;
  const password = patch.password ? String(patch.password) : previous?.password || '';
  const hosts = provider === 'gmail'
    ? {
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpSecure: true,
    }
    : {
      imapHost: String(patch.imapHost ?? previous?.imapHost ?? '').trim(),
      imapPort: Number(patch.imapPort ?? previous?.imapPort ?? 993),
      imapSecure: patch.imapSecure ?? previous?.imapSecure ?? true,
      smtpHost: String(patch.smtpHost ?? previous?.smtpHost ?? '').trim(),
      smtpPort: Number(patch.smtpPort ?? previous?.smtpPort ?? 465),
      smtpSecure: patch.smtpSecure ?? previous?.smtpSecure ?? true,
    };
  if (provider !== 'gmail' && (!hosts.imapHost || !hosts.smtpHost)) {
    throw new Error('U vlastního serveru vyplň IMAP i SMTP adresu.');
  }
  return {
    name,
    email,
    username,
    provider,
    password,
    ...hosts,
  };
}

function folderSummaries(data) {
  return [...data.folders]
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'cs'))
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      system: folder.system,
      unread: data.messages.filter((item) => item.folderId === folder.id && item.unread).length,
    }));
}

function fullMessage(item) {
  return {
    id: item.id,
    folderId: item.folderId,
    threadId: item.threadId,
    messageId: item.messageId,
    inReplyTo: item.inReplyTo,
    from: item.from,
    to: item.to,
    cc: item.cc,
    bcc: item.bcc,
    subject: item.subject,
    text: item.text,
    html: item.html || textToHtml(item.text),
    date: item.date,
    unread: item.unread,
    starred: item.starred,
    localOnly: item.localOnly,
    demo: item.demo,
    attachments: item.attachments,
  };
}

export function openStore(filePath, { seed = true } = {}) {
  let data = emptyData();

  function load() {
    if (!fs.existsSync(filePath)) {
      data = emptyData();
      if (seed) data.messages = demoMessages();
      persist();
      return;
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data = {
      account: parsed.account || null,
      folders: Array.isArray(parsed.folders) && parsed.folders.length ? parsed.folders : emptyData().folders,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
    for (const folder of SYSTEM_FOLDERS) {
      if (!data.folders.some((item) => item.id === folder.id)) {
        data.folders.push({ ...folder, system: true, remotePath: null });
      }
    }
  }

  function persist() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temp = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(data));
    fs.renameSync(temp, filePath);
  }

  let chain = Promise.resolve();
  function mutate(fn) {
    const run = chain.then(fn);
    chain = run.then(() => {}, () => {});
    return run;
  }

  function requireMessage(id) {
    const item = data.messages.find((messageItem) => messageItem.id === id);
    if (!item) {
      const error = new Error('Zpráva neexistuje.');
      error.status = 404;
      throw error;
    }
    return item;
  }

  function requireFolder(id) {
    const folder = data.folders.find((item) => item.id === id);
    if (!folder) throw new Error('Složka neexistuje.');
    return folder;
  }

  load();

  return {
    filePath,
    snapshot() {
      return {
        account: publicAccount(data.account),
        me: data.account
          ? { name: data.account.name, email: data.account.email }
          : { name: 'Já', email: 'ja@posta.local' },
        folders: folderSummaries(data),
        messages: [...data.messages]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map(summaryOf),
        demo: data.messages.some((item) => item.demo),
      };
    },
    credentials() {
      return data.account ? { ...data.account } : null;
    },
    canSend() {
      return Boolean(data.account?.password && data.account.smtpHost && data.account.email);
    },
    previewAccount(patch) {
      return mergeAccount(data.account, patch);
    },
    saveAccount(patch) {
      return mutate(() => {
        data.account = mergeAccount(data.account, patch);
        persist();
        return publicAccount(data.account);
      });
    },
    read(id) {
      const item = requireMessage(id);
      if (item.unread && item.folderId !== 'drafts') {
        item.unread = false;
        persist();
      }
      const thread = data.messages
        .filter((messageItem) => messageItem.threadId === item.threadId)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(fullMessage);
      return { message: fullMessage(item), thread, folders: folderSummaries(data) };
    },
    patch(id, patch) {
      return mutate(() => {
        const item = requireMessage(id);
        if (typeof patch.unread === 'boolean') item.unread = patch.unread;
        if (typeof patch.starred === 'boolean') item.starred = patch.starred;
        if (patch.folderId) {
          requireFolder(patch.folderId);
          item.folderId = patch.folderId;
        }
        persist();
        return { message: fullMessage(item), folders: folderSummaries(data) };
      });
    },
    trash(id) {
      return mutate(() => {
        const item = requireMessage(id);
        if (item.folderId === 'trash') {
          data.messages = data.messages.filter((messageItem) => messageItem.id !== id);
        } else {
          item.folderId = 'trash';
          item.unread = false;
        }
        persist();
        return { folders: folderSummaries(data) };
      });
    },
    createFolder(name) {
      return mutate(() => {
        const trimmed = String(name || '').trim();
        if (!trimmed) throw new Error('Složka potřebuje jméno.');
        if (data.folders.some((folder) => folder.name.toLowerCase() === trimmed.toLowerCase())) {
          throw new Error('Složka s tímhle jménem už je.');
        }
        const folder = {
          id: `folder:${crypto.randomUUID()}`,
          name: trimmed,
          system: false,
          remotePath: null,
          order: 100 + data.folders.length,
        };
        data.folders.push(folder);
        persist();
        return { folder, folders: folderSummaries(data) };
      });
    },
    deleteFolder(id) {
      return mutate(() => {
        const folder = requireFolder(id);
        if (folder.system || SYSTEM_IDS.has(folder.id)) throw new Error('Systémovou složku nejde smazat.');
        for (const item of data.messages) {
          if (item.folderId === id) item.folderId = 'inbox';
        }
        data.folders = data.folders.filter((item) => item.id !== id);
        persist();
        return { folders: folderSummaries(data) };
      });
    },
    clearDemo() {
      return mutate(() => {
        data.messages = data.messages.filter((item) => !item.demo);
        persist();
        return { folders: folderSummaries(data) };
      });
    },
    buildOutgoing(input) {
      const action = input.action === 'draft' ? 'draft' : 'send';
      const existing = input.draftId
        ? data.messages.find((item) => item.id === input.draftId && item.folderId === 'drafts')
        : null;
      if (input.draftId && !existing) throw new Error('Koncept už neexistuje.');
      const original = input.replyToId ? requireMessage(input.replyToId) : null;
      const to = parseAddressList(input.to);
      const cc = parseAddressList(input.cc);
      const bcc = parseAddressList(input.bcc);
      if (action === 'send' && to.length === 0) throw new Error('Chybí příjemce.');
      const subject = String(input.subject || '').trim();
      const text = String(input.text || '');
      const me = data.account
        ? { name: data.account.name, email: data.account.email }
        : { name: 'Já', email: 'ja@posta.local' };
      const keepDraft = action === 'draft' && existing;
      return {
        replaceId: existing ? existing.id : null,
        message: {
          id: keepDraft ? existing.id : crypto.randomUUID(),
          folderId: action === 'draft' ? 'drafts' : 'sent',
          threadId: original?.threadId || existing?.threadId || crypto.randomUUID(),
          messageId: keepDraft ? existing.messageId : `<${crypto.randomUUID()}@posta.local>`,
          inReplyTo: original?.messageId || existing?.inReplyTo || null,
          references: original
            ? [...(original.references || []), original.messageId]
            : existing?.references || [],
          from: me,
          to,
          cc,
          bcc,
          subject,
          text,
          html: textToHtml(text),
          date: new Date().toISOString(),
          unread: false,
          starred: existing?.starred || false,
          demo: false,
          localOnly: action === 'send' ? !this.canSend() : false,
          remoteUid: null,
          remoteMailbox: null,
          attachments: [],
        },
      };
    },
    commitOutgoing(outgoing) {
      return mutate(() => {
        if (outgoing.replaceId) {
          data.messages = data.messages.filter((item) => item.id !== outgoing.replaceId);
        }
        data.messages.push(outgoing.message);
        persist();
        return { message: fullMessage(outgoing.message), folders: folderSummaries(data) };
      });
    },
    applyRemote(entries) {
      return mutate(() => {
        let imported = 0;
        for (const entry of entries) {
          const folderId = rememberFolder(entry.classified);
          if (!folderId) continue;
          const record = { ...entry.record, folderId };
          if (upsertRemote(record)) imported += 1;
        }
        if (imported > 0) data.messages = data.messages.filter((item) => !item.demo);
        persist();
        return { imported, folders: folderSummaries(data) };
      });
    },
  };

  function rememberFolder(classified) {
    if (!classified) return null;
    if (classified.kind === 'system') {
      const folder = data.folders.find((item) => item.id === classified.id);
      if (folder && classified.remotePath) folder.remotePath = classified.remotePath;
      return classified.id;
    }
    let folder = data.folders.find((item) => item.remotePath === classified.remotePath || item.id === classified.id);
    if (!folder) {
      folder = {
        id: classified.id,
        name: classified.name,
        system: false,
        remotePath: classified.remotePath,
        order: 100 + data.folders.length,
      };
      data.folders.push(folder);
    } else if (classified.name) {
      folder.name = classified.name;
      folder.remotePath = classified.remotePath;
    }
    return folder.id;
  }

  function upsertRemote(record) {
    const identity = record.messageId
      ? data.messages.find((item) => item.messageId === record.messageId)
      : null;
    const byUid = data.messages.find((item) => (
      item.remoteMailbox === record.remoteMailbox && item.remoteUid === record.remoteUid
    ));
    const existing = identity || byUid;
    if (existing) {
      existing.folderId = record.folderId;
      existing.unread = record.unread;
      existing.starred = record.starred;
      existing.remoteUid = record.remoteUid;
      existing.remoteMailbox = record.remoteMailbox;
      existing.demo = false;
      return false;
    }
    data.messages.push(record);
    return true;
  }
}
