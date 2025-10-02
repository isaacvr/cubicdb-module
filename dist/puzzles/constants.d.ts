export interface IReconstruction {
    sequence: string[];
    sequenceIndex: number[];
    finalAlpha: number;
    result: string;
    hasError: boolean;
}
export interface PuzzleOptions {
    type: PuzzleType;
    order?: number[];
}
export interface PuzzleInterface {
    palette: any;
    move: (m: any) => any;
    getImage?: () => string;
    raw?: any;
}
export interface IPuzzleOrder {
    a: number;
    b: number;
    c: number;
}
export declare const PuzzleTypeName: readonly ["rubik", "icarry", "skewb", "square1", "pyraminx", "axis", "fisher", "ivy", "clock", "megaminx", "mirror", "dino", "rex", "redi", "mixup", "pyramorphix", "gear", "dreidel", "bandaged222", "bicube", "square2", "pandora", "ultimateSkewb", "pyraminxCrystal", "tetraminx", "meierHalpernPyramid", "sq1Star", "windmill", "helicopter", "supersquare1", "fto", "timemachine", "masterskewb", "void", "diamondcube", "axis44", "fisher44", "redibarrel", "twisty33", "ghost", "barrel33"];
export declare type PuzzleType = (typeof PuzzleTypeName)[number];
export declare const ScramblerList: readonly ["222so", "333", "333fm", "333ni", "333mbf", "333oh", "444bld", "444wca", "555wca", "555bld", "666wca", "777wca", "clkwca", "mgmp", "pyrso", "skbso", "sqrs"];
export type Scrambler = (typeof ScramblerList)[number];
declare const COLORS: Record<string, string>;
export declare type ColorName = keyof typeof COLORS;
export declare const STANDARD_PALETTE: {
    y: string;
    r: string;
    o: string;
    b: string;
    g: string;
    w: string;
    x: string;
    d: string;
    v: string;
    k: string;
    yellow: string;
    red: string;
    orange: string;
    blue: string;
    green: string;
    white: string;
    gray: string;
    darkGray: string;
    lightGray: string;
    black: string;
    violet: string;
    pink: string;
    lblue: string;
    lyellow: string;
    lgreen: string;
};
export declare function strToHex(color: string): number;
export declare const R222: readonly ["222so", "222o", "2223", "2226", "222eg", "222eg0", "222eg1", "222eg2", "222nb", "222tcp", "222tcn", "222lsall"];
export declare const R333: readonly ["333", "333ni", "333fm", "333oh", "333o", "edges", "corners", "ll", "zbll", "cll", "ell", "lse", "lsemu", "cmll", "f2l", "lsll2", "2gll", "zbls", "zzll", "oll", "pll", "eoline", "easyc", "333ft", "333custom", "2gen", "2genl", "roux", "3gen_F", "3gen_L", "RrU", "half", "lsll", "coll", "eols", "wvls", "vls", "easyxc", "sbrx", "mt3qb", "mteole", "mttdr", "mt6cp", "mtcdrll", "mtl5ep", "ttll"];
export declare const R444: readonly ["444wca", "444bld", "444m", "444", "444yj", "4edge", "RrUu"];
export declare const R555: readonly ["555wca", "555bld", "555", "5edge"];
export declare const R666: readonly ["666wca", "666si", "666p", "666s", "6edge"];
export declare const R777: readonly ["777wca", "777si", "777p", "777s", "7edge"];
export declare const PYRA: readonly ["pyrso", "pyro", "pyrm", "pyrl4e", "pyr4c", "pyrnb"];
export declare const SKWB: readonly ["skbso", "skbo", "skb", "skbnb"];
export declare const SQR1: readonly ["sqrs", "sqrcsp", "sq1h", "sq1t"];
export declare const CLCK: readonly ["clkwca", "clk", "clkwca", "clko", "clkc", "clke"];
export declare const MEGA: readonly ["mgmp", "mgmc", "mgmo", "minx2g", "mlsll", "mgmll", "mgmpll"];
export declare const KILO: readonly ["klmso", "klmp"];
export declare const GIGA: readonly ["giga"];
export declare const MISC: (string | string[])[];
export type AScramblers = (typeof R222)[number] | (typeof R333)[number] | (typeof R444)[number] | (typeof R555)[number] | (typeof R666)[number] | (typeof R777)[number] | (typeof PYRA)[number] | (typeof SKWB)[number] | (typeof SQR1)[number] | (typeof CLCK)[number] | (typeof MEGA)[number] | (typeof KILO)[number] | (typeof GIGA)[number];
export declare const options: Map<string, PuzzleOptions | PuzzleOptions[]>;
export {};
