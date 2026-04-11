/** Low level Transmission Protocol */
export const BYTE = {
  /** Enquiry */
  ENQ: 0x05,
  /** Acknowledge */
  ACK: 0x06,
  /** Negative acknowledge (retry) */
  NAK: 0x15,
  /** Data link escape, marks special bytes */
  DLE: 0x10,
  /** Start of text */
  STX: 0x02,
  /** End of text */
  ETX: 0x03,
  /** End transmission block, more packets coming */
  ETB: 0x17,
  /** End of transmission */
  EOT: 0x04,
} as const;

/** Camera commands */
export const CMD = {
  DOWNLOAD_THUMBNAIL: [0x00, 0x00],
  DOWNLOAD_IMAGE: [0x00, 0x02],
  GET_SOFTWARE_VERSION: [0x00, 0x09],
  GET_PICTURES_NUMBER: [0x00, 0x0b],
  GET_PICTURE_NAME: [0x00, 0x0a],
  GET_PICTURE_SIZE: [0x00, 0x17],
  CHANGE_SPEED: [0x01, 0x07],
} as const;

/** Serial port baud rate */
export const BAUD_RATE = {
  9600: 0,
  12000: 1,
  14400: 2,
  16800: 3,
  19200: 4,
  28800: 5,
  38400: 6,
  57600: 7,
  115200: 8,
};

/** Transport configuration */
export const TRANSPORT: SerialOptions = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: "even",
};
