'use client';

import itCommon from '@/locales/it/common.json';
import enCommon from '@/locales/en/common.json';
import itRegister from '@/locales/it/register.json';
import enRegister from '@/locales/en/register.json';
import itLogin from '@/locales/it/login.json';
import enLogin from '@/locales/en/login.json';
import itDashboard from '@/locales/it/dashboard.json';
import enDashboard from '@/locales/en/dashboard.json';

export type NamespaceData = Record<string, string>;

export const translations = {
  it: {
    common: itCommon,
    register: itRegister,
    login: itLogin,
    dashboard: itDashboard
  },
  en: {
    common: enCommon,
    register: enRegister,
    login: enLogin,
    dashboard: enDashboard
  },
} as const;

export type SupportedLocale = keyof typeof translations; // 'it' | 'en'
export type Namespace = keyof (typeof translations)['en'];
