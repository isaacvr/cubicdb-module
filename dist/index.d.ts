import { AScramblers, Scrambler } from "./puzzles/constants";
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
export declare function genImages(opts: ImageOptions[]): string[];
export declare function getScrambles(opts: ScrambleOptions[]): (string | {
    scramble: string;
    image: string;
})[];
export declare function setSeed(count: number, seed: string): void;
export declare function getSeed(): {
    0: number;
    1: string;
};
export {};
