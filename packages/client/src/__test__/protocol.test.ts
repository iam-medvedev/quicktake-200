import { Buffer } from "buffer";
import { describe, it, expect, mock } from "bun:test";
import { Protocol } from "../protocol";
import { BYTE } from "../constants";
import type { Transport } from "../transport/types";

describe("Protocol", () => {
  it("creates protocol with transport", () => {
    const mockTransport: Transport = {
      writeBytes: mock(async () => {}),
      readBytes: mock(async () => Buffer.from([])),
    };

    const protocol = new Protocol(mockTransport, 9600);
    expect(protocol).toBeDefined();
  });

  it("performs handshake", async () => {
    const writeBytesMock = mock(async () => {});
    const readBytesMock = mock(async () => Buffer.from([]))
      .mockImplementationOnce(async () => Buffer.from([BYTE.ACK])) // ACK for ENQ
      .mockImplementationOnce(async () => Buffer.from([BYTE.ACK])) // ACK for CHANGE_SPEED
      .mockImplementationOnce(async () => Buffer.from([BYTE.DLE, BYTE.STX])) // Packet header
      .mockImplementationOnce(async () => Buffer.from([0x00])) // Response command byte 1
      .mockImplementationOnce(async () => Buffer.from([0x00])) // Response command byte 2
      .mockImplementationOnce(async () => Buffer.from([0x01])) // Length byte 1
      .mockImplementationOnce(async () => Buffer.from([0x00])) // Length byte 2
      .mockImplementationOnce(async () => Buffer.from([0x00])) // Payload (0x00 = OK)
      .mockImplementationOnce(async () => Buffer.from([BYTE.DLE])) // DLE before ETX
      .mockImplementationOnce(async () => Buffer.from([BYTE.ETX])) // ETX
      .mockImplementationOnce(async () => Buffer.from([0x00])); // BCC

    const mockTransport: Transport = {
      writeBytes: writeBytesMock,
      readBytes: readBytesMock,
    };

    const protocol = new Protocol(mockTransport, 9600);
    await protocol.handshake();

    expect(writeBytesMock).toHaveBeenCalled();
    expect(readBytesMock).toHaveBeenCalled();
  });

  it("sends ACK", async () => {
    const chunks: Buffer[] = [];

    const mockTransport: Transport = {
      writeBytes: async (data) => {
        chunks.push(Buffer.from(data));
      },
      readBytes: async () => Buffer.from([]),
    };

    const protocol = new Protocol(mockTransport, 9600);
    await protocol.sendAck();

    expect(chunks.length).toBe(1);
    expect(chunks[0]).toEqual(Buffer.from([BYTE.ACK]));
  });

  it("sends EOT", async () => {
    const chunks: Buffer[] = [];

    const mockTransport: Transport = {
      writeBytes: async (data) => {
        chunks.push(Buffer.from(data));
      },
      readBytes: async () => Buffer.from([]),
    };

    const protocol = new Protocol(mockTransport, 9600);
    await protocol.endTransmission();

    expect(chunks.length).toBe(1);
    expect(chunks[0]).toEqual(Buffer.from([BYTE.EOT]));
  });

  it("sends command", async () => {
    const chunks: Buffer[] = [];

    const mockTransport: Transport = {
      writeBytes: async (data) => {
        chunks.push(Buffer.from(data));
      },
      readBytes: async () => Buffer.from([BYTE.ACK]),
    };

    const protocol = new Protocol(mockTransport, 9600);
    await protocol.sendCommand([0x00, 0x02]);

    expect(chunks.length).toBe(1);
    expect(chunks[0][0]).toBe(BYTE.DLE);
    expect(chunks[0][1]).toBe(BYTE.STX);
  });

  it("receives response", async () => {
    const writeBytesMock = mock(async () => {});
    const readBytesMock = mock(async () => Buffer.from([]))
      .mockImplementationOnce(async () => Buffer.from([BYTE.DLE, BYTE.STX])) // Packet header
      .mockImplementationOnce(async () => Buffer.from([0x00])) // Response command byte 1
      .mockImplementationOnce(async () => Buffer.from([0x00])) // Response command byte 2
      .mockImplementationOnce(async () => Buffer.from([0x02])) // Length byte 1
      .mockImplementationOnce(async () => Buffer.from([0x00])) // Length byte 2
      .mockImplementationOnce(async () => Buffer.from([0xaa])) // Payload byte 1
      .mockImplementationOnce(async () => Buffer.from([0xbb])) // Payload byte 2
      .mockImplementationOnce(async () => Buffer.from([BYTE.DLE])) // DLE before ETX
      .mockImplementationOnce(async () => Buffer.from([BYTE.ETX])) // ETX (last packet)
      .mockImplementationOnce(async () => Buffer.from([0x00])); // BCC

    const mockTransport: Transport = {
      writeBytes: writeBytesMock,
      readBytes: readBytesMock,
    };

    const protocol = new Protocol(mockTransport, 9600);
    const result = await protocol.receiveResponse();

    expect(result).toEqual(Buffer.from([0xaa, 0xbb]));
    expect(writeBytesMock).toHaveBeenCalled(); // ACK sent
  });
});
