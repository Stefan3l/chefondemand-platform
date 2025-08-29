import { z } from "zod";

export const updateChefSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  countryCode: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine((s) => /^[A-Z]{2}$/.test(s), { message: "countryCode must be ISO-3166 alpha-2 (e.g. IT, BE)" }),
  phonePrefix: z
    .string()
    .trim()
    .transform((s) => (s.startsWith("+") ? s : `+${s}`))
    .refine((s) => /^\+\d{1,5}$/.test(s), { message: "Invalid phone prefix" }),
  phoneNumber: z
    .string()
    .trim()
    .transform((s) => s.replace(/[^\d]/g, "")) // doar cifre
    .refine((s) => /^\d{5,20}$/.test(s), { message: "Invalid phone number" }),
  email: z.string().trim().toLowerCase().email(),
});

export type UpdateChefInput = z.infer<typeof updateChefSchema>;
