import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email non valida."),
  password: z.string().min(1, "La password è obbligatoria."),
});

export type LoginInput = z.infer<typeof loginSchema>;
