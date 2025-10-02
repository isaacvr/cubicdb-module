/**
 * Copyright (C) 2023  Shuang Chen

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.

  -----------------------------------------------------------------------
  
  Modified by Isaac Vega <isaacvega1996@gmail.com>
 */
export declare const Cnk: number[][];
export declare const fact: number[];
export declare function circleOri(arr: number[], a: number, b: number, c: number, d: number, ori: number): void;
export declare function circle(arr: any[], ...args: any[]): typeof circle;
export declare function acycle(arr: number[], perm: any[], pow?: number, ori?: number[]): typeof acycle;
export declare function getPruning(table: number[], index: number): number;
export declare function setNPerm(arr: number[], idx: number, n: number, even?: number): number[];
export declare function getNPerm(arr: number[], n: number, even?: number): number;
export declare function getNParity(idx: number, n: number): number;
export declare function get8Perm(arr: number[], n?: number, even?: number): number;
export declare function set8Perm(arr: number[], idx: number, n?: number, even?: number): number[];
export declare function getNOri(arr: number[], n: number, evenbase: number): number;
export declare function setNOri(arr: number[], idx: number, n: number, evenbase: number): number[];
export declare class coord {
    length: number;
    evenbase: number;
    private type;
    constructor(type: string, length: number, evenbase: number);
    get(arr: number[]): number;
    set(arr: number[], idx: number): number[];
}
export declare function fillFacelet(facelets: number[][], f: number[], perm: number[], ori: number[], divcol: number): void;
export declare function createMove(moveTable: number[][], size: number, doMove: any, N_MOVES?: number): void;
export declare function edgeMove(arr: number[], m: number): void;
export declare class CubieCube {
    ca: number[];
    ea: number[];
    ori: number;
    tstamp: number;
    constructor();
    static EdgeMult(a: CubieCube, b: CubieCube, prod: CubieCube): void;
    static CornMult(a: CubieCube, b: CubieCube, prod: CubieCube): void;
    static CubeMult(a: CubieCube, b: CubieCube, prod: CubieCube): void;
    static moveCube: CubieCube[];
    static rotCube: CubieCube[];
    static get rotMult(): number[][];
    static get rotMulI(): number[][];
    static get rotMulM(): number[][];
    static get rot2str(): string[];
    static SOLVED: CubieCube;
    init(ca: number[], ea: number[]): CubieCube;
    hashCode(): number;
    isEqual(c: CubieCube): boolean;
    toFaceCube(cFacelet?: number[][], eFacelet?: number[][]): string;
    invForm(cc: CubieCube): this;
    fromFacelet(facelet: string, cFacelet?: number[][], eFacelet?: number[][]): this | -1;
    verify(): 0 | -1;
    edgeCycles(): number;
    selfMoveStr(moveStr: string, isInv: boolean): number | undefined;
    selfConj(conj?: number): void;
}
export declare function createPrun(prun: number[], init: number, size: number, maxd: number, doMove: any, N_MOVES?: number, N_POWER?: number, N_INV?: number): void;
declare type SolverState = number[];
export declare class Solver {
    N_STATES: number;
    N_MOVES: number;
    N_POWER: number;
    state_params: any;
    inited: boolean;
    prun: number[][];
    move: any;
    sol: number[][];
    constructor(N_MOVES: number, N_POWER: number, state_params: any);
    search(state: SolverState, minl: number, MAXL?: number): number[][] | null;
    idaSearch(state: SolverState, maxl: number, lm: number): boolean;
    toStr(sol: number[][], move_map: string, power_map: string): string;
}
export declare class gSolver {
    prunDepth: number;
    prevSize: number;
    prunTableSize: number;
    prunTable: Record<string, number>;
    cost: number;
    MAX_PRUN_SIZE: number;
    solvedStates: string[];
    doMove: Function;
    movesList: any[];
    toUpdateArr: string[] | null;
    state: string;
    sol: any;
    solArr: string[] | null;
    prevSolStr: string | null;
    subOpt: any;
    visited: any;
    maxl: any;
    constructor(solvedStates: string[], doMove: Function, moves: Record<string, number>);
    updatePrun(targetDepth?: number): void;
    updatePrunBFS(fromDepth: number): void;
    search(state: string, minl: number, MAXL?: number): string[] | null;
    searchNext(MAXL?: number, cost?: number): string[] | null;
    getPruning(state: string): number;
    idaSearch(state: string, maxl: number, lm: any, depth: number): boolean;
    getSolArr(): any[];
}
export declare function rndEl(x: any[]): any;
export declare function rn(n: number): number;
export declare function rndPerm(n: number, isEven?: boolean): number[];
export declare function rndProb(plist: number[]): number;
export declare function time2str(unix: number, format: string): string;
export declare function str2time(val: string): number | null;
export declare function obj2str(val: object): string;
export declare function str2obj(val: any): object;
export declare function valuedArray(len: number, val: any): any[];
export declare function idxArray(arr: readonly any[], idx: number): any[];
export declare const minx: {
    doMove: (state: number[], face: number, pow: number, wide: number) => void;
    oppFace: number[];
    adjFaces: number[][];
};
export declare const SOLVED_FACELET = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
export declare const getSeed: () => {
    0: number;
    1: string;
};
export declare const setSeed: (_rndCnt: number, _seedStr: string) => void;
export {};
