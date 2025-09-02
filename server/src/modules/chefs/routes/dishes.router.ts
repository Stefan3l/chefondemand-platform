// routes/dishes.router.ts
import { Router } from "express";
import {
  getDishes,
  getDish,
  postDish,
  patchDish,
  deleteDishById,
} from "../controllers/dishes.controller";
import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";
import { ensureSameChefOrAdmin } from "../../../middleware/ownership.middleware";

/**
 * Router "interno" con rotte relative e mergeParams abilitato:
 * - mantiene il parametro :chefId dal prefisso montato qui sotto
 * - i controller possono leggere req.params.chefId
 */
const r = Router({ mergeParams: true });

// Lista e creazione
r.get("/", getDishes);
r.post("/", postDish);

// Dettaglio, update e delete
r.get("/:dishId", getDish);
r.patch("/:dishId", patchDish);
r.delete("/:dishId", deleteDishById);

/**
 * Router "esterno" che applica:
 * - prefisso /chefs/:chefId/dishes
 * - middleware di autenticazione e ownership
 *
 * In app.ts viene montato così: app.use("/api", dishesRouter)
 * quindi le rotte finali risultano:
 *   GET    /api/chefs/:chefId/dishes
 *   POST   /api/chefs/:chefId/dishes
 *   GET    /api/chefs/:chefId/dishes/:dishId
 *   PATCH  /api/chefs/:chefId/dishes/:dishId
 *   DELETE /api/chefs/:chefId/dishes/:dishId
 */
const dishesRouter = Router();

dishesRouter.use(
  "/chefs/:chefId/dishes",
  authJwtMiddleware,
  ensureSameChefOrAdmin("chefId"),
  r
);

export default dishesRouter;
