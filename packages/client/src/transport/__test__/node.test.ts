import { Buffer } from "buffer";
import { describe, it, expect } from "bun:test";
import { SerialPort } from "serialport";
import { MockBinding } from "@serialport/binding-mock";
import { NodeTransport } from "../node";
import { TRANSPORT } from "../../constants";

describe("NodeTransport", () => {
  it("writes bytes", async () => {
    MockBinding.createPort("/dev/ROBOT", { echo: true, record: true });

    const port = new SerialPort({
      binding: MockBinding,
      path: "/dev/ROBOT",
      ...TRANSPORT,
    });

    // Wait for port open
    await new Promise((resolve) => port.on("open", resolve));

    const transport = new NodeTransport(port);
    await transport.writeBytes(Buffer.from([0x10, 0x02]));

    await port.close();
  });

  it("reads bytes", async () => {
    MockBinding.createPort("/dev/ROBOT2", { echo: true, record: true });

    const port = new SerialPort({
      binding: MockBinding,
      path: "/dev/ROBOT2",
      ...TRANSPORT,
    });

    // Wait for port open
    await new Promise((resolve) => port.on("open", resolve));

    const transport = new NodeTransport(port);
    port.port?.emitData(Buffer.from([0x06]));

    const result = await transport.readBytes(1);
    expect(result).toEqual(Buffer.from([0x06]));

    await port.close();
  });
});
