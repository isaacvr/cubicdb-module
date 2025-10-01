export declare class Color {
    color: number[];
    constructor(a?: any, b?: any, c?: any, d?: any, e?: any);
    set(k: number, v: number): void;
    fromRGB(r: number, g: number, b: number): void;
    fromRGBA(r: number, g: number, b: number, a: number): void;
    fromString(s: string): void;
    interpolate(col: Color, a: number): Color;
    clone(): Color;
    toHex(alpha?: boolean): string;
    toNumber(): number;
    toRGBStr(): string;
    toRGBAStr(): string;
    rgbToHSL(): number[];
    toArray(): number[];
}
