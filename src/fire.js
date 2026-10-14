// Calculation only: knows nothing about how the fire is displayed.
//
// `pixels` is a 2D array indexed as pixels[y][x].
// Each value is an integer intensity from 0 to 36 (see palette.js).

export class Fire {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = Array.from({ length: height }, (_, rowIndex) => (
      new Array(width).fill(rowIndex === (height - 1) ? 36 : 0)
    ));
  }

  // Set every pixel of the bottom row to `value`.
  // 0 puts the fire out, 36 lights it again.
  setBottomRow(value) {
    this.pixels[this.height - 1].fill(value);
  }

  // Advance the simulation by one frame.
  step() {
    for (let i = this.height - 2; i >= 0; i--) {
      for (let j = this.width - 1; j >= 0; j--) {
        const [pixelBelow, decay, offset] = [
          this.pixels[i + 1][j],
          Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 2)
        ];

        let newValue = pixelBelow - decay;

        if (newValue < 0) {
          newValue = 0;
        }

        if ((j - offset) >= 0) {
          this.pixels[i][j - offset] = newValue;
        }
      }
    }
  }
}
