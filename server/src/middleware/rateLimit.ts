import rateLimit from 'express-rate-limit';

// limitazioni per evitare i attacchi brute-force per proteggere le credenziali degli utenti
export const changePasswordLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        ok: false,
        message: "Troppi tentativi di cambio password. Riprova più tardi."
    },
    keyGenerator: (req) => {
        const userId = (req as any).user?.id;
        return userId ? `user:${userId}` : req.ip || "anonymous";
    }
})