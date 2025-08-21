// src/modules/inquiries/inquiries.schema.ts
import { z } from "zod";

export const InquirySchema = z.object({
  serviceType: z.enum(["single", "multi", "class"]),
  dateFrom: z.string().min(1, "dateFrom is required"),
  dateTo: z.string().optional(),
  location: z.string().min(2, "location is required"),
  guestsAdult: z.coerce.number().int().nonnegative(),
  guestsKid: z.coerce.number().int().nonnegative().default(0),
  cuisine: z.array(z.string()).default([]),
  budget: z.coerce.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
}).refine((d) => {

  if (d.serviceType === "multi") {
    if (!d.dateTo) return false;
    const from = Date.parse(d.dateFrom);
    const to = Date.parse(d.dateTo);
    return Number.isFinite(from) && Number.isFinite(to) && to >= from;
  }
  return true;
}, { message: "Intervallo date non valido per il tipo di servizio." });

export type InquiryInput = z.infer<typeof InquirySchema>;
