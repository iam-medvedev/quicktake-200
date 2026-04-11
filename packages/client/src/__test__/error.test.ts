import { Buffer } from "buffer";
import { describe, it, expect } from "bun:test";
import {
  BytesValidationError,
  TransportError,
  ProtocolError,
} from "../error";

describe("BytesValidationError", () => {
  it("formats single sequence", () => {
    const buffer = Buffer.from([0x10, 0x02]);
    const error = new BytesValidationError(buffer, [0x10, 0x03]);
    expect(error.message).toEqual(
      "Expected 0x10 0x03, Received: 0x10 0x02",
    );
  });

  it("formats multiple sequences", () => {
    const buffer = Buffer.from([0x10, 0x02]);
    const error = new BytesValidationError(buffer, [
      [0x10, 0x03],
      [0x10, 0x04],
    ]);
    expect(error.message).toEqual(
      "Expected 0x10 0x03 OR 0x10 0x04, Received: 0x10 0x02",
    );
  });
});

describe("TransportError", () => {
  it("creates error", () => {
    const error = new TransportError("test");
    expect(error.message).toEqual("test");
  });
});

describe("ProtocolError", () => {
  it("creates error", () => {
    const error = new ProtocolError("test");
    expect(error.message).toEqual("test");
  });
});
