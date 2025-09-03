// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

// rotte principali
import chefsRouter from "./modules/chefs/routes/chefs.routes";
import dishPhotosRouter from "./modules/chefs/routes/dishPhotos.routes"; // ← foto piatti
import dishesRouter from "./modules/chefs/routes/dishes.router";        // ← piatti
import menuRouter from "./modules/chefs/routes/menu.routes";            // ← menu
import menuDishRouter from "./modules/chefs/routes/menuDish.routes"; // ← menu-dishes
import { healthRouter } from "./modules/health/health";
import { inquiriesRouter } from "./modules/inquiries/inquiries.routes";

import { loadEnv } from "./lib/env";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();
const env = loadEnv();
const app = express();

/* ───────────────── CORS (liste origini consentite) ───────────────── */
const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";
const ALLOWED_ORIGINS = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ───────────────── Sicurezza & performance ───────────────── */
app.use(
  helmet({
    // Consente di servire immagini/statiche cross-origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Disabilitiamo COEP per evitare problemi con script terzi
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      // Nessuna origin (Postman/curl) → permetti
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin non consentita dal CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(compression());

// Body parser (limite ragionevole per payload JSON)
app.use(express.json({ limit: "1mb" }));

/* ───────────────── Protezione URL minima: rimuove CR/LF/TAB percent-encoded ───────────────── */
app.use((req, _res, next) => {
  const cleaned = req.url.replace(/%0A|%0D|%09/gi, "");
  if (cleaned !== req.url) req.url = cleaned;
  next();
});

/* ───────────────── Statico: /static → cartella uploads ───────────────── */
const uploadsRoot = path.join(process.cwd(), "uploads");
app.use(
  "/static",
  (req, res, next) => {
    // Consente embedding cross-origin per le risorse statiche
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    const reqOrigin = req.headers.origin as string | undefined;
    if (reqOrigin && ALLOWED_ORIGINS.includes(reqOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", reqOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    next();
  },
  express.static(uploadsRoot, {
    setHeaders: (res) => {
      // Cache aggressiva per asset immutabili
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

/* ───────────────── Rate limit API (prima del montaggio rotte) ───────────────── */
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000, // finestra 60s
    max: 120,         // max 120 richieste/min per IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ───────────────── Montaggio router API ─────────────────
// Nota: ogni router espone il proprio prefisso (es. /chefs/:chefId/...).
app.use("/api", dishPhotosRouter);      // foto piatti: GET/POST/PATCH/DELETE
app.use("/api", dishesRouter);          // piatti (Dish) GET/POST/PATCH/DELETE
app.use("/api/chefs", menuRouter);      // /api/chefs/:chefId/menus
app.use("/api/chefs", menuDishRouter);  // /api/chefs/:chefId/menus/:menuId/dishes
app.use("/api/chefs", chefsRouter);     // rotte chefs esistenti
app.use("/api/inquiries", inquiriesRouter);

/* ───────────────── Healthcheck ───────────────── */
app.use("/health", healthRouter);

/* ───────────────── Error handling ───────────────── */
app.use(notFound);
app.use(errorHandler);

export default app;
