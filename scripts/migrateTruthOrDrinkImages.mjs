// One-time migration: export all Firestore data as a local backup, then rewrite
// Truth or Drink's Firebase Storage image URLs to their S3 equivalents.
//
// Usage:
//   node scripts/migrateTruthOrDrinkImages.mjs            # backup + dry-run diff, no writes
//   node scripts/migrateTruthOrDrinkImages.mjs --apply     # backup, then write the new URLs

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

// Every top-level collection this app uses (from the Firebase console).
const ALL_COLLECTIONS = ["MrWhite", "game", "truthordrink"];

const S3_BASE = "https://gamenight-assets.s3.us-east-2.amazonaws.com/truthordrink";
const s3Url = (folder, filename) => `${S3_BASE}/${folder}/${encodeURIComponent(filename)}`;

// Truth or Drink deck doc ID -> S3 slug (see Truthordrink.jsx button labels)
const DECK_SLUGS = {
  "3VYgpS7VAfD86qrsOT9W": "ontherocks",
  axjXX9veP0KzvOZKJMSn: "lastcall",
  cF3CqSjUmMTVO5sBFNzo: "extradirty",
  Eg6tVYEv769y7JcMcOnr: "happyhour",
  twistcards: "twist",
};

function firebaseFilename(url) {
  const match = /\/o\/([^?]+)/.exec(url);
  return match ? decodeURIComponent(match[1]) : null;
}

function rewriteUrl(url, folder) {
  if (!url || !url.includes("firebasestorage.googleapis.com")) return url; // already migrated or not a Firebase URL
  const filename = firebaseFilename(url);
  if (!filename) return url;
  return s3Url(folder, filename);
}

async function backupAllCollections() {
  const snapshot = {};
  for (const name of ALL_COLLECTIONS) {
    const querySnapshot = await getDocs(collection(db, name));
    snapshot[name] = {};
    querySnapshot.forEach((d) => {
      snapshot[name][d.id] = d.data();
    });
  }

  const backupDir = path.join(__dirname, "firestore-backups");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `firestore-backup-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
  console.log(`Backed up ${ALL_COLLECTIONS.join(", ")} -> ${backupPath}`);
  return snapshot;
}

async function migrateTruthOrDrink(backup) {
  const truthordrink = backup["truthordrink"];
  for (const [docId, data] of Object.entries(truthordrink)) {
    const slug = DECK_SLUGS[docId];
    if (!slug) {
      console.warn(`Skipping unknown truthordrink doc "${docId}" (no slug mapping)`);
      continue;
    }

    const updates = {};
    let changed = false;

    if (Array.isArray(data.Cards)) {
      const newCards = data.Cards.map((url) => rewriteUrl(url, `Content/${slug}`));
      if (JSON.stringify(newCards) !== JSON.stringify(data.Cards)) {
        updates.Cards = newCards;
        changed = true;
      }
    }

    if (Array.isArray(data.rules)) {
      const newRules = data.rules.map((url) => rewriteUrl(url, "utility"));
      if (JSON.stringify(newRules) !== JSON.stringify(data.rules)) {
        updates.rules = newRules;
        changed = true;
      }
    } else if (data.rules) {
      const newRules = rewriteUrl(data.rules, "utility");
      if (newRules !== data.rules) {
        updates.rules = newRules;
        changed = true;
      }
    }

    if (!changed) {
      console.log(`[${docId}] (${slug}) - already migrated, nothing to do`);
      continue;
    }

    console.log(`[${docId}] (${slug})`);
    if (updates.Cards) {
      data.Cards.forEach((old, i) => {
        if (old !== updates.Cards[i]) console.log(`  Cards[${i}]: ${old}\n    -> ${updates.Cards[i]}`);
      });
    }
    if (updates.rules) {
      if (Array.isArray(updates.rules)) {
        data.rules.forEach((old, i) => {
          if (old !== updates.rules[i]) console.log(`  rules[${i}]: ${old}\n    -> ${updates.rules[i]}`);
        });
      } else {
        console.log(`  rules: ${data.rules}\n    -> ${updates.rules}`);
      }
    }

    if (APPLY) {
      await updateDoc(doc(db, "truthordrink", docId), updates);
      console.log(`  applied.`);
    }
  }
}

async function main() {
  const backup = await backupAllCollections();
  await migrateTruthOrDrink(backup);
  if (!APPLY) {
    console.log("\nDry run only - no writes made. Re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
