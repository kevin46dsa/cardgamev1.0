import type { WireView } from "@party/shared/src/protocol";
import { viewFor, type GameState, type ViewCtx } from "@party/shared/src/rules";
import { promptText } from "../lib/prompts";

// viewFor + the prompt TEXT (the engine only knows ids; the whole bank is never sent).
export function wireView(s: GameState, who: string, c?: ViewCtx): WireView {
  const v = viewFor(s, who, c);
  return v.match ? { ...v, match: { ...v.match, prompt: promptText(v.match.promptId) } } : (v as WireView);
}
