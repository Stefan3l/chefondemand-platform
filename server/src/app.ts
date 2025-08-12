// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import healthRoutes from "./routes/health";
import inquiriesRoutes from "./routes/inquiries";

import { loadEnv } from "./lib/env";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();
const env = loadEnv();

const app = express();

/* -------- Security & performance middlewares -------- */
app.use(helmet()); // Sets various HTTP headers for app security
app.use(
  cors({
    origin: env.CORS_ORIGIN, // Allowed origin(s) for CORS
    credentials: true
  })
);
app.use(compression()); // Compresses response bodies for better performance
app.use(express.json({ limit: "1mb" })); // Parse incoming JSON requests with body limit

// Rate limiter to prevent abuse and brute-force attacks
app.use(
  rateLimit({
    windowMs: 60_000, // 1 minute
    max: 120,         // Limit each IP to 120 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  })
);

/* -------- API routes -------- */
app.use("/health", healthRoutes);
app.use("/api/inquiries", inquiriesRoutes);

/* -------- 404 handler & error handler -------- */
app.use(notFound); // Handle non-existing routes
app.use(errorHandler); // Centralized error handling

export default app;
