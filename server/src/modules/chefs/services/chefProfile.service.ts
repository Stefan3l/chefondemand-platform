import fs from "fs/promises";
import { prisma } from "../../../lib/prisma";
import { ChefProfileInput } from "../validators/chefProfile.schema";

/**
 * Recupera il profilo di un determinato chef.
 */
export async function getByChefId(chefId: string) {
  return prisma.chefProfile.findUnique({ where: { chefId } });
}

/**
 * Crea o aggiorna (upsert) il profilo chef.
 * - Se languages/skills non sono presenti nel payload, vengono coerentemente salvati come [].
 * - Il campo website può arrivare come undefined (gestito dal validator).
 */
export async function upsertByChefId(chefId: string, input: ChefProfileInput) {
  const languages = Array.isArray(input.languages) ? input.languages : [];
  const skills = Array.isArray(input.skills) ? input.skills : [];

  return prisma.chefProfile.upsert({
    where: { chefId },
    update: { ...input, languages, skills },
    create: { chefId, ...input, languages, skills },
  });
}

/**
 * Imposta la foto profilo:
 * - salva url/path/mime nuovi,
 * - dopo upsert, se il path precedente è diverso, elimina il vecchio file dal filesystem.
 * Ritorna sempre un oggetto "safe" per il frontend (senza path interno).
 */
export async function setProfilePhoto(
  chefId: string,
  data: { url: string; path: string; mime: string }
) {
  // 1) leggi il path precedente (se esiste)
  const prev = await prisma.chefProfile.findUnique({
    where: { chefId },
    select: { profileImagePath: true },
  });

  // 2) aggiorna/crea il profilo con i nuovi dati
  const result = await prisma.chefProfile.upsert({
    where: { chefId },
    update: {
      profileImageUrl: data.url,
      profileImagePath: data.path, // salvato ma NON esposto
      profileImageMime: data.mime,
    },
    create: {
      chefId,
      profileImageUrl: data.url,
      profileImagePath: data.path,
      profileImageMime: data.mime,
      languages: [], // profilo creato a step
      skills: [],
    },
    // selezione campi "safe" per il frontend
    select: {
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
      createdAt: true,
      updatedAt: true,
    },
  });

  // 3) elimina il vecchio file, se diverso dal nuovo
  try {
    const oldPath = prev?.profileImagePath;
    if (oldPath && oldPath !== data.path) {
      await fs.unlink(oldPath);
    }
  } catch {
    // non bloccare il flusso se la rimozione fallisce (ENOENT, permessi, ecc.)
  }

  return result;
}
