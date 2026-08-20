// One-time fix: rewrite Truth or Drink's Firestore `Cards`/`rules` URLs to
// match the actual files in S3 (Content/<slug>/TruthorDrink-<CODE>-%04d.png),
// after they were renamed in the bucket without Firestore being updated to
// match. Follows the same backup-then-apply pattern as migrateTruthOrDrinkImages.mjs.
//
// Usage:
//   node scripts/fixTruthOrDrinkAssetNames.mjs            # backup + dry-run diff, no writes
//   node scripts/fixTruthOrDrinkAssetNames.mjs --apply     # backup, then write the new URLs

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const firebaseConfig = {
  apiKey: "AIzaSyCj69emN7_WHDgj8d0Jc0Vf2gGF-5mTH2A",
  authDomain: "card-game-45e80.firebaseapp.com",
  projectId: "card-game-45e80",
  storageBucket: "card-game-45e80.appspot.com",
  messagingSenderId: "213213288776",
  appId: "1:213213288776:web:d04b2787a7be815f917b7d",
};

initializeApp(firebaseConfig);
const db = getFirestore();

const S3_BASE = "https://gamenight-assets.s3.us-east-2.amazonaws.com/truthordrink";
const s3Url = (folder, filename) => `${S3_BASE}/${folder}/${encodeURIComponent(filename)}`;

// Truth or Drink deck doc ID -> S3 slug/code/actual file count (verified via
// `aws s3 ls` against the real bucket on 2026-08-20).
const DECKS = {
  "3VYgpS7VAfD86qrsOT9W": { slug: "ontherocks", code: "OTR", count: 54 },
  axjXX9veP0KzvOZKJMSn: { slug: "lastcall", code: "LC", count: 54 },
  cF3CqSjUmMTVO5sBFNzo: { slug: "extradirty", code: "ED", count: 55 },
  Eg6tVYEv769y7JcMcOnr: { slug: "happyhour", code: "HH", count: 56 },
  twistcards: { slug: "twist", code: "TWIST", count: 55 },
};

function buildCards({ slug, code, count }) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(4, "0");
    return s3Url(`Content/${slug}`, `TruthorDrink-${code}-${n}.png`);
  });
}

// The stored `rules` field points at truthordrink/utility/... (lowercase);
// the real folder is Utility/ (capital U). Fix casing only — the referenced
// file itself doesn't exist in the bucket, flagged separately.
function fixRulesCasing(rules) {
  const fix = (url) => (typeof url === "string" ? url.replace("/truthordrink/utility/", "/truthordrink/Utility/") : url);
  return Array.isArray(rules) ? rules.map(fix) : fix(rules);
}

async function backupTruthOrDrink() {
  const snapshot = {};
  const querySnapshot = await getDocs(collection(db, "truthordrink"));
  querySnapshot.forEach((d) => {
    snapshot[d.id] = d.data();
  });

  const backupDir = path.join(__dirname, "firestore-backups");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `truthordrink-backup-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
  console.log(`Backed up truthordrink -> ${backupPath}`);
  return snapshot;
}

async function fixDeck(docId, data) {
  const deck = DECKS[docId];
  if (!deck) {
    console.warn(`Skipping unknown truthordrink doc "${docId}" (no deck mapping)`);
    return;
  }

  const newCards = buildCards(deck);
  const newRules = fixRulesCasing(data.rules);

  const updates = {};
  if (JSON.stringify(newCards) !== JSON.stringify(data.Cards ?? [])) updates.Cards = newCards;
  if (JSON.stringify(newRules) !== JSON.stringify(data.rules)) updates.rules = newRules;

  if (Object.keys(updates).length === 0) {
    console.log(`[${docId}] (${deck.slug}) - already correct, nothing to do`);
    return;
  }

  console.log(`[${docId}] (${deck.slug})`);
  if (updates.Cards) {
    console.log(`  Cards: ${data.Cards?.length ?? 0} items -> ${updates.Cards.length} items`);
    console.log(`    first: ${updates.Cards[0]}`);
    console.log(`    last:  ${updates.Cards[updates.Cards.length - 1]}`);
  }
  if (updates.rules) {
    console.log(`  rules: ${JSON.stringify(data.rules)} -> ${JSON.stringify(updates.rules)}`);
  }

  if (APPLY) {
    await updateDoc(doc(db, "truthordrink", docId), updates);
    console.log(`  applied.`);
  }
}

async function main() {
  const backup = await backupTruthOrDrink();
  for (const [docId, data] of Object.entries(backup)) {
    await fixDeck(docId, data);
  }
  if (!APPLY) {
    console.log("\nDry run only - no writes made. Re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
