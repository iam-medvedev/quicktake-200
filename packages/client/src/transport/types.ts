/** Serial port transport */
export interface Transport {
  writeBytes(data: Buffer | ArrayLike<number>): Promise<void>;
  readBytes(length: number): Promise<Buffer>;
}
