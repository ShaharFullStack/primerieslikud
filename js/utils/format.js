export function initials(name) {
  return name.slice(0, 2);
}

function hueFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 360;
  return hash;
}

export function avatarGradient(name) {
  const hue = hueFromString(name);
  return `linear-gradient(135deg, hsl(${hue},55%,32%), hsl(${(hue + 45) % 360},60%,46%))`;
}

export function shortLabel(text, max) {
  if (!text) return null;
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + '…';
}

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ESCAPE_MAP[s]);
}
