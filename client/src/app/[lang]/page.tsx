'use client';

import { useState } from 'react';
import { useTranslation } from "@/utils/useTranslation";
import { Button, Container, Heading, Paragraph } from "@/components/ui";
import { ArrowLeft, ArrowRight, LogIn } from 'lucide-react'; // <-- importă LogIn aici
import { ThemeToggle } from "@/components/ui/buttons/Theme-toggle";
import RegisterChefModal from "@/components/modals/RegisterChefModal";
import LoginChefModal from "@/components/modals/LoginChefModal";

export default function HomePage() {
  const { t } = useTranslation('common');
  const [openRegister, setOpenRegister] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);

  return (
    <main className="min-h-screen">
      <Container size="xl">
        <div className="text-center pt-10">
          <Heading level="h1" color="gold">{t('title')}</Heading>
        </div>

        <div className="mt-4">
          <Paragraph color="auto" weight="medium" align="center">
            {t('description')}
          </Paragraph>
        </div>

        <div className="mt-8 flex justify-center">
          <ThemeToggle />
        </div>

        <div className="mt-20 flex flex-wrap gap-8 justify-between items-center">
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

          {/* Register modal trigger */}
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => setOpenRegister(true)}
          >
            Registra
          </Button>

          {/* Login modal trigger */}
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={() => setOpenLogin(true)}
            leftIcon={<LogIn size={18} />}   
          >
            Login
          </Button>
        </div>
      </Container>
     
      {/* Modals */}
      <RegisterChefModal
        open={openRegister}
        onClose={() => setOpenRegister(false)}
      />
      <LoginChefModal
        open={openLogin}
        onClose={() => setOpenLogin(false)}
      />
      
    </main>
  );
}
