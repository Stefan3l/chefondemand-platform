
// -------------------------------------------------------------
// Autorizzazione: consente l’accesso solo se l’utente autenticato
// è lo stesso chef del path (/:chefId) oppure ha ruolo "admin".
// È una "factory": ensureSameChefOrAdmin("chefId") → RequestHandler.
// -------------------------------------------------------------

import { RequestHandler } from "express";

export const ensureSameChefOrAdmin = (paramName = "chefId"): RequestHandler => {
  return (req, res, next) => {
    // req.user deve essere valorizzato da authJwtMiddleware
    const user = req.user;
    if (!user) {
      res.status(401).json({ ok: false, error: { message: "Non autenticato." } });
      return;
    }

    const chefIdFromPath = req.params[paramName];
    if (!chefIdFromPath) {
      res.status(400).json({ ok: false, error: { message: `Parametro mancante: :${paramName}` } });
      return;
    }

    // Alcuni JWT espongono user.id == chef.id, altri hanno un campo dedicato (user.chefId)
    const userChefId = user.chefId ?? user.id;
    const isAdmin = user.role === "admin";

    if (isAdmin || userChefId === chefIdFromPath) {
      next();
      return;
    }

    res.status(403).json({ ok: false, error: { message: "Non autorizzato." } });
  };
};
