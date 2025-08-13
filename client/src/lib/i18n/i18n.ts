'use client';

import itCommon from '@/locales/it/common.json';
import enCommon from '@/locales/en/common.json';

export type NamespaceData = Record<string, string>;

export const translations = {
  it: {
    common: itCommon,
  
  },
  en: {
    common: enCommon,
    
  },
} as const;

export type SupportedLocale = keyof typeof translations; // 'it' | 'en'
export type Namespace = keyof (typeof translations)['en'];
