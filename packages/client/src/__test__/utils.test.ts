import { Buffer } from "buffer";
import { describe, it, expect } from "bun:test";
import { buildCommand, getBufferLength, calculateBCC } from "../utils";
import { CMD, BYTE } from "../constants";

describe("buildCommand", () => {
  it("works with payload", () => {
    const imageNumber = 9;
    const payload = Buffer.alloc(2);
    payload.writeUInt16LE(imageNumber);

    const buffer = buildCommand(CMD.DOWNLOAD_IMAGE, payload);

    expect(buffer).toEqual(
      Buffer.from([
        // Header
        0x10, 0x02,
        // Command
        0x00, 0x02, 0x02, 0x00,
        // Payload
        0x09, 0x00,
        // Footer
        0x10, 0x03,
        // BCC (0x03 ^ 0x00 ^ 0x02 ^ 0x02 ^ 0x00 ^ 0x09 ^ 0x00)
        0x0a,
      ]),
    );
  });

  it("works without payload", () => {
    const buffer = buildCommand(CMD.DOWNLOAD_IMAGE);

    expect(buffer).toEqual(
      Buffer.from([
        // Header
        0x10, 0x02,
        // Command
        0x00, 0x02, 0x00, 0x00,
        // Footer
        0x10, 0x03,
        // BCC
        0x01,
      ]),
    );
  });
});

describe("getBufferLength", () => {
  it("returns non-zero length", () => {
    const result = getBufferLength(Buffer.from(CMD.DOWNLOAD_IMAGE));
    expect(result).toEqual(Buffer.from([0x02, 0x00]));
  });

  it("returns zero length", () => {
    const result = getBufferLength(Buffer.from([]));
    expect(result).toEqual(Buffer.from([0x00, 0x00]));
  });
});

describe("calculateBCC", () => {
  it("calculates BCC", () => {
    const controlByte = BYTE.ETX;
    // Data should be command + length (without control byte)
    const data = Buffer.from([...CMD.DOWNLOAD_IMAGE, 0x00, 0x00]);

    expect(calculateBCC(data, controlByte)).toEqual(0x01);
  });
});
