import { escapeHtml } from '../utils/format.js?v=2';
import { renderGrid } from './CardComponent.js?v=2';
import { TABS } from './TabsNavComponent.js?v=2';
import { NATIONAL_MAX } from '../services/MarkingService.js?v=2';

export const QUICK_TAGS = ['שרים וח"כים', 'בכירים', 'נשים', 'מועמדים חדשים'];

function searchBoxHtml(query) {
  return `<div class="search-box">
    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input type="text" id="searchInput" placeholder="חיפוש לפי שם, תפקיד או רקע..." value="${escapeHtml(query)}">
  </div>`;
}

/**
 * Builds each tab's HTML "shell" (search box, filters, section headers,
 * empty result placeholders) and separately refreshes just the result
 * grids inside it. Keeping these two concerns apart means typing in the
 * search box only ever touches `.grid-container` innerHTML — the input
 * element itself is never replaced, so it keeps focus and cursor position
 * on every keystroke (the previous single-file version rebuilt the whole
 * panel on every keystroke, which unfocused the field after each letter).
 */
export class TabViewRenderer {
  constructor({ candidates, markingService, filterService, districtsMeta, reservedMeta }) {
    this.candidates = candidates;
    this.markingService = markingService;
    this.filterService = filterService;
    this.districtsMeta = districtsMeta;
    this.reservedMeta = reservedMeta;
  }

  renderShell(activeTab, appState) {
    switch (activeTab) {
      case 'all':
        return this._allShell(appState);
      case 'national':
        return this._nationalShell(appState);
      case 'districts':
        return this._districtsShell(appState);
      case 'reserved':
        return this._reservedShell(appState);
      case 'secured':
        return this._securedShell(appState);
      default:
        return '';
    }
  }

  updateResults(root, activeTab, appState) {
    root.querySelectorAll('[data-results]').forEach((el) => {
      const groups = el.dataset.groups ? el.dataset.groups.split(',') : null;
      const tag = el.dataset.tag || null;
      const groupLabel = el.dataset.groupLabel || null;

      let list = groups ? this.filterService.byGroups(this.candidates, groups) : this.candidates;
      if (groupLabel) list = this.filterService.byGroupLabel(list, groupLabel);
      if (tag) list = this.filterService.byTag(list, tag);
      list = this.filterService.byQuery(list, appState.searchQuery);
      list = this.filterService.byMarkedOnly(list, this.markingService, appState.showMarkedOnly);

      el.innerHTML = renderGrid(list, this.markingService, { showGroupTag: activeTab === 'all' });
    });

    root.querySelectorAll('[data-cap-badge]').forEach((el) => {
      const capKey = el.dataset.capBadge;
      const capMax = el.dataset.capMax;
      const greenCount = this.markingService.greenCountForCapKey(capKey);
      el.textContent = `${greenCount}/${capMax} נבחר`;
      el.classList.toggle('filled', greenCount > 0);
    });

    // Informational-only counts (e.g. quota categories) that don't enforce a cap of their own.
    root.querySelectorAll('[data-info-badge]').forEach((el) => {
      const groupLabel = el.dataset.infoBadge;
      const greenCount = this.markingService.greenCountForGroupLabel(groupLabel);
      el.textContent = greenCount > 0 ? `✓ ${greenCount} מסומנים` : '0 מסומנים';
      el.classList.toggle('filled', greenCount > 0);
    });
  }

  _allShell(appState) {
    const filterTags = `<div class="filter-tags" data-group-filter-tags>
      <span style="font-size: 12.5px; font-weight: 700; margin-left: 4px;">סינון:</span>
      ${TABS.filter((t) => t.id !== 'all')
        .map((t) => `<button class="filter-tag ${appState.tagFilter === t.id ? 'active' : ''}" data-action="set-group-filter" data-group="${t.id}">${t.label}</button>`)
        .join('')}
      <button class="filter-tag ${appState.tagFilter === 'all' ? 'active' : ''}" data-action="set-group-filter" data-group="all">הכל</button>
    </div>`;

    const groups = appState.tagFilter !== 'all' ? TABS.find((t) => t.id === appState.tagFilter).groups : null;
    const groupsAttr = groups ? ` data-groups="${groups.join(',')}"` : '';

    return `<div class="controls-panel">${searchBoxHtml(appState.searchQuery)}${filterTags}</div>
      <div class="grid-container" data-results${groupsAttr}></div>`;
  }

  _nationalShell(appState) {
    const filterTags = `<div class="filter-tags">
      <span style="font-size: 12.5px; font-weight: 700; margin-left: 4px;">סינון מהיר:</span>
      <button class="filter-tag ${appState.tagFilter === 'all' ? 'active' : ''}" data-action="set-tag-filter" data-tag="all">הכל</button>
      ${QUICK_TAGS.map((tag) => `<button class="filter-tag ${appState.tagFilter === tag ? 'active' : ''}" data-action="set-tag-filter" data-tag="${escapeHtml(tag)}">${tag}</button>`).join('')}
    </div>`;

    const tagAttr = appState.tagFilter !== 'all' ? ` data-tag="${escapeHtml(appState.tagFilter)}"` : '';
    const banner = `<div class="info-banner">🗳️ פתק אחד, עד ${NATIONAL_MAX} מועמדים בסך הכל. מועמדי משבצות הבטחת הייצוג (טאב נפרד) מתמודדים <strong>באותה הצבעה</strong> — אם תסמני/תסמן "בטוח/ה מצביע/ה" עבורם שם, זה נספר כאן.</div>`;

    return `<div class="controls-panel">${searchBoxHtml(appState.searchQuery)}${filterTags}</div>${banner}
      <div class="grid-container" data-results data-groups="national"${tagAttr}></div>`;
  }

  _districtsShell(appState) {
    const banner = `<div class="info-banner">ℹ️ כל מתפקד/ת מצביע/ה בנוסף לרשימה הארצית גם עבור <strong>נציג/ה אחד/ת בלבד</strong> במחוז הגיאוגרפי שאליו/ה הוא/היא משתייך/ת לפי כתובת המגורים בספר הבוחרים. סמנ/י "בטוח/ה מצביע/ה" (ירוק) אצל נציג/ה אחד/ת בלבד בכל מחוז.</div>`;
    const sections = this.districtsMeta
      .map(
        (d) => `<div class="section-block">
          <div class="section-head">
            <div class="section-title">📍 ${escapeHtml(d.name)}</div>
            <div class="section-meta"><span class="tag-pill" data-cap-badge="district::${escapeHtml(d.name)}" data-cap-max="1">0/1 נבחר</span><span>${d.count} מתמודדים</span></div>
          </div>
          <div class="grid-container" data-results data-groups="district" data-group-label="${escapeHtml(d.name)}"></div>
        </div>`
      )
      .join('');

    return `<div class="controls-panel">${searchBoxHtml(appState.searchQuery)}</div>${banner}${sections}`;
  }

  _reservedShell(appState) {
    const banner = `<div class="info-banner">ℹ️ משבצות ייעודיות לשילוב נשים חדשות, צעירים, עולים חדשים, אנשים עם מוגבלויות ונציגי המגזר הלא-יהודי ברשימת הליכוד לכנסת. <strong>זו לא הצבעה נפרדת:</strong> מועמדי המשבצות מתמודדים באותה הצבעה של הרשימה הארצית (סימון "בטוח/ה מצביע/ה" כאן נספר בתוך אותם ${NATIONAL_MAX} קולות, לא בנוסף להם) — הבטחת הייצוג עצמה (מיקום מובטח ברשימה אם אף מועמד/ת מהקבוצה לא דורג/ה גבוה מספיק בכוח הקולות) מופעלת אוטומטית בספירת המפלגה, לא על ידך.</div>`;
    const sections = this.reservedMeta
      .map(
        (r) => `<div class="section-block">
          <div class="section-head">
            <div class="section-title">⭐ ${escapeHtml(r.category)}</div>
            <div class="section-meta"><span class="tag-pill" data-info-badge="${escapeHtml(r.category)}">0 מסומנים</span><span>${escapeHtml(r.quota)}</span><span>${r.count} מתמודדים</span></div>
          </div>
          <div class="grid-container" data-results data-groups="reserved" data-group-label="${escapeHtml(r.category)}"></div>
        </div>`
      )
      .join('');

    return `<div class="controls-panel">${searchBoxHtml(appState.searchQuery)}</div>${banner}${sections}`;
  }

  _securedShell(appState) {
    const banner = `<div class="info-banner">👑 מועמדים ששוריינו מראש ברשימת הליכוד מטעם הנהגת המפלגה וראש הממשלה, בהתאם להחלטות מוסדות התנועה והסכמים קואליציוניים. <strong>אינם עומדים לבחירה בפריימריז</strong> — מוצגים לצורך שקיפות והיכרות עם הרשימה המלאה בלבד.</div>`;
    return `<div class="controls-panel">${searchBoxHtml(appState.searchQuery)}</div>${banner}
      <div class="grid-container" data-results data-groups="secured"></div>`;
  }
}
