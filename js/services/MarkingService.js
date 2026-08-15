export const NATIONAL_MAX = 12;

/**
 * Owns the voter's personal tri-state marking (yes/maybe/no) for every
 * candidate and enforces the vote caps, mirroring how the real Likud
 * primary ballot works: up to NATIONAL_MAX green marks shared across the
 * national-list ballot (capKey 'national') — which also covers the
 * representation-quota candidates, since they run in that same national
 * vote and only get an automatic rank-floor if they don't place high
 * enough on their own, not a separate ballot — and exactly one green mark
 * per geographic district (capKey 'district::<name>'), which really is
 * chosen on a separate ballot. The same rule applies no matter which
 * tab/view a candidate is rendered in, because it's derived from the
 * candidate's own capKey rather than from UI state.
 */
export class MarkingService {
  constructor(candidates, storageService) {
    this.candidates = candidates;
    this.byId = new Map(candidates.map((c) => [c.id, c]));
    this.storage = storageService;
    this.state = this.storage.load();
  }

  markingOf(id) {
    return this.state.markings[id] || null;
  }

  countGreenInCapKey(capKey, excludeId) {
    let n = 0;
    for (const c of this.candidates) {
      if (c.capKey === capKey && c.id !== excludeId && this.markingOf(c.id) === 'yes') n++;
    }
    return n;
  }

  /**
   * Returns { ok: true } on success, or { ok: false, reason } when a cap
   * blocks the change (reason is a ready-to-show Hebrew message).
   */
  setMarking(id, value) {
    const candidate = this.byId.get(id);
    if (!candidate) return { ok: false, reason: null };

    const current = this.markingOf(id);
    const next = current === value ? null : value;

    if (next === 'yes' && candidate.capKey && candidate.capMax) {
      const currentGreen = this.countGreenInCapKey(candidate.capKey, id);
      if (currentGreen >= candidate.capMax) {
        const reason =
          candidate.capKey === 'national'
            ? `⚠️ ניתן לסמן "בטוח מצביע" עד ${NATIONAL_MAX} מועמדים בסך הכל ברשימה הארצית (כולל מועמדי משבצות הייצוג — הם חלק מאותה הצבעה). הסר סימון קיים כדי לבחור אחר.`
            : `⚠️ ניתן לסמן "בטוח מצביע" נציג/ה אחד/ת בלבד עבור ${candidate.groupLabel}. הסר את הסימון הקודם קודם.`;
        return { ok: false, reason };
      }
    }

    if (next === null) delete this.state.markings[id];
    else this.state.markings[id] = next;
    this.storage.save(this.state);
    return { ok: true };
  }

  resetAll() {
    this.state.markings = {};
    this.storage.save(this.state);
  }

  hasAnyMarking() {
    return Object.keys(this.state.markings).length > 0;
  }

  greenCountForGroups(groups) {
    return this.candidates.filter((c) => groups.includes(c.group) && this.markingOf(c.id) === 'yes').length;
  }

  greenCandidatesForGroup(group) {
    return this.candidates.filter((c) => c.group === group && this.markingOf(c.id) === 'yes');
  }

  greenCandidatesForCapKey(capKey) {
    return this.candidates.filter((c) => c.capKey === capKey && this.markingOf(c.id) === 'yes');
  }

  greenCountForCapKey(capKey) {
    return this.greenCandidatesForCapKey(capKey).length;
  }

  /** Informational only (no cap tied to this) — how many candidates sharing a groupLabel are marked green. */
  greenCountForGroupLabel(groupLabel) {
    return this.candidates.filter((c) => c.groupLabel === groupLabel && this.markingOf(c.id) === 'yes').length;
  }
}
