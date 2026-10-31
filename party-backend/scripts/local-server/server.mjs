// `node scripts/local-server/server.mjs` -> ws://localhost:8787 (PORT=... to change). Bundles entry.ts with esbuild, swapping the
// DynamoDB module for the in-memory fakeDb, then runs it. No AWS, no rate-limit quota.
import { build } from "esbuild";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, ".build", "server.mjs");
const fakeDb = path.join(here, "../../ws-handler/src/testing/fakeDb.ts");

await build({
  entryPoints: [path.join(here, "entry.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: ["ws", "@aws-sdk/*"],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  plugins: [{
    name: "fake-db",
    setup: (b) => b.onResolve({ filter: /^@party\/shared\/src\/db$/ }, () => ({ path: fakeDb })),
  }],
  logLevel: "warning",
});

if (process.argv.includes("--build-only")) process.exit(0);
const child = spawn(process.execPath, [out], { stdio: "inherit", env: { ...process.env, TABLE_NAME: "local" }, cwd: path.join(here, "../..") });
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => child.kill(s));
child.on("exit", (c) => process.exit(c ?? 0));
