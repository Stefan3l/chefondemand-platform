import { prisma } from "../../prisma";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/AppError";

type Input = {
  userId: string;
  oldPassword: string;
  newPassword: string;
};

export async function changeChefPassword({ userId, oldPassword, newPassword }: Input) {
  const chef = await prisma.chef.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!chef) {
    throw new AppError("Utente non trovato.", 404);
  }

  const ok = await bcrypt.compare(oldPassword, chef.passwordHash);
  if (!ok) {
    throw new AppError("La password corrente non è corretta.", 400);
  }

  // Evita riutilizzo identico
  const same = await bcrypt.compare(newPassword, chef.passwordHash);
  if (same) {
    throw new AppError("La nuova password deve essere diversa da quella corrente.", 400);
  }

  const salt = await bcrypt.genSalt(12);
  const newHash = await bcrypt.hash(newPassword, salt);

  await prisma.chef.update({
    where: { id: chef.id },
    data: { passwordHash: newHash },
  });

  return { ok: true };
}
