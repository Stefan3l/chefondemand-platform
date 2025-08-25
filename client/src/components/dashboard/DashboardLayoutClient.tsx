"use client";

import { useEffect, useState } from "react";
import ChefDashboardShell from "@/components/dashboard/ChefDashboardShell";
import { api } from "@/lib/axios";
import type { ApiOk, ChefMeDTO } from "@/types/chef";

export default function DashboardLayoutClient({
  children,
  lang,
}: { children: React.ReactNode; lang: string }) {
  const [me, setMe] = useState<ChefMeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get<ApiOk<ChefMeDTO>>("/api/chefs/me", { withCredentials: true });
        if (!alive) return;
        setMe(res.data.data);
      } catch {
        window.location.href = `/${lang}/login`;
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [lang]);

  if (loading || !me) return <div className="p-6 text-neutral-300">Caricamento…</div>;

  return (
    <ChefDashboardShell userName={me.firstName}>
      {children}
    </ChefDashboardShell>
  );
}
