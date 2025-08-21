// src/modules/inquiries/inquiries.controller.ts
import { Request, Response, NextFunction } from "express";
// când legi DB, importă prisma de aici: import { prisma } from "../../prisma";
import { InquiryInput } from "./inquiries.schema";

export async function createInquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as InquiryInput;

    // TODO: când vei avea tabel, fă insert în DB cu prisma.inquiry.create({ data })
    // deocamdată întoarcem un ID temporar
    const id = "inq_" + Date.now();

    return res.status(201).json({ ok: true, id, ...data });
  } catch (err) {
    next(err);
  }
}
