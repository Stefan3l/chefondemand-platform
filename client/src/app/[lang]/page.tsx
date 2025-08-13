'use client';

import { useTranslation } from "@/utils/useTranslation";


export default function HomePage() {
  const { t } = useTranslation('common');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </main>
  );
}
