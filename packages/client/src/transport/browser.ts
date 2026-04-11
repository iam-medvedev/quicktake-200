import { Buffer } from "buffer";
import { reader } from "it-reader";
import { withTimeout } from "es-toolkit";
import { TransportError } from "../error";
import { TRANSPORT } from "../constants";
import type { Transport } from "./types";

/**
 * Serial port transport for browser
 */
export class WebTransport implements Transport {
  private reader: ReturnType<typeof reader>;
  private writer: WritableStreamDefaultWriter<Buffer>;

  constructor(private port: SerialPort) {
    const readable = this.port.readable;
    if (!readable || readable === null) {
      throw new TransportError("Cannot get port reader");
    }
    this.reader = reader(readable);

    const writer = this.port.writable?.getWriter();
    if (!writer) {
      throw new TransportError("Cannot get port writer");
    }
    this.writer = writer;
  }

  /** Writes bytes */
  public writeBytes(data: Buffer | ArrayLike<number>): Promise<void> {
    return this.writer.write(Buffer.from(data));
  }

  /** Reads bytes in chunk */
  public async readBytes(length: number): Promise<Buffer> {
    const result = await withTimeout(() => this.reader.next(length), 5000);
    if (!result.value) {
      throw new TransportError("Unexpected end of stream");
    }

    return Buffer.from(result.value.slice());
  }

  /** Serial port getter */
  static async getPort() {
    const port = await navigator.serial.requestPort();
    await port.open(TRANSPORT);

    // Reset port
    // TODO: find a less hacky way
    await port.close();
    await port.open(TRANSPORT);

    return port;
  }
}
