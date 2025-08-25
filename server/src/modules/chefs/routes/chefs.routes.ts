// ✅ Router unificato: TUTTE le rotte Chef (register, login, me, change-password + profilo)
import { Router } from "express";
import rateLimit from "express-rate-limit";

import { registerChef } from "../controllers/chefs.controller";
import { changePasswordController } from "../controllers/changePassword.controller";
import { LoginChefController } from "../controllers/login.controller";
import { MeChefController } from "../controllers/me.controller";

import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";
import { validate } from "../../../middleware/validate";
import { changePasswordSchema } from "../validators/password.policy";

//  importa le rotte di PROFILO
import chefProfileRoutes from "./chefProfile.routes";

const changePwdLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi tentativi. Riprova tra qualche minuto." },
  // Endpoint protetto ➜ limitiamo per utente (no IP)
  keyGenerator: (req) => {
    const u = (req as any).user as { id?: string; sub?: string } | undefined;
    return `cpw:user:${u?.id || u?.sub || "unknown"}`;
  },
});

export const chefsRouter = Router();

// --- Rotte publiche ---
chefsRouter.post("/register", registerChef);
chefsRouter.post("/login",   LoginChefController);

// --- Rotte protette ---
chefsRouter.get("/me", authJwtMiddleware, MeChefController);

chefsRouter.put(
  "/change-password",
  authJwtMiddleware,
  changePwdLimiter,
  validate(changePasswordSchema),
  changePasswordController
);

// --- PROFILO: montato sotto lo stesso prefisso /api/chefs ---
chefsRouter.use("/", chefProfileRoutes);

// (opzionale) rotta di debug per confermare il mount del router
chefsRouter.get("/__alive", (_req, res) => res.json({ ok: true, scope: "chefs" }));

export default chefsRouter;
