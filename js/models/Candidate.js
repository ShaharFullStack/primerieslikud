import { initials, avatarGradient } from '../utils/format.js?v=3';
import { commonsFilePath } from '../utils/wikimedia.js?v=3';

/**
 * A single candidate across any of the four ballots (national list,
 * geographic district, representation quota, or party-leadership
 * reservation). `capKey`/`capMax` describe the vote bucket this candidate
 * belongs to (e.g. one district) so MarkingService can enforce the right
 * "how many green marks are allowed here" rule generically.
 */
export class Candidate {
  constructor(raw) {
    this.id = raw.id;
    this.name = raw.name;
    this.role = raw.role;
    this.desc = raw.desc;
    this.tags = raw.tags || [];
    this.imageFilename = raw.imageFilename || null;
    this.imageCredit = raw.imageCredit || null;
    this.sources = raw.sources || [];
    this.initialsLabel = raw.initials || initials(raw.name);
    this.group = raw.group;
    this.groupLabel = raw.groupLabel || '';
    this.capKey = raw.capKey || null;
    this.capMax = raw.capMax || null;
    this.positions = raw.positions || { security: null, economy: null, justice: null };
  }

  get isSecured() {
    return this.group === 'secured';
  }

  get imageUrl() {
    return this.imageFilename ? commonsFilePath(this.imageFilename) : null;
  }

  get avatarGradient() {
    return avatarGradient(this.name);
  }

  get hasAnyPosition() {
    return Boolean(this.positions.security || this.positions.economy || this.positions.justice);
  }

  matchesQuery(query) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      this.name.toLowerCase().includes(q) ||
      this.role.toLowerCase().includes(q) ||
      this.desc.toLowerCase().includes(q) ||
      this.groupLabel.toLowerCase().includes(q)
    );
  }
}
