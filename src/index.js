import { Fire } from "./fire.js";
import { ConsoleRenderer } from "./renderers/console.js";
import { GifRenderer } from "./renderers/gif.js";

const DEFAULT_WIDTH = 100;
const DEFAULT_HEIGHT = 60;
const DEFAULT_FPS = 20;
const DEFAULT_GIF_FRAMES = 100;

// Usage: npm start -- --fps 15
function parseFps(argv) {
  const index = argv.indexOf("--fps");
  if (index === -1) return DEFAULT_FPS;

  const fps = Number(argv[index + 1]);
  if (!Number.isFinite(fps) || fps <= 0) {
    console.error("--fps must be a positive number");
    process.exit(1);
  }
  return fps;
}

// Usage: npm start -- --gif fire.gif --frames 100
// Without --gif the fire is drawn in the console and runs until Ctrl+C.
// With --gif it stops after DEFAULT_GIF_FRAMES frames unless --frames is given.
function parseOptionalNumber(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;

  const value = Number(argv[index + 1]);
  if (!Number.isInteger(value) || value <= 0) {
    console.error(`${flag} must be a positive whole number`);
    process.exit(1);
  }
  return value;
}

// Usage: npm start -- --start 50
// Frames 0 to start-1 are simulated but not rendered. --frames counts rendered frames.
function parseStartFrame(argv) {
  const index = argv.indexOf("--start");
  if (index === -1) return 0;

  const value = Number(argv[index + 1]);
  if (!Number.isInteger(value) || value < 0) {
    console.error("--start must be a whole number, 0 or more");
    process.exit(1);
  }
  return value;
}

function parseGifPath(argv) {
  const index = argv.indexOf("--gif");
  if (index === -1) return undefined;

  const path = argv[index + 1];
  if (!path || path.startsWith("--")) {
    console.error("--gif needs an output file path");
    process.exit(1);
  }
  return path;
}

// Usage: npm start -- --width 80 --height 40
// Fire grid size in pixels. Defaults to DEFAULT_WIDTH x DEFAULT_HEIGHT.
// Usage: npm start -- --gif fire.gif --scale 4
// Each fire pixel becomes a scale x scale block. Only applies to GIF output.
const args = process.argv.slice(2);
const fps = parseFps(args);
const gifPath = parseGifPath(args);
const maxFrames = parseOptionalNumber(args, "--frames") ?? (gifPath ? DEFAULT_GIF_FRAMES : undefined);
const scale = parseOptionalNumber(args, "--scale") ?? 1;

if (scale !== 1 && !gifPath) {
  console.error("--scale only works with --gif");
  process.exit(1);
}

const width = parseOptionalNumber(args, "--width") ?? DEFAULT_WIDTH;
const height = parseOptionalNumber(args, "--height") ?? DEFAULT_HEIGHT;

const startFrame = parseStartFrame(args);

const fire = new Fire(width, height);
const renderer = gifPath
  ? new GifRenderer(gifPath, fps, scale)
  : new ConsoleRenderer();

// Advance the simulation silently so rendering begins at startFrame.
for (let n = 0; n < startFrame; n++) {
  fire.step();
}

let frames = 0;
let stopped = false;

function stop() {
  if (stopped) return;
  stopped = true;
  clearInterval(timer);
  renderer.close();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.exit(0);
}

// In the console, read single key presses. "d" toggles the bottom row between
// 0 (fire out) and 36 (fire lit). Raw mode stops Ctrl+C from sending SIGINT,
// so it is handled here too.
if (!gifPath && process.stdin.isTTY) {
  let lit = true;
  process.stdin.setRawMode(true);
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (key) => {
    if (key === "d") {
      lit = !lit;
      fire.setBottomRow(lit ? 36 : 0);
    }
    if (key === "\u0003") stop();
  });
  process.stdin.resume();
}

const timer = setInterval(() => {
  fire.step();
  renderer.render(fire.pixels);
  frames++;
  if (maxFrames !== undefined && frames >= maxFrames) stop();
}, 1000 / fps);

process.on("SIGINT", stop);
