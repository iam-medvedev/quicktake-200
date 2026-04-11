import { Buffer } from "buffer";
import { BYTE, CMD, BAUD_RATE } from "./constants";
import { buildCommand, validateBytes, type ExpectedBytes } from "./utils";
import { BytesValidationError, ProtocolError } from "./error";
import type { Transport } from "./transport/types";

/** Apple QuickTake 200 low-level protocol implementation  */
export class Protocol {
  constructor(
    private transport: Transport,
    private speed: keyof typeof BAUD_RATE,
  ) {}

  /**
   * Performs handshake with the camera
   */
  public async handshake() {
    // Send ENQ and wait for ACK
    await this.transport.writeBytes([BYTE.ENQ]);
    const ack = await this.transport.readBytes(1);
    this.assertBytes(ack, [BYTE.ACK]);

    // Increase speed
    const rate = BAUD_RATE[this.speed];
    const payload = Buffer.from([rate]);
    await this.sendCommand(CMD.CHANGE_SPEED, payload);
    const result = await this.receiveResponse();
    this.assertBytes(result, [0x00]); // 0 is OK
  }

  /**
   * Sends ACK
   */
  public async sendAck() {
    await this.transport.writeBytes([BYTE.ACK]);
  }

  /**
   * Sends EOT
   */
  public async endTransmission() {
    await this.transport.writeBytes([BYTE.EOT]);
  }

  /**
   * Sends a command packet and wait for ACK
   */
  public async sendCommand(cmd: ArrayLike<number>, payload = Buffer.from([])) {
    const packet = buildCommand(cmd, payload);
    await this.transport.writeBytes(packet);

    // Wait for ACK
    const ack = await this.transport.readBytes(1);
    this.assertBytes(ack, [BYTE.ACK]);
  }

  /**
   * Reads a single packet from the camera, handling DLE byte stuffing
   */
  private async readPacket(): Promise<{ data: Buffer; isLast: boolean }> {
    // Read DLE STX
    const header = await this.transport.readBytes(2);
    this.assertBytes(header, [BYTE.DLE, BYTE.STX]);

    // Read bytes until we find DLE ETX/ETB, handling DLE byte stuffing
    const rawBytes: number[] = [];
    let foundEnd = false;
    let controlByte = 0;

    while (!foundEnd) {
      const byte = await this.transport.readBytes(1);
      const b = byte[0];

      if (b === BYTE.DLE) {
        // Peek at next byte
        const next = await this.transport.readBytes(1);
        const n = next[0];

        if (n === BYTE.DLE) {
          // Escaped DLE - add single DLE to data
          rawBytes.push(BYTE.DLE);
        } else if (n === BYTE.ETX || n === BYTE.ETB) {
          // End of packet
          controlByte = n;
          foundEnd = true;
        } else {
          throw new ProtocolError(
            `Unexpected byte after DLE: 0x${n.toString(16).padStart(2, "0")}`,
          );
        }
      } else {
        rawBytes.push(b);
      }
    }

    // Read BCC
    // TODO: Verify BCC checksum
    const bcc = await this.transport.readBytes(1);

    // Send ACK
    await this.sendAck();

    // Parse the unescaped data
    const rawBuffer = Buffer.from(rawBytes);

    // First 4 bytes are response command (2) + length (2)
    // Remaining bytes are the actual payload data
    const data = rawBuffer.slice(4);

    const isLast = controlByte === BYTE.ETX;

    return { data, isLast };
  }

  /**
   * Receives a response
   */
  public async receiveResponse(): Promise<Buffer> {
    const chunks: Buffer[] = [];

    let isLast = false;
    while (!isLast) {
      const packet = await this.readPacket();
      chunks.push(packet.data);
      isLast = packet.isLast;
    }

    return Buffer.concat(chunks);
  }

  /**
   * Assert version for bytes validator
   */
  private assertBytes(buffer: Buffer, expected: ExpectedBytes) {
    if (!validateBytes(buffer, expected)) {
      throw new BytesValidationError(buffer, expected);
    }
  }
}
