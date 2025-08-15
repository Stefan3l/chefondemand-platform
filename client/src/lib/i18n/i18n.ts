'use client';

import itCommon from '@/locales/it/common.json';
import enCommon from '@/locales/en/common.json';
import itRegister from '@/locales/it/register.json';
import enRegister from '@/locales/en/register.json';
import itLogin from '@/locales/it/login.json';
import enLogin from '@/locales/en/login.json';

export type NamespaceData = Record<string, string>;

export const translations = {
  it: {
    common: itCommon,
    register: itRegister,
    login: itLogin
  },
  en: {
    common: enCommon,
    register: enRegister,
    login: enLogin
  },
} as const;

export type SupportedLocale = keyof typeof translations; // 'it' | 'en'
export type Namespace = keyof (typeof translations)['en'];
