import { Buffer } from "buffer";
import { CMD } from "./constants";
import { Protocol } from "./protocol";
import { decodeThumbnail } from "./thumb";
import type { Transport } from "./transport/types";

/**
 * High-level client for Apple QuickTake 200 Camera
 */
export class Client {
  private protocol: Protocol;

  constructor(private transport: Transport) {
    this.protocol = new Protocol(this.transport, 57600);
  }

  /**
   * Initializes connection with the camera
   */
  public async connect(): Promise<void> {
    await this.protocol.handshake();
  }

  /**
   * Returns software version from camera
   */
  public async getSoftwareVersion(): Promise<{
    version: string;
    camera: string;
  }> {
    await this.protocol.sendCommand(CMD.GET_SOFTWARE_VERSION);
    const response = await this.protocol.receiveResponse();
    const raw = response.toString("ascii").trim();

    // TODO: validate
    const [version, camera] = raw.split(",");
    return { version, camera };
  }

  /**
   * Returns picture name
   */
  public async getPictureName(frame: number): Promise<string> {
    const payload = Buffer.alloc(2);
    payload.writeUInt16LE(frame, 0);

    await this.protocol.sendCommand(CMD.GET_PICTURE_NAME, payload);
    const response = await this.protocol.receiveResponse();
    return response.toString("ascii").trim();
  }

  /**
   * Returns picture size in bytes
   */
  public async getPictureSize(frame: number): Promise<number> {
    const payload = Buffer.alloc(2);
    payload.writeUInt16LE(frame, 0);

    await this.protocol.sendCommand(CMD.GET_PICTURE_SIZE, payload);
    const response = await this.protocol.receiveResponse();
    return response.readUInt32LE(0);
  }

  /**
   * Returns number of pictures stored in camera
   */
  public async getPicturesNumber(): Promise<number> {
    await this.protocol.sendCommand(CMD.GET_PICTURES_NUMBER);
    const response = await this.protocol.receiveResponse();
    return response.readUInt16LE(0);
  }

  /**
   * Downloads thumbnail for given frame number
   * The camera sends JPEG with embedded EXIF containing the thumbnail
   */
  public async downloadThumbnail(frame: number) {
    const payload = Buffer.alloc(2);
    payload.writeUInt16LE(frame, 0);

    await this.protocol.sendCommand(CMD.DOWNLOAD_THUMBNAIL, payload);

    const data = await this.protocol.receiveResponse();
    return decodeThumbnail(data);
  }

  /**
   * Downloads full image for given frame number
   */
  public async downloadImage(frame: number): Promise<Buffer> {
    const payload = Buffer.alloc(2);
    payload.writeUInt16LE(frame, 0);

    await this.protocol.sendCommand(CMD.DOWNLOAD_IMAGE, payload);
    return await this.protocol.receiveResponse();
  }

  /**
   * Closes connection with the camera
   */
  public async disconnect(): Promise<void> {
    await this.protocol.endTransmission();
  }
}
