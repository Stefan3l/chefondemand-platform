// Persistă sidebar + header pentru toate paginile din (dashboard)
import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";

export default function DashboardLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return <DashboardLayoutClient lang={lang}>{children}</DashboardLayoutClient>;
}
