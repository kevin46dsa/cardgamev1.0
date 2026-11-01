import { COPY, POLL_MS, TIMEOUT } from "./constants";
import type { Party } from "./fixtures";
import type { Phone, ScreenState, Tv } from "./pages";

type Side = "A" | "B";
type TieChoice = "New prompt" | "Revote";

export interface GameOptions {
  phones: Phone[];
  tv?: Tv;
  mode: "tv" | "phone";
  /** side to vote for, or null to abstain (zero votes = a tie). Default: everyone votes A. */
  vote?: (voter: Phone, run: GameRun) => Side | null;
  /** tie choice for a tied contestant (null = do not choose). Default: Revote. */
  tie?: (p: Phone, run: GameRun) => TieChoice | null;
  /** answer text for a contestant. Default: unique per player and answer. */
  answer?: (p: Phone, run: GameRun) => string;
  /** stop early when true (default: every phone shows "Game over") */
  until?: (run: GameRun, states: ScreenState[], tv: ScreenState | null) => boolean;
  timeoutMs?: number;
  /** photograph each new distinct screen (default true) */
  catalog?: boolean;
}

/** What happened during a driven game; specs assert on it. */
export class GameRun {
  answers: { who: string; text: string }[] = [];
  leaks: string[] = [];
  phasesSeen = new Set<string>();
  roleTitlesSeen = new Set<string>();
  tvVoteCountSeen = false;
  phoneVoteCountSeen = false;
  /** number of times the first phone entered the phase (a replay counts again) */
  entered: Record<string, number> = {};
  votesCast = 0;
  private last: string | null = null;
  noteFirst(s: ScreenState) {
    if (s.phase !== this.last) {
      this.last = s.phase;
      if (s.phase) this.entered[s.phase] = (this.entered[s.phase] ?? 0) + 1;
    }
  }
}

/**
 * Plays a whole game through the real UIs like a table of people: contestants type, the crowd votes, tied players choose.
 * Polls every screen (no fixed sleeps) and acts only on what that screen shows, so every action is idempotent:
 * a locked answer, a pressed vote or a disabled tie button is never touched twice. Secrecy is checked on every poll.
 */
export async function playGame(party: Party, o: GameOptions): Promise<GameRun> {
  const run = new GameRun();
  const deadline = Date.now() + (o.timeoutMs ?? TIMEOUT.game(o.phones.length));
  const names = (i: number) => o.phones[i]!.label;

  while (Date.now() < deadline) {
    const states = await Promise.all(o.phones.map((p) => p.read()));
    const tvState = o.tv ? await o.tv.read() : null;
    run.noteFirst(states[0]!);
    if (process.env.PARTY_TRACE) console.log(new Date().toISOString().slice(14, 23), states.map((s) => `${s.phase}${s.canWrite ? "/w" : ""}${s.voteButtons ? "/v" : ""}${s.votePressed ? "*" : ""}`).join(" "));
    const all: [string, ScreenState][] = [...states.map((s, i): [string, ScreenState] => [names(i), s]), ...(tvState ? [["TV", tvState] as [string, ScreenState]] : [])];

    for (const [label, s] of all) {
      if (s.phase) run.phasesSeen.add(s.phase);
      if (s.roleTitle) run.roleTitlesSeen.add(s.roleTitle);
      // secrecy: nobody but the author sees a typed answer before voting opens
      if (s.phase === "write" || s.phase === "intro") {
        for (const a of run.answers) if (a.who !== label && s.text.includes(a.text)) run.leaks.push(`${label} saw ${a.who}'s answer "${a.text}" during ${s.phase}`);
      }
      // live vote count: never on a phone; on the TV only in TV mode
      if (s.phase === "vote" && COPY.VOTE_COUNT.test(s.text)) {
        if (label === "TV") run.tvVoteCountSeen = true; else run.phoneVoteCountSeen = true;
      }
    }

    if (o.catalog !== false) {
      for (const [i, s] of states.entries()) await party.catalog(o.phones[i]!, o.mode, s);
      if (tvState && o.tv) await party.catalog(o.tv, o.mode, tvState);
    }

    for (const [i, p] of o.phones.entries()) {
      const s = states[i]!;
      if (s.phase === "write" && s.canWrite && s.canSubmit) {
        const text = (o.answer ?? defaultAnswer)(p, run);
        run.answers.push({ who: p.label, text });
        await p.page.locator("#party-answer").fill(text);
        await p.page.getByRole("button", { name: /^(Submit|Update answer)$/ }).click();
      } else if (s.phase === "vote" && s.voteButtons > 0 && !s.votePressed) {
        const side = (o.vote ?? (() => "A" as Side))(p, run);
        if (side) {
          await p.page.locator("button.party-answer").filter({ has: p.page.locator(".party-answer__side", { hasText: new RegExp(`^${side}$`) }) }).click();
          run.votesCast++;
        }
      } else if (s.phase === "tiebreak" && s.tieEnabled) {
        const choice = (o.tie ?? (() => "Revote" as TieChoice))(p, run);
        if (choice) await p.page.getByRole("group", { name: "Tie break choice" }).getByRole("button", { name: choice }).click();
      }
    }

    if (o.until ? o.until(run, states, tvState) : states.every((s) => s.phase === "final")) return run;
    await o.phones[0]!.page.waitForTimeout(POLL_MS); // poll cadence, not a state wait
  }
  const where = (await Promise.all(o.phones.map(async (p) => `${p.label}=${(await p.read()).phase}`))).join(" ");
  throw new Error(`game did not finish in time; phases seen: ${[...run.phasesSeen].join(",")}; now: ${where}`);
}

let counter = 0;
const defaultAnswer = (p: Phone) => `${p.name} answer ${++counter}`.slice(0, 60);
