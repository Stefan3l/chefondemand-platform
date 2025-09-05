import fs from "fs/promises";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import type { ChefProfileInput } from "../validators/chefProfile.schema";
import type { ChefProfilePatchInput } from "../validators/chefProfile.patch.schema";

/* Selezione "safe" (mai senza path interno) */
const safeSelect = {
  id: true,
  chefId: true,
  profileImageUrl: true,
  profileImageMime: true,
  bio: true,
  website: true,
  languages: true,
  skills: true,
  address: true,
  region: true,
  country: true,
  serviceRadiusKm: true,
  serviceMultiDay: true, // 👈 aggiungi questa riga
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChefProfileSelect;

/* Helper: verifica se una chiave è presente nell'oggetto (anche se undefined/null) */
function has<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return !!obj && Object.prototype.hasOwnProperty.call(obj as object, key);
}

/**
 * Recupera il profilo per chefId.
 */
export async function getByChefId(chefId: string) {
  return prisma.chefProfile.findUnique({
    where: { chefId },
    select: safeSelect,
  });
}

/**
 * UPDATE PARZIALE (PATCH): tocca SOLO i campi presenti nel payload.
 *  - campo ASSENTE  => non modificare
 *  - campo PRESENTE => aggiorna (null/[] azzerano)
 */
export async function updatePartialByChefId(chefId: string, patch: ChefProfilePatchInput) {
  const data: Prisma.ChefProfileUpdateInput = {};

  if (has(patch, "bio")) data.bio = patch.bio ?? null;
  if (has(patch, "website")) data.website = patch.website ?? null;

  if (has(patch, "languages")) data.languages = patch.languages ?? [];
  if (has(patch, "skills")) data.skills = patch.skills ?? [];

  if (has(patch, "address")) data.address = patch.address ?? null;
  if (has(patch, "region")) data.region = patch.region ?? null;
  if (has(patch, "country")) data.country = patch.country ?? null;
  if (has(patch, "serviceRadiusKm")) data.serviceRadiusKm = patch.serviceRadiusKm ?? null;
  if (has(patch, "serviceMultiDay")) (data as any).serviceMultiDay = patch.serviceMultiDay ?? null;

  return prisma.chefProfile.upsert({
    where: { chefId },
    create: { chefId, ...(data as any) },
    update: data,
    select: safeSelect,
  });
}

/**
 *  UPSERT COMPLETO (PUT): sostituzione coerente dell'intero profilo.
 *  - se languages/skills mancano, li normalizziamo a [] (comportamento desiderato per PUT).
 */
export async function upsertFullByChefId(chefId: string, input: ChefProfileInput) {
  const languages = Array.isArray(input.languages) ? input.languages : [];
  const skills = Array.isArray(input.skills) ? input.skills : [];

  return prisma.chefProfile.upsert({
    where: { chefId },
    update: { ...input, languages, skills },
    create: { chefId, ...input, languages, skills },
    select: safeSelect,
  });
}

/**
 * Foto profilo: salva url/path/mime; rimuove il vecchio file se cambia.
 */
export async function setProfilePhoto(
  chefId: string,
  data: { url: string; path: string; mime: string }
) {
  const prev = await prisma.chefProfile.findUnique({
    where: { chefId },
    select: { profileImagePath: true },
  });

  const result = await prisma.chefProfile.upsert({
    where: { chefId },
    update: {
      profileImageUrl: data.url,
      profileImagePath: data.path,
      profileImageMime: data.mime,
    },
    create: {
      chefId,
      profileImageUrl: data.url,
      profileImagePath: data.path,
      profileImageMime: data.mime,
      languages: [],
      skills: [],
    },
    select: safeSelect,
  });

  try {
    const oldPath = prev?.profileImagePath;
    if (oldPath && oldPath !== data.path) {
      await fs.unlink(oldPath);
    }
  } catch {
    // non bloccare il flusso
  }

  return result;
}
