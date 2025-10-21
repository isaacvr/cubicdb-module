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
exports.getScramble = getScramble;
var mathlib_1 = require("../lib/mathlib");
var scramble_1 = require("./scramble");
/**	1 2   U
     0  LFRB
    3 4   D  */
//centers: U R F B L D
//twstcor: URF ULB DRB DLF
//fixedco: UBR UFL DFR DBL
var fixedCorn = [
    [4, 16, 7], // U4 B1 R2
    [1, 11, 22], // U1 F1 L2
    [26, 14, 8], // D1 F4 R3
    [29, 19, 23], // D4 B4 L3
];
var twstCorn = [
    [3, 6, 12], // U3 R1 F2
    [2, 21, 17], // U2 L1 B2
    [27, 9, 18], // D2 R4 B3
    [28, 24, 13], // D3 L4 F3
];
function checkNoBar(perm, _twst) {
    var corner = cpcord.set([], perm % 12);
    var center = ctcord.set([], ~~(perm / 12));
    var fixedtwst = ftcord.set([], _twst % 81);
    var twst = twcord.set([], ~~(_twst / 81));
    var f = [];
    for (var i = 0; i < 6; i++) {
        f[i * 5] = center[i];
    }
    (0, mathlib_1.fillFacelet)(fixedCorn, f, [0, 1, 2, 3], fixedtwst, 5);
    (0, mathlib_1.fillFacelet)(twstCorn, f, corner, twst, 5);
    for (var i = 0; i < 30; i += 5) {
        for (var j = 1; j < 5; j++) {
            if (f[i] == f[i + j]) {
                return false;
            }
        }
    }
    return true;
}
var moveCenters = [
    [0, 3, 1],
    [0, 2, 4],
    [1, 5, 2],
    [3, 4, 5],
];
var moveCorners = [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2],
];
var ctcord = new mathlib_1.coord("p", 6, -1);
var cpcord = new mathlib_1.coord("p", 4, -1);
var ftcord = new mathlib_1.coord("o", 4, 3);
var twcord = new mathlib_1.coord("o", 4, -3);
function ctcpMove(idx, m) {
    var corner = cpcord.set([], idx % 12);
    var center = ctcord.set([], ~~(idx / 12));
    (0, mathlib_1.acycle)(center, moveCenters[m]);
    (0, mathlib_1.acycle)(corner, moveCorners[m]);
    return ctcord.get(center) * 12 + cpcord.get(corner);
}
function twstMove(idx, move) {
    var fixedtwst = ftcord.set([], idx % 81);
    var twst = twcord.set([], ~~(idx / 81));
    fixedtwst[move]++;
    (0, mathlib_1.acycle)(twst, moveCorners[move], 1, [0, 2, 1, 3]);
    return twcord.get(twst) * 81 + ftcord.get(fixedtwst);
}
var solv = new mathlib_1.Solver(4, 2, [
    [0, ctcpMove, 4320],
    [0, twstMove, 2187],
]);
var solvivy = new mathlib_1.Solver(4, 2, [
    [
        0,
        function (idx, m) {
            return ~~(ctcpMove(idx * 12, m) / 12);
        },
        360,
    ],
    [
        0,
        function (idx, m) {
            return twstMove(idx, m) % 81;
        },
        81,
    ],
]);
function sol2str(sol) {
    var ret = [];
    var move2str = ["L", "R", "B", "U"]; //RLDB (in jaap's notation) rotated by z2
    for (var i = 0; i < sol.length; i++) {
        var axis = sol[i][0];
        var pow = 1 - sol[i][1];
        if (axis == 2) {
            //step two.
            (0, mathlib_1.acycle)(move2str, [0, 3, 1], pow + 1);
        }
        ret.push(move2str[axis] + (pow == 1 ? "'" : ""));
    }
    return ret.join(" ");
}
var ori = [0, 1, 2, 0, 2, 1, 1, 2, 0, 2, 1, 0];
function getScramble(type) {
    var perm, twst;
    var lim = type == "skbso" ? 6 : 2;
    var minl = type == "skbo" ? 0 : 8;
    do {
        perm = (0, mathlib_1.rn)(4320);
        twst = (0, mathlib_1.rn)(2187);
    } while ((perm == 0 && twst == 0) ||
        ori[perm % 12] != (twst + ~~(twst / 3) + ~~(twst / 9) + ~~(twst / 27)) % 3 ||
        solv.search([perm, twst], 0, lim) != null ||
        (type == "skbnb" && !checkNoBar(perm, twst)));
    return sol2str(solv.search([perm, twst], minl).reverse());
}
function getScrambleIvy(type) {
    var perm, twst, lim = 1, maxl = type == "ivyso" ? 6 : 0;
    do {
        perm = (0, mathlib_1.rn)(360);
        twst = (0, mathlib_1.rn)(81);
    } while ((perm == 0 && twst == 0) || solvivy.search([perm, twst], 0, lim) != null);
    return solvivy.toStr(solvivy.search([perm, twst], maxl).reverse(), "RLDB", "' ");
}
(0, scramble_1.regScrambler)(["skbo", "skbso", "skbnb"], getScramble)(["ivyo", "ivyso"], getScrambleIvy);
