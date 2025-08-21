// src/modules/inquiries/inquiries.routes.ts
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { InquirySchema } from "./inquiries.schema";
import { createInquiry } from "./inquiries.controller";

export const inquiriesRouter = Router();

// validazione Zod (puoi riutilizzare il tuo middleware)
const validate = (schema: z.ZodSchema) => (req: any, _res: any, next: any) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return next({ status: 400, message: "Invalid payload" });
  req.body = r.data;
  next();
};

// limit basic anti-spam per il modulo
const inquiriesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste. Riprova tra poco." },
});

inquiriesRouter.post("/", inquiriesLimiter, validate(InquirySchema), createInquiry);
