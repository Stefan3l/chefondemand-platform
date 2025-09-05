// validators/chefProfile.schema.ts
import { z } from "zod";

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const chefProfileSchema = z.object({
  bio: z.string().max(240, "Bio massimo 240 caratteri").optional(),

  //  Accetta stringa vuota "" come "non compilato", oppure URL http/https valido
  website: z
    .string()
    .trim()
    .transform(v => (v === "" ? undefined : v))         // "" -> undefined
    .refine(v => v === undefined || isHttpUrl(v), {
      message: "URL non valido (usa http o https)",
    })
    .optional(),

  languages: z.array(z.string().min(1)).optional(),
  skills: z.array(z.string().min(1)).max(5, "Massimo 5 competenze").optional(),

  address: z.string().optional(),
  region: z.string().optional(),
  country: z.string().length(2, "Il paese deve essere ISO-2 (es. IT, BE)").optional(),
  serviceRadiusKm: z.number().int().positive("Il raggio deve essere un intero positivo").optional(),
  serviceMultiDay: z.boolean().optional(), // 👈 nuovo campo
});

export type ChefProfileInput = z.infer<typeof chefProfileSchema>;
