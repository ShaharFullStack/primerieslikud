import { escapeHtml } from '../utils/format.js?v=2';
import { NATIONAL_MAX } from '../services/MarkingService.js?v=2';
import { groupBadgeLabel, POSITION_ICONS, POSITION_LABELS } from './CardComponent.js?v=2';

function imageHtml(candidate) {
  if (candidate.imageUrl) {
    return `<img src="${candidate.imageUrl}" alt="${escapeHtml(candidate.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"
      style="width:100%;height:100%;object-fit:cover;object-position:top center;"
      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="avatar-fallback" style="display:none; background:${candidate.avatarGradient}; width:100%; height:100%;">${escapeHtml(candidate.initialsLabel)}</div>`;
  }
  return `<div class="avatar-fallback" style="background:${candidate.avatarGradient}; width:100%; height:100%;">${escapeHtml(candidate.initialsLabel)}</div>`;
}

function positionsHtml(candidate) {
  return ['security', 'economy', 'justice']
    .map((key) => {
      const value = candidate.positions[key];
      return `<div class="position-row">
        <div class="p-label">${POSITION_ICONS[key]} ${POSITION_LABELS[key] === 'רפורמה משפטית' ? 'רפורמה במערכת המשפט' : POSITION_LABELS[key]}</div>
        <div class="p-text ${value ? '' : 'empty'}">${value ? escapeHtml(value) : 'אין מידע פומבי ידוע בנושא זה'}</div>
      </div>`;
    })
    .join('');
}

function sourcesHtml(candidate) {
  if (!candidate.sources || candidate.sources.length === 0) return '';
  const links = candidate.sources
    .map((url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`)
    .join('<br>');
  return `<div class="detail-sources">מקורות: <br>${links}</div>`;
}

export function renderDetailModalBody(candidate, marking) {
  const markSection = candidate.isSecured
    ? `<div class="detail-cap-note">🔒 מועמד/ת משוריין/ת מטעם הנהגת המפלגה — אינו/ה עומד/ת לבחירה בפריימריז.</div>`
    : `<div class="detail-mark-label">הסימון האישי שלך:</div>
      <div class="detail-mark-row">
        <button class="detail-mark-btn yes ${marking === 'yes' ? 'active' : ''}" data-action="mark" data-id="${candidate.id}" data-value="yes">🟢 בטוח/ה מצביע/ה</button>
        <button class="detail-mark-btn maybe ${marking === 'maybe' ? 'active' : ''}" data-action="mark" data-id="${candidate.id}" data-value="maybe">🟡 שוקל/ת</button>
        <button class="detail-mark-btn no ${marking === 'no' ? 'active' : ''}" data-action="mark" data-id="${candidate.id}" data-value="no">🔴 בטוח/ה לא</button>
      </div>
      ${
        candidate.capMax
          ? `<div class="detail-cap-note">${
              candidate.capKey === 'national'
                ? `נספר/ת יחד עם עד ${NATIONAL_MAX} מועמדים בסך הכל ברשימה הארצית${candidate.group === 'reserved' ? ' — הבחירה כאן היא אותה הצבעה, לא הצבעה נפרדת למשבצת' : ''}`
                : `מכסה: נציג/ה אחד/ת בלבד עבור ${candidate.groupLabel} (הצבעה נפרדת)`
            }</div>`
          : ''
      }`;

  const credit = candidate.imageCredit ? `<div class="detail-image-credit">${escapeHtml(candidate.imageCredit)}</div>` : '';

  return `
    <div class="detail-top">
      <div class="detail-photo">${imageHtml(candidate)}</div>
      <div>
        <div class="detail-name">${escapeHtml(candidate.name)}</div>
        <div class="detail-role">${escapeHtml(candidate.role)}</div>
        <div class="detail-group">${escapeHtml(groupBadgeLabel(candidate))}</div>
        ${credit}
      </div>
    </div>
    <div class="detail-desc">${escapeHtml(candidate.desc)}</div>
    <div class="detail-positions">${positionsHtml(candidate)}</div>
    ${markSection}
    ${sourcesHtml(candidate)}
  `;
}
