const STORAGE_KEY = 'likud2026_state_v2';

/**
 * Thin wrapper around localStorage so the rest of the app never touches
 * the storage API (or its quirks/failures) directly.
 */
export class StorageService {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { markings: {} };
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.markings) return parsed;
      return { markings: {} };
    } catch (e) {
      return { markings: {} };
    }
  }

  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // storage unavailable (private mode / quota) — state stays in-memory only
    }
  }
}
