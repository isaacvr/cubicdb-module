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
var edgePerms = [
    [0, 1, 2, 3],
    [0, 2, 5, 4],
];
var edgeOris = [
    [0, 0, 0, 0, 2],
    [0, 1, 0, 1, 2],
];
function doPermMove(idx, m) {
    var edge = idx >> 3;
    var corn = idx;
    var cent = (idx << 1) | ((0, mathlib_1.getNParity)(edge, 6) ^ ((corn >> 1) & 1));
    var g = (0, mathlib_1.set8Perm)([], edge, 6);
    (0, mathlib_1.acycle)(g, edgePerms[m]);
    if (m == 0) {
        //U
        corn = corn + 2;
    }
    if (m == 1) {
        //M
        cent = cent + 1;
    }
    return ((0, mathlib_1.getNPerm)(g, 6) << 3) | (corn & 6) | ((cent >> 1) & 1);
}
function doOriMove(arr, m) {
    (0, mathlib_1.acycle)(arr, edgePerms[m], 1, edgeOris[m]);
}
var solv = new mathlib_1.Solver(2, 3, [
    [0, doPermMove, 5760],
    [0, [doOriMove, "o", 6, -2], 32],
]);
function generateScramble() {
    var b, c;
    do {
        c = (0, mathlib_1.rn)(5760);
        b = (0, mathlib_1.rn)(32);
    } while (b + c == 0);
    return solv.toStr(solv.search([c, b], 0), "UM", " 2'").replace(/ +/g, " ");
}
(0, scramble_1.regScrambler)("lsemu", generateScramble);
