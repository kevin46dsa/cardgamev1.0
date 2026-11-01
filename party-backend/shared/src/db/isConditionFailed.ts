export const isConditionFailed = (e: unknown): boolean =>
  (e as { name?: string } | null)?.name === "ConditionalCheckFailedException";
