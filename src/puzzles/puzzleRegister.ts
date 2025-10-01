import { PuzzleType } from "./constants";

export interface PuzzleInfo {
  code: string;
  name: string;
  constr: any;
  order: boolean;
}

export const puzzleReg: Map<string, PuzzleInfo> = new Map<string, PuzzleInfo>();

export function registerPuzzle(code: PuzzleType, name: string, constr: any, order: boolean) {
  puzzleReg.set(code, { code, name, constr, order });
}
