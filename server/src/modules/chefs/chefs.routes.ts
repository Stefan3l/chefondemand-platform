import { Router } from "express";
import rateLimit from "express-rate-limit";

import { registerChef } from "./chefs.controller";
import { changePasswordController } from "./changePassword.controller";
import { LoginChefController } from "./login.controller";
import { MeChefController } from "./me.controller";

import { authJwtMiddleware } from "../../middleware/authJwtMiddleware";
import { validate } from "../../middleware/validate";
import { changePasswordSchema } from "./password.policy";

const changePwdLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi tentativi. Riprova tra qualche minuto." },
  keyGenerator: (req) => {
    const u = (req as any).user as { id?: string; sub?: string };
    return `cpw:${u?.id || u?.sub || req.ip}`;
  }
});

export const chefsRouter = Router();

// Register
chefsRouter.post("/register", registerChef);

// Login
chefsRouter.post("/login", LoginChefController);

// Me (autentificat)
chefsRouter.get("/me", authJwtMiddleware, MeChefController);

// Change password (autentificat + limitat)
chefsRouter.put(
  "/change-password",
  authJwtMiddleware,
  changePwdLimiter,
  validate(changePasswordSchema),
  changePasswordController
);
