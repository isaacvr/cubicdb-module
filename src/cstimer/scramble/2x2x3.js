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
var cmv = [];
var cprun = [];
function initCornerMoveTable() {
    var g = [], temp;
    for (var i = 0; i < 40320; i++) {
        cmv[i] = [];
    }
    for (var i = 0; i < 40320; i++) {
        (0, mathlib_1.set8Perm)(g, i);
        (0, mathlib_1.circle)(g, 0, 1, 2, 3);
        temp = cmv[0][i] = (0, mathlib_1.get8Perm)(g); //U
        (0, mathlib_1.circle)(g, 4, 5, 6, 7);
        temp = cmv[1][temp] = (0, mathlib_1.get8Perm)(g); //D
        (0, mathlib_1.circle)(g, 2, 5)(g, 3, 6);
        temp = cmv[2][temp] = (0, mathlib_1.get8Perm)(g); //R
        (0, mathlib_1.circle)(g, 0, 5)(g, 3, 4);
        cmv[3][temp] = (0, mathlib_1.get8Perm)(g); //F
    }
}
function doEdgeMove(idx, m) {
    if (m < 2) {
        return idx;
    }
    var g = (0, mathlib_1.set8Perm)([], idx, 3);
    if (m == 2) {
        (0, mathlib_1.circle)(g, 0, 1);
    }
    else if (m == 3) {
        (0, mathlib_1.circle)(g, 0, 2);
    }
    return (0, mathlib_1.get8Perm)(g, 3);
}
var initRet = false;
function init() {
    if (initRet) {
        return;
    }
    initRet = true;
    initCornerMoveTable();
    (0, mathlib_1.createPrun)(cprun, 0, 40320, 12, cmv, 4, 3);
}
function search(corner, edge, maxl, lm, sol) {
    if (maxl == 0) {
        return corner + edge == 0;
    }
    if ((0, mathlib_1.getPruning)(cprun, corner) > maxl)
        return false;
    var h, g, f, i;
    for (i = 0; i < 4; i++) {
        if (i != lm) {
            h = corner;
            g = edge;
            for (f = 0; f < (i < 2 ? 3 : 1); f++) {
                h = cmv[i][h];
                g = doEdgeMove(g, i);
                if (search(h, g, maxl - 1, i, sol)) {
                    sol.push(["U", "D", "R2", "F2"][i] + (i < 2 ? " 2'".charAt(f) : ""));
                    return true;
                }
            }
        }
    }
}
function generateScramble() {
    init();
    var b, c;
    do {
        c = (0, mathlib_1.rn)(40320);
        b = (0, mathlib_1.rn)(6);
    } while (b + c == 0);
    var d = [];
    for (var a = 0; a < 99; a++) {
        if (search(c, b, a, -1, d)) {
            break;
        }
    }
    return d.reverse().join(" ");
}
(0, scramble_1.regScrambler)("223", generateScramble);
