import sanitizeHtml from 'sanitize-html';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function textToHtml(text) {
  const linked = escapeHtml(text).replace(
    /https?:\/\/[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (token) => {
      if (token.includes('@') && !token.startsWith('http')) {
        return `<a href="mailto:${token}">${token}</a>`;
      }
      return `<a href="${token}" target="_blank" rel="noreferrer noopener">${token}</a>`;
    },
  );
  if (!linked.trim()) return '';
  return linked
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function sanitizeMailHtml(dirty) {
  if (!dirty) return '';
  return sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'span', 'h1', 'h2']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          href: attribs.href,
          target: '_blank',
          rel: 'noreferrer noopener',
        },
      }),
    },
  });
}
