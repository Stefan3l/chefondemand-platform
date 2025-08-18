import { useTranslation } from "@/utils/useTranslation";
import { useMemo } from "react";
import { CalendarDays } from "lucide-react";

// import components
import { Heading, Paragraph } from "@/components/ui";

export default function WelcomeBanner({ firstName }: { firstName: string }) {
  const { t, locale } = useTranslation('dashboard');
  

  const today = useMemo(() => {
    
    const dateLocale = locale === 'it' ? 'it-IT' : 'en-US';
    return new Date().toLocaleDateString(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [locale]);

  return (
   <div className="m-6 rounded-xl bg-[#1E1B15] border border-[#C7AE6A33] flex flex-col  justify-center  lg:flex-row lg:justify-between items-center">
      <div className="px-4 py-8 space-y-1">
        <div className="flex items-center justify-center lg:justify-start">
            <Heading level="h3" className="text-neutral-200 lg:text-3xl lg:font-semibold">
                {t('header.welcome')} {firstName}!
            </Heading>
            <span className="ml-1 leading-none text-2xl">👨‍🍳</span>
        </div>
            <Paragraph className="text-sm text-neutral-400 text-center">{t('header.banner')}</Paragraph>
      </div>

      <div className="px-4 py-4 text-sm text-neutral-300 flex items-center justify-center lg:justify-start">
         <CalendarDays className="mr-2 inline-block" width={18} height={18} />
         {today}
      </div>
    </div>
  );
}
