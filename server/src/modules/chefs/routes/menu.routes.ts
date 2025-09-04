import { Router } from "express";
import { createMenu, deleteMenu, getMenu, listMenus, updateMenu, zodErrorHandler } from "../controllers/menu.controller";
import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";
import { ensureSameChefOrAdmin } from "../../../middleware/ownership.middleware";

// Path base da montare sotto /api/chefs → es: /api/chefs/:chefId/menus
const router = Router();

// Autenticazione + ownership a livello di gruppo rotte
router.use("/:chefId/menus", authJwtMiddleware, ensureSameChefOrAdmin("chefId"));

router.get("/:chefId/menus", listMenus);
router.get("/:chefId/menus/:menuId", getMenu);
router.post("/:chefId/menus", createMenu);
router.patch("/:chefId/menus/:menuId", updateMenu);
router.delete("/:chefId/menus/:menuId", deleteMenu);

// Gestione errori Zod
router.use(zodErrorHandler);

export default router;
