// src/context/me.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/axios';

/* ──────────────────────────────────────────────────────────────────────────
   Tipi pubblici (quelli che userai nel resto dell’app)
   ────────────────────────────────────────────────────────────────────────── */
export type Me = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profileImage?: string | null; // URL ASSOLUTO pronto da usare in <img />
};

/* ──────────────────────────────────────────────────────────────────────────
   Tipi interni per il payload dell’API /api/chefs/me
   - L’API può rispondere in due modi:
     1) direttamente con i campi (id, firstName, …)
     2) incapsulati in { ok, data: {...} }
   ────────────────────────────────────────────────────────────────────────── */
type ApiMeCore = {
  id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileImage?: string | null; // alcuni backend lo forniscono già qui
  profile?: { profileImageUrl?: string | null } | null; // oppure qui
  chef?: {
    id?: string | number | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
};

type ApiMeEnvelope = { ok?: boolean; data?: ApiMeCore };

/* ──────────────────────────────────────────────────────────────────────────
   Type guard per distinguere l’envelope { ok, data } dalla risposta diretta
   ────────────────────────────────────────────────────────────────────────── */
function isApiEnvelope(x: unknown): x is ApiMeEnvelope {
  return typeof x === 'object' && x !== null && 'data' in x;
}

/* ──────────────────────────────────────────────────────────────────────────
   Helper: rende assoluto un URL relativo (es. "/static/...") puntando al base
   dell’API; evita 404 su http://localhost:3000/static/...
   ────────────────────────────────────────────────────────────────────────── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
function toAbsolute(u: string | null | undefined): string | null {
  if (!u) return null;
  return u.startsWith('http') ? u : `${API_BASE}${u}`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Context + Provider
   ────────────────────────────────────────────────────────────────────────── */
const MeCtx = createContext<Me | null>(null);

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        // accettiamo entrambe le forme: envelope o core diretto
        const r = await api.get<ApiMeEnvelope | ApiMeCore>('/api/chefs/me', {
          validateStatus: () => true,
        });
        if (!active || r.status < 200 || r.status >= 300) return;

        const raw = r.data;
        // estraiamo sempre l’oggetto “core”
        const core: ApiMeCore = isApiEnvelope(raw) ? (raw.data ?? {}) : raw;

        // fonti possibili (dirette o nidificate sotto chef)
        const idSrc = core.id ?? core.chef?.id;
        const first = core.firstName ?? core.chef?.firstName ?? '';
        const last  = core.lastName  ?? core.chef?.lastName  ?? '';
        const email = core.email     ?? core.chef?.email     ?? undefined;

        // URL immagine da possibili campi, e reso ASSOLUTO
        const imgRel = core.profileImage ?? core.profile?.profileImageUrl ?? null;
        const imgAbs = toAbsolute(imgRel);

        if (idSrc != null) {
          setMe({
            id: String(idSrc),
            firstName: String(first),
            lastName: String(last),
            email,
            profileImage: imgAbs,
          });
        }
      } catch {
        // opzionale: logging silenzioso; il layout può mostrare fallback
      }
    })();

    return () => { active = false; };
  }, []);

  return <MeCtx.Provider value={me}>{children}</MeCtx.Provider>;
}

/* ──────────────────────────────────────────────────────────────────────────
   Hook di comodo per leggere i dati dell’utente loggato
   ────────────────────────────────────────────────────────────────────────── */
export function useMe(): Me | null {
  return useContext(MeCtx);
}
