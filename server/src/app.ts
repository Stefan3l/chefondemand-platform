// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

// routes
import chefsRouter from "./modules/chefs/routes/chefs.routes";
import { healthRouter } from "./modules/health/health";
import { inquiriesRouter } from "./modules/inquiries/inquiries.routes";

import { loadEnv } from "./lib/env";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();
const env = loadEnv();
const app = express();

/* ───────────────── Sicurezza & performance ───────────────── */
// ⚠️ Configura helmet per consentire le risorse cross-origin (immagini su porta 4000)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // <- FIX CORP
    crossOriginEmbedderPolicy: false, // utile in dev per evitare "require-corp"
  })
);

app.use(cookieParser());

// CORS per XHR/fetch (non influisce su CORP, ma serve per cookie/fetch)
app.use(
  cors({
    origin: env.CORS_ORIGIN, // es.: "http://localhost:3000"
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "1mb" }));

/* ───────────────── Static /static → uploads ───────────────── */
// mappa /static alla cartella 'uploads' e aggiungi CORP cross-origin
const uploadsRoot = path.join(process.cwd(), "uploads");
app.use(
  "/static",
  (req, res, next) => {
    // permette l'embed da origin diversa (3000 -> 4000)
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // opzionale ma utile in dev per evitare dubbi
    if (env.CORS_ORIGIN) {
      res.setHeader("Access-Control-Allow-Origin", env.CORS_ORIGIN);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    next();
  },
  express.static(uploadsRoot, {
    setHeaders: (res) => {
      // caching gradevole per le immagini
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

/* ───────────────── API ───────────────── */
app.use("/api/chefs", chefsRouter);
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use("/health", healthRouter);
app.use("/api/inquiries", inquiriesRouter);

/* ───────────────── Error handling ───────────────── */
app.use(notFound);
app.use(errorHandler);

export default app;
