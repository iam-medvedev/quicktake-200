import { Buffer } from "buffer";
import { describe, it, expect } from "bun:test";
import {
  buildCommand,
  getBufferLength,
  calculateBCC,
  formatBytes,
  isBytesSequenceList,
  validateBytes,
} from "../utils";
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

describe("formatBytes", () => {
  it("formats bytes", () => {
    const result = formatBytes([0x10, 0x02, 0xab]);
    expect(result).toEqual("0x10 0x02 0xab");
  });

  it("formats empty array", () => {
    const result = formatBytes([]);
    expect(result).toEqual("");
  });
});

describe("isBytesSequenceList", () => {
  it("returns true for sequence list", () => {
    const result = isBytesSequenceList([[0x10], [0x20]]);
    expect(result).toBe(true);
  });

  it("returns false for single sequence", () => {
    const result = isBytesSequenceList([0x10, 0x20]);
    expect(result).toBe(false);
  });

  it("returns false for empty array", () => {
    const result = isBytesSequenceList([]);
    expect(result).toBe(false);
  });
});

describe("validateBytes", () => {
  it("validates matching bytes", () => {
    const buffer = Buffer.from([0x10, 0x02]);
    const result = validateBytes(buffer, [0x10, 0x02]);
    expect(result).toBe(true);
  });

  it("validates non-matching bytes", () => {
    const buffer = Buffer.from([0x10, 0x02]);
    const result = validateBytes(buffer, [0x10, 0x03]);
    expect(result).toBe(false);
  });

  it("validates against multiple sequences", () => {
    const buffer = Buffer.from([0x10, 0x02]);
    const result = validateBytes(buffer, [
      [0x10, 0x03],
      [0x10, 0x02],
    ]);
    expect(result).toBe(true);
  });

  it("validates non-matching multiple sequences", () => {
    const buffer = Buffer.from([0x10, 0x02]);
    const result = validateBytes(buffer, [
      [0x10, 0x03],
      [0x10, 0x04],
    ]);
    expect(result).toBe(false);
  });
});
