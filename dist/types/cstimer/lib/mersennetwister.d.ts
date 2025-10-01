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
export declare class MersenneTwisterObject {
    N: number;
    mask: number;
    mt: never[];
    mti: number;
    m01: number[];
    M: number;
    N1: number;
    NM: number;
    MN: number;
    U: number;
    L: number;
    R: number;
    constructor(seed?: any, seedArray?: any);
    dmul0(m: any, n: any): number;
    init0(seed: any): void;
    init(seed?: any): void;
    initByArray(seedArray: any, seed: any): void;
    skip(n: any): void;
    randomInt32(): number;
    randomInt53(): number;
    randomReal32(): number;
    randomReal53(): number;
    randomString(len: any): string;
}
