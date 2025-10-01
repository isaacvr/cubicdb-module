import { PuzzleType } from "./constants";
export interface PuzzleInfo {
    code: string;
    name: string;
    constr: any;
    order: boolean;
}
export declare const puzzleReg: Map<string, PuzzleInfo>;
export declare function registerPuzzle(code: PuzzleType, name: string, constr: any, order: boolean): void;
