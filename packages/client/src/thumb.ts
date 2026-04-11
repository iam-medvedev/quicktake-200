import { PNG } from "pngjs/browser";
import { Buffer } from "buffer";
import { batch, flatMap } from "iter-tools-es";
import { ExifParserFactory } from "ts-exif-parser";

const unknownLabel = "Unknown";

function clamp(n: number) {
  return Math.max(0, Math.min(255, n + 0.5) | 0);
}

/** Converts APEX shutter speed to a human-readable exposure time (e.g. 3 -> "1/8s") */
function apexShutterToReadable(apex: number): string {
  const seconds = Math.pow(2, -apex);
  if (seconds >= 1) return `${seconds}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

/** Converts APEX aperture value to an f-number string (e.g. 2.3 -> "f/4.9") */
function apexApertureToReadable(apex: number): string {
  const fNumber = Math.pow(2, apex / 2);
  return `f/${fNumber.toFixed(1)}`;
}

/**
 * Converts YCbCr to RGB
 * @see https://www.mir.com/DMG/ycbcr.html
 */
function ycbcrToRgb(
  Y: number,
  Cb: number,
  Cr: number,
): [number, number, number] {
  const cb = Cb - 128;
  const cr = Cr - 128;

  return [
    clamp(Y + 1.402 * cr),
    clamp(Y - 0.344136 * cb - 0.714136 * cr),
    clamp(Y + 1.772 * cb),
  ];
}

/**
 * Decodes thumbnail
 * Returns EXIF data and thumbnail (YCbCr -> PNG)
 */
export function decodeThumbnail(raw: Buffer) {
  const { tags } = ExifParserFactory.create(raw).parse();
  const make = tags?.Make ?? unknownLabel;
  const model = tags?.Model ?? unknownLabel;
  const shutterSpeed = tags?.ShutterSpeedValue
    ? apexShutterToReadable(parseInt(tags.ShutterSpeedValue))
    : unknownLabel;
  const aperture = tags?.ApertureValue
    ? apexApertureToReadable(parseInt(tags.ApertureValue))
    : unknownLabel;
  const width = tags?.ImageWidth ?? 0;
  const height = tags?.ImageHeight ?? 0;
  const thumbIndex = parseInt(tags?.StripOffsets || "");
  const thumbLength = parseInt(tags?.StripByteCounts || "");

  const date = new Date(
    (tags?.DateTimeOriginal || 0) * 1000,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // YCbCr Thumb starts after EXIF data
  const data = raw.subarray(thumbIndex, thumbIndex + thumbLength);

  const rgba = flatMap(
    ([Y0, Y1, Cb, Cr]: number[]) => [
      ...ycbcrToRgb(Y0, Cb, Cr),
      255,
      ...ycbcrToRgb(Y1, Cb, Cr),
      255,
    ],
    batch(4, data),
  );

  const png = new PNG({ width, height });
  png.data = Buffer.from(Array.from(rgba));

  return {
    exif: {
      make,
      model,
      shutterSpeed,
      aperture,
      date,
    },
    width,
    height,
    thumb: PNG.sync.write(png),
  };
}
