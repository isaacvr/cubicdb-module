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
exports.pKilo = exports.pUtils = exports.pSkewb = exports.pSq1 = exports.p333 = exports.pScramble = exports.p444 = exports.pPyra = exports.pMega = exports.pGear = exports.pClock = exports.p333lse = exports.p223 = exports.p222 = exports.p133 = void 0;
exports.getScramble = getScramble;
var p133 = require("./1x3x3");
exports.p133 = p133;
var p222 = require("./2x2x2");
exports.p222 = p222;
var p223 = require("./2x2x3");
exports.p223 = p223;
var p333lse = require("./333lse");
exports.p333lse = p333lse;
var pClock = require("./clock");
exports.pClock = pClock;
var pGear = require("./gearcube");
exports.pGear = pGear;
var pMega = require("./megascramble");
exports.pMega = pMega;
var pPyra = require("./pyraminx");
exports.pPyra = pPyra;
var p444 = require("./scamble_444");
exports.p444 = p444;
var p333 = require("./scramble_333");
exports.p333 = p333;
var pSq1 = require("./scramble_sq1");
exports.pSq1 = pSq1;
var pSkewb = require("./skewb");
exports.pSkewb = pSkewb;
var pUtils = require("./utilscramble");
exports.pUtils = pUtils;
var pKilo = require("./kilominx");
exports.pKilo = pKilo;
var pScramble = require("./scramble");
exports.pScramble = pScramble;
function getScramble(mode, len, pb) {
    return (pScramble.scramblers.get(mode) || (function () { return ""; }))
        .apply(null, [mode, Math.abs(len), pb < 0 ? undefined : pb])
        .replace(/\\n/g, "<br>")
        .trim();
}
