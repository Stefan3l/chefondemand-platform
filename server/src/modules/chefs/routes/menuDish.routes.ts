// modules/chefs/menu-dishes/menuDish.routes.ts
import { Router } from "express";
import {
  addMenuDish,
  deleteMenuDish,
  listMenuDishes,
  menuDishErrorHandler,
  reorderMenuDishes,
  updateMenuDish,
} from "../controllers/menuDish.controller";
// Adatta i percorsi di import in base alla tua struttura
import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";
import { ensureSameChefOrAdmin } from "../../../middleware/ownership.middleware";

// ───────────────── Router MenuDish ─────────────────
// Path completo (montato sotto /api/chefs):
//   /api/chefs/:chefId/menus/:menuId/dishes[...]

const router = Router();

// Autenticazione + ownership per tutte le rotte di questo gruppo
router.use("/:chefId/menus/:menuId/dishes", authJwtMiddleware, ensureSameChefOrAdmin("chefId"));

// Lista righe del menu
router.get("/:chefId/menus/:menuId/dishes", listMenuDishes);

// Aggiungi un piatto esistente al menu (crea snapshot)
router.post("/:chefId/menus/:menuId/dishes", addMenuDish);

// Aggiorna una riga (attualmente solo 'ordine')
router.patch("/:chefId/menus/:menuId/dishes/:menuDishId", updateMenuDish);

// Riordino massivo (opzionale ma utile per UI drag&drop)
router.patch("/:chefId/menus/:menuId/dishes/reorder", reorderMenuDishes);

// Elimina una riga dal menu
router.delete("/:chefId/menus/:menuId/dishes/:menuDishId", deleteMenuDish);

// Gestione errori specifica del modulo
router.use(menuDishErrorHandler);

export default router;
