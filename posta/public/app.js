const $ = (id) => document.getElementById(id);

const state = {
  mailbox: null,
  folderId: 'inbox',
  query: '',
  searchAll: false,
  selectedId: null,
  opened: null,
  busy: false,
  compose: null,
};

const zone = 'Europe/Prague';

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value == null ? '' : String(value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value != null && value !== false) node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Požadavek selhal.');
  return data;
}

function toast(text) {
  const node = $('toast');
  node.textContent = text;
  node.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { node.hidden = true; }, 4200);
}

function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date().toLocaleDateString('cs-CZ', { timeZone: zone });
  const day = date.toLocaleDateString('cs-CZ', { timeZone: zone });
  if (day === today) {
    return new Intl.DateTimeFormat('cs-CZ', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('cs-CZ', { timeZone: zone, day: 'numeric', month: 'numeric' }).format(date);
}

function formatFull(iso) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('cs-CZ', { timeZone: zone, dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function personLabel(person) {
  if (!person) return '';
  if (person.name && person.email) return `${person.name} <${person.email}>`;
  return person.name || person.email || '';
}

function initials(person) {
  const source = person?.name || person?.email || '?';
  const parts = source.replace(/@.*/, '').split(/[\s.]+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function hue(email) {
  let value = 0;
  for (const char of String(email || '')) value = (value * 33 + char.charCodeAt(0)) % 360;
  return value;
}

function setHtml(node, html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, link, meta, style').forEach((item) => item.remove());
  for (const element of doc.querySelectorAll('*')) {
    for (const attr of [...element.attributes]) {
      if (attr.name.startsWith('on') || attr.name === 'style') element.removeAttribute(attr.name);
      if ((attr.name === 'href' || attr.name === 'src') && /^\s*javascript:/i.test(attr.value)) {
        element.removeAttribute(attr.name);
      }
    }
  }
  node.replaceChildren(...[...doc.body.childNodes]);
}

function currentFolder() {
  return state.mailbox?.folders.find((folder) => folder.id === state.folderId) || state.mailbox?.folders[0];
}

function visibleMessages() {
  const query = state.query.trim().toLowerCase();
  return (state.mailbox?.messages || []).filter((item) => {
    if (!state.searchAll && item.folderId !== state.folderId) return false;
    if (!query) return true;
    const blob = [
      item.subject,
      item.snippet,
      item.from?.name,
      item.from?.email,
      ...(item.to || []).flatMap((person) => [person.name, person.email]),
    ].join(' ').toLowerCase();
    return blob.includes(query);
  });
}

function myEmails() {
  const emails = new Set(['ja@posta.local']);
  if (state.mailbox?.me?.email) emails.add(state.mailbox.me.email.toLowerCase());
  return emails;
}

function isMine(person) {
  return myEmails().has(String(person?.email || '').toLowerCase());
}

function renderFolders() {
  const list = $('folders');
  list.replaceChildren(...state.mailbox.folders.map((folder) => {
    const button = el('button', {
      class: `folder${folder.id === state.folderId ? ' active' : ''}`,
      type: 'button',
      onClick: () => {
        state.folderId = folder.id;
        state.searchAll = false;
        $('search-all').checked = false;
        $('app').dataset.pane = 'list';
        const first = visibleMessages()[0];
        state.selectedId = first?.id || null;
        state.opened = null;
        renderFolders();
        renderList();
        renderReading();
        if (first && first.folderId !== 'drafts') openSelected();
      },
    }, [
      el('span', { class: 'folder-name', text: folder.name }),
      folder.unread ? el('span', { class: 'folder-count', text: folder.unread }) : null,
    ]);
    const row = el('div', { class: 'folder-row' }, [button]);
    if (!folder.system) {
      row.append(el('button', {
        class: 'folder-delete',
        type: 'button',
        title: 'Smazat složku',
        text: '×',
        onClick: () => removeFolder(folder),
      }));
    }
    return row;
  }));
}

function renderList() {
  const folder = currentFolder();
  $('folder-title').textContent = state.searchAll ? 'Hledání' : (folder?.name || 'Pošta');
  const items = visibleMessages();
  const unread = items.filter((item) => item.unread).length;
  $('folder-meta').textContent = items.length
    ? `${items.length} ${items.length === 1 ? 'zpráva' : items.length < 5 ? 'zprávy' : 'zpráv'}${unread ? ` · ${unread} nepřečtených` : ''}`
    : 'Žádné zprávy';
  const banner = $('demo-banner');
  if (state.mailbox.demo && !state.mailbox.account.connected) {
    banner.hidden = false;
    banner.textContent = 'Ukázková schránka. V nastavení připojíš Gmail a stáhneš vlastní poštu.';
  } else {
    banner.hidden = true;
  }
  const host = $('messages');
  if (!items.length) {
    host.replaceChildren(el('p', { class: 'empty', text: state.query ? 'Nic neodpovídá hledání.' : 'Tahle složka je prázdná.' }));
    return;
  }
  host.replaceChildren(...items.map((item) => {
    const open = el('button', {
      class: 'row-open',
      type: 'button',
      onClick: () => choose(item),
    }, [
      el('span', {
        class: 'avatar',
        text: initials(item.from),
        style: `background: hsl(${hue(item.from?.email)} 42% 36%)`,
      }),
      el('span', { class: 'row-main' }, [
        el('span', { class: 'row-top' }, [
          el('span', { class: 'from', text: item.from?.name || item.from?.email || 'Neznámý' }),
          el('time', { class: 'when', text: formatWhen(item.date) }),
        ]),
        el('span', { class: 'subject', text: item.subject || '(bez předmětu)' }),
        el('span', { class: 'snippet', text: `${state.searchAll ? `${folderName(item.folderId)} · ` : ''}${item.snippet}` }),
      ]),
    ]);
    return el('div', {
      class: `row${item.unread ? ' unread' : ''}${item.id === state.selectedId ? ' active' : ''}`,
      role: 'listitem',
    }, [
      open,
      el('button', {
        class: `star${item.starred ? ' on' : ''}`,
        type: 'button',
        title: item.starred ? 'Odebrat hvězdu' : 'Hvězda',
        text: '★',
        onClick: () => toggleStar(item),
      }),
    ]);
  }));
}

let searchToken = 0;
async function followSearch() {
  const token = ++searchToken;
  const items = visibleMessages();
  if (!items.some((item) => item.id === state.selectedId)) {
    state.selectedId = items.find((item) => item.folderId !== 'drafts')?.id || null;
  }
  renderList();
  if (!state.selectedId) {
    state.opened = null;
    renderReading();
    return;
  }
  if (state.opened?.message.id === state.selectedId) return;
  const opened = await api(`/api/messages/${encodeURIComponent(state.selectedId)}`);
  if (token !== searchToken) return;
  state.opened = opened;
  state.mailbox.folders = opened.folders;
  const summary = state.mailbox.messages.find((item) => item.id === state.selectedId);
  if (summary && summary.folderId !== 'drafts') summary.unread = false;
  renderFolders();
  renderList();
  renderReading();
}

function folderName(id) {
  return state.mailbox.folders.find((folder) => folder.id === id)?.name || '';
}

function renderReading() {
  const host = $('reading');
  const opened = state.opened;
  if (!opened) {
    host.replaceChildren(el('div', { class: 'empty-read' }, [
      el('strong', { text: 'Pošta' }),
      'Vyber zprávu, nebo napiš novou.',
    ]));
    return;
  }
  const message = opened.message;
  const toolbar = el('div', { class: 'read-toolbar' }, [
    el('button', { class: 'only-mobile', type: 'button', text: 'Zpět', onClick: () => { $('app').dataset.pane = 'list'; } }),
    el('button', { type: 'button', text: 'Odpovědět', onClick: () => startReply(message, false) }),
    el('button', { type: 'button', text: 'Všem', onClick: () => startReply(message, true) }),
    el('button', { type: 'button', text: 'Přeposlat', onClick: () => startForward(message) }),
    message.folderId === 'archive'
      ? el('button', { type: 'button', text: 'Do doručené', onClick: () => moveMessage(message, 'inbox') })
      : el('button', { type: 'button', text: 'Archivovat', onClick: () => moveMessage(message, 'archive') }),
    el('button', {
      class: 'danger',
      type: 'button',
      text: message.folderId === 'trash' ? 'Smazat natrvalo' : 'Smazat',
      onClick: () => trashMessage(message),
    }),
    el('button', {
      type: 'button',
      text: message.unread ? 'Přečtené' : 'Nepřečtené',
      onClick: () => markUnread(message, !message.unread),
    }),
    message.folderId === 'spam'
      ? el('button', { type: 'button', text: 'Není spam', onClick: () => moveMessage(message, 'inbox') })
      : el('button', { type: 'button', text: 'Spam', onClick: () => moveMessage(message, 'spam') }),
  ]);
  const move = el('select', {
    'aria-label': 'Přesunout',
    name: 'move',
    onChange: (event) => {
      const folderId = event.target.value;
      event.target.value = '';
      if (folderId) moveMessage(message, folderId);
    },
  }, [el('option', { value: '', text: 'Přesunout' })]);
  for (const folder of state.mailbox.folders) {
    if (folder.id !== message.folderId) move.append(el('option', { value: folder.id, text: folder.name }));
  }
  toolbar.append(el('span', { class: 'move' }, [move]));

  const thread = el('div', { class: 'thread' });
  thread.append(el('div', { class: 'read-head' }, [
    el('div', {}, [
      el('h1', { text: message.subject || '(bez předmětu)' }),
      el('p', { class: 'read-meta', text: opened.thread.length > 1 ? `${opened.thread.length} zprávy v konverzaci` : '' }),
    ]),
  ]));
  for (const item of opened.thread) {
    const open = item.id === message.id;
    const card = el('article', { class: `card${open ? '' : ' collapsed'}` });
    const header = el('header', {}, [
      el('span', {
        class: 'avatar',
        text: initials(item.from),
        style: `background: hsl(${hue(item.from?.email)} 42% 36%)`,
      }),
      el('div', {}, [
        el('h3', { text: item.from?.name || item.from?.email || 'Neznámý' }),
        el('p', { class: 'who', text: open
          ? `Komu: ${item.to.map(personLabel).join(', ') || '—'}${item.cc?.length ? ` · Kopie: ${item.cc.map(personLabel).join(', ')}` : ''}`
          : (item.text || '').replace(/\s+/g, ' ').slice(0, 90) }),
      ]),
      el('time', { class: 'when', text: formatFull(item.date) }),
    ]);
    card.append(header);
    if (!open) {
      card.addEventListener('click', () => choose({ id: item.id, folderId: item.folderId }));
    } else {
      const body = el('div', { class: 'body' });
      setHtml(body, item.html || '');
      card.append(body);
      if (item.localOnly) card.append(el('span', { class: 'badge', text: 'jen na tomhle počítači' }));
      if (item.attachments?.length) {
        card.append(el('div', { class: 'files' }, item.attachments.map((file) => (
          el('span', { class: 'file', text: `${file.filename} (${Math.ceil((file.size || 0) / 1024)} kB)` })
        ))));
      }
    }
    thread.append(card);
  }
  host.replaceChildren(toolbar, thread);
}

function renderAccount() {
  const account = state.mailbox.account;
  $('account-label').textContent = account.email || 'místní schránka';
  const send = $('compose-send');
  if (send) send.textContent = account.connected ? 'Odeslat' : 'Uložit do odeslané';
  const note = $('compose-note');
  if (note) {
    note.textContent = account.connected
      ? 'Odejde přes nastavený účet.'
      : 'Účet není připojený, zpráva zůstane jen tady.';
  }
}

async function reload() {
  state.mailbox = await api('/api/mailbox');
  if (!state.mailbox.folders.some((folder) => folder.id === state.folderId)) state.folderId = 'inbox';
  renderFolders();
  renderList();
  renderAccount();
}

async function openSelected() {
  if (!state.selectedId) {
    state.opened = null;
    renderReading();
    return;
  }
  state.opened = await api(`/api/messages/${encodeURIComponent(state.selectedId)}`);
  state.mailbox.folders = state.opened.folders;
  const summary = state.mailbox.messages.find((item) => item.id === state.selectedId);
  if (summary && summary.folderId !== 'drafts') summary.unread = false;
  renderFolders();
  renderList();
  renderReading();
}

async function choose(item) {
  state.selectedId = item.id;
  if (window.matchMedia('(max-width: 860px)').matches) $('app').dataset.pane = item.folderId === 'drafts' ? 'list' : 'read';
  if (item.folderId === 'drafts') {
    const opened = await api(`/api/messages/${encodeURIComponent(item.id)}`);
    openCompose({
      title: 'Koncept',
      draftId: opened.message.id,
      replyToId: null,
      to: opened.message.to.map(personLabel).join(', '),
      cc: opened.message.cc.map(personLabel).join(', '),
      bcc: opened.message.bcc.map(personLabel).join(', '),
      subject: opened.message.subject,
      text: opened.message.text,
    });
    state.opened = null;
    renderList();
    renderReading();
    return;
  }
  await openSelected();
}

function quote(message) {
  const who = personLabel(message.from);
  const lines = String(message.text || '').split('\n').map((line) => `> ${line}`).join('\n');
  return `\n\nDne ${formatFull(message.date)} napsal(a) ${who}:\n\n${lines}\n`;
}

function withPrefix(subject, prefix, pattern) {
  if (pattern.test(subject || '')) return subject;
  return `${prefix} ${subject || ''}`.trim();
}

function startReply(message, all) {
  const to = [];
  const cc = [];
  const push = (list, person) => {
    if (!person?.email || isMine(person)) return;
    if ([...to, ...cc].some((item) => item.email.toLowerCase() === person.email.toLowerCase())) return;
    list.push(person);
  };
  push(to, message.from);
  if (all) {
    for (const person of [...(message.to || []), ...(message.cc || [])]) push(cc, person);
  }
  if (!to.length && message.to?.length) push(to, message.to.find((person) => !isMine(person)) || message.to[0]);
  openCompose({
    title: all ? 'Odpovědět všem' : 'Odpovědět',
    replyToId: message.id,
    to: to.map(personLabel).join(', '),
    cc: cc.map(personLabel).join(', '),
    subject: withPrefix(message.subject, 'Re:', /^(re|odp)\s*:/i),
    text: quote(message),
  });
}

function startForward(message) {
  const header = [
    '',
    '---------- Přeposlaná zpráva ----------',
    `Od: ${personLabel(message.from)}`,
    `Datum: ${formatFull(message.date)}`,
    `Předmět: ${message.subject || ''}`,
    `Komu: ${message.to.map(personLabel).join(', ')}`,
    '',
    message.text || '',
  ].join('\n');
  openCompose({
    title: 'Přeposlat',
    to: '',
    subject: withPrefix(message.subject, 'Fwd:', /^(fwd|fw|přeposl|preposl)\s*:/i),
    text: header,
  });
}

function openCompose(fields) {
  state.compose = { draftId: fields.draftId || null, replyToId: fields.replyToId || null };
  $('compose-title').textContent = fields.title || 'Nová zpráva';
  $('compose-to').value = fields.to || '';
  $('compose-cc').value = fields.cc || '';
  $('compose-bcc').value = fields.bcc || '';
  $('compose-subject').value = fields.subject || '';
  $('compose-text').value = fields.text || '';
  const showCopies = Boolean(fields.cc || fields.bcc);
  $('cc-field').hidden = !showCopies;
  $('bcc-field').hidden = !showCopies;
  $('compose').hidden = false;
  renderAccount();
  $('compose-to').focus();
}

function closeCompose() {
  state.compose = null;
  $('compose').hidden = true;
}

async function submitCompose(action) {
  if (!state.compose || state.busy) return;
  state.busy = true;
  try {
    const saved = await api('/api/messages', {
      method: 'POST',
      body: {
        action,
        draftId: state.compose.draftId,
        replyToId: state.compose.replyToId,
        to: $('compose-to').value,
        cc: $('compose-cc').value,
        bcc: $('compose-bcc').value,
        subject: $('compose-subject').value,
        text: $('compose-text').value,
      },
    });
    closeCompose();
    await reload();
    state.folderId = saved.message.folderId;
    state.selectedId = saved.message.id;
    $('app').dataset.pane = 'read';
    await openSelected();
    if (action === 'draft') toast('Koncept je uložený.');
    else if (saved.message.localOnly) toast('Zpráva je v Odeslané jen na tomhle počítači.');
    else toast('Odesláno.');
  } catch (error) {
    toast(error.message);
  } finally {
    state.busy = false;
  }
}

async function toggleStar(item) {
  const starred = !item.starred;
  const result = await api(`/api/messages/${encodeURIComponent(item.id)}`, {
    method: 'PATCH',
    body: { starred },
  });
  item.starred = starred;
  state.mailbox.folders = result.folders;
  if (state.opened?.message.id === item.id) state.opened.message.starred = starred;
  renderFolders();
  renderList();
}

async function moveMessage(message, folderId) {
  try {
    await api(`/api/messages/${encodeURIComponent(message.id)}`, {
      method: 'PATCH',
      body: { folderId },
    });
    await reload();
    state.selectedId = message.id;
    await openSelected();
    toast(`Přesunuto do složky ${folderName(folderId)}.`);
  } catch (error) {
    toast(error.message);
  }
}

async function markUnread(message, unread) {
  await api(`/api/messages/${encodeURIComponent(message.id)}`, {
    method: 'PATCH',
    body: { unread },
  });
  await reload();
  if (state.opened?.message.id === message.id) state.opened.message.unread = unread;
  const summary = state.mailbox.messages.find((item) => item.id === message.id);
  if (summary) summary.unread = unread;
  renderList();
  renderReading();
}

async function trashMessage(message) {
  const permanent = message.folderId === 'trash';
  await api(`/api/messages/${encodeURIComponent(message.id)}`, { method: 'DELETE' });
  const remaining = visibleMessages().filter((item) => item.id !== message.id);
  state.selectedId = remaining[0]?.id || null;
  state.opened = null;
  await reload();
  if (state.selectedId) await openSelected();
  else renderReading();
  toast(permanent ? 'Zpráva je smazaná natrvalo.' : 'Zpráva je v koši.');
}

async function removeFolder(folder) {
  if (!window.confirm(`Smazat složku ${folder.name}? Zprávy z ní spadnou do Doručené.`)) return;
  try {
    await api(`/api/folders/${encodeURIComponent(folder.id)}`, { method: 'DELETE' });
    if (state.folderId === folder.id) state.folderId = 'inbox';
    await reload();
    toast('Složka je pryč.');
  } catch (error) {
    toast(error.message);
  }
}

function accountForm() {
  return {
    name: $('account-name').value,
    email: $('account-email').value,
    provider: $('account-provider').value,
    username: $('account-username').value,
    password: $('account-password').value,
    imapHost: $('imap-host').value,
    imapPort: Number($('imap-port').value) || 993,
    smtpHost: $('smtp-host').value,
    smtpPort: Number($('smtp-port').value) || 465,
  };
}

function fillSettings() {
  const account = state.mailbox.account;
  $('account-name').value = account.name || '';
  $('account-email').value = account.email || '';
  $('account-provider').value = account.provider || 'gmail';
  $('account-username').value = account.username || '';
  $('account-password').value = '';
  $('imap-host').value = account.imapHost || '';
  $('imap-port').value = account.imapPort || 993;
  $('smtp-host').value = account.smtpHost || '';
  $('smtp-port').value = account.smtpPort || 465;
  $('settings-status').textContent = account.connected ? 'Účet je připojený.' : 'Zatím jen místní schránka.';
  toggleProvider();
}

function toggleProvider() {
  $('custom-server').hidden = $('account-provider').value !== 'custom';
}

function openSettings() {
  fillSettings();
  $('settings').hidden = false;
}

function closeSettings() {
  $('settings').hidden = true;
}

async function checkAccount() {
  $('settings-status').textContent = 'Zkouším přihlášení…';
  try {
    const result = await api('/api/account/check', { method: 'POST', body: accountForm() });
    $('settings-status').textContent = `Přihlášení prošlo. Schránek na serveru: ${result.mailboxes}.`;
  } catch (error) {
    $('settings-status').textContent = error.message;
  }
}

async function syncAccount(event) {
  event.preventDefault();
  $('settings-status').textContent = 'Ukládám a stahuji poštu…';
  $('settings-sync').disabled = true;
  try {
    const result = await api('/api/sync', { method: 'POST', body: accountForm() });
    await reload();
    state.selectedId = visibleMessages()[0]?.id || null;
    state.opened = null;
    if (state.selectedId) await openSelected();
    else renderReading();
    $('settings-status').textContent = `Staženo nových zpráv: ${result.imported}.`;
    toast(result.imported ? `Ve schránce je ${result.imported} nových zpráv.` : 'Nové zprávy na serveru nejsou.');
    $('account-password').value = '';
  } catch (error) {
    $('settings-status').textContent = error.message;
  } finally {
    $('settings-sync').disabled = false;
  }
}

async function clearDemo() {
  await api('/api/demo/clear', { method: 'POST', body: {} });
  state.selectedId = null;
  state.opened = null;
  await reload();
  renderReading();
  $('settings-status').textContent = 'Ukázkové zprávy jsou pryč.';
}

function moveSelection(delta) {
  const items = visibleMessages();
  if (!items.length) return;
  const index = items.findIndex((item) => item.id === state.selectedId);
  const next = items[Math.min(items.length - 1, Math.max(0, index + delta))];
  if (next) choose(next);
}

function onKey(event) {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
  if (event.key === 'Escape') {
    if (!$('compose').hidden) closeCompose();
    else if (!$('settings').hidden) closeSettings();
    return;
  }
  if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
  const message = state.opened?.message;
  if (event.key === 'n') openCompose({ title: 'Nová zpráva' });
  else if (event.key === 'r' && message) startReply(message, false);
  else if (event.key === 'a' && message) startReply(message, true);
  else if (event.key === 'f' && message) startForward(message);
  else if (event.key === 'e' && message) moveMessage(message, message.folderId === 'archive' ? 'inbox' : 'archive');
  else if ((event.key === 'Delete' || event.key === '#') && message) trashMessage(message);
  else if (event.key === 's' && message) toggleStar(message);
  else if (event.key === 'u' && message) markUnread(message, !message.unread);
  else if (event.key === 'j' || event.key === 'ArrowDown') moveSelection(1);
  else if (event.key === 'k' || event.key === 'ArrowUp') moveSelection(-1);
  else if (event.key === '/') {
    event.preventDefault();
    $('search').focus();
  } else return;
  if (event.key !== '/') event.preventDefault();
}

function bind() {
  $('new-mail').addEventListener('click', () => openCompose({ title: 'Nová zpráva' }));
  $('compose-close').addEventListener('click', closeCompose);
  $('compose-form').addEventListener('submit', (event) => {
    event.preventDefault();
    submitCompose('send');
  });
  $('compose-draft').addEventListener('click', () => submitCompose('draft'));
  $('toggle-cc').addEventListener('click', () => {
    const show = $('cc-field').hidden;
    $('cc-field').hidden = !show;
    $('bcc-field').hidden = !show;
  });
  $('search').addEventListener('input', () => {
    state.query = $('search').value;
    followSearch();
  });
  $('search-all').addEventListener('change', () => {
    state.searchAll = $('search-all').checked;
    followSearch();
  });
  $('new-folder').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = $('new-folder-name').value;
    try {
      await api('/api/folders', { method: 'POST', body: { name } });
      $('new-folder-name').value = '';
      await reload();
    } catch (error) {
      toast(error.message);
    }
  });
  $('open-settings').addEventListener('click', openSettings);
  $('settings-close').addEventListener('click', closeSettings);
  $('settings').addEventListener('click', (event) => {
    if (event.target === $('settings')) closeSettings();
  });
  $('account-provider').addEventListener('change', toggleProvider);
  $('settings-check').addEventListener('click', checkAccount);
  $('settings-form').addEventListener('submit', syncAccount);
  $('settings-clear').addEventListener('click', clearDemo);
  $('show-folders').addEventListener('click', () => { $('app').dataset.pane = 'folders'; });
  document.addEventListener('keydown', onKey);
}

async function main() {
  bind();
  try {
    await reload();
    const first = visibleMessages().find((item) => item.folderId !== 'drafts');
    if (first) {
      state.selectedId = first.id;
      await openSelected();
    } else {
      renderReading();
    }
  } catch (error) {
    $('reading').replaceChildren(el('div', { class: 'empty-read' }, [
      el('strong', { text: 'Pošta se nenačetla' }),
      error.message,
    ]));
  }
}

main();
