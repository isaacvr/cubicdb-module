"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var mathlib_1 = require("../lib/mathlib");
var scramble_1 = require("./scramble");
var solv = new mathlib_1.Solver(4, 1, [[0, doMove, 384]]);
var movePieces = [
    [0, 1],
    [2, 3],
    [0, 3],
    [1, 2],
];
function doMove(idx, m) {
    var arr = (0, mathlib_1.set8Perm)([], idx >> 4, 4);
    (0, mathlib_1.acycle)(arr, movePieces[m]);
    return ((0, mathlib_1.get8Perm)(arr, 4) << 4) + ((idx & 15) ^ (1 << m));
}
function generateScramble() {
    var c = 1 + (0, mathlib_1.rn)(191);
    c = c * 2 + (((0, mathlib_1.getNParity)(c >> 3, 4) ^ (c >> 1) ^ (c >> 2) ^ c) & 1);
    return solv.toStr(solv.search([c], 0), "RLFB", [""]);
}
(0, scramble_1.regScrambler)("133", generateScramble);
