import { AScramblers } from "./puzzles/constants";
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
export declare function genImages(opts: ImageOptions[]): string[];
export declare function getScrambles(opts: ScrambleOptions[]): ({
    scramble: string;
    image: string[];
} | {
    scramble: string;
    image?: undefined;
})[];
export declare function setSeed(count: number, seed: string): void;
export declare function getSeed(): {
    0: number;
    1: string;
};
export {};
