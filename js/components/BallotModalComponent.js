import { escapeHtml } from '../utils/format.js';
import { NATIONAL_MAX } from '../services/MarkingService.js';

function ballotItem(candidate, index) {
  const sublabel = candidate.group === 'reserved' ? ` · משבצת: ${escapeHtml(candidate.groupLabel)}` : '';
  return `<div class="ballot-item">
    <div class="ballot-number">${index}</div>
    <div class="ballot-info">
      <div class="ballot-name">${escapeHtml(candidate.name)}</div>
      <div class="ballot-role">${escapeHtml(candidate.role)}${sublabel}</div>
    </div>
  </div>`;
}

function picks(markingService) {
  // The national ballot cap (capKey 'national') covers both the 40 national-list
  // candidates and the representation-quota candidates — they're marked on the
  // very same ballot in real life, so they belong in the same printed list.
  const nationalPicks = markingService.greenCandidatesForCapKey('national');
  const districtPicks = markingService.greenCandidatesForGroup('district');
  return { nationalPicks, districtPicks };
}

export function renderBallotBody(markingService) {
  const { nationalPicks, districtPicks } = picks(markingService);

  let html = `<p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 6px;">להלן כל המועמדים שסימנת כ"בטוח/ה מצביע/ה" (סך הכל <strong>${nationalPicks.length}</strong> מתוך ${NATIONAL_MAX} ברשימה הארצית):</p>`;

  html += `<div class="ballot-sub-head">🗳️ הרשימה הארצית (${nationalPicks.length}/${NATIONAL_MAX})</div>`;
  html += nationalPicks.length
    ? `<div class="ballot-list">${nationalPicks.map((c, i) => ballotItem(c, i + 1)).join('')}</div>`
    : `<div class="ballot-empty-note">טרם סימנת מועמדים לרשימה הארצית.</div>`;

  html += `<div class="ballot-sub-head">📍 נציג/ה מחוזי/ת (הצבעה נפרדת)</div>`;
  html += districtPicks.length
    ? `<div class="ballot-list">${districtPicks.map((c, i) => ballotItem(c, i + 1)).join('')}</div>`
    : `<div class="ballot-empty-note">טרם סימנת נציג/ה במחוז שלך.</div>`;

  return html;
}

/**
 * Compact, print-only rendering: just the voter's own picks, numbered, no
 * intro copy or empty-state placeholders — meant to fit on a single printed
 * page to bring to the polling station.
 */
export function renderPrintableBallot(markingService) {
  const { nationalPicks, districtPicks } = picks(markingService);

  if (nationalPicks.length === 0 && districtPicks.length === 0) {
    return `<p style="text-align:center; padding: 20px;">טרם סימנת מועמדים כ"בטוח/ה מצביע/ה".</p>`;
  }

  let html = `<div class="print-ballot-section">
    <h3>הרשימה הארצית (${nationalPicks.length}/${NATIONAL_MAX})</h3>
    <ol class="print-ballot-list">
      ${nationalPicks.map((c) => `<li>${escapeHtml(c.name)}${c.group === 'reserved' ? ` <span class="print-sub">(משבצת: ${escapeHtml(c.groupLabel)})</span>` : ''}</li>`).join('')}
    </ol>
  </div>`;

  if (districtPicks.length > 0) {
    html += `<div class="print-ballot-section">
      <h3>נציג/ה מחוזי/ת</h3>
      <ol class="print-ballot-list">
        ${districtPicks.map((c) => `<li>${escapeHtml(c.name)} <span class="print-sub">(${escapeHtml(c.groupLabel)})</span></li>`).join('')}
      </ol>
    </div>`;
  }

  return html;
}

export function ballotAsText(markingService) {
  const { nationalPicks, districtPicks } = picks(markingService);

  let text = 'פתק ההצבעה שלי — פריימריז הליכוד 2026\n\n';
  text +=
    `הרשימה הארצית (${nationalPicks.length}/${NATIONAL_MAX}):\n` +
    nationalPicks.map((c, i) => `${i + 1}. ${c.name} (${c.role}${c.group === 'reserved' ? ` · משבצת: ${c.groupLabel}` : ''})`).join('\n');
  text += `\n\nנציג/ה מחוזי/ת:\n` + (districtPicks.length ? districtPicks.map((c) => `${c.name} — ${c.groupLabel}`).join('\n') : 'לא נבחר');
  return { text, isEmpty: nationalPicks.length === 0 && districtPicks.length === 0 };
}
