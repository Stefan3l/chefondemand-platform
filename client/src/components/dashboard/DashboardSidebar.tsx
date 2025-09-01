"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  House,
  ClipboardList,
  Mail,
  Calendar,
  User,
  UtensilsCrossed,
  ChevronDown,
  LogOut,
  BookOpenText,
  Pizza,
  Camera,
  UserRoundPen,
  Utensils,
  MapPinned,
  CreditCard,
  Settings,
  CircleQuestionMark,
} from "lucide-react";
import { useTranslation } from "@/utils/useTranslation";
import React, { useState } from "react";
import { Button } from "@/components/ui";

interface Props {
  base: string;
  richiesteDisponibili: number;
  unread: number;
}

export default function DashboardSidebar({
  base,
  richiesteDisponibili,
  unread,
}: Props) {
  const { t } = useTranslation("dashboard");
  const { t: tLogout } = useTranslation("logoutModal");
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isActive = (href: string) => Boolean(pathname?.startsWith(href));
  const hoverClass =
    "hover:text-[#C7AE6A] hover:bg-[rgba(199,174,106,0.08)] hover:border-[rgba(199,174,106,0.2)] hover:translate-x-[5px]";

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    router.push("/login");
  };

  return (
    <>
      <aside className="h-full w-64 overflow-y-auto border-r border-[rgba(199,174,106,0.15)] bg-neutral-900/95 shadow-[4px_0_30px_rgba(0,0,0,0.5)] backdrop-blur">
        <nav className="px-2 py-3">
          <ul className="space-y-1">
            {/* Dashboard */}
            <li>
              <Link
                href={`${base}/dashboard`}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 flex items-center gap-3 text-[15px] transition-all duration-300 border ${
                  isActive(`${base}/dashboard`)
                    ? "bg-[rgba(199,174,106,0.15)] text-[#C7AE6A] border-[rgba(199,174,106,0.3)] shadow-[0_0_20px_rgba(199,174,106,0.15)]"
                    : `text-white/60 border-transparent ${hoverClass}`
                }`}
              >
                <span
                  className={`absolute left-0 top-0 h-full w-[3px] rounded-r transition-all duration-300 ${
                    isActive(`${base}/dashboard`)
                      ? "bg-[#C7AE6A]"
                      : "bg-[#C7AE6A] scale-y-0 origin-top group-hover:scale-y-100"
                  }`}
                />
                <House size={18} strokeWidth={2.5} />
                {t("nav.dashboard")}
              </Link>
            </li>

            {/* Requests */}
            <li>
              <Link
                href={`${base}/requests`}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 flex items-center gap-3 text-[15px] transition-all duration-300 border ${
                  isActive(`${base}/requests`)
                    ? "bg-[rgba(199,174,106,0.15)] text-[#C7AE6A] border-[rgba(199,174,106,0.3)] shadow-[0_0_20px_rgba(199,174,106,0.15)]"
                    : `text-white/60 border-transparent ${hoverClass}`
                }`}
              >
                <span
                  className={`absolute left-0 top-0 h-full w-[3px] rounded-r transition-all duration-300 ${
                    isActive(`${base}/requests`)
                      ? "bg-[#C7AE6A]"
                      : "bg-[#C7AE6A] scale-y-0 origin-top group-hover:scale-y-100"
                  }`}
                />
                <ClipboardList size={18} strokeWidth={2.5} />
                {t("nav.requests")}
                {typeof richiesteDisponibili === "number" &&
                  richiesteDisponibili > 0 && (
                    <span className="ml-auto rounded-2xl px-2 py-0.5 text-[11px] font-semibold bg-[#C7AE6A] text-black">
                      {richiesteDisponibili}
                    </span>
                  )}
              </Link>
            </li>

            {/* Messages */}
            <li>
              <Link
                href={`${base}/messages`}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 flex items-center gap-3 text-[15px] transition-all duration-300 border ${
                  isActive(`${base}/messages`)
                    ? "bg-[rgba(199,174,106,0.15)] text-[#C7AE6A] border-[rgba(199,174,106,0.3)] shadow-[0_0_20px_rgba(199,174,106,0.15)]"
                    : `text-white/60 border-transparent ${hoverClass}`
                }`}
              >
                <span
                  className={`absolute left-0 top-0 h-full w-[3px] rounded-r transition-all duration-300 ${
                    isActive(`${base}/messages`)
                      ? "bg-[#C7AE6A]"
                      : "bg-[#C7AE6A] scale-y-0 origin-top group-hover:scale-y-100"
                  }`}
                />
                <Mail size={18} strokeWidth={2.5} />
                {t("nav.messages")}
                {typeof unread === "number" && unread > 0 && (
                  <span className="ml-auto rounded-2xl px-2 py-0.5 text-[11px] font-semibold bg-[#C7AE6A] text-black">
                    {unread}
                  </span>
                )}
              </Link>
            </li>

            {/* Calendar */}
            <li>
              <Link
                href={`${base}/calendar`}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 flex items-center gap-3 text-[15px] transition-all duration-300 border ${
                  isActive(`${base}/calendar`)
                    ? "bg-[rgba(199,174,106,0.15)] text-[#C7AE6A] border-[rgba(199,174,106,0.3)] shadow-[0_0_20px_rgba(199,174,106,0.15)]"
                    : `text-white/60 border-transparent ${hoverClass}`
                }`}
              >
                <span
                  className={`absolute left-0 top-0 h-full w-[3px] rounded-r transition-all duration-300 ${
                    isActive(`${base}/calendar`)
                      ? "bg-[#C7AE6A]"
                      : "bg-[#C7AE6A] scale-y-0 origin-top group-hover:scale-y-100"
                  }`}
                />
                <Calendar size={18} strokeWidth={2.5} />
                {t("nav.calendar")}
              </Link>
            </li>

            {/* Profile */}
            <li className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 flex items-center justify-between text-[15px] text-white/60 transition-all duration-300 ${hoverClass}`}
              >
                <span className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-[#C7AE6A] scale-y-0 origin-top group-hover:scale-y-100 transition-all duration-300" />
                <span className="flex items-center gap-3">
                  <User size={18} strokeWidth={2.5} />
                  {t("nav.profile")}
                </span>
                <ChevronDown
                  size={16}
                  className={
                    "ml-2 transition " +
                    (profileOpen
                      ? "rotate-180 text-[#C7AE6A]"
                      : "text-white/60")
                  }
                />
              </button>

              <div
                className={`${
                  profileOpen ? "max-h-72" : "max-h-0"
                } space-y-2 ml-10 overflow-hidden rounded-lg transition-[max-height] duration-300`}
              >
                <Link
                  href={`${base}/profile/foto-profile`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-md text-white/60 bg-black/20 transition-all duration-300 ${hoverClass}`}
                >
                  <Camera size={20} /> Foto
                </Link>
                <Link
                  href={`${base}/profile/info-personali`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-md text-white/60 bg-black/20 transition-all duration-300 ${hoverClass}`}
                >
                  <UserRoundPen size={20} /> Info Personali
                </Link>
                <Link
                  href={`${base}/profile/competenze`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-md text-white/60 bg-black/20 transition-all duration-300 ${hoverClass}`}
                >
                  <Utensils size={20} /> Competenze
                </Link>
                <Link
                  href={`${base}/profile/raggio-servizio`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-md text-white/60 bg-black/20 transition-all duration-300 ${hoverClass}`}
                >
                  <MapPinned size={20} /> Raggio di Servizio
                </Link>
                <Link
                  href={`${base}/profile/pagamenti`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-md text-white/60 bg-black/20 transition-all duration-300 ${hoverClass}`}
                >
                  <CreditCard size={20} /> Pagamenti
                </Link>
              </div>
            </li>

            {/* Menus */}
            <li className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 flex items-center justify-between text-[15px] text-white/60 transition-all duration-300 ${hoverClass}`}
              >
                <span className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-[#C7AE6A] scale-y-0 origin-top group-hover:scale-y-100 transition-all duration-300" />
                <span className="flex items-center gap-3">
                  <UtensilsCrossed size={18} />
                  {t("nav.menus")}
                </span>
                <ChevronDown
                  size={16}
                  className={
                    "ml-2 transition " +
                    (menuOpen
                      ? "rotate-180 text-[#C7AE6A]"
                      : "text-white/60")
                  }
                />
              </button>

              <div
                className={`${
                  menuOpen ? "max-h-32" : "max-h-0"
                } space-y-2 ml-10 overflow-hidden rounded-lg transition-[max-height] duration-300`}
              >
                <Link
                  href={`${base}/profile/foto-profile`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-md text-white/60 bg-black/20 transition-all duration-300 ${hoverClass}`}
                >
                  <Camera size={20} /> Foto Piatti
                </Link>
                <Link
                  href={`${base}/menu`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-md text-white/60 bg-black/20 transition-all duration-300 ${hoverClass}`}
                >
                  <BookOpenText size={20} /> {t("nav.menu")}
                </Link>
                <Link
                  href={`${base}/dishes`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-md text-white/60 bg-black/20 transition-all duration-300 ${hoverClass}`}
                >
                  <Pizza size={20} /> {t("nav.dishes")}
                </Link>
              </div>
            </li>

            {/* Settings & Help */}
            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[rgba(199,174,106,0.2)] to-transparent" />

            <li>
              <Link
                href={`${base}/settings`}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 flex items-center gap-3 text-[15px] text-white/60 transition-all duration-300 border-transparent ${hoverClass}`}
              >
                <Settings size={18} /> {t("nav.settings")}
              </Link>
            </li>

            <li>
              <Link
                href={`${base}/help`}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 flex items-center gap-3 text-[15px] text-white/60 transition-all duration-300 border-transparent ${hoverClass}`}
              >
                <CircleQuestionMark size={18} /> {t("nav.help")}
              </Link>
            </li>

            {/* Divider */}
            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[rgba(199,174,106,0.2)] to-transparent" />

            {/* Logout */}
            <li className="px-2 pt-2 relative">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className={`group cursor-pointer relative overflow-hidden flex w-full items-center bg-black/20 gap-2 rounded-lg px-3 py-2 text-md text-white/60 transition-all duration-300 ${hoverClass}`}
              >
                <span className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-[#C7AE6A] scale-y-0 origin-top group-hover:scale-y-100 transition-all duration-300" />
                <LogOut size={20} /> {t("nav.logout")}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* === Logout Confirmation Modal === */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-xl  bg-neutral-900 border border-white/10 hover:border-[#C7AE6A33] px-8 py-10 text-center  space-y-6">
            <p className="text-xl text-center text-neutral-200">{tLogout("confirm_title")}</p>
            <div className="flex justify-between gap-10 mt-10">
              <Button
                onClick={handleLogout}
                className="text-md"
              >
                {tLogout("yes")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
                className="text-md"
              >
                {tLogout("no")}
                
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
