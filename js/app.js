import { DataService } from './services/DataService.js?v=2';
import { StorageService } from './services/StorageService.js?v=2';
import { MarkingService, NATIONAL_MAX } from './services/MarkingService.js?v=2';
import { FilterService } from './services/FilterService.js?v=2';
import { renderTabsNav } from './components/TabsNavComponent.js?v=2';
import { TabViewRenderer } from './components/TabViewComponent.js?v=2';
import { renderDetailModalBody } from './components/DetailModalComponent.js?v=2';
import { renderBallotBody, renderPrintableBallot, ballotAsText } from './components/BallotModalComponent.js?v=2';
import { ToastComponent } from './components/ToastComponent.js?v=2';
import { canNativeShare, shareNative, shareToTwitter, shareToFacebook, shareToInstagram } from './components/ShareComponent.js?v=2';

const appState = {
  activeTab: 'all',
  searchQuery: '',
  tagFilter: 'all',
  showMarkedOnly: false,
};

let candidates, byId, districtsMeta, reservedMeta;
let markingService, filterService, tabViewRenderer, toast;

const el = {
  tabsNav: document.getElementById('tabsNav'),
  tabContent: document.getElementById('tab-content'),
  selectedCountDisplay: document.getElementById('selectedCountDisplay'),
  progressBar: document.getElementById('progressBar'),
  miniStats: document.getElementById('miniStats'),
  viewSelectedBtn: document.getElementById('viewSelectedBtn'),
  detailModal: document.getElementById('detailModal'),
  detailModalBody: document.getElementById('detailModalBody'),
  ballotModal: document.getElementById('ballotModal'),
  ballotContainer: document.getElementById('ballotContainer'),
  printArea: document.getElementById('printArea'),
  shareNativeBtn: document.getElementById('shareNativeBtn'),
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toastMsg'),
};

async function init() {
  const data = await new DataService('js/data').load();
  candidates = data.candidates;
  byId = data.byId;
  districtsMeta = data.districtsMeta;
  reservedMeta = data.reservedMeta;

  markingService = new MarkingService(candidates, new StorageService());
  filterService = new FilterService();
  tabViewRenderer = new TabViewRenderer({ candidates, markingService, filterService, districtsMeta, reservedMeta });
  toast = new ToastComponent(el.toast, el.toastMsg);

  renderTabsNavUI();
  renderShellAndResults();
  updateTracker();
  wireEvents();

  if (canNativeShare()) el.shareNativeBtn.style.display = '';
}

function renderTabsNavUI() {
  el.tabsNav.innerHTML = renderTabsNav(candidates, markingService, appState.activeTab);
}

function renderShellAndResults() {
  el.tabContent.innerHTML = tabViewRenderer.renderShell(appState.activeTab, appState);
  tabViewRenderer.updateResults(el.tabContent, appState.activeTab, appState);
}

function refreshResultsOnly() {
  tabViewRenderer.updateResults(el.tabContent, appState.activeTab, appState);
}

function updateTracker() {
  // The national cap is shared by the 40 national-list candidates AND the
  // representation-quota candidates (they run in the same vote — see
  // MarkingService), so it's counted by capKey, not by the 'national' group alone.
  const nationalGreen = markingService.greenCountForCapKey('national');
  el.selectedCountDisplay.textContent = `${nationalGreen} / ${NATIONAL_MAX}`;
  el.selectedCountDisplay.classList.toggle('full', nationalGreen === NATIONAL_MAX);
  el.progressBar.style.width = `${(nationalGreen / NATIONAL_MAX) * 100}%`;

  const districtsFilled = districtsMeta.filter((d) => markingService.greenCandidatesForCapKey(`district::${d.name}`).length > 0).length;
  // Quota categories aren't a separate cap anymore, just informational: how many
  // categories have at least one candidate you've already marked green.
  const reservedFilled = reservedMeta.filter((r) => markingService.greenCountForGroupLabel(r.category) > 0).length;

  el.miniStats.innerHTML = `
    <span class="mini-stat ${districtsFilled > 0 ? 'done' : ''}">מחוז: ${districtsFilled > 0 ? '✓ נבחר' : 'טרם נבחר'}</span>
    <span class="mini-stat ${reservedFilled > 0 ? 'done' : ''}">משבצות מיוצגות: ${reservedFilled}/${reservedMeta.length}</span>
  `;
}

function switchTab(tabId) {
  appState.activeTab = tabId;
  appState.tagFilter = 'all';
  appState.showMarkedOnly = false;
  el.viewSelectedBtn.innerHTML = markedOnlyLabel(false);
  renderTabsNavUI();
  renderShellAndResults();
}

function markedOnlyLabel(active) {
  const eyeSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  return active ? `${eyeSvg} הצג את כולם` : `${eyeSvg} הצג מסומנים בלבד`;
}

function handleMark(id, value) {
  const result = markingService.setMarking(id, value);
  if (!result.ok) {
    if (result.reason) toast.show(result.reason);
    return;
  }
  renderTabsNavUI();
  refreshResultsOnly();
  updateTracker();

  if (el.detailModal.classList.contains('active')) {
    const openId = Number(el.detailModal.dataset.openId);
    if (openId === id) openDetailModal(id);
  }
}

function openDetailModal(id) {
  const candidate = byId.get(id);
  if (!candidate) return;
  el.detailModal.dataset.openId = String(id);
  el.detailModalBody.innerHTML = renderDetailModalBody(candidate, markingService.markingOf(id));
  el.detailModal.classList.add('active');
}

function closeDetailModal() {
  el.detailModal.classList.remove('active');
}

function openBallotModal() {
  el.ballotContainer.innerHTML = renderBallotBody(markingService);
  el.ballotModal.classList.add('active');
}

function closeBallotModal() {
  el.ballotModal.classList.remove('active');
}

function printBallot() {
  el.printArea.innerHTML = `
    <div class="print-header">
      <h1>פריימריז הליכוד 2026 — פתק ההצבעה שלי</h1>
      <p>רשימה אישית מסומנת "בטוח/ה מצביע/ה"</p>
    </div>
    ${renderPrintableBallot(markingService)}
  `;
  window.print();
}

function copyBallotToClipboard() {
  const { text, isEmpty } = ballotAsText(markingService);
  if (isEmpty) {
    toast.show('אין מועמדים מסומנים להעתקה');
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => toast.show('הרשימה הועתקה ללוח בהצלחה!'))
    .catch(() => toast.show('שגיאה בהעתקה ללוח'));
}

function hasNothingToShare() {
  const { isEmpty } = ballotAsText(markingService);
  if (isEmpty) toast.show('סמנ/י קודם מועמדים כ"בטוח/ה מצביע/ה" כדי לשתף את הבחירה שלך');
  return isEmpty;
}

function handleShareNative() {
  if (hasNothingToShare()) return;
  shareNative(markingService, toast);
}

function handleShareTwitter() {
  if (hasNothingToShare()) return;
  shareToTwitter(markingService);
}

function handleShareFacebook() {
  if (hasNothingToShare()) return;
  shareToFacebook(markingService, toast);
}

function handleShareInstagram() {
  if (hasNothingToShare()) return;
  shareToInstagram(markingService, toast);
}

function resetSelections() {
  if (!markingService.hasAnyMarking()) return;
  if (confirm('האם לאפס את כל הסימונים שביצעת (ירוק/צהוב/אדום) בכל הרשימות?')) {
    markingService.resetAll();
    appState.showMarkedOnly = false;
    el.viewSelectedBtn.innerHTML = markedOnlyLabel(false);
    renderTabsNavUI();
    renderShellAndResults();
    updateTracker();
    toast.show('כל הסימונים אופסו בהצלחה');
  }
}

function toggleMarkedOnly() {
  appState.showMarkedOnly = !appState.showMarkedOnly;
  el.viewSelectedBtn.innerHTML = markedOnlyLabel(appState.showMarkedOnly);
  refreshResultsOnly();
}

function wireEvents() {
  document.body.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const { action } = actionEl.dataset;

    switch (action) {
      case 'switch-tab':
        switchTab(actionEl.dataset.tab);
        break;
      case 'open-detail':
        openDetailModal(Number(actionEl.dataset.id));
        break;
      case 'mark':
        handleMark(Number(actionEl.dataset.id), actionEl.dataset.value);
        break;
      case 'set-tag-filter':
        appState.tagFilter = actionEl.dataset.tag;
        renderShellAndResults();
        break;
      case 'set-group-filter':
        appState.tagFilter = actionEl.dataset.group;
        renderShellAndResults();
        break;
      case 'toggle-marked-only':
        toggleMarkedOnly();
        break;
      case 'open-ballot':
        openBallotModal();
        break;
      case 'close-detail-modal':
        closeDetailModal();
        break;
      case 'close-ballot-modal':
        closeBallotModal();
        break;
      case 'copy-ballot':
        copyBallotToClipboard();
        break;
      case 'reset-selections':
        resetSelections();
        break;
      case 'print':
        printBallot();
        break;
      case 'share-native':
        handleShareNative();
        break;
      case 'share-twitter':
        handleShareTwitter();
        break;
      case 'share-facebook':
        handleShareFacebook();
        break;
      case 'share-instagram':
        handleShareInstagram();
        break;
      default:
        break;
    }
  });

  document.body.addEventListener('input', (e) => {
    if (e.target.id === 'searchInput') {
      appState.searchQuery = e.target.value;
      refreshResultsOnly();
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target === el.ballotModal) closeBallotModal();
    if (e.target === el.detailModal) closeDetailModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
