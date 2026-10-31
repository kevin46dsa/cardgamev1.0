// DynamoDB TTL is epoch SECONDS. META gets idle expiry (refreshed on every save/touch); every other
// room item gets the longer ITEM_TTL so a long game never loses players mid-match while META keeps living.
export const IDLE_TTL = 30 * 60;
export const ENDED_TTL = 24 * 60 * 60;
export const ITEM_TTL = 4 * 60 * 60;
export const PAIR_TTL = 10 * 60;

export const nowSec = () => Math.floor(Date.now() / 1000);
export const ttlIn = (seconds: number) => nowSec() + seconds;
