"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/utils/useTranslation";
import { api } from "@/lib/axios";
import {
  Utensils,
  Sparkles,
  Leaf,
  Cookie,
  UtensilsCrossed,
  GraduationCap,
  Fish,
  Sun,
  Star,
  Flame,
  Carrot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Heading, Paragraph } from "@/components/ui";

/* ----------------------------- Types ----------------------------- */
type SkillKey =
  | "italiana"
  | "fusion"
  | "vegana"
  | "vegetariana"
  | "pasticceria"
  | "finger_food"
  | "cooking_class"
  | "giapponese"
  | "mediterranea"
  | "alta_cucina"
  | "bbq_grill";

type MeData = {
  id: string;
  profile?: { skills?: SkillKey[] | null } | null;
};
type MeResponse = { ok?: boolean; data?: MeData } | MeData;

type ProfileData = { skills?: SkillKey[] | null } | { profile?: { skills?: SkillKey[] | null } | null };
type ProfileResponse = { ok?: boolean; data?: ProfileData } | ProfileData;

type Json = Record<string, unknown>;

/* ------------------------ Icons + ordering ----------------------- */
const ICONS: Record<SkillKey, LucideIcon> = {
  italiana: Utensils,
  fusion: Sparkles,
  vegana: Leaf,
  vegetariana: Carrot,
  pasticceria: Cookie,
  finger_food: UtensilsCrossed,
  cooking_class: GraduationCap,
  giapponese: Fish,
  mediterranea: Sun,
  alta_cucina: Star,
  bbq_grill: Flame,
};

const ORDER: SkillKey[] = [
  "italiana",
  "fusion",
  "vegana",
  "vegetariana",
  "pasticceria",
  "finger_food",
  "cooking_class",
  "giapponese",
  "mediterranea",
  "alta_cucina",
  "bbq_grill",
];

const MAX_SELECTED = 5;

/* -------------------------- Type guards -------------------------- */
function isObject(u: unknown): u is Json {
  return typeof u === "object" && u !== null;
}

function pickMeData(resp: unknown): MeData | null {
  if (!isObject(resp)) return null;

  // shape A: { id, profile? }
  if (typeof resp.id === "string") {
    const id = resp.id as string;
    const profile = isObject(resp.profile) ? (resp.profile as MeData["profile"]) : null;
    return { id, profile };
  }

  // shape B: { ok?, data: { id, profile? } }
  if (isObject(resp.data) && typeof (resp.data as Json).id === "string") {
    const d = resp.data as Json;
    const id = d.id as string;
    const profile = isObject(d.profile) ? (d.profile as MeData["profile"]) : null;
    return { id, profile };
  }

  return null;
}

function toSkillArray(raw: unknown): SkillKey[] | null {
  // already array
  if (Array.isArray(raw)) {
    const out = raw.filter((x): x is SkillKey => typeof x === "string") as SkillKey[];
    return out;
  }
  // stringified JSON array
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const out = parsed.filter((x): x is SkillKey => typeof x === "string") as SkillKey[];
        return out;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function pickProfileSkills(resp: unknown): SkillKey[] | null {
  // Accept diverse shapes:
  // - { skills: [...] }
  // - { profile: { skills: [...] } }
  // - { data: { skills: [...] } }
  // - { data: { profile: { skills: [...] } } }
  if (!isObject(resp)) return null;

  const tryObj = (obj: Json | null | undefined): SkillKey[] | null => {
    if (!obj) return null;
    if ("skills" in obj) return toSkillArray((obj as Json).skills);
    if ("profile" in obj && isObject((obj as Json).profile)) {
      const prof = (obj as Json).profile as Json;
      if ("skills" in prof) return toSkillArray(prof.skills);
    }
    return null;
  };

  // top-level
  const direct = tryObj(resp);
  if (direct) return direct;

  // in data
  if (isObject(resp.data)) {
    const nested = tryObj(resp.data as Json);
    if (nested) return nested;
  }

  return null;
}

/* ----------------------------- Page ------------------------------ */
export default function Competenze(): ReactElement {
  const { t } = useTranslation("competenze");
  const router = useRouter();

  const [chefId, setChefId] = useState<string>("");
  const [selected, setSelected] = useState<Set<SkillKey>>(new Set());
  const [saving, setSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  // auto-hide status (~3s)
  useEffect(() => {
    if (!status) return;
    const id = window.setTimeout(() => setStatus(null), 3000);
    return () => window.clearTimeout(id);
  }, [status]);

  // --------------------- Load /me + current skills ---------------------
  useEffect(() => {
    (async () => {
      try {
        // 1) /me (authed)
        const meRes = await api.get<MeResponse>("/api/chefs/me", { validateStatus: () => true });
        if (meRes.status !== 200) return;
        const me = pickMeData(meRes.data);
        if (!me?.id) return;

        setChefId(me.id);

        // Fallback instant: dacă /me conține deja skills, le folosim
        const skillsFromMe = toSkillArray(me.profile?.skills ?? null);
        if (skillsFromMe && skillsFromMe.length) {
          setSelected(new Set(skillsFromMe));
        }

        // 2) GET profile (preferat) — poate returna stare mai „proaspătă”
        let prof = await api.get<ProfileResponse>(`/api/chefs/${me.id}/profile`, { validateStatus: () => true });
        if (prof.status === 404) {
          prof = await api.get<ProfileResponse>(`/api/chefs/profile/${me.id}/profile`, { validateStatus: () => true });
        }
        if (prof.status >= 200 && prof.status < 300) {
          const skills = pickProfileSkills(prof.data);
          if (skills) setSelected(new Set(skills));
        }
      } catch {
        // silent: UI starts empty
      }
    })();
  }, []);

  const selectedCount = selected.size;
  const canSave = useMemo(() => selectedCount > 0 && !saving && !!chefId, [selectedCount, saving, chefId]);

  const toggleSkill = (key: SkillKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (next.size >= MAX_SELECTED) {
          setStatus({
            kind: "err",
            msg: t("status.maxReached").replace("{{max}}", String(MAX_SELECTED)),
          });
          return prev;
        }
        next.add(key);
      }
      return next;
    });
  };

  // ------------------------------ Save ------------------------------
  const saveSkills = async () => {
    if (!chefId) {
      setStatus({ kind: "err", msg: t("status.notAuth") });
      return;
    }
    setSaving(true);
    const payload = { skills: Array.from(selected) as SkillKey[] };

    try {
      // PATCH (new route), fallback la legacy dacă 404
      let res = await api.patch(`/api/chefs/${chefId}/profile`, payload, {
        validateStatus: () => true,
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 404) {
        res = await api.patch(`/api/chefs/profile/${chefId}/profile`, payload, {
          validateStatus: () => true,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (res.status >= 200 && res.status < 300) {
        setStatus({ kind: "ok", msg: t("status.saved") });

        // Re-fetch exact din DB, apoi refresh UI
        try {
          let prof = await api.get<ProfileResponse>(`/api/chefs/${chefId}/profile`, { validateStatus: () => true });
          if (prof.status === 404) {
            prof = await api.get<ProfileResponse>(`/api/chefs/profile/${chefId}/profile`, { validateStatus: () => true });
          }
          if (prof.status >= 200 && prof.status < 300) {
            const skills = pickProfileSkills(prof.data);
            setSelected(new Set(skills ?? []));
          }
        } catch {
          /* ignore */
        }

        router.refresh();
      } else {
        const data = res.data as unknown;
        const msg =
          (isObject(data) && typeof data.message === "string" && data.message) || t("status.saveError");
        setStatus({ kind: "err", msg });
      }
    } catch {
      setStatus({ kind: "err", msg: t("status.network") });
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------ UI ------------------------------
  return (
    <div className="w-full px-4 py-6 lg:px-8 mb-10 lg:mb-0">
      {/* Page title */}
      <Heading level="h3" className="font-semibold text-neutral-200 mb-5">
        {t("pageTitle")}
      </Heading>

      {/* Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800">
          <Heading level="h4" className="text-base font-semibold text-[#C7AE6A]">
            {t("sectionTitle")}
          </Heading>
          <Paragraph color="muted" size="sm" className=" mt-1">
            {t("sectionHelp").replace("{{max}}", String(MAX_SELECTED))}
          </Paragraph>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Chips grid */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {ORDER.map((key) => {
              const Icon = ICONS[key];
              const active = selected.has(key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => toggleSkill(key)}
                    aria-pressed={active}
                    className={
                      "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-4 border transition " +
                      (active
                        ? "border-[#C7AE6A66] bg-[#C7AE6A1A] text-neutral-100 shadow-[0_0_0_3px_rgba(199,174,106,0.12)]"
                        : "border-neutral-800 bg-neutral-900 text-neutral-200 hover:border-[#C7AE6A33]")
                    }
                  >
                    <span className="inline-flex items-center gap-2 text-md">
                      <Icon size={20} aria-hidden="true" />
                      {t(`skills.${key}`)}
                    </span>

                    {/* small square indicator */}
                    <span
                      aria-hidden="true"
                      className={
                        "inline-block size-4 rounded-sm border " +
                        (active ? "bg-[#C7AE6A] border-[#C7AE6A]" : "border-neutral-700")
                      }
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Counter */}
          <div className="mt-4 text-sm text-neutral-400">
            {t("counter").replace("{{count}}", String(selectedCount)).replace("{{max}}", String(MAX_SELECTED))}
          </div>

          {/* Save button */}
          <div className="flex items-center justify-center py-6">
            <button
              type="button"
              onClick={saveSkills}
              disabled={!canSave}
              className="inline-flex h-11 items-center justify-center rounded-full px-6 font-medium text-neutral-900
                         bg-[#C7AE6A] hover:bg-[#bfa45e] active:bg-[#ac9557] transition
                         shadow-[0_0_0_3px_rgba(199,174,106,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? t("saving") : t("save")}
            </button>
          </div>

          {/* Status message */}
          {status && (
            <p
              className={`text-center text-sm ${status.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}
              role="status"
              aria-live="polite"
            >
              {status.msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
