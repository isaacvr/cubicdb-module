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
exports.options = exports.probs = exports.filters = exports.scramblers = void 0;
exports.mega = mega;
exports.regScrambler = regScrambler;
exports.formatScramble = formatScramble;
exports.rndState = rndState;
exports.fixCase = fixCase;
var mathlib_1 = require("../lib/mathlib");
function mega(turns, suffixes, length) {
    turns = turns || [[""]];
    suffixes = suffixes || [""];
    length = length || 0;
    var donemoves = 0;
    var lastaxis = -1;
    var s = [];
    var first, second;
    for (var i = 0; i < length; i++) {
        do {
            first = (0, mathlib_1.rn)(turns.length);
            second = (0, mathlib_1.rn)(turns[first].length);
            if (first != lastaxis) {
                donemoves = 0;
                lastaxis = first;
            }
        } while (((donemoves >> second) & 1) != 0);
        donemoves |= 1 << second;
        if (turns[first][second].constructor == Array) {
            s.push((0, mathlib_1.rndEl)(turns[first][second]) + (0, mathlib_1.rndEl)(suffixes));
        }
        else {
            s.push(turns[first][second] + (0, mathlib_1.rndEl)(suffixes));
        }
    }
    return s.join(" ");
}
exports.scramblers = new Map();
exports.filters = new Map();
exports.probs = new Map();
exports.options = new Map();
function regScrambler(mode, callback, filter_and_probs) {
    if (Array.isArray(mode)) {
        for (var i = 0; i < mode.length; i++) {
            exports.scramblers.set(mode[i], callback);
            exports.filters.set(mode[i], []);
            exports.probs.set(mode[i], []);
        }
    }
    else {
        exports.scramblers.set(mode, callback);
        if (filter_and_probs != undefined) {
            exports.filters.set(mode, filter_and_probs[0]);
            exports.probs.set(mode, filter_and_probs[1]);
        }
    }
    return regScrambler;
}
/**
 *	format string,
 *		${args} => scramblers[scrType](scrType, scrArg)
 *		#{args} => mega(args)
 */
function formatScramble(str) {
    var repfunc = function (match, p1) {
        var _a;
        if (match[0] == "$") {
            var args = [p1];
            if (p1[0] == "[") {
                args = JSON.parse(p1);
            }
            return (_a = exports.scramblers.get(args[0].toString())) === null || _a === void 0 ? void 0 : _a.apply(this, args);
        }
        else if (match[0] == "#") {
            return mega.apply(this, JSON.parse("[" + p1 + "]"));
        }
        else {
            return "";
        }
    };
    var re1 = /[$#]\{([^}]+)\}/g;
    return str.replace(re1, repfunc);
}
function rndState(filter, probs) {
    if (probs == undefined) {
        return undefined;
    }
    var ret = probs.slice();
    if (filter == undefined) {
        filter = ret;
    }
    for (var i = 0; i < filter.length; i++) {
        if (!filter[i]) {
            ret[i] = 0;
        }
    }
    return (0, mathlib_1.rndProb)(ret);
}
function fixCase(cases, probs) {
    return cases == undefined ? (0, mathlib_1.rndProb)(probs) : cases;
}
