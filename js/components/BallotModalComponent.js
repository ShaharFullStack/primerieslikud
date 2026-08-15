import { escapeHtml } from '../utils/format.js';
import { NATIONAL_MAX } from '../services/MarkingService.js';

function ballotItem(candidate, index) {
  return `<div class="ballot-item">
    <div class="ballot-number">${index}</div>
    <div class="ballot-info">
      <div class="ballot-name">${escapeHtml(candidate.name)}</div>
      <div class="ballot-role">${escapeHtml(candidate.role)}</div>
    </div>
  </div>`;
}

export function renderBallotBody(markingService) {
  const nationalPicks = markingService.greenCandidatesForGroup('national');
  const districtPicks = markingService.greenCandidatesForGroup('district');
  const reservedPicks = markingService.greenCandidatesForGroup('reserved');

  let html = `<p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 6px;">להלן כל המועמדים שסימנת כ"בטוח/ה מצביע/ה" (סך הכל <strong>${nationalPicks.length}</strong> מתוך ${NATIONAL_MAX} ברשימה הארצית):</p>`;

  html += `<div class="ballot-sub-head">🗳️ הרשימה הארצית (${nationalPicks.length}/${NATIONAL_MAX})</div>`;
  html += nationalPicks.length
    ? `<div class="ballot-list">${nationalPicks.map((c, i) => ballotItem(c, i + 1)).join('')}</div>`
    : `<div class="ballot-empty-note">טרם סימנת מועמדים לרשימה הארצית.</div>`;

  html += `<div class="ballot-sub-head">📍 נציג/ה מחוזי/ת</div>`;
  html += districtPicks.length
    ? `<div class="ballot-list">${districtPicks.map((c, i) => ballotItem(c, i + 1)).join('')}</div>`
    : `<div class="ballot-empty-note">טרם סימנת נציג/ה במחוז שלך.</div>`;

  html += `<div class="ballot-sub-head">⭐ משבצות ייצוג</div>`;
  html += reservedPicks.length
    ? `<div class="ballot-list">${reservedPicks.map((c, i) => ballotItem(c, i + 1)).join('')}</div>`
    : `<div class="ballot-empty-note">טרם סימנת נציג/ה במשבצת ייצוג.</div>`;

  return html;
}

export function ballotAsText(markingService) {
  const nationalPicks = markingService.greenCandidatesForGroup('national');
  const districtPicks = markingService.greenCandidatesForGroup('district');
  const reservedPicks = markingService.greenCandidatesForGroup('reserved');

  let text = 'פתק ההצבעה שלי — פריימריז הליכוד 2026\n\n';
  text += `הרשימה הארצית (${nationalPicks.length}/${NATIONAL_MAX}):\n` + nationalPicks.map((c, i) => `${i + 1}. ${c.name} (${c.role})`).join('\n');
  text += `\n\nנציג/ה מחוזי/ת:\n` + (districtPicks.length ? districtPicks.map((c) => `${c.name} — ${c.groupLabel}`).join('\n') : 'לא נבחר');
  text += `\n\nמשבצות ייצוג:\n` + (reservedPicks.length ? reservedPicks.map((c) => `${c.name} — ${c.groupLabel}`).join('\n') : 'לא נבחר');
  return { text, isEmpty: nationalPicks.length === 0 && districtPicks.length === 0 && reservedPicks.length === 0 };
}
