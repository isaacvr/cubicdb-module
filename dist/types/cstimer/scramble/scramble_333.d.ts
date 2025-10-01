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
export declare function getRandomScramble(): string;
export declare function getFMCScramble(): string;
export declare function getEdgeScramble(): string;
export declare function getCornerScramble(): string;
export declare function getLLScramble(): string;
export declare const f2l_map: readonly [readonly [8192, 4, "Easy-01"], readonly [4113, 4, "Easy-02"], readonly [8210, 4, "Easy-03"], readonly [4099, 4, "Easy-04"], readonly [8195, 4, "RE-05"], readonly [4114, 4, "RE-06"], readonly [8194, 4, "RE-07"], readonly [4115, 4, "RE-08"], readonly [8211, 4, "REFC-09"], readonly [4098, 4, "REFC-10"], readonly [8208, 4, "REFC-11"], readonly [4097, 4, "REFC-12"], readonly [8209, 4, "REFC-13"], readonly [4096, 4, "REFC-14"], readonly [8193, 4, "SPGO-15"], readonly [4112, 4, "SPGO-16"], readonly [0, 4, "SPGO-17"], readonly [17, 4, "SPGO-18"], readonly [3, 4, "PMS-19"], readonly [18, 4, "PMS-20"], readonly [2, 4, "PMS-21"], readonly [19, 4, "PMS-22"], readonly [1, 4, "Weird-23"], readonly [16, 4, "Weird-24"], readonly [1024, 4, "CPEU-25"], readonly [1041, 4, "CPEU-26"], readonly [5120, 4, "CPEU-27"], readonly [9233, 4, "CPEU-28"], readonly [5137, 4, "CPEU-29"], readonly [9216, 4, "CPEU-30"], readonly [24, 4, "EPCU-31"], readonly [8, 4, "EPCU-32"], readonly [8200, 4, "EPCU-33"], readonly [4104, 4, "EPCU-34"], readonly [8216, 4, "EPCU-35"], readonly [4120, 4, "EPCU-36"], readonly [1048, 1, "ECP-37"], readonly [5128, 1, "ECP-38"], readonly [9224, 1, "ECP-39"], readonly [5144, 1, "ECP-40"], readonly [9240, 1, "ECP-41"], readonly [1032, 1, "Solved-42"]];
export declare const f2lfilter: any[];
export declare function getLSLLScramble(type: any, length: any, cases: any): string;
export declare function getF2LScramble(_type: any, _length: any, prob: any): string;
export declare function getZBLLScramble(type: any, length: any, cases: any): string;
export declare function getZZLLScramble(): string;
export declare function getZBLSScramble(): string;
export declare function getLSEScramble(): string;
export declare function getCMLLScramble(type: any, length: any, cases: any): string;
export declare function getCLLScramble(): string;
export declare function getELLScramble(): string;
export declare function get2GLLScramble(): string;
export declare const pllfilter: string[];
export declare function getPLLScramble(type: any, length: any, cases: any): string;
export declare const ollfilter: string[];
export declare function getOLLScramble(type: any, length: any, cases: any): string;
export declare function getEOLineScramble(): string;
export declare function getEasyCrossScramble(type: any, length: any): string;
export declare function genFacelet(facelet: string): string;
export declare function solvFacelet(facelet: string): string;
export declare function getCustomScramble(type: string, length: number, cases: any): string;
