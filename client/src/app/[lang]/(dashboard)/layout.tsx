
import React from "react";
import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";
import { MeProvider } from "@/context/me";

type Params = { lang: string };

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>; // ← params e Promise
}) {
  const { lang } = await params;   // ← așteaptă params
  return( <MeProvider>
      <DashboardLayoutClient lang={lang}>{children}</DashboardLayoutClient>
    </MeProvider>)
}
