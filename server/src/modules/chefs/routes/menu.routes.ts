// modules/chefs/menu/menu.routes.ts
import { Router } from "express";
import { createMenu, deleteMenu, getMenu, listMenus, updateMenu, zodErrorHandler } from "../controllers/menu.controller";
// ⚠️ Adatta i percorsi di import in base alla tua struttura progetto
import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";
import { ensureSameChefOrAdmin } from "../../../middleware/ownership.middleware";

// ───────────────── Router Menu (scoped per Chef) ─────────────────
// Path base da montare sotto /api/chefs → es: /api/chefs/:chefId/menus

const router = Router();

// Autenticazione + ownership a livello di gruppo rotte
router.use("/:chefId/menus", authJwtMiddleware, ensureSameChefOrAdmin("chefId"));

// Lista menu dello chef
router.get("/:chefId/menus", listMenus);

// Dettaglio singolo menu
router.get("/:chefId/menus/:menuId", getMenu);

// Crea nuovo menu
router.post("/:chefId/menus", createMenu);

// Modifica menu esistente
router.patch("/:chefId/menus/:menuId", updateMenu);

// Elimina menu
router.delete("/:chefId/menus/:menuId", deleteMenu);

// Gestione errori Zod
router.use(zodErrorHandler);

export default router;
