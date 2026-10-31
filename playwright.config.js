import { defineConfig, devices } from "@playwright/test";

// Party (Funniest Answer) E2E: live backend, so it runs alone (PARTY_ONLY=1 via `npm run e2e:party`), one worker,
// against its own vite dev server. See e2e/party/README.md.
const PARTY_PORT = process.env.PARTY_PORT ?? "5180";
const PARTY_URL = process.env.PARTY_BASE_URL ?? `http://localhost:${PARTY_PORT}`;
const partyOnly = !!process.env.PARTY_ONLY;
// By default the UI talks to a LOCAL in-memory server running the real handler (party-backend/scripts/local-server):
// the live backend allows only 10 createRoom per hour per IP. PARTY_WS_URL=wss://... targets another backend instead.
const LOCAL_WS_PORT = process.env.PARTY_LOCAL_WS_PORT ?? "8787";
const PARTY_WS_URL = process.env.PARTY_WS_URL ?? `ws://localhost:${LOCAL_WS_PORT}`;
process.env.WS_URL = PARTY_WS_URL; // read by the socket bots (party-backend/scripts/sim/bot.mjs) in the test workers
const partyServers = [
  ...(process.env.PARTY_WS_URL
    ? []
    : [{ command: "node party-backend/scripts/local-server/server.mjs", port: Number(LOCAL_WS_PORT), reuseExistingServer: true, timeout: 60_000, env: { PORT: LOCAL_WS_PORT } }]),
  {
    command: `npx vite --port ${PARTY_PORT} --strictPort`,
    url: PARTY_URL,
    reuseExistingServer: true,
    timeout: 60_000,
    env: { VITE_WS_URL: PARTY_WS_URL },
  },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: partyOnly ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  webServer: [
    ...(partyOnly
      ? []
      : [{
          command: "npm run preview -- --port 4173",
          url: "http://localhost:4173",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        }]),
    ...(partyOnly || process.env.PARTY_SERVER ? partyServers : []),
  ],
  projects: [
    { name: "chromium", testIgnore: /party\//, use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Chrome", testIgnore: /party\//, use: { ...devices["Pixel 5"] } },
    {
      name: "party",
      testDir: "./e2e/party",
      fullyParallel: false,
      retries: 0,
      timeout: 120_000,
      expect: { timeout: 10_000 },
      // video/trace are applied by the `party` fixture to every context it opens (see e2e/party/support/fixtures.ts).
      use: { ...devices["Desktop Chrome"], baseURL: PARTY_URL, video: "on", trace: "on-first-retry", screenshot: "only-on-failure" },
    },
  ],
});
