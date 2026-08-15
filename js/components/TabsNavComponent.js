export const TABS = [
  { id: 'all', label: 'כל המועמדים', groups: null },
  { id: 'national', label: 'הרשימה הארצית', groups: ['national'] },
  { id: 'districts', label: 'מחוזות גיאוגרפיים', groups: ['district'] },
  { id: 'reserved', label: 'משבצות הבטחת ייצוג', groups: ['reserved'] },
  { id: 'secured', label: 'מטעם הנהגת המפלגה', groups: ['secured'] },
];

export function renderTabsNav(candidates, markingService, activeTab) {
  return TABS.map((tab) => {
    const count = tab.groups ? candidates.filter((c) => tab.groups.includes(c.group)).length : candidates.length;
    // The national-list cap (capKey 'national') is shared with the representation-quota
    // candidates — they run in the same vote, not a separate one — so the national tab's
    // progress badge has to count by capKey, not by group, or it would miss quota picks.
    const greenCount =
      tab.id === 'national'
        ? markingService.greenCountForCapKey('national')
        : tab.groups
        ? markingService.greenCountForGroups(tab.groups)
        : markingService.greenCountForGroups(['national', 'district', 'reserved', 'secured']);
    const progress = greenCount > 0 ? `<span class="tab-progress">✓ ${greenCount}</span>` : '';
    return `<button class="tab-btn ${activeTab === tab.id ? 'active' : ''}" data-action="switch-tab" data-tab="${tab.id}">
      ${tab.label} <span class="tab-count">${count}</span> ${progress}
    </button>`;
  }).join('');
}
