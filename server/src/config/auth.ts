// Config comun pentru auth/JWT
export const JWT_COOKIE_NAME = "chef_access_token";

export function getJwtExpiresInSeconds(): number {
  const envVal = process.env.JWT_EXPIRES_IN;
  const n = envVal ? Number(envVal) : NaN;
  return Number.isFinite(n) ? n : 7 * 24 * 60 * 60; 
}

export function getCookieSameSite(): "lax" | "none" | "strict" {
  const v = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  return v === "none" || v === "strict" ? (v as any) : "lax";
}
