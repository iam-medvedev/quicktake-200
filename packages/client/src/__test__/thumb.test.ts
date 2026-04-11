import { describe, it, expect } from "bun:test";
import fs from "fs/promises";
import path from "path";
import { decodeThumbnail } from "../thumb";

const thumbBuffer = await fs.readFile(
  path.resolve(__dirname, "../__fixtures__/test_thumb.jpg"),
);

describe("decodeThumbnail", () => {
  it("decodes thumbnail with valid EXIF", async () => {
    const result = decodeThumbnail(thumbBuffer);

    expect(result).toHaveProperty("width");
    expect(result).toHaveProperty("height");
    expect(result.thumb).toMatchSnapshot("thumb");
    expect(result.exif).toMatchSnapshot("exif");
  });
});
