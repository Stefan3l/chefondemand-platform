import { Router } from "express";
import { z } from "zod";

const router = Router();

const InquirySchema = z.object({
  serviceType: z.enum(["single", "multi", "class"]),
  dateFrom: z.string(),
  dateTo: z.string().optional(),
  location: z.string(),
  guestsAdult: z.number().int().nonnegative(),
  guestsKid: z.number().int().nonnegative().default(0),
  cuisine: z.array(z.string()).default([]),
  budget: z.number().int().optional(),
  notes: z.string().optional(),
});

// POST /api/inquiries (per il momento solo valida, senza DB)
router.post("/", (req, res, next) => {
  const parsed = InquirySchema.safeParse(req.body);
  if (!parsed.success) return next({ status: 400, message: "Invalid payload" });
  // TODO: quando aggiungiamo Prisma → inseriamo nel DB
  return res.status(201).json({ id: "temp_" + Date.now(), ...parsed.data });
});

export default router;
