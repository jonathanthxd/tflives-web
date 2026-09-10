import { createConnection } from "node:net";
import { z } from "zod";

export const MINECRAFT_HOST = "mc.tflives.com";
export const MINECRAFT_PORT = 25565;
export interface MinecraftStatus {
  reachable: boolean;
  online: boolean;
  players: number | null;
  maxPlayers: number | null;
  version: string | null;
  protocol: number | null;
  checkedAt: string;
  queryDurationMs: number;
}
export function encodeVarInt(value: number) {
  const bytes: number[] = [];
  do {
    let byte = value & 127;
    value >>>= 7;
    if (value) byte |= 128;
    bytes.push(byte);
  } while (value);
  return Buffer.from(bytes);
}
export function decodeVarInt(
  buffer: Buffer,
  offset = 0,
): { value: number; next: number } | null {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    if (offset + i >= buffer.length) return null;
    const byte = buffer[offset + i];
    value |= (byte & 127) << (7 * i);
    if (!(byte & 128)) return { value, next: offset + i + 1 };
  }
  throw new Error("Invalid VarInt");
}
const statusPayload = z.object({
  players: z
    .object({
      online: z.number().int().nonnegative(),
      max: z.number().int().nonnegative(),
    })
    .optional(),
  version: z
    .object({ name: z.string().max(200), protocol: z.number().int() })
    .optional(),
});

/** Bounded Java status handshake. Never returns player samples, MOTD internals or addresses. */
export function queryMinecraft(
  host = MINECRAFT_HOST,
  port = MINECRAFT_PORT,
  timeoutMs = 3500,
): Promise<MinecraftStatus> {
  return new Promise((resolve) => {
    const started = Date.now();
    let reachable = false;
    let settled = false;
    let received = Buffer.alloc(0);
    const socket = createConnection({ host, port });
    const finish = (data?: z.infer<typeof statusPayload>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve({
        reachable,
        online: !!data,
        players: data?.players?.online ?? null,
        maxPlayers: data?.players?.max ?? null,
        version: data?.version?.name ?? null,
        protocol: data?.version?.protocol ?? null,
        checkedAt: new Date().toISOString(),
        queryDurationMs: Date.now() - started,
      });
    };
    const timer = setTimeout(() => finish(), timeoutMs);
    socket.once("connect", () => {
      reachable = true;
      const hostname = Buffer.from(host);
      const portBytes = Buffer.alloc(2);
      portBytes.writeUInt16BE(port);
      const handshake = Buffer.concat([
        Buffer.from([0]),
        encodeVarInt(-1),
        encodeVarInt(hostname.length),
        hostname,
        portBytes,
        Buffer.from([1]),
      ]);
      socket.write(
        Buffer.concat([
          encodeVarInt(handshake.length),
          handshake,
          Buffer.from([1, 0]),
        ]),
      );
    });
    socket.on("data", (chunk) => {
      try {
        if (received.length + chunk.length > 1024 * 1024) return finish();
        received = Buffer.concat([received, chunk]);
        const frame = decodeVarInt(received);
        if (!frame) return;
        if (frame.value < 2 || frame.value > 1024 * 1024) return finish();
        if (received.length < frame.next + frame.value) return;
        const packetId = decodeVarInt(received, frame.next);
        if (!packetId || packetId.value !== 0) return finish();
        const length = decodeVarInt(received, packetId.next);
        if (
          !length ||
          length.value < 0 ||
          length.next + length.value !== frame.next + frame.value
        )
          return finish();
        finish(
          statusPayload.parse(
            JSON.parse(
              received
                .subarray(length.next, length.next + length.value)
                .toString("utf8"),
            ),
          ),
        );
      } catch {
        finish();
      }
    });
    socket.once("error", () => finish());
    socket.once("close", () => finish());
  });
}
