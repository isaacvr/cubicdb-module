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
import { PuzzleOptions } from "../../puzzles/constants";
export declare function mega(turns: any, suffixes: any, length: number): string;
export declare const scramblers: Map<string, Function>;
export declare const filters: Map<string, string[]>;
export declare const probs: Map<string, number[]>;
export declare const options: Map<string, PuzzleOptions | PuzzleOptions[]>;
export declare function regScrambler(mode: string | string[], callback: Function, filter_and_probs?: any): typeof regScrambler;
/**
 *	format string,
 *		${args} => scramblers[scrType](scrType, scrArg)
 *		#{args} => mega(args)
 */
export declare function formatScramble(str: string): string;
export declare function rndState(filter: any[], probs: any[]): number | undefined;
export declare function fixCase(cases: number, probs: number[]): number;
