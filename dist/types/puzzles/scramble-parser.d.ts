import { IPuzzleOrder, PuzzleType } from "./constants";
export declare const scrambleReg: RegExp;
declare function _moveToOrder(mv: string, order: IPuzzleOrder): number;
export declare class ScrambleParser {
    constructor();
    static parseScramble(scramble: string, moveMap: string): number[][];
    static parseNNN(scramble: string, order: IPuzzleOrder, MOVE_MAP?: string, moveToOrder?: typeof _moveToOrder, simplify?: boolean): (string | number | undefined)[][];
    static parseMegaminx(scramble: string): number[][];
    static parsePyraminx(scramble: string, moveMap?: string): number[][];
    static parseSkewb(scramble: string, moveMap?: string): number[][];
    static parseSquare1(scramble: string): number[][];
    static parseSuperSquare1(scramble: string): number[][];
    static parseFTO(scramble: string): number[][];
    static parseClock(scramble: string): number[][];
    static parseNNNString(scramble: string, simplify?: boolean): string;
    static parsePyraminxString(scramble: string): string;
    static parseMisc(scramble: string, mode: string): string[];
    static inverse(type: PuzzleType, sequence: string): string;
}
export {};
