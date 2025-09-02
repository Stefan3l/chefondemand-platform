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
import itPhotoProfile from '@/locales/it/photo-profile.json';
import enPhotoProfile from '@/locales/en/photo-profile.json';
import itInfoPersonali from '@/locales/it/profileInfo.json';
import enInfoPersonali from '@/locales/en/profileInfo.json';
import itCompetenze from '@/locales/it/competenze.json';
import enCompetenze from '@/locales/en/competenze.json';
import itRaggioServizio from '@/locales/it/raggio-servizio.json';
import enRaggioServizio from '@/locales/en/raggio-servizio.json';
import itDishPhotos from '@/locales/it/dishPhotos.json';
import enDishPhotos from '@/locales/en/dishPhotos.json';
import itDishes from '@/locales/it/dishes.json';
import enDishes  from '@/locales/en/dishes.json';

export type NamespaceData = Record<string, string>;

export const translations = {
  it: {
    common: itCommon,
    register: itRegister,
    login: itLogin,
    dashboard: itDashboard,
    logoutModal: itLogoutModal,
    changePassword: itChangePassword,
    photoProfile: itPhotoProfile,
    profileInfo: itInfoPersonali,
    competenze: itCompetenze,
    raggioServizio: itRaggioServizio,
    dishPhotos: itDishPhotos,
    dishes: itDishes
  },
  en: {
    common: enCommon,
    register: enRegister,
    login: enLogin,
    dashboard: enDashboard,
    logoutModal: enLogoutModal,
    changePassword: enChangePassword,
    photoProfile: enPhotoProfile,
    profileInfo: enInfoPersonali,
    competenze: enCompetenze,
    raggioServizio: enRaggioServizio,
    dishPhotos: enDishPhotos,
    dishes: enDishes
  },
} as const;

export type SupportedLocale = keyof typeof translations; // 'it' | 'en'
export type Namespace = keyof (typeof translations)['en'];
