import { Client, Transport } from "@quicktake-200/client";
import { writeFile } from "fs/promises";

(async function () {
  const port = await Transport.getPort();
  const transport = new Transport(port);
  const client = new Client(transport);

  console.log("Connecting to camera...");
  await client.connect();
  console.log("✓ Connected!");

  console.log("Getting software version...");
  const version = await client.getSoftwareVersion();
  console.log("Software version:", version);

  console.log(
    "Test picture name/size",
    await client.getPictureName(1),
    await client.getPictureSize(1),
  );

  console.log("Getting number of pictures...");
  const count = await client.getPicturesNumber();
  console.log(`Pictures in camera: ${count}`);

  console.log("Downloading thumb...");
  const thumb = await client.downloadThumbnail(13);
  console.log(`Thumb data`, thumb);
  const filename = `thumb_1.jpg`;
  await writeFile(filename, thumb.thumb);

  //   for (let i = 1; i <= count; i++) {
  //     const start = Date.now();
  //
  //     console.log(`Downloading ${i}...`);
  //     const image = await client.downloadImage(i);
  //     console.log(`Image size: ${image.length} bytes`);
  //
  //     const filename = `image_${i}.jpg`;
  //     await writeFile(filename, image);
  //     const end = Date.now();
  //     console.log(`✓ Saved to ${filename} in ${end - start} ms`);
  //   }

  console.log("Disconnecting...");
  await client.disconnect();
  console.log("✓ Done!");
})();
