
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

// Restituisce il profilo "safe" (senza path interno) dopo l'upload
export async function setProfilePhoto(chefId: string, data: {
  url: string; path: string; mime: string;
}) {
  return prisma.chefProfile.upsert({
    where: { chefId },
    update: {
      profileImageUrl: data.url,
      profileImagePath: data.path,   // salvato ma NON esposto
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
    //  selezione campi "safe" per il frontend
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
}


