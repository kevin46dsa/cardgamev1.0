import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const newPlayerToken = (): string => randomBytes(16).toString("base64url"); // 128 bits

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export function verifyToken(token: string, hash: string): boolean {
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
