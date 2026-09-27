/**
 * Finance Capital Florida localStorage keys.
 * One-time migrate from legacy Rubicon keys so existing sessions keep working.
 */

export const TOKEN_KEY = 'fcf_token';
export const ADMIN_TOKEN_KEY = 'fcf_admin_token';
export const HIDE_BALANCES_KEY = 'fcf_hide_balances';
export const TRUSTED_DEVICE_KEY = 'fcf_trusted_device';
export const REMEMBER_EMAIL_KEY = 'fcf_remember_email';

const LEGACY: Record<string, string[]> = {
  [TOKEN_KEY]: ['rubicon_token', 'fc_token', 'token'],
  [ADMIN_TOKEN_KEY]: ['rubicon_admin_token'],
  [HIDE_BALANCES_KEY]: ['rubicon_hide_balances'],
  [TRUSTED_DEVICE_KEY]: ['rubicon_trusted_device'],
  [REMEMBER_EMAIL_KEY]: ['rubicon_remember_email'],
};

function migrate(key: string): string | null {
  const current = localStorage.getItem(key);
  if (current) return current;
  const legacyKeys = LEGACY[key] || [];
  for (const old of legacyKeys) {
    const val = localStorage.getItem(old);
    if (val) {
      localStorage.setItem(key, val);
      localStorage.removeItem(old);
      return val;
    }
  }
  return null;
}

export function getStoredToken(): string | null {
  return migrate(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  // Clear legacy keys so we don't leave dual state
  for (const old of LEGACY[TOKEN_KEY] || []) localStorage.removeItem(old);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  for (const old of LEGACY[TOKEN_KEY] || []) localStorage.removeItem(old);
}

export function getStoredAdminToken(): string | null {
  return migrate(ADMIN_TOKEN_KEY);
}

export function setStoredAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  for (const old of LEGACY[ADMIN_TOKEN_KEY] || []) localStorage.removeItem(old);
}

export function clearStoredAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  for (const old of LEGACY[ADMIN_TOKEN_KEY] || []) localStorage.removeItem(old);
}

export function getStoredFlag(key: string): string | null {
  return migrate(key);
}

export function setStoredFlag(key: string, value: string) {
  localStorage.setItem(key, value);
  for (const old of LEGACY[key] || []) localStorage.removeItem(old);
}

export function clearStoredFlag(key: string) {
  localStorage.removeItem(key);
  for (const old of LEGACY[key] || []) localStorage.removeItem(old);
}
