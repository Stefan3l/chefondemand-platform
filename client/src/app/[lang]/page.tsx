'use client';

import { useTranslation } from "@/utils/useTranslation";
import { Button, Container } from "@/components/ui";
import { ArrowLeft, ArrowRight } from 'lucide-react';



export default function HomePage() {
  const { t } = useTranslation('common');

  return (
    <main className="min-h-screen bg-black">
        <Container size="xl">
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <div className="mt-20 flex gap-8 justify-between">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<ArrowLeft className="text-[#C7AE6A]" size={18} />}
        >
          Previous
        </Button>

        <Button
          variant="primary"
          size="md"
          rightIcon={<ArrowRight className="ml-1" size={18} />}
        >
          Next
        </Button>
      </div>
      </Container>
    </main>
  );
}


