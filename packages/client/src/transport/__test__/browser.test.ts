import { Buffer } from "buffer";
import { describe, it, expect, mock } from "bun:test";
import { WebTransport } from "../browser";

describe("WebTransport", () => {
  it("writes bytes", async () => {
    const chunks: Uint8Array[] = [];

    const mockPort = {
      readable: new ReadableStream(),
      writable: new WritableStream({
        write(chunk) {
          chunks.push(chunk);
        },
      }),
    } as SerialPort;

    const transport = new WebTransport(mockPort);
    await transport.writeBytes(Buffer.from([0x10, 0x02]));

    expect(chunks.length).toBe(1);
    expect(Buffer.from(chunks[0])).toEqual(Buffer.from([0x10, 0x02]));
  });

  it("throws error when no readable stream", () => {
    const mockPort = {
      readable: null,
      writable: {
        getWriter: () => ({
          write: mock(() => {}),
        }),
      },
    } as unknown as SerialPort;

    expect(() => new WebTransport(mockPort)).toThrow();
  });

  it("throws error when no writable stream", () => {
    const mockPort = {
      readable: new ReadableStream(),
      writable: null,
    } as unknown as SerialPort;

    expect(() => new WebTransport(mockPort)).toThrow();
  });
});
