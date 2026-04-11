import { formatBytes, isBytesSequenceList, type ExpectedBytes } from "./utils";

/**
 * Humanized error for bytes validation
 */
export class BytesValidationError extends Error {
  constructor(buffer: Buffer, expected: ExpectedBytes) {
    super();
    const receivedString = formatBytes(buffer);
    const expectedString = isBytesSequenceList(expected)
      ? expected.map(formatBytes).join(" OR ")
      : formatBytes(expected);

    this.message = `Expected ${expectedString}, Received: ${receivedString}`;
  }
}

/**
 * Transport errors
 */
export class TransportError extends Error {}

/**
 * Protocol errors
 */
export class ProtocolError extends Error {}
