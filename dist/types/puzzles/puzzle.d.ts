import { IPuzzleOrder, PuzzleInterface, PuzzleOptions, PuzzleType } from "./constants";
export declare function arrayToOrder(arr: number[] | undefined): number[] | null;
export declare class Puzzle {
    rotation: any;
    p: PuzzleInterface;
    order: IPuzzleOrder;
    type: PuzzleType;
    options: PuzzleOptions;
    constructor(options: PuzzleOptions);
    static fromSequence(scramble: string, options: PuzzleOptions, inv?: boolean, move?: boolean): Puzzle;
    move(seq: string): this;
    getColor(face: string): string;
    getHexColor(face: string): number;
    getHexStrColor(face: string): string;
}
