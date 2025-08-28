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

/* ────────────── CORS: suportă listă de origini ────────────── */
const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";
const ALLOWED_ORIGINS = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ────────────── Securitate & perf ────────────── */
app.use(
  helmet({
    // imagini servite de pe port 4000 pot fi încărcate în Next (port 3000)
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cookieParser());

// CORS pentru XHR/fetch (cu cookie-uri)
app.use(
  cors({
    origin: (origin, callback) => {
      // fără header Origin (ex: curl, Postman) -> permite
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "1mb" }));

/* ────────────── Static /static → uploads ────────────── */
const uploadsRoot = path.join(process.cwd(), "uploads");
app.use(
  "/static",
  (req, res, next) => {
    // permite embed din altă origine (3000 -> 4000)
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    // reflectă Origin-ul DOAR dacă e în whitelist
    const reqOrigin = req.headers.origin as string | undefined;
    if (reqOrigin && ALLOWED_ORIGINS.includes(reqOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", reqOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    next();
  },
  express.static(uploadsRoot, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

/* ────────────── API ────────────── */
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

/* ────────────── Error handling ────────────── */
app.use(notFound);
app.use(errorHandler);

export default app;
