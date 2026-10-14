import { PALETTE } from "../palette.js";

// Renders the pixel grid into the terminal using 24-bit ANSI background colors.
// Each terminal character is a half-block: the top pixel is the foreground
// color and the bottom pixel is the background color, so two pixel rows fit
// in one text line and each pixel is roughly square.
export class ConsoleRenderer {
  constructor() {
    process.stdout.write("\x1b[?25l\x1b[2J"); // hide cursor, clear screen
  }

  render(pixels) {
    let out = "\x1b[H"; // move cursor to top-left, redraw in place
    for (let y = 0; y < pixels.length; y += 2) {
      for (let x = 0; x < pixels[y].length; x++) {
        const [tr, tg, tb] = PALETTE[pixels[y][x]];
        const [br, bg, bb] = PALETTE[pixels[y + 1]?.[x] ?? 0];
        out += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀`;
      }
      out += "\x1b[0m\n";
    }
    process.stdout.write(out);
  }

  close() {
    process.stdout.write("\x1b[0m\x1b[?25h\n"); // reset colors, show cursor
  }
}
