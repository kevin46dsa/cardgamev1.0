import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

// DynamoDB rejects reserved words used bare in expressions; the mocks never notice, only the real service does.
const RESERVED = ["online", "name", "text", "status", "count", "ttl", "version", "hill", "data", "role", "key", "value", "user", "timestamp", "connection", "session"];

test("no db expression uses a DynamoDB reserved word unaliased", () => {
  for (const f of readdirSync(__dirname).filter((n) => n.endsWith(".ts") && !n.endsWith(".test.ts"))) {
    const src = readFileSync(`${__dirname}/${f}`, "utf8");
    for (const [, expr] of src.matchAll(/(?:Update|Condition|KeyCondition|Filter|Projection)Expression:\s*"([^"]*)"/g)) {
      for (const w of RESERVED) expect(expr, `${f}: ${expr}`).not.toMatch(new RegExp(`(^|[\\s,(])${w}\\s*(=|<|>|,|\\)|$)`, "i"));
    }
  }
});
