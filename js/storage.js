/**
 * storage.js
 * -----------------------------------------------------------------------
 * A small, safe wrapper around localStorage.
 * - All keys are namespaced under "toolkit_" so this app never collides
 *   with other data that might live in the same browser profile.
 * - Every read is wrapped in try/catch and validated so a corrupted or
 *   hand-edited localStorage value can never crash the app; it just
 *   falls back to a sensible default.
 * -----------------------------------------------------------------------
 */

const Storage = (() => {
  const KEYS = {
    theme: 'toolkit_theme',
    settings: 'toolkit_settings',
    history: 'toolkit_history',
    favorites: 'toolkit_favorites',
  };

  const DEFAULT_SETTINGS = {
    theme: 'system', // 'light' | 'dark' | 'system'
    historySize: 50,
    savePasswordHistory: false,
    animationsEnabled: true,
  };

  function isStorageAvailable() {
    try {
      const testKey = '__toolkit_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  const available = isStorageAvailable();
  let memoryFallback = {}; // used only if localStorage is unavailable (private browsing etc.)

  function rawGet(key) {
    if (available) return window.localStorage.getItem(key);
    return Object.prototype.hasOwnProperty.call(memoryFallback, key) ? memoryFallback[key] : null;
  }

  function rawSet(key, value) {
    if (available) {
      window.localStorage.setItem(key, value);
    } else {
      memoryFallback[key] = value;
    }
  }

  function rawRemove(key) {
    if (available) {
      window.localStorage.removeItem(key);
    } else {
      delete memoryFallback[key];
    }
  }

  function safeParse(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    try {
      const parsed = JSON.parse(raw);
      if (parsed === null || typeof parsed !== 'object') return fallback;
      return parsed;
    } catch (e) {
      return fallback;
    }
  }

  // ---- Settings -----------------------------------------------------
  function getSettings() {
    const parsed = safeParse(rawGet(KEYS.settings), {});
    const merged = { ...DEFAULT_SETTINGS, ...parsed };

    // Validate each field individually; never trust stored data blindly.
    if (!['light', 'dark', 'system'].includes(merged.theme)) merged.theme = DEFAULT_SETTINGS.theme;
    if (![10, 25, 50, 100].includes(Number(merged.historySize))) merged.historySize = DEFAULT_SETTINGS.historySize;
    merged.historySize = Number(merged.historySize);
    merged.savePasswordHistory = Boolean(merged.savePasswordHistory);
    merged.animationsEnabled = Boolean(merged.animationsEnabled);

    return merged;
  }

  function saveSettings(settings) {
    rawSet(KEYS.settings, JSON.stringify(settings));
  }

  function resetSettings() {
    rawRemove(KEYS.settings);
    return { ...DEFAULT_SETTINGS };
  }

  // ---- History --------------------------------------------------------
  // Each item: { id, type, label, value, timestamp }
  function getHistory() {
    const raw = rawGet(KEYS.history);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item) =>
          item &&
          typeof item === 'object' &&
          typeof item.type === 'string' &&
          typeof item.value === 'string' &&
          typeof item.timestamp === 'number'
      );
    } catch (e) {
      return [];
    }
  }

  function addHistoryItem(item) {
    const settings = getSettings();

    if (item.type === 'password' && !settings.savePasswordHistory) {
      return getHistory();
    }

    const list = getHistory();
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: item.type,
      label: item.label || '',
      value: item.value,
      timestamp: Date.now(),
    };

    list.unshift(entry);

    const trimmed = list.slice(0, settings.historySize);
    rawSet(KEYS.history, JSON.stringify(trimmed));
    return trimmed;
  }

  function removeHistoryItem(id) {
    const list = getHistory().filter((item) => item.id !== id);
    rawSet(KEYS.history, JSON.stringify(list));
    return list;
  }

  function clearHistory() {
    rawRemove(KEYS.history);
    return [];
  }

  function purgePasswordHistory() {
    const list = getHistory().filter((item) => item.type !== 'password');
    rawSet(KEYS.history, JSON.stringify(list));
    return list;
  }

  // ---- Favorites --------------------------------------------------------
  function getFavorites() {
    const raw = rawGet(KEYS.favorites);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function toggleFavorite(item) {
    const list = getFavorites();
    const existingIndex = list.findIndex((f) => f.value === item.value && f.type === item.type);
    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
    } else {
      list.unshift({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: item.type,
        value: item.value,
        timestamp: Date.now(),
      });
    }
    rawSet(KEYS.favorites, JSON.stringify(list));
    return list;
  }

  // ---- Theme (kept separate for very fast startup read) --------------
  function getRawTheme() {
    const raw = rawGet(KEYS.theme);
    return ['light', 'dark', 'system'].includes(raw) ? raw : null;
  }

  function setRawTheme(theme) {
    rawSet(KEYS.theme, theme);
  }

  // ---- Full reset -------------------------------------------------------
  function clearAllData() {
    rawRemove(KEYS.theme);
    rawRemove(KEYS.settings);
    rawRemove(KEYS.history);
    rawRemove(KEYS.favorites);
  }

  return {
    KEYS,
    DEFAULT_SETTINGS,
    isAvailable: available,
    getSettings,
    saveSettings,
    resetSettings,
    getHistory,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
    purgePasswordHistory,
    getFavorites,
    toggleFavorite,
    getRawTheme,
    setRawTheme,
    clearAllData,
  };
})();
