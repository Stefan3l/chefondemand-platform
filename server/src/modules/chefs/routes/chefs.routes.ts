// modules/chefs/routes/chefs.routes.ts
import { Router } from "express";
import rateLimit from "express-rate-limit";

import { registerChef } from "../controllers/chefs.controller";
import { changePasswordController } from "../controllers/changePassword.controller";
import { LoginChefController } from "../controllers/login.controller";
import { MeChefController } from "../controllers/me.controller";

import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";
import { validate } from "../../../middleware/validate";
import { changePasswordSchema } from "../validators/password.policy";

import { PatchChefAccountController } from "../controllers/updateAccount.controller";
import { updateChefSchema } from "../validators/chef.update.schema";

import chefProfileRoutes from "./chefProfile.routes";

const changePwdLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi tentativi. Riprova tra qualche minuto." },
  // Limite per utente (no IP)
  keyGenerator: (req) => {
    const u = (req as any).user as { id?: string; sub?: string } | undefined;
    return `cpw:user:${u?.id || u?.sub || "unknown"}`;
  },
});

export const chefsRouter = Router();

/* --------- Rotte pubbliche --------- */
chefsRouter.post("/register", registerChef);
chefsRouter.post("/login",   LoginChefController);

/* --------- Rotte protette --------- */
chefsRouter.get("/me", authJwtMiddleware, MeChefController);

chefsRouter.put(
  "/change-password",
  authJwtMiddleware,
  changePwdLimiter,
  validate(changePasswordSchema),
  changePasswordController
);

/* --------- Update ACCOUNT (tutti i campi obbligatori, no password) --------- */
// Accetta sia PUT (replace completo) che PATCH (fallback)
chefsRouter
  .route("/:chefId/account")
  .put(authJwtMiddleware, validate(updateChefSchema), PatchChefAccountController)
  .patch(authJwtMiddleware, validate(updateChefSchema), PatchChefAccountController);

/* --------- PROFILO --------- */
// Montato sotto /profile per evitare collisioni con /:chefId/...
chefsRouter.use("/", chefProfileRoutes);

export default chefsRouter;
