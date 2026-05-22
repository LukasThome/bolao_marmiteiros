import { randomBytes, pbkdf2Sync } from "crypto";

const ITERATIONS = 600_000;
const KEY_LEN = 64;
const DIGEST = "sha256";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return derived === hash;
}
