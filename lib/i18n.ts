import { browser } from 'wxt/browser';

type MessageKey = Parameters<typeof browser.i18n.getMessage>[0];

/** Localized UI string from public/_locales, falling back to the key. */
export function t(key: MessageKey, substitutions?: string | string[]): string {
  try {
    return browser.i18n.getMessage(key as any, substitutions) || String(key);
  } catch {
    return String(key);
  }
}

/**
 * Picks the singular or plural form (`<key>_one` / `<key>_other`).
 * `display` overrides the number shown, e.g. YouTube's own "1.2K".
 */
export function tCount(key: string, count: number, display?: string): string {
  return t(`${key}_${count === 1 ? 'one' : 'other'}` as MessageKey, display || count.toLocaleString());
}
