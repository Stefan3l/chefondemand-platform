import { PrismaClient, ChefDishPhoto } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

/** Mappa errori Prisma → HTTP status + messaggio utile */
function mapPrismaError(e: unknown): { status: number; message: string } {
  const err = e as { code?: string };
  switch (err.code) {
    case "P2003": // violazione chiave esterna
      return { status: 400, message: "Relazione non valida (chiave esterna)." };
    case "P2025": // record non trovato
      return { status: 404, message: "Risorsa non trovata." };
    default:
      return { status: 500, message: "Errore interno." };
  }
}

/** Piccola guard per evitare path traversal su percorsi relativi */
function isSafeRelPath(rel: string): boolean {
  if (!rel) return false;
  if (rel.includes("..")) return false;
  // normalizza gli slash (compat Win)
  const norm = rel.replace(/\\/g, "/");
  // non deve iniziare con "/" (deve essere relativo)
  if (norm.startsWith("/")) return false;
  return true;
}

/** Costruisce il path assoluto nel folder /uploads a partire da un path relativo */
function uploadsAbsPathFromRel(rel: string): string {
  return path.join(process.cwd(), "uploads", rel);
}

/** Tenta di derivare un path relativo a /uploads da un imageUrl tipo /static/... */
function relPathFromStaticUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  // rimuove origin (http://host:port) e prefisso /static/
  const withoutOrigin = imageUrl.replace(/^https?:\/\/[^/]+/i, "");
  const m = withoutOrigin.match(/^\/static\/(.+)$/);
  if (!m) return null;
  const rel = m[1].replace(/\\/g, "/");
  return rel && isSafeRelPath(rel) ? rel : null;
}

export async function listDishPhotosByChef(
  chefId: string,
  limit = 50
): Promise<ChefDishPhoto[]> {
  return prisma.chefDishPhoto.findMany({
    where: { chefId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createDishPhoto(params: {
  chefId: string;
  imageUrl: string;
  imageMime?: string | null;
  description?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  /** percorso relativo sotto /uploads, es. "dishes/1693...-abc.jpg" */
  imagePath?: string | null;
}): Promise<ChefDishPhoto> {
  try {
    return await prisma.chefDishPhoto.create({
      data: {
        chefId: params.chefId,
        imageUrl: params.imageUrl,
        imageMime: params.imageMime ?? null,
        description: params.description ?? null,
        imageWidth: params.imageWidth ?? null,
        imageHeight: params.imageHeight ?? null,
        imagePath: params.imagePath ?? null, // ← salva anche il path relativo su disco
      },
    });
  } catch (e) {
    throw mapPrismaError(e);
  }
}

export async function updateDishPhotoDescription(params: {
  chefId: string;
  photoId: string;
  description?: string | null;
}): Promise<ChefDishPhoto> {
  try {
    const updated = await prisma.chefDishPhoto.update({
      where: { id: params.photoId },
      data: { description: params.description ?? null },
    });
    if (updated.chefId !== params.chefId) {
      throw { status: 403, message: "Foto non appartiene allo chef." };
    }
    return updated;
  } catch (e) {
    if ((e as { status?: number }).status) throw e;
    throw mapPrismaError(e);
  }
}

/** Elimina record e (se presente) il file immagine dallo storage locale */
export async function deleteDishPhoto(params: {
  chefId: string;
  photoId: string;
}): Promise<void> {
  try {
    // 1) Recupera il record e verifica appartenenza
    const photo = await prisma.chefDishPhoto.findUnique({ where: { id: params.photoId } });
    if (!photo) throw { status: 404, message: "Foto non trovata." };
    if (photo.chefId !== params.chefId) {
      throw { status: 403, message: "Foto non appartiene allo chef." };
    }

    // 2) Determina il file da cancellare
    let rel: string | null = null;

    // priorità: imagePath (più affidabile)
    if (photo.imagePath && isSafeRelPath(photo.imagePath)) {
      rel = photo.imagePath.replace(/\\/g, "/");
    } else {
      // fallback: prova a derivare da imageUrl (/static/...)
      rel = relPathFromStaticUrl(photo.imageUrl);
    }

    // 3) Se abbiamo un path relativo valido, prova a rimuovere il file
    if (rel) {
      const full = uploadsAbsPathFromRel(rel);
      try {
        await fs.unlink(full);
      } catch {
        // File già assente o permesso negato → non blocchiamo la cancellazione DB
      }
    }

    // 4) Elimina il record dal DB
    await prisma.chefDishPhoto.delete({ where: { id: params.photoId } });
  } catch (e) {
    if ((e as { status?: number }).status) throw e;
    throw mapPrismaError(e);
  }
}
