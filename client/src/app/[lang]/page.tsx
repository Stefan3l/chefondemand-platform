'use client';

import { useTranslation } from "@/utils/useTranslation";
import { Button, Container, Heading, Paragraph } from "@/components/ui";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ThemeToggle } from "@/components/ui/buttons/Theme-toggle";



export default function HomePage() {
  const { t } = useTranslation('common');

  return (
    <main className="min-h-screen ">
        <Container size="xl">
            <div className="text-center pt-10">
      <Heading level="h1" color="gold">{t('title')}</Heading>
      </div>
      <div className="mt-4">
      <Paragraph color="auto" weight="medium" align="center">{t('description')}</Paragraph>
      </div>
      <div className="mt-8 flex justify-center">
        <ThemeToggle />
      </div>
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


