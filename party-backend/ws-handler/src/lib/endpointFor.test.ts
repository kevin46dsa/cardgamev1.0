import { expect, test } from "vitest";
import { endpointFor } from "./endpointFor";

test("execute-api host includes the stage", () => {
  expect(endpointFor({ domainName: "abc.execute-api.eu-west-1.amazonaws.com", stage: "prod" }))
    .toBe("https://abc.execute-api.eu-west-1.amazonaws.com/prod");
});

test("custom domain omits the stage", () => {
  expect(endpointFor({ domainName: "ws.example.com", stage: "prod" })).toBe("https://ws.example.com");
});
