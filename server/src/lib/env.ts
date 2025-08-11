import { z } from "zod";

const EnvSchema = z.object({
 PORT: z.string().transform(v => Number(v)).default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(), // o folosim când adăugăm Prisma
});

export type Env = z.infer<typeof EnvSchema>;

export const loadEnv = (): Env => {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
};
