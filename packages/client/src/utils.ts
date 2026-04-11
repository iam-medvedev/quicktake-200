import { Buffer } from "buffer";
import { BYTE } from "./constants";

/**
 * Returns a buffer with length
 */
export function getBufferLength(payload: Buffer): Buffer {
  const length = Buffer.alloc(2);
  length.writeUInt16LE(payload.length, 0);
  return length;
}

/**
 * Apply DLE byte stuffing - escape any 0x10 bytes as 0x10 0x10
 */
function applyDleStuffing(data: Buffer): Buffer {
  const stuffed: number[] = [];

  for (const byte of data) {
    stuffed.push(byte);
    if (byte === BYTE.DLE) {
      // Escape DLE by adding another DLE
      stuffed.push(BYTE.DLE);
    }
  }

  return Buffer.from(stuffed);
}

/**
 * Builds a packet with command
 *
 * - DLE, STX
 * - Command (2 bytes), Length (2 bytes), Payload (variable) - with DLE stuffing
 * - DLE, ETX
 * - BCC (Block Check Character)
 */
export function buildCommand(
  cmd: ArrayLike<number>,
  payload = Buffer.from([]),
): Buffer {
  const command = Buffer.from(cmd);
  const controlByte = BYTE.ETX;
  const header = Buffer.from([BYTE.DLE, BYTE.STX]);
  const footer = Buffer.from([BYTE.DLE, controlByte]);

  // Build data: command + length + payload
  const data = Buffer.concat([command, getBufferLength(payload), payload]);

  // Apply DLE stuffing to data
  const stuffedData = applyDleStuffing(data);

  // BCC is calculated on ALL data bytes (command + length + payload) + control byte
  const bcc = Buffer.from([calculateBCC(data, controlByte)]);

  return Buffer.concat([header, stuffedData, footer, bcc]);
}

/**
 * Calculate Block Check Character (BCC) using XOR
 *
 * The BCC is calculated as XOR of:
 * - ALL data bytes (command + length + payload)
 * - The control byte (ETX or ETB)
 *
 * Note: DLE, STX, and DLE prefixes are excluded (only the data portion is included)
 */
export function calculateBCC(data: Buffer, controlByte: number): number {
  let bcc = controlByte;

  // XOR all data bytes
  for (const byte of data) {
    bcc ^= byte;
  }

  return bcc;
}

/**
 * Humanized bytes formatter
 */
export function formatBytes(arr: ArrayLike<number>) {
  return Array.from(arr)
    .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
    .join(" ");
}

type ByteSequence = ArrayLike<number>;
export type ExpectedBytes = ByteSequence | ByteSequence[];

/** A guard for bytes sequence */
export function isBytesSequenceList(
  input: ExpectedBytes,
): input is ByteSequence[] {
  return Array.isArray(input) && input.length > 0 && Array.isArray(input[0]);
}

/**
 * Validates that buffer matches one of the expected byte sequences
 */
export function validateBytes(
  buffer: Buffer,
  expected: ExpectedBytes,
): boolean {
  const matches = (seq: ByteSequence) => {
    const expectedBuffer = Buffer.from(seq);
    return (
      buffer.length === expectedBuffer.length && buffer.equals(expectedBuffer)
    );
  };

  if (isBytesSequenceList(expected)) {
    return expected.some(matches);
  }

  return matches(expected);
}
