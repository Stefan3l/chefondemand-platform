"use client";
import { useTranslation } from "@/utils/useTranslation";
import { useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Heading, Paragraph } from "@/components/ui";

export default function WelcomeBanner({ firstName }: { firstName: string }) {
  const { t, locale } = useTranslation("dashboard");

  // state pentru închiderea bannerului
  const [visible, setVisible] = useState(true);

  const today = useMemo(() => {
    const dateLocale = locale === "it" ? "it-IT" : "en-US";
    return new Date().toLocaleDateString(dateLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [locale]);

  // dacă utilizatorul l-a închis, nu mai randăm bannerul
  if (!visible) return null;

  return (
    <div className="my-6 rounded-xl bg-[#1E1B15] border border-[#C7AE6A33]  flex flex-col justify-center lg:flex-row lg:justify-between items-center relative">
      {/* X button (visible only on mobile) */}
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 p-1 rounded-md text-neutral-400 hover:text-white transition lg:hidden"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <div className="px-4 py-8 space-y-1">
        <div className="flex items-center justify-center lg:justify-start">
          <Heading level="h3" className="text-neutral-200 lg:text-3xl lg:font-semibold">
            {t("header.welcome")} {firstName}!
          </Heading>
          <span className="ml-1 leading-none text-2xl">👨‍🍳</span>
        </div>
        <Paragraph className="text-sm text-neutral-400 text-center">
          {t("header.banner")}
        </Paragraph>
      </div>

      <div className="px-4 py-4 text-sm text-neutral-300 flex items-center justify-center lg:justify-start">
        <CalendarDays className="mr-2 inline-block" width={18} height={18} />
        {today}
      </div>
    </div>
  );
}
