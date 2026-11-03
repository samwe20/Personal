import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseAddressList } from '../server/addresses.js';
import { classifyMailbox } from '../server/mailboxes.js';
import { explainMailError } from '../server/sync.js';
import { sanitizeMailHtml, textToHtml } from '../server/sanitize.js';
import { openStore } from '../server/store.js';
import { createServer } from '../server/index.js';

function tempStore(seed = true) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'posta-'));
  return openStore(path.join(dir, 'mailbox.json'), { seed });
}

test('adresy se rozdělí na jméno a e-mail', () => {
  const people = parseAddressList('Eva Hrubá <eva.hruba@example.com>, marek@example.com');
  assert.equal(people.length, 2);
  assert.deepEqual(people[0], { name: 'Eva Hrubá', email: 'eva.hruba@example.com' });
  assert.equal(people[1].email, 'marek@example.com');
  assert.throws(() => parseAddressList('není adresa'), /Neplatná adresa/);
});

test('html pošty zahodí skript a text se escapuje', () => {
  const clean = sanitizeMailHtml('<p onclick="evil()">Ahoj</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>');
  assert.doesNotMatch(clean, /script|onclick|javascript/i);
  assert.match(clean, /Ahoj/);
  const html = textToHtml('Ahoj <script>\n\nhttps://example.com');
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="https:\/\/example.com"/);
});

test('složky Gmailu se namapují a All Mail se přeskočí', () => {
  assert.equal(classifyMailbox({ path: 'INBOX', specialUse: '\\Inbox' }).id, 'inbox');
  assert.equal(classifyMailbox({ path: '[Gmail]/Odeslaná pošta', specialUse: '\\Sent' }).id, 'sent');
  assert.equal(classifyMailbox({ path: '[Gmail]/Všechny zprávy', specialUse: '\\All' }), null);
  assert.equal(classifyMailbox({ path: '[Gmail]', flags: new Set(['\\Noselect']) }), null);
  assert.equal(classifyMailbox({ path: 'Práce', name: 'Práce' }).id, 'box:Práce');
});

test('ukázková schránka umí odpovědět, uložit koncept a vyhodit poštu', async () => {
  const store = tempStore();
  const snap = store.snapshot();
  assert.equal(snap.demo, true);
  assert.equal(JSON.stringify(snap).includes('password'), false);
  const inbox = snap.folders.find((folder) => folder.id === 'inbox');
  assert.equal(inbox.unread, 2);

  const sent = store.buildOutgoing({
    action: 'send',
    to: 'Eva Hrubá <eva.hruba@example.com>',
    subject: 'Re: Čtvrtek',
    text: 'Budu tam.',
    replyToId: 'demo-cafe',
  });
  assert.equal(sent.message.localOnly, true);
  assert.equal(sent.message.inReplyTo, '<demo-cafe@posta.local>');
  assert.equal(sent.message.folderId, 'sent');
  await store.commitOutgoing(sent);

  const draft = store.buildOutgoing({
    action: 'draft',
    to: 'marek@example.com',
    subject: 'Rozepsané',
    text: 'ještě ne',
  });
  await store.commitOutgoing(draft);
  assert.equal(store.snapshot().messages.some((item) => item.subject === 'Rozepsané' && item.folderId === 'drafts'), true);

  await store.trash('demo-cafe');
  assert.equal(store.snapshot().messages.find((item) => item.id === 'demo-cafe').folderId, 'trash');
  await store.trash('demo-cafe');
  assert.equal(store.snapshot().messages.some((item) => item.id === 'demo-cafe'), false);

  await store.createFolder('Rodina');
  await assert.rejects(() => store.createFolder('rodina'), /už je/);
  await assert.rejects(() => store.patch('demo-photos', { folderId: 'missing' }), /Složka neexistuje/);
});

test('stažená pošta nahradí ukázku a nezdvojí se', async () => {
  const store = tempStore();
  const record = {
    id: 'remote-1',
    threadId: '<remote@example.com>',
    messageId: '<remote@example.com>',
    inReplyTo: null,
    references: [],
    from: { name: 'Úřad', email: 'urad@example.com' },
    to: [{ name: '', email: 'ja@example.com' }],
    cc: [],
    bcc: [],
    subject: 'Dopis',
    text: 'Dobrý den',
    html: '<p>Dobrý den</p>',
    date: new Date().toISOString(),
    unread: true,
    starred: false,
    demo: false,
    localOnly: false,
    remoteUid: 10,
    remoteMailbox: 'INBOX',
    attachments: [],
  };
  const first = await store.applyRemote([{
    classified: { kind: 'system', id: 'inbox', remotePath: 'INBOX' },
    record,
  }]);
  assert.equal(first.imported, 1);
  assert.equal(store.snapshot().demo, false);
  assert.equal(store.snapshot().messages.length, 1);
  const again = await store.applyRemote([{
    classified: { kind: 'system', id: 'inbox', remotePath: 'INBOX' },
    record: { ...record, id: 'remote-2', unread: false, starred: true },
  }]);
  assert.equal(again.imported, 0);
  const only = store.snapshot().messages[0];
  assert.equal(only.starred, true);
  assert.equal(only.unread, false);
});

test('heslo z chyby serveru se nevrací', () => {
  assert.equal(explainMailError(new Error('failed with heslo-aplikace'), 'heslo-aplikace'), 'Spojení se nezdařilo.');
  assert.match(explainMailError(new Error('Invalid credentials')), /heslo aplikace/);
});

test('účet v odpovědi neobsahuje heslo a http schránka funguje', async () => {
  const store = tempStore();
  await store.saveAccount({
    name: 'Jan Novák',
    email: 'jan.novak@example.com',
    provider: 'gmail',
    password: 'tajne-heslo',
  });
  const account = store.snapshot().account;
  assert.equal(account.email, 'jan.novak@example.com');
  assert.equal(account.connected, true);
  assert.equal(account.imapHost, 'imap.gmail.com');
  assert.equal('password' in account, false);

  const server = createServer(store);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const mailbox = await fetch(`http://127.0.0.1:${port}/api/mailbox`).then((response) => response.json());
    assert.equal(mailbox.account.hasPassword, true);
    assert.equal(JSON.stringify(mailbox).includes('tajne-heslo'), false);
    const page = await fetch(`http://127.0.0.1:${port}/`).then((response) => response.text());
    assert.match(page, /Pošta/);
    const missing = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'send', to: '', subject: 'Ahoj', text: 'Text' }),
    });
    assert.equal(missing.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('zpráva bez připojeného účtu zůstane v odeslané', async () => {
  const store = tempStore(false);
  const server = createServer(store);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'send', to: 'eva@example.com', subject: 'Ahoj', text: 'Text' }),
    });
    const created = await response.json();
    assert.equal(response.status, 201);
    assert.equal(created.message.localOnly, true);
    assert.equal(created.message.folderId, 'sent');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
