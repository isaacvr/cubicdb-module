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
export declare class KiloCubie {
    perm: number[];
    twst: number[];
    constructor();
    static SOLVED: KiloCubie;
    static moveCube: KiloCubie[];
    static symCube: KiloCubie[];
    static symMult: number[][];
    static symMulI: number[][];
    static symMulM: number[][];
    static CombCoord: any;
    toFaceCube(kFacelet?: number[][]): number[];
    fromFacelet(facelet: number[], kFacelet?: number[][]): -1 | this;
    hashCode(): number;
    static KiloMult(a: KiloCubie, b: KiloCubie, prod: KiloCubie): void;
    static KiloMult3(a: KiloCubie, b: KiloCubie, c: KiloCubie, prod: KiloCubie): void;
    invFrom(cc: KiloCubie): this;
    init(perm: number[], twst: number[]): this;
    isEqual(c: KiloCubie): boolean;
    setComb(idx: number, r?: number): void;
    getComb(r?: number): number[];
    faceletMove(face: number, pow: number, wide: number): void;
}
