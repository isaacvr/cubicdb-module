import { MISC, options, PuzzleOptions } from "../puzzles/constants";
import * as all from "../cstimer/scramble/index";
import { Puzzle } from "../puzzles/puzzle";
import { ScrambleParser } from "../puzzles/scramble-parser";

export function scrambleToPuzzle(scramble: string, mode: string) {
  let cb: Puzzle[] = [];

  if (
    MISC.some((mmode: any) =>
      typeof mmode === "string" ? mmode === mode : mmode.indexOf(mode) > -1,
    )
  ) {
    const opts: PuzzleOptions[] = options.get(mode)! as PuzzleOptions[];

    cb = ScrambleParser.parseMisc(scramble, mode).map((scr, pos) =>
      Puzzle.fromSequence(scr, { ...opts[pos % opts.length] }, false, true),
    );
  } else {
    cb = [
      Puzzle.fromSequence(
        scramble,
        {
          ...options.get(mode),
        } as PuzzleOptions,
        false,
        true,
      ),
    ];
  }

  return cb;
}
