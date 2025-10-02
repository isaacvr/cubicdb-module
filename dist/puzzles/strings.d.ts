import { IReconstruction, PuzzleType } from "./constants";
import { Interpreter } from "./scramble-interpreter";
export declare function defaultInner(s: string, withSuffix?: boolean): string;
type IToken = ReturnType<Interpreter["getTree"]>["program"];
export declare function getTreeString(token: IToken, puzzle: PuzzleType): string;
export declare function parseReconstruction(s: string, puzzle: PuzzleType, order: number): IReconstruction;
export declare function prettyScramble(scramble: string): string;
export {};
