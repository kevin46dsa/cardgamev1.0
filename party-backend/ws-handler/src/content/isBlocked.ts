import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });

// Handles leet speak and repeated letters; whole-word matching keeps "Scunthorpe" and "Cassandra" clean.
// ponytail: "s h i t" (spaced letters) is not caught; collapsing spaces would flag innocent text like "his hit".
// A first name like "Dick" IS blocked: pick another name, cheaper than moderating a lobby.
export function isBlocked(text: string): boolean {
  return matcher.hasMatch(text);
}
