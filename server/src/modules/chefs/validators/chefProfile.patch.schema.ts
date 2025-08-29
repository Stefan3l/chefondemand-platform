import { z } from "zod";

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const chefProfilePatchSchema = z.object({
  bio: z.string().trim().max(240).optional().nullable(),

  website: z
    .string()
    .trim()
    .transform(v => (v === "" ? undefined : v))
    .refine(v => v === undefined || v === null || isHttpUrl(v), {
      message: "URL non valido (usa http o https)",
    })
    .optional()
    .nullable(),

  languages: z.array(z.string().trim().toLowerCase()).max(24).optional(),
  skills: z.array(z.string().trim().toLowerCase()).max(5, "Massimo 5 competenze").optional(),

  address: z.string().trim().max(255).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().toUpperCase().length(2, "ISO-2 (es. IT, BE)").optional(),
  serviceRadiusKm: z.number().int().min(0).max(500).optional(),
}).strict();

export type ChefProfilePatchInput = z.infer<typeof chefProfilePatchSchema>;
