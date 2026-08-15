import { Candidate } from '../models/Candidate.js?v=2';

/**
 * Loads the candidate roster and district/quota metadata from static JSON
 * files and turns the raw records into Candidate model instances. Kept
 * separate from MarkingService/FilterService so "where the data comes
 * from" can change (e.g. a real backend later) without touching business
 * logic or rendering.
 */
export class DataService {
  constructor(basePath = 'js/data') {
    this.basePath = basePath;
  }

  async load() {
    const [candidatesRaw, meta] = await Promise.all([
      fetch(`${this.basePath}/candidates.json?v=2`).then((r) => r.json()),
      fetch(`${this.basePath}/meta.json?v=2`).then((r) => r.json()),
    ]);

    const candidates = candidatesRaw.map((raw) => new Candidate(raw));
    const byId = new Map(candidates.map((c) => [c.id, c]));

    return {
      candidates,
      byId,
      districtsMeta: meta.districts,
      reservedMeta: meta.reserved,
    };
  }
}
