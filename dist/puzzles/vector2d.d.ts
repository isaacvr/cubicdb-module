export declare class Vector2D {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    static cross(a: Vector2D, b: Vector2D): number;
    add(v: Vector2D): Vector2D;
    sub(v: Vector2D): Vector2D;
    mul(f: number): Vector2D;
    multiply(v: Vector2D): Vector2D;
    div(f: number): Vector2D;
    rot(ang: number): Vector2D;
    abs(): number;
    unit(): Vector2D;
    toArr(): number[];
}
