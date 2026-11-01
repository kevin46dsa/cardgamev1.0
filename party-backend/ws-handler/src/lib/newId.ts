const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

// Public player id (not a secret; the token is). 8 chars.
export const newId = (rng: () => number): string => Array.from({ length: 8 }, () => CHARS[Math.floor(rng() * CHARS.length)]).join("");
