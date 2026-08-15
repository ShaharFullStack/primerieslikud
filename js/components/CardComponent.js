import { escapeHtml, shortLabel } from '../utils/format.js?v=3';

const POSITION_ICONS = { security: '🛡️', economy: '💰', justice: '⚖️' };
const POSITION_LABELS = { security: 'ביטחון', economy: 'כלכלה', justice: 'רפורמה משפטית' };

function groupBadgeLabel(candidate) {
  if (candidate.group === 'national') return `רשימה ארצית #${candidate.id}`;
  if (candidate.group === 'secured') return 'שריון';
  return candidate.groupLabel;
}

function imageHtml(candidate) {
  if (candidate.imageUrl) {
    return `<img class="c-img" src="${candidate.imageUrl}" alt="${escapeHtml(candidate.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"
      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="avatar-fallback" style="display:none; background:${candidate.avatarGradient};">${escapeHtml(candidate.initialsLabel)}</div>`;
  }
  return `<div class="avatar-fallback" style="background:${candidate.avatarGradient};">${escapeHtml(candidate.initialsLabel)}</div>`;
}

function chipsHtml(candidate, max = 26) {
  return ['security', 'economy', 'justice']
    .map((key) => {
      const value = candidate.positions[key];
      const short = shortLabel(value, max);
      if (!short) {
        return `<div class="c-chip empty" title="אין מידע פומבי ידוע"><span class="ic">${POSITION_ICONS[key]}</span><span>${POSITION_LABELS[key]}: אין מידע</span></div>`;
      }
      return `<div class="c-chip" title="${escapeHtml(value)}"><span class="ic">${POSITION_ICONS[key]}</span><span>${escapeHtml(short)}</span></div>`;
    })
    .join('');
}

export function renderCard(candidate, marking, { showGroupTag = false } = {}) {
  const markClass = marking ? `mark-${marking}` : '';

  const markControls = candidate.isSecured
    ? `<div class="c-locked-note">🔒 משוריין — לא נדרשת הצבעה</div>`
    : `<div class="c-mark">
        <button class="mark-btn mark-yes-btn ${marking === 'yes' ? 'active' : ''}" title="בטוח/ה מצביע/ה" data-action="mark" data-id="${candidate.id}" data-value="yes">✓</button>
        <button class="mark-btn mark-maybe-btn ${marking === 'maybe' ? 'active' : ''}" title="שוקל/ת" data-action="mark" data-id="${candidate.id}" data-value="maybe">?</button>
        <button class="mark-btn mark-no-btn ${marking === 'no' ? 'active' : ''}" title="בטוח/ה לא מצביע/ה" data-action="mark" data-id="${candidate.id}" data-value="no">✕</button>
      </div>`;

  return `
    <div class="c-card ${markClass}" data-candidate-id="${candidate.id}">
      <div class="c-top" data-action="open-detail" data-id="${candidate.id}">
        ${candidate.group === 'national' ? `<span class="badge-number">#${candidate.id}</span>` : ''}
        ${imageHtml(candidate)}
        ${showGroupTag ? `<span class="group-tag">${escapeHtml(groupBadgeLabel(candidate))}</span>` : ''}
      </div>
      <div class="c-body" data-action="open-detail" data-id="${candidate.id}">
        <div class="c-name">${escapeHtml(candidate.name)}</div>
        <div class="c-role">${escapeHtml(candidate.role)}</div>
        <div class="c-chips">${chipsHtml(candidate)}</div>
      </div>
      ${markControls}
    </div>`;
}

export function renderGrid(candidates, markingService, options) {
  if (candidates.length === 0) {
    return `<div class="empty-selected">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin: 0 auto 10px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <h3>לא נמצאו מועמדים תואמים</h3>
      <p style="margin-top: 6px; font-size: 13px;">נסה לשנות את החיפוש, הסינון או להסיר את מצב "מסומנים בלבד"</p>
    </div>`;
  }
  return candidates.map((c) => renderCard(c, markingService.markingOf(c.id), options)).join('');
}

export { groupBadgeLabel, POSITION_ICONS, POSITION_LABELS };
