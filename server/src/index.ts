import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRoutes from "./routes/health";
import inquiriesRoutes from "./routes/inquiries";
import { loadEnv } from "./lib/env";
import { errorHandler } from "./middleware/error";

dotenv.config();
const env = loadEnv();

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// routes
app.use("/health", healthRoutes);
app.use("/api/inquiries", inquiriesRoutes);

// error handler
app.use(errorHandler);

const PORT = env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
