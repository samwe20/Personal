const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function isEmail(value) {
  return EMAIL.test(String(value || '').trim());
}

export function parseAddressList(value) {
  if (value == null || !String(value).trim()) return [];
  return String(value)
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseAddress);
}

export function parseAddress(part) {
  const angled = String(part).trim().match(/^(.*)<([^>]+)>$/);
  if (angled) {
    const name = angled[1].trim().replace(/^["']|["']$/g, '');
    const email = angled[2].trim();
    if (!isEmail(email)) throw new Error(`Neplatná adresa: ${part}`);
    return { name, email };
  }
  const email = String(part).trim();
  if (!isEmail(email)) throw new Error(`Neplatná adresa: ${part}`);
  return { name: '', email };
}

export function formatAddress(person) {
  if (!person?.email) return '';
  if (!person.name) return person.email;
  const name = /[",<>]/.test(person.name) ? `"${person.name.replace(/"/g, '')}"` : person.name;
  return `${name} <${person.email}>`;
}

export function formatAddressList(list) {
  return (list || []).map(formatAddress).filter(Boolean).join(', ');
}

export function sameEmail(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}
