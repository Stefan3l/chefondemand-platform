import { z } from 'zod';

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "La password corrente è obbligatoria."),
    newPassword: z.string()
         .min(8, "La nuova password deve avere almeno 8 caratteri.")
         .regex(/[A-Za-z]/, "La nuova password deve contenere almeno una lettera.")
         .regex(/[0-9]/, "La nuova password deve contenere almeno una cifra."),
})

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;