# CubicDB Module

A TypeScript library for generating **puzzle scrambles** with optional **images** and **seed-based reproducibility**.
Designed for both **Node.js** and the **browser (UMD)**.

Built on top of [csTimer](https://github.com/cs0x7f/cstimer) and distributed under **GPL-3.0**.

## 🚀 Installation

```bash
npm install cubicdb-module
```

## ⚙️ Usage

### Importing

#### ESM / TypeScript

```ts
import { getScrambles, genImages, setSeed, getSeed } from "cubicdb-module";
```

#### CommonJS

```js
const { getScrambles, genImages, setSeed, getSeed } = require("cubicdb-module");
```

## 🔀 Generate Scrambles

```ts
import { getScrambles } from "cubicdb-module";

const scrambles = getScrambles([{ scrambler: "333" }, { scrambler: "222so" }]);

console.log(scrambles);
// ["R U R' U' ...", "F R U R' ..."]
```

Generate scrambles for all the WCA events:

```ts
const wca_events = [
  ["3x3x3", "333", 0],
  ["2x2x2", "222so", 0],
  ["4x4x4", "444wca", 0],
  ["5x5x5", "555wca", 60],
  ["6x6x6", "666wca", 80],
  ["7x7x7", "777wca", 100],
  ["3x3 bld", "333ni", 0],
  ["3x3 fm", "333fm", 0],
  ["3x3 oh", "333", 0],
  ["clock", "clkwca", 0],
  ["megaminx", "mgmp", 70],
  ["pyraminx", "pyrso", 10],
  ["skewb", "skbso", 0],
  ["sq1", "sqrs", 0],
  ["4x4 bld", "444bld", 40],
  ["5x5 bld", "555bld", 60],
  ["3x3 mbld", "r3ni", 5], // 5 scrambles
];

const scrInfo = getScrambles(
  wca_events.map((ev) => ({ scrambler: ev[1], length: ev[2], image: true })),
);

console.log("Scramble info: ", scrInfo);
```

## 🖼️ Generate Scrambles with Images

You can use the [CubicDB](https://cubicdb.netlify.app) image generator with the scrambler. All the images are optimized in size so it can reduce the time to be parsed by the browser, to be sent through the network or to be stored.

```ts
import { getScrambles } from "cubicdb-module";

const withImages = getScrambles([
  { scrambler: "333", image: true },
  { scrambler: "222so", image: true },
  { scrambler: "222so" },
]);

console.log(withImages);
/*
[
  { scramble: "R U R' U' ...", image: ["<svg>...</svg>"] },
  { scramble: "F R U R' ...", image: ["<svg>...</svg>"] },
  { scramble: "R U R' F2 ..." }
]
*/
```

The return type of the field `image` is an array of strings because there are some scramble generators like `r3ni` (3x3 multi-blind) that have more than one image.

## 🌱 Seed Support

Scrambles can be made **deterministic** by setting a seed. It uses a CSPRNG (Cryptographically Secure Pseudo-Random Number Generator), ensuring high quality of the scrambles.

```ts
import { setSeed, getSeed, getScrambles } from "cubicdb-module";

// Set a custom seed
setSeed(147, "cubicdb-module-seed");

// Generate reproducible scrambles
const scrambles = getScrambles([{ scrambler: "333" }]);

console.log(scrambles[0]);
// R2 U2 R U2 B2 R B2 R' B2 R2 U F U' L' F' D2 B F' D'

// Retrieve the current seed
console.log(getSeed());
```

## Performance

After some benchmarks, here is the result on scrambles and images (on average):

| Category | Scrambles (CSTimer) | Images (CubicDB) |
| -------- | ------------------- | ---------------- |
| 2x2      | 0.47ms              | 0.0552ms         |
| 3x3      | 3.76ms              | 0.1208ms         |
| 4x4      | 284ms               | 0.3696ms         |
| 5x5      | 0.0122ms            | 0.3785ms         |
| 6x6      | 0.0151ms            | 0.6377ms         |
| 7x7      | 0.0187ms            | 0.8453ms         |
| Clock    | 0.0038ms            | 0.3449ms         |
| Pyraminx | 0.5290ms            | 0.0261ms         |
| Megaminx | 0.0099ms            | 0.4535ms         |
| Skewb    | 0.2721ms            | 0.0508ms         |
| Square-1 | 8.92ms              | 0.1453ms         |

### Explanation

For some of the scramblers it takes significantly more time than other puzzles that seems more complicated, but what really happens is this. As the cube length grows, it reaches more easily a random state, so the generator can get that state by generating random moves, but for small cubes, since there are fewer states, adding random moves can get you to a very easy state. Those puzzles (2x2, 3x3, 4x4 and Square-1) needs more checks and calculations, therefore they take more time.

As for the image generation, it uses the CubicDB scramble parser, which is a powerful machine that will be described in the next section.

## Scramble parser

There are some different notations for puzzles and the CubicDB scramble parser takes that into account. This is the list with the available notations for the puzzles:

### NxN

- Regular move (U, R, F, D, L, B).
- Middle layer move (M, E, S).
- Double layer move (r, Rw, u, Uw, ...).
- Rotation of the whole cube (x, y, z).
- All the moves can have the double and inverse notation (R2, R2', R').
- Conmutators ([R, U] or [F: [R, U]]).
- Repetition structures (F (R U R' U')2 F' [R, U]2).

### Pyraminx

- Regular move (U, R, L, B).
- Tip move (u, r, l, b).
- Non-standard moves (oU, oR, oL, oB, Uw, Rw, Lw, Bw, d).
- Rotations (z, y),
- Conmutators.
- Repetition structures.

### Megaminx

- WCA notation (R++, R--, D++, D--, U).
- Face turns (U, R, F, L, BL, BR, DR, DL, DBL, B, DBR, D).
- Rotations (y, [u], [r], [l], [f], [b], [d]).
- Repetition structures.

### Skewb

- WCA notation (U, R, L, B).
- Extended notation (U, F, R, L, B, u, f, r, l, b).
- Rotations (x, y, z).

### Square-1

- WCA notation ( (up_face, down_face), / ).
- Shorter version ( 1,2 instead of (1, 2) ).
- Even shorter ( 12 instead of (1, 2), -40 instead of (-4, 0) ).
- Top face only ( 2 instead of (2, 0) ).
- Rotations (x2, y2, z2).

### Clock

- WCA notation (UR2+, ALL2-, y2, ...).
- Jaap notation (UdUU u=-2...).
- Conmutators.

## 📚 Types

The package includes TypeScript definitions:

- **`ScrambleOptions`**
  - `scrambler: string`
  - `length?: number`
  - `prob?: number`
  - `image?: boolean`

- **`ImageOptions`**
  - `scramble: string`
  - `type: string` (scrambler)

## 📄 License

This project is licensed under the [GNU GPL v3](./LICENSE).
It includes code from [csTimer](https://github.com/cs0x7f/cstimer), also licensed under GPL-3.0.
