import { Buffer } from "buffer";
import { SerialPort } from "serialport";
import { StreamReader } from "peek-readable";
import { withTimeout } from "es-toolkit";
import prompts from "prompts";
import { TRANSPORT } from "../constants";
import type { Transport } from "./types";

/**
 * Serial port transport for node.js
 */
export class NodeTransport implements Transport {
  private reader: StreamReader;

  constructor(private port: SerialPort) {
    this.reader = new StreamReader(this.port);
  }

  /** Writes bytes */
  public writeBytes(data: Buffer | ArrayLike<number>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.port.write(Buffer.from(data), (err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }

  /** Reads bytes in chunk */
  public async readBytes(length: number): Promise<Buffer> {
    const buffer = Buffer.alloc(length);
    await withTimeout(() => this.reader.read(buffer), 5000);
    return buffer;
  }

  /** Serial port getter */
  static async getPort() {
    const ports = await SerialPort.list();
    const { path } = await prompts({
      type: "select",
      name: "path",
      message: "Select a serial port",
      choices: ports.map((p) => ({ title: p.path, value: p.path })),
    });

    const port = new SerialPort({ ...TRANSPORT, path });
    return port;
  }
}
