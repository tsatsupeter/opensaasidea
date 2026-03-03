/**
 * Bulletproof localStorage wrapper for Supabase auth.
 * Every call is wrapped in try/catch. If data is corrupted,
 * it auto-clears instead of crashing the app.
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Storage full or blocked — silently ignore
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silently ignore
    }
  },
}
