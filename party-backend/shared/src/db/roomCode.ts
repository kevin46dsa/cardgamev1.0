// 24 letters: A-Z without O and I (they look like 0 and 1).
export const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRoomCode(rng: () => number): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(rng() * ALPHABET.length)];
  return s;
}

export function normalizeCode(input: string): string | null {
  const c = input.trim().toUpperCase();
  return /^[A-HJ-NP-Z]{4}$/.test(c) ? c : null;
}
