'use client';

import itCommon from '@/locales/it/common.json';
import enCommon from '@/locales/en/common.json';
import itRegister from '@/locales/it/register.json';
import enRegister from '@/locales/en/register.json';
import itLogin from '@/locales/it/login.json';
import enLogin from '@/locales/en/login.json';
import itDashboard from '@/locales/it/dashboard.json';
import enDashboard from '@/locales/en/dashboard.json';
import itLogoutModal from '@/locales/it/logoutModal.json';
import enLogoutModal from '@/locales/en/logoutModal.json';
import itChangePassword from '@/locales/it/changePassword.json';
import enChangePassword from '@/locales/en/changePassword.json';

export type NamespaceData = Record<string, string>;

export const translations = {
  it: {
    common: itCommon,
    register: itRegister,
    login: itLogin,
    dashboard: itDashboard,
    logoutModal: itLogoutModal,
    changePassword: itChangePassword
  },
  en: {
    common: enCommon,
    register: enRegister,
    login: enLogin,
    dashboard: enDashboard,
    logoutModal: enLogoutModal,
    changePassword: enChangePassword
  },
} as const;

export type SupportedLocale = keyof typeof translations; // 'it' | 'en'
export type Namespace = keyof (typeof translations)['en'];
