import {
  setSeed as _setSeed,
  getSeed as _getSeed,
} from "./cstimer/lib/mathlib";
import { getScramble as cstimerGetScramble } from "./cstimer/scramble/index";
import { scrambleToPuzzle } from "./helpers/scrambleToPuzzle";
import { AScramblers, IPuzzleOrder, PuzzleType } from "./puzzles/constants";

interface ImageOptions {
  scramble: string;
  type: AScramblers;
}

interface ScrambleOptions {
  scrambler: AScramblers;
  image?: boolean;
  length?: number;
  prob?: number;
}

function canGenerateImage(type: PuzzleType, o: IPuzzleOrder): boolean {
  const list: PuzzleType[] = [
    "rubik",
    "pyraminx",
    "skewb",
    "square1",
    "clock",
    "megaminx",
  ];

  if (type === "rubik") return o.a === o.b && o.b === o.c;
  if (type === "pyraminx" || type === "megaminx") return o.a === 3;

  return list.includes(type);
}

export function genImages(opts: ImageOptions[]) {
  if (!Array.isArray(opts)) return [];

  let res: string[] = [];

  for (let i = 0, maxi = opts.length; i < maxi; i += 1) {
    const op = opts[i];
    const pzs = scrambleToPuzzle(op.scramble, op.type || "333");

    res = [
      ...res,
      ...pzs.map((p) => {
        if (canGenerateImage(p.type, p.order)) {
          return (p.p.getImage || (() => ""))();
        }
        return "";
      }),
    ];
  }

  return res;
}

export function getScrambles(opts: ScrambleOptions[]) {
  if (!Array.isArray(opts)) return [];

  return opts.map((op) => {
    let scr = cstimerGetScramble(op.scrambler, op.length || 0, op.prob || -1);

    if (op.image) {
      return {
        scramble: scr,
        image: genImages([
          { scramble: scr, type: op.scrambler as AScramblers },
        ]),
      };
    }

    return { scramble: scr };
  });
}

export function setSeed(count: number, seed: string) {
  _setSeed(Math.abs(count), seed);
}

export function getSeed() {
  return _getSeed();
}
