import { parseFragment, serialize } from 'parse5';

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const DROP_WITH_CONTENT_TAGS = new Set([
  'base',
  'canvas',
  'embed',
  'form',
  'iframe',
  'input',
  'link',
  'math',
  'meta',
  'noscript',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
]);

const GLOBAL_ATTRS = new Set(['aria-hidden', 'aria-label', 'class', 'id', 'role', 'style', 'title']);

const TAG_ATTRS = {
  a: new Set(['href', 'rel', 'target']),
  img: new Set([
    'alt',
    'data-caption',
    'decoding',
    'fetchpriority',
    'height',
    'loading',
    'sizes',
    'src',
    'srcset',
    'width',
  ]),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
};

const SAFE_STYLE_PROPS = new Set([
  'aspect-ratio',
  'background-color',
  'border-radius',
  'color',
  'display',
  'font-style',
  'font-weight',
  'height',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-width',
  'object-fit',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'text-align',
  'text-decoration',
  'width',
]);

function isSafeUrl(value = '') {
  const normalized = String(value || '').trim().replace(/[\u0000-\u001f\u007f\s]+/g, '');
  if (!normalized) return false;
  if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) {
    return true;
  }
  try {
    const url = new URL(normalized, 'https://www.carmatch.vn');
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeSrcSet(value = '') {
  const candidates = String(value || '')
    .split(',')
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .map((candidate) => {
      const [url, ...descriptor] = candidate.split(/\s+/);
      return isSafeUrl(url) ? [url, ...descriptor].join(' ') : '';
    })
    .filter(Boolean);

  return candidates.join(', ');
}

function sanitizeStyle(value = '') {
  return String(value || '')
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator < 1) return '';
      const prop = declaration.slice(0, separator).trim().toLowerCase();
      const styleValue = declaration.slice(separator + 1).trim();
      if (!SAFE_STYLE_PROPS.has(prop)) return '';
      if (/url\s*\(|expression\s*\(|javascript:|vbscript:|data:|@import|-moz-binding/i.test(styleValue)) return '';
      return `${prop}: ${styleValue}`;
    })
    .filter(Boolean)
    .join('; ');
}

function sanitizeAttrs(tagName, attrs = []) {
  const cleanAttrs = [];
  let hasTargetBlank = false;
  let relValue = '';

  for (const attr of attrs) {
    const name = String(attr.name || '').toLowerCase();
    const value = String(attr.value || '');
    if (!name || name.startsWith('on')) continue;
    if (!GLOBAL_ATTRS.has(name) && !TAG_ATTRS[tagName]?.has(name)) continue;

    if (name === 'style') {
      const safeStyle = sanitizeStyle(value);
      if (safeStyle) cleanAttrs.push({ name, value: safeStyle });
      continue;
    }

    if (name === 'href' || name === 'src') {
      if (!isSafeUrl(value)) continue;
      cleanAttrs.push({ name, value: value.trim() });
      continue;
    }

    if (name === 'srcset') {
      const srcset = sanitizeSrcSet(value);
      if (srcset) cleanAttrs.push({ name, value: srcset });
      continue;
    }

    if (name === 'target') {
      hasTargetBlank = value.trim().toLowerCase() === '_blank';
      cleanAttrs.push({ name, value: hasTargetBlank ? '_blank' : value.trim() });
      continue;
    }

    if (name === 'rel') {
      relValue = value;
      cleanAttrs.push({ name, value });
      continue;
    }

    cleanAttrs.push({ name, value });
  }

  if (tagName === 'a' && hasTargetBlank) {
    const rel = new Set(
      relValue
        .split(/\s+/)
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean),
    );
    rel.add('noopener');
    rel.add('noreferrer');
    const existingRel = cleanAttrs.find((attr) => attr.name === 'rel');
    if (existingRel) existingRel.value = [...rel].join(' ');
    else cleanAttrs.push({ name: 'rel', value: [...rel].join(' ') });
  }

  return cleanAttrs;
}

function sanitizeChildren(childNodes = []) {
  const cleanChildren = [];
  for (const child of childNodes) {
    const cleanChild = sanitizeNode(child);
    if (Array.isArray(cleanChild)) cleanChildren.push(...cleanChild);
    else if (cleanChild) cleanChildren.push(cleanChild);
  }
  return cleanChildren;
}

function sanitizeNode(node) {
  if (!node) return null;
  if (node.nodeName === '#text') return node;
  if (node.nodeName === '#comment') return null;

  if (!node.tagName) {
    if (node.childNodes) node.childNodes = sanitizeChildren(node.childNodes);
    return node;
  }

  const tagName = String(node.tagName || '').toLowerCase();
  if (DROP_WITH_CONTENT_TAGS.has(tagName)) return null;

  node.childNodes = sanitizeChildren(node.childNodes);
  if (!ALLOWED_TAGS.has(tagName)) return node.childNodes || [];

  node.tagName = tagName;
  node.nodeName = tagName;
  node.attrs = sanitizeAttrs(tagName, node.attrs);
  return node;
}

export function sanitizeBlogHtml(value = '') {
  const fragment = parseFragment(String(value || ''));
  fragment.childNodes = sanitizeChildren(fragment.childNodes);
  return serialize(fragment);
}
