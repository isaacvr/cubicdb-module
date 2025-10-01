export declare class Isaac {
    m: number[];
    acc: number;
    brs: number;
    cnt: number;
    r: number[];
    gnt: number;
    constructor();
    reset(): void;
    seed(s: number | number[]): void;
    prng(n?: number): void;
    rand(): number;
    internals(): {
        a: number;
        b: number;
        c: number;
        m: number[];
        r: number[];
    };
    random(): number;
}
