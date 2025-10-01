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
import { getScramble, genImages, setSeed, getSeed } from "cubicdb-module";
```

#### CommonJS

```js
const { getScramble, genImages, setSeed, getSeed } = require("cubicdb-module");
```

## 🔀 Generate Scrambles

```ts
import { getScramble } from "cubicdb-module";

const scrambles = getScramble([
  { scrambler: "333", length: 20 },
  { scrambler: "222", length: 11 },
]);

console.log(scrambles);
// ["R U R' U' ...", "F R U R' ..."]
```

## 🖼️ Generate Scrambles with Images

You can use the [CubicDB](https://cubicdb.netlify.app) image generator with the scrambler.

```ts
import { getScramble } from "cubicdb-module";

const withImages = getScramble([
  { scrambler: "333", length: 20, image: true },
  { scrambler: "222", length: 11, image: true },
  { scrambler: "222", length: 11 },
]);

console.log(withImages);
/*
[
  { scramble: "R U R' U' ...", image: "<svg>...</svg>" },
  { scramble: "F R U R' ...", image: "<svg>...</svg>" },
  "R U R' F2 ..."
]
*/
```

## 🌱 Seed Support

Scrambles can be made **deterministic** by setting a seed. It uses a CSPRNG (Cryptographically Secure Pseudo-Random Number Generator), ensuring high quality of the scrambles.

```ts
import { setSeed, getSeed, getScramble } from "cubicdb-module";

// Set a custom seed
setSeed(147, "cubicdb-module-seed");

// Generate reproducible scrambles
const scrambles = getScramble([{ scrambler: "333", length: 20 }]);

console.log(scrambles[0]);
// R2 U2 R U2 B2 R B2 R' B2 R2 U F U' L' F' D2 B F' D'

// Retrieve the current seed
console.log(getSeed());
```

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