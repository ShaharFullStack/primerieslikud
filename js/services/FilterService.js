/**
 * Pure filtering helpers over a Candidate array. Kept stateless/testable —
 * all "what is currently selected" state lives in AppState, not here.
 */
export class FilterService {
  byGroups(candidates, groups) {
    if (!groups) return candidates;
    return candidates.filter((c) => groups.includes(c.group));
  }

  byTag(candidates, tag) {
    if (!tag || tag === 'all') return candidates;
    return candidates.filter((c) => c.tags.includes(tag));
  }

  byQuery(candidates, query) {
    if (!query || !query.trim()) return candidates;
    return candidates.filter((c) => c.matchesQuery(query.trim()));
  }

  byMarkedOnly(candidates, markingService, onlyMarked) {
    if (!onlyMarked) return candidates;
    return candidates.filter((c) => markingService.markingOf(c.id));
  }

  byGroupLabel(candidates, groupLabel) {
    return candidates.filter((c) => c.groupLabel === groupLabel);
  }
}
