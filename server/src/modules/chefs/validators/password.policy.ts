import { z } from "zod";

// Regola comune per la password: 8–72, maiuscole, minuscole, numero, nessuno spazio
export const passwordSchema = z
  .string()
  .min(8, "La password deve avere almeno 8 caratteri.")
  .max(72, "La password può avere al massimo 72 caratteri.")
  .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "La password deve includere maiuscole, minuscole e un numero.")
  .refine((s) => !/\s/.test(s), "La password non deve contenere spazi.");

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "La password corrente è obbligatoria."),
  newPassword: passwordSchema,
});

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
