const PLAYER_NAME_STORAGE_KEY = 'wyr:name';

export function getStoredPlayerName() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function saveStoredPlayerName(name: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return;
  }

  try {
    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, trimmedName);
  } catch {
    // Ignore storage failures; the current join/create flow can continue.
  }
}