import bank from "../content/prompts.json";

export const PROMPT_IDS: string[] = bank.map((p) => p.id);
const text = new Map(bank.map((p) => [p.id, p.text]));
export const promptText = (id: string): string => text.get(id) ?? "";
