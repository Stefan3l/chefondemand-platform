'use client';

import { usePathname } from 'next/navigation';
import {
  translations,
  type SupportedLocale,
  type Namespace,
} from '../lib/i18n/i18n';

type Dict = Record<string, unknown>;

/**
 * Resolve "dot.path.keys" within a nested JSON object.
 * Returns `undefined` if any segment is missing.
 */
function getByPath(obj: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Dict)) {
      return (acc as Dict)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Detect the active locale from the URL: `/it/...` or `/en/...`.
 * Falls back to `it` if the first segment is missing or unsupported.
 * Adjust to your routing if needed.
 */
function detectLocaleFromPath(pathname: string): SupportedLocale {
  const seg = pathname.split('/')[1];
  return seg === 'it' || seg === 'en' ? (seg as SupportedLocale) : 'en';
}

/**
 * Simple translation hook with:
 * - namespace support (e.g. 'mainNav')
 * - nested key paths (e.g. 'prodotti.cookie_banner.title')
 * - URL-based locale detection
 * - dev-friendly fallback + console warning when a key is missing
 */
export function useTranslation(ns: Namespace = 'common') {
  const pathname = usePathname() ?? '/';
  const locale = detectLocaleFromPath(pathname);

  // Current namespace dictionary (nested JSON)
  const dict = translations[locale][ns] as Dict;

  /**
   * Translate a key within the current namespace.
   * Example: t('triggers.prodotti') with ns='mainNav'
   */
  function t(key: string): string {
    const val = getByPath(dict, key);
    if (typeof val === 'string') return val;

    if (process.env.NODE_ENV !== 'production') {
      // Helpful warning during development
      // (kept quiet in production to avoid noisy logs)
      console.warn(
        `Missing translation for key: ${ns}.${key} in locale: ${locale}`
      );
    }
    // Return the full key so the UI shows something deterministic
    return `${ns}.${key}`;
  }

  return { t, locale, ns };
}
