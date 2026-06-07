import { Client, Transport } from "@quicktake-200/client";
import { writeFile } from "fs/promises";
import path from "path";
import prompts from "prompts";

(async function () {
  const port = await Transport.getPort();
  const transport = new Transport(port);
  const client = new Client(transport);

  console.info("Connecting to camera...");
  await client.connect();
  console.info("✔ Connected!");

  const count = await client.getPicturesNumber();
  console.info(`Pictures in camera: ${count}`);

  const { index } = await prompts({
    type: "number",
    name: "index",
    message: `Enter image number (1-${count})`,
    validate: (v) => (v >= 1 && v <= count) || `Must be between 1 and ${count}`,
  });

  if (typeof index !== "number") {
    await client.disconnect();
    process.exit(1);
  }

  const name = await client.getPictureName(index);
  console.info(`Downloading ${name}...`);
  const image = await client.downloadImage(index);

  const outputPath = path.join(process.cwd(), name);

  await writeFile(outputPath, image);
  console.info(`✔ Saved to ${outputPath} (${image.length} bytes)`);

  await client.disconnect();
  console.info("✔ Done!");
  process.exit(0);
})();
