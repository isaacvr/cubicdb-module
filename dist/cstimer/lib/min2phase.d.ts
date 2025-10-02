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
declare class CubieCube {
    ca: number[];
    ea: number[];
    static urf1: CubieCube;
    static urf2: CubieCube;
    static EdgeMult(a: CubieCube, b: CubieCube, prod: CubieCube): void;
    static CornMult(a: CubieCube, b: CubieCube, prod: CubieCube): void;
    static CornMultFull(a: CubieCube, b: CubieCube, prod: CubieCube): void;
    static CornConjugate(a: CubieCube, idx: number, b: CubieCube): void;
    static EdgeConjugate(a: CubieCube, idx: number, b: CubieCube): void;
    init(ca: number[], ea: number[]): CubieCube;
    initCoord(cperm: number, twist: number, eperm: number, flip: number): CubieCube;
    isEqual(c: CubieCube): boolean;
    setFlip(idx: number): void;
    getFlip(): number;
    getFlipSym(): number;
    setTwist(idx: number): void;
    getTwist(): number;
    getTwistSym(): number;
    setCPerm(idx: number): void;
    getCPerm(): number;
    getCPermSym(): number;
    setEPerm(idx: number): void;
    getEPerm(): number;
    getEPermSym(): number;
    getUDSlice(): number;
    setUDSlice(idx: number): void;
    getMPerm(): number;
    setMPerm(idx: number): void;
    getCComb(): number;
    setCComb(idx: number): void;
    URFConjugate(): void;
    toFaceCube(cFacelet?: number[][], eFacelet?: number[][]): string;
    invFrom(cc: CubieCube): CubieCube;
    fromFacelet(facelet: string, cFacelet?: number[][], eFacelet?: number[][]): -1 | undefined;
}
declare class CoordCube {
    twist: number;
    tsym: number;
    flip: number;
    fsym: number;
    slice: number;
    prun: number;
    twistc: number;
    flipc: number;
    static UDSliceTwistPrunMax: number;
    set(node: CoordCube): void;
    calcPruning(): void;
    setWithPrun(cc: CubieCube, depth: number): boolean;
    doMovePrun(cc: CoordCube, m: number): number;
    doMovePrunConj(cc: CoordCube, m: number): number;
}
export declare class Search {
    move: number[];
    moveSol: number[] | null;
    nodeUD: CoordCube[];
    valid1: number;
    allowShorter: boolean;
    cc: CubieCube;
    urfCubieCube: CubieCube[];
    urfCoordCube: CoordCube[];
    phase1Cubie: CubieCube[];
    preMoveCubes: CubieCube[];
    preMoves: number[];
    preMoveLen: number;
    maxPreMoves: number;
    sol: number;
    probe: number;
    probeMax: number;
    probeMin: number;
    verbose: number;
    conjMask: number;
    length1: number;
    depth1: number;
    urfIdx: number;
    isRec: boolean;
    strSolution: string | null;
    constructor();
    solution(facelets: string, maxDepth?: number, probeMax?: number, probeMin?: number, verbose?: number): string;
    initSearch(): void;
    next(probeMax: number, probeMin: number, verbose: number): string;
    verify(facelets: string): number;
    phase1PreMoves(maxl: number, lm: number, cc: CubieCube): 0 | 1;
    search(): string;
    initPhase2Pre(): number;
    initPhase2(phase2Cubie: CubieCube): 0 | 1 | 2;
    phase1(node: CoordCube, maxl: number, lm: number): number;
    appendSolMove(curMove: number): void;
    phase2(edge: number, esym: number, corn: number, csym: number, mid: number, maxl: number, depth: number, lm: number): number;
    solutionToString(): string;
}
export declare function randomCube(): string;
export declare function solve(facelet: string): string;
export declare function initFull(): void;
export {};
