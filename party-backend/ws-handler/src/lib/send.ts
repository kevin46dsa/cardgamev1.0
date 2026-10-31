import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import type { ServerEvent } from "@party/shared/src/protocol";

export const WARN_BYTES = 2048;
export const MAX_BYTES = 30 * 1024; // API Gateway: 32 KB per frame, 128 KB per message

export interface SendResult {
  gone: string[]; // 410: socket is dead, caller should mark these players away
  failed: number; // any other error: logged, not thrown
}

const isGone = (e: unknown) => {
  const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
  return err?.name === "GoneException" || err?.$metadata?.httpStatusCode === 410;
};

export function makeSender(endpoint: string) {
  const client = new ApiGatewayManagementApiClient({ endpoint });

  async function broadcast(connectionIds: string[], event: ServerEvent | { event: string }): Promise<SendResult> {
    const Data = JSON.stringify(event);
    const bytes = Buffer.byteLength(Data);
    if (bytes > MAX_BYTES) throw new Error(`event "${event.event}" is ${bytes} bytes, over the ${MAX_BYTES} byte limit`);
    if (bytes > WARN_BYTES) console.warn(`event "${event.event}" is ${bytes} bytes, over ${WARN_BYTES}`);
    const results = await Promise.allSettled(
      connectionIds.map((ConnectionId) => client.send(new PostToConnectionCommand({ ConnectionId, Data }))),
    );
    const out: SendResult = { gone: [], failed: 0 };
    results.forEach((r, i) => {
      if (r.status === "fulfilled") return;
      if (isGone(r.reason)) out.gone.push(connectionIds[i]!);
      else {
        out.failed++;
        console.error(`send to ${connectionIds[i]} failed`, r.reason);
      }
    });
    return out;
  }

  return { broadcast, send: (connectionId: string, event: ServerEvent | { event: string }) => broadcast([connectionId], event) };
}

export type Sender = ReturnType<typeof makeSender>;
