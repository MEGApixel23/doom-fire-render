import { writeFileSync } from "node:fs";
import gifenc from "gifenc";
import { PALETTE } from "../palette.js";

const { GIFEncoder } = gifenc;

// Collects every frame in memory and writes an animated GIF on close().
// Pixel values are already palette indices, so no color quantization is needed.
// `scale` makes each fire pixel a scale x scale block in the GIF.
export class GifRenderer {
  constructor(outputPath, fps, scale = 1) {
    this.outputPath = outputPath;
    this.delay = Math.round(1000 / fps); // milliseconds per frame
    this.scale = scale;
    this.encoder = GIFEncoder();
  }

  render(pixels) {
    const height = pixels.length;
    const width = pixels[0].length;
    const scale = this.scale;
    const outWidth = width * scale;
    const outHeight = height * scale;
    const indexed = new Uint8Array(outWidth * outHeight);

    for (let y = 0; y < outHeight; y++) {
      for (let x = 0; x < outWidth; x++) {
        indexed[y * outWidth + x] = pixels[Math.floor(y / scale)][Math.floor(x / scale)];
      }
    }

    this.encoder.writeFrame(indexed, outWidth, outHeight, {
      palette: PALETTE,
      delay: this.delay,
    });
  }

  close() {
    this.encoder.finish();
    writeFileSync(this.outputPath, this.encoder.bytes());
    console.log(`GIF written to ${this.outputPath}`);
  }
}
