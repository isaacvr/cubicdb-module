import {
  setSeed as _setSeed,
  getSeed as _getSeed,
} from "./cstimer/lib/mathlib";
import { getScramble as cstimerGetScramble } from "./cstimer/scramble/index";
import {
  AScramblers,
  options,
  Scrambler,
  ScramblerList,
} from "./puzzles/constants";
import { Puzzle } from "./puzzles/puzzle";

interface ImageOptions {
  scramble: string;
  type: Scrambler;
}

interface ScrambleOptions {
  scrambler: AScramblers;
  image?: boolean;
  length?: number;
  prob?: number;
}

export function genImages(opts: ImageOptions[]) {
  const res: string[] = [];

  for (let i = 0, maxi = opts.length; i < maxi; i += 1) {
    const op = options.get(opts[i].type || "333") || { type: "rubik" };
    const scr = opts[i].scramble || "";

    if (!Array.isArray(op)) {
      res.push((Puzzle.fromSequence(scr, op).p.getImage || (() => ""))());
    }
  }

  return res;
}

export function getScramble(opts: ScrambleOptions[]) {
  return opts.map((op) => {
    let scr = cstimerGetScramble(op.scrambler, op.length || 0, op.prob || -1);

    if (op.image && ScramblerList.includes(op.scrambler as any)) {
      return {
        scramble: scr,
        image: genImages([
          { scramble: scr, type: op.scrambler as Scrambler },
        ])[0],
      };
    }

    return scr;
  });
}

export function setSeed(count: number, seed: string) {
  _setSeed(Math.abs(count), seed);
}

export function getSeed() {
  return _getSeed();
}
