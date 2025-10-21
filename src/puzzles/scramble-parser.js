"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrambleParser = exports.scrambleReg = void 0;
var scramble_interpreter_1 = require("./scramble-interpreter");
var strings_1 = require("./strings");
exports.scrambleReg = /^([\d]+)?([FRUBLDfrubldzxySME])(?:([w])|&sup([\d]);)?('|2'|2|3'|3)?$/;
function _moveToOrder(mv, order) {
    if (mv === "F" || mv === "B")
        return order.b;
    if (mv === "U" || mv === "D")
        return order.c;
    return order.a;
}
function checkBit(n, b) {
    return !!(n & (1 << b));
}
var ScrambleParser = /** @class */ (function () {
    function ScrambleParser() {
    }
    ScrambleParser.parseScramble = function (scramble, moveMap) {
        var moveseq = [];
        var moves = scramble.split(/\s+/g);
        var m, w, f, p;
        for (var s = 0, maxs = moves.length; s < maxs; s += 1) {
            m = exports.scrambleReg.exec(moves[s]);
            if (m == null) {
                continue;
            }
            f = "FRUBLDfrubldzxySME".indexOf(m[2]);
            p = -(parseInt(m[5]) || 1) * Math.sign(moves[s].indexOf("'") + 0.2);
            if (f > 14) {
                f = [0, 4, 5][f % 3];
                moveseq.push([moveMap.indexOf("FRUBLD".charAt(f)), 2, p, 1, 0]);
                continue;
            }
            w = f < 12 ? ~~m[1] || ~~m[4] || ((m[3] == "w" || f > 5) && 2) || 1 : -1;
            // Move Index, Face Index, Direction
            moveseq.push([moveMap.indexOf("FRUBLD".charAt(f % 6)), w, p, 0, f < 12 ? 0 : 1]);
        }
        return moveseq;
    };
    // static parseScrambleOld(scramble: string, order: IPuzzleOrder, moveMap: string) {
    //   return ScrambleParser.parseNNN(
    //     solvFacelet(
    //       Puzzle.fromSequence(
    //         scramble,
    //         { type: "rubik", order: [order.a, order.b, order.c] },
    //         true,
    //         true
    //       ).toFacelet()
    //     ),
    //     order,
    //     moveMap
    //   ).map((moves: any) => ({
    //     move: moves[1],
    //     pos: moveMap.indexOf(moves[1]),
    //     times: ((moves[2] % 4) + 4) % 4,
    //   }));
    // }
    ScrambleParser.parseNNN = function (scramble, order, MOVE_MAP, moveToOrder, simplify) {
        if (MOVE_MAP === void 0) { MOVE_MAP = "URFDLB"; }
        if (moveToOrder === void 0) { moveToOrder = _moveToOrder; }
        if (simplify === void 0) { simplify = false; }
        var scr = ScrambleParser.parseNNNString(scramble, simplify);
        var moves = ScrambleParser.parseScramble(scr, MOVE_MAP);
        var res = [];
        for (var i = 0, maxi = moves.length; i < maxi; i += 1) {
            var o = moveToOrder(MOVE_MAP.charAt(moves[i][0]), order);
            if (!moves[i][4]) {
                res.push([
                    moves[i][3] ? o - 1 : moves[i][1], // Face Index | Starting face
                    MOVE_MAP.charAt(moves[i][0]), // Move Index | Index of the move
                    moves[i][2], // Direction | Clockwise, double turn, counterclockwise
                    moves[i][3] ? o - 2 : undefined, // Span | How many layers
                ]);
            }
            else {
                res.push([o, MOVE_MAP.charAt(moves[i][0]), moves[i][2], moves[i][3]]);
            }
        }
        return res;
    };
    ScrambleParser.parseMegaminx = function (scramble) {
        var res = [];
        // Carrot Notation
        if (scramble
            .split("\n")
            .filter(function (e) { return e; })
            .every(function (e) { return /^(\s*([+-]{2}|U|U'))*$/.test(e); })) {
            var moves = scramble.match(/[+-]{2}|U'?/g);
            if (!moves) {
                return res;
            }
            for (var i = 0, maxi = moves.length; i < maxi; i += 1) {
                switch (moves[i]) {
                    case "U":
                        res.push([0, -1, 1]);
                        break;
                    case "U'":
                        res.push([0, 1, 1]);
                        break;
                    case "++":
                    case "+-":
                    case "-+":
                    case "--":
                        res.push([1, 2 * (moves[i][0] == "-" ? -1 : 1), -1]);
                        res.push([0, 2 * (moves[i][1] == "-" ? -1 : 1), -1]);
                        break;
                }
            }
        }
        else {
            // WCA Notation
            var moves = scramble.match(/((DB[RL]\d*'?)|([dbDB][RL]\d*'?)|(\[[ulfrbd]\d*'?\])|([LRDlrd](\+|-){1,2})|([ULFRBDy]\d*'?))/g) || [];
            var moveMap = "ULFRBD";
            for (var i = 0, maxi = moves.length; i < maxi; i += 1) {
                var mv = moves[i];
                if (/^([LRDlrd](\+|-){1,2})$/.test(mv)) {
                    var type = { d: 0, r: 1, l: 3 }[mv[0].toLowerCase()] || 0;
                    var turns = mv.indexOf("+") * (mv.length - 1);
                    res.push([type, turns, -1, mv[0] === mv[0].toLowerCase() ? 1 : 0]);
                }
                else {
                    var turns = (parseInt(mv.replace(/\D+(\d+)\D*/g, "$1")) || 1) * Math.sign(mv.indexOf("'") + 0.2);
                    if (/^([ULFRBDy]\d*'?)$/.test(mv)) {
                        if (mv[0] === "y") {
                            res.push([0, turns, 1]);
                            res.push([0, turns, -1]);
                        }
                        else {
                            res.push([moveMap.indexOf(mv[0]), turns, 1]);
                        }
                    }
                    else if (/^([dbDB][RL]\d*'?)$/.test(mv)) {
                        res.push([
                            ["dl", "dr", "bl", "br"].indexOf(mv.slice(0, 2).toLowerCase()) + 6,
                            turns,
                            1,
                        ]);
                    }
                    else if (/^(DB[RL]\d*'?)$/.test(mv)) {
                        res.push([["DBL", "DBR"].indexOf(mv.slice(0, 3)) + 10, turns, 1]);
                    }
                    else {
                        res.push([moveMap.indexOf(mv[1].toUpperCase()) + 12, turns, -1]);
                    }
                }
            }
        }
        return res;
    };
    ScrambleParser.parsePyraminx = function (scramble, moveMap) {
        // MOVE_MAP = "URLB"
        // MV = [ plane, turns, layers, direction ] ]
        if (moveMap === void 0) { moveMap = "URLB"; }
        var res = [];
        var moveReg = /(([ULRB]w?)|(o?[ULRB])|[urlbdyz])['2]?/g;
        var moves = scramble.match(moveReg);
        if (!moves)
            return [];
        for (var i = 0, maxi = moves.length; i < maxi; i += 1) {
            var mv = moves[i];
            var turns = (parseInt(mv.replace(/\D+(\d+)\D*/g, "$1")) || 1) * Math.sign(mv.indexOf("'") + 0.2);
            if (mv.startsWith("o")) {
                res.push([moveMap.indexOf(mv[1]), turns, 0, -1]);
            }
            else if (/^[yz]$/.test(mv[0])) {
                res.push(["y--z".indexOf(mv[0]), (mv[0] === "z" ? -1 : 1) * turns, 0, -1]);
            }
            else if (mv[0] === "d") {
                res.push([0, -turns, 2, -1]);
            }
            else {
                var mmv = mv[0].toUpperCase();
                res.push([
                    moveMap.indexOf(mmv),
                    turns,
                    mv.indexOf("w") > -1 ? 3 : mmv === mv[0] ? 2 : 1,
                    1,
                ]);
            }
        }
        return res;
    };
    ScrambleParser.parseSkewb = function (scramble, moveMap) {
        if (moveMap === void 0) { moveMap = "FURLBfrlbxyz"; }
        var res = [];
        var moveReg = /[FULRBfrlbxyz]['2]?/g;
        var moves = scramble.match(moveReg);
        if (!moves)
            return [];
        for (var i = 0, maxi = moves.length; i < maxi; i += 1) {
            var mv = moves[i];
            var turns = (parseInt(mv.replace(/\D+(\d+)\D*/g, "$1")) || 1) * Math.sign(mv.indexOf("'") + 0.2);
            res.push([moveMap.indexOf(mv[0]), -turns]);
        }
        return res;
    };
    ScrambleParser.parseSquare1 = function (scramble) {
        var newScramble = scramble.replace(/\s+/g, "").split("/");
        var sqres = [/^\((-?\d),(-?\d)\)$/, /^(-?\d),(-?\d)$/, /^(-?\d)(-?\d)$/, /^(-?\d)$/];
        var res = [];
        var _loop_1 = function (i, maxi) {
            var reg = sqres.find(function (reg) { return reg.exec(newScramble[i]); });
            if (reg) {
                var m = reg.exec(newScramble[i]);
                var u = ~~m[1];
                var d = ~~m[2];
                if (u != 0) {
                    res.push([1, u]);
                }
                if (d != 0) {
                    res.push([2, d]);
                }
            }
            else if (/^([xyz])2$/.test(newScramble[i])) {
                res.push(["xyz".indexOf(newScramble[i][0]) + 4, 6]);
            }
            if (i != maxi - 1) {
                res.push([0, 6]);
            }
        };
        for (var i = 0, maxi = newScramble.length; i < maxi; i += 1) {
            _loop_1(i, maxi);
        }
        return res;
    };
    ScrambleParser.parseSuperSquare1 = function (scramble) {
        var newScramble = scramble.replace(/\s+/g, "").split("/");
        var sqres = /^\((-?\d),(-?\d),(-?\d),(-?\d)\)$/;
        var res = [];
        for (var i = 0, maxi = newScramble.length; i < maxi; i += 1) {
            var m = sqres.exec(newScramble[i]);
            if (m) {
                for (var n = 1; n <= 4; n += 1) {
                    var mv = ~~m[n];
                    if (mv)
                        res.push([n, mv]);
                }
            }
            if (i != maxi - 1) {
                res.push([0, 6]);
            }
        }
        return res;
    };
    ScrambleParser.parseFTO = function (scramble) {
        var res = [];
        var moveReg = /(BL|BR|[URFDLB])'?/g;
        var moves = scramble.match(moveReg);
        var moveMap = ["U", "R", "F", "D", "L", "B", "BR", "BL"];
        if (!moves)
            return [];
        for (var i = 0, maxi = moves.length; i < maxi; i += 1) {
            var mv = moves[i];
            var turns = mv.endsWith("'") ? -1 : 1;
            res.push([moveMap.indexOf(turns < 0 ? mv.slice(0, -1) : mv), -turns]);
        }
        return res;
    };
    ScrambleParser.parseClock = function (scramble) {
        var parts = scramble.replace(/\n+/g, " ").split(/\s+/g);
        var res = [];
        if (/-\d/.test(scramble)) {
            /// Concise notation
            var pins = [0xc, 0x5, 0x3, 0xa, 0x7, 0xb, 0xe, 0xd, 0xf, 0x0, 0];
            var parts_1 = scramble.replace(/\s+/g, "").split("/");
            if (parts_1.length != 11)
                return res;
            var BOTH_REG = /^\((-?\d),(-?\d)\)$/;
            var SINGLE_REG = /^\((-?\d)\)$/;
            for (var i = 0, maxi = parts_1.length; i < maxi; i += 1) {
                var mv = parts_1[i];
                if (BOTH_REG.test(mv) && i < 4) {
                    var moves = mv.replace(BOTH_REG, "$1 $2").split(" ").map(Number);
                    res.push([pins[i], moves[0], 0]);
                    res.push([-1, -1, -1]);
                    res.push([i & 1 ? pins[i] : pins[(i + 2) & 3], -moves[1], 0]);
                    res.push([-1, -1, -1]);
                }
                else if (SINGLE_REG.test(mv)) {
                    var move = +mv.replace(SINGLE_REG, "$1");
                    if (i === 9) {
                        res.push([-1, -1, -1]);
                        res.push([0xf, -move, 0]);
                        res.push([-1, -1, -1]);
                    }
                    else {
                        res.push([pins[i], move, 0]);
                    }
                }
                else {
                    var pin = parseInt(mv
                        .split("")
                        .map(function (s) { return (s === "U" ? 1 : 0); })
                        .join(""), 2);
                    res.push([pin, NaN, NaN]);
                }
            }
        }
        else if (!/([Ud]{2})/.test(scramble)) {
            /// Extended WCA notation
            var MOVE_REG = /^((UR|DR|DL|UL|ur|dr|dl|ul|R|D|L|U|ALL|\/|\\)(\(\d[+-],\s*\d[+-]\)|\d[+-])|y2|x2|z[2']?|UR|DR|DL|UL)$/;
            var letters = [
                "UL",
                "UR",
                "DL",
                "DR",
                "ALL",
                "U",
                "R",
                "D",
                "L",
                "ul",
                "ur",
                "dl",
                "dr",
                "/",
                "\\",
            ];
            var pins = [0x8, 0x4, 0x2, 0x1, 0xf, 0xc, 0x5, 0x3, 0xa, 0x7, 0xb, 0xd, 0xe, 0x6, 0x9];
            var first = true;
            var pinCode = 0x0;
            for (var i = 0, maxi = parts.length; i < maxi; i += 1) {
                if (!MOVE_REG.test(parts[i])) {
                    continue;
                }
                if (parts[i] === "y2") {
                    res.push([-1, 0]);
                    first = true;
                }
                else if (parts[i] === "x2") {
                    res.push([-2, 0]);
                    first = true;
                }
                else if (parts[i][0] === "z") {
                    res.push([-3, parts[i][1] === "2" ? 2 : parts[i][1] === "'" ? -1 : 1]);
                    first = true;
                }
                else {
                    var cmd = [0, 0, 0];
                    for (var j = 0, maxj = letters.length; j < maxj; j += 1) {
                        if (parts[i].startsWith(letters[j])) {
                            cmd[0] = pins[j];
                            if (parts[i].includes("(")) {
                                var mvs = parts[i].slice(letters[j].length).match(/\((\d[+-]),\s*(\d[+-])\)/);
                                if (mvs && mvs.length >= 3) {
                                    var upPos = checkBit(cmd[0], 3) === checkBit(cmd[0], 1)
                                        ? [2, 1][(cmd[0] & 0x8) >> 3]
                                        : checkBit(cmd[0], 3) === checkBit(cmd[0], 2)
                                            ? [2, 2, 1, 1][cmd[0] & 0x3]
                                            : cmd[0] & 0x8
                                                ? 1
                                                : 2;
                                    cmd[upPos] = parseInt(mvs[1][1] + mvs[1][0]);
                                    cmd[3 - upPos] = parseInt(mvs[2][1] + mvs[2][0]);
                                }
                            }
                            else {
                                var turns = parseInt(parts[i].slice(letters[j].length, letters[j].length + 1));
                                if (parts[i].indexOf("-") > -1) {
                                    turns = -turns;
                                }
                                cmd[1] = turns;
                            }
                            if (cmd[1] != 0 || cmd[2] != 0) {
                                res.push(cmd);
                                if (isNaN(cmd[1])) {
                                    if (!first) {
                                        pinCode |= cmd[0];
                                        cmd[0] = pinCode;
                                    }
                                    else {
                                        pinCode = cmd[0];
                                    }
                                    first = false;
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
        else {
            /// JAAP notation
            var pins = "";
            var d = 0;
            var u = 0;
            for (var i = 0, maxi = parts.length; i < maxi; i += 1) {
                if (parts[i] === "y2") {
                    res.push([-1, 0, 0]);
                }
                else if (parts[i] === "x2") {
                    res.push([-2, 0, 0]);
                }
                else if (parts[i][0] === "z") {
                    res.push([-3, parts[i][1] === "2" ? 2 : parts[i][1] === "'" ? -1 : 1]);
                }
                else if (/\d+/.test(parts[i])) {
                    var turns = parseInt(parts[i].replace("=", "").slice(1, 3));
                    if (parts[i][0] === "d") {
                        d = turns;
                    }
                    else {
                        u = turns;
                    }
                }
                else {
                    if (pins.length === 4) {
                        res.push([parseInt(pins.replace(/U/g, "1").replace(/d/g, "0"), 2), u, d]);
                        d = 0;
                        u = 0;
                        pins = "";
                    }
                    else {
                        pins += parts[i];
                    }
                }
            }
            if (pins.length === 4) {
                res.push([parseInt(pins.replace(/U/g, "1").replace(/d/g, "0"), 2), u, d]);
            }
        }
        return res;
    };
    ScrambleParser.parseNNNString = function (scramble, simplify) {
        if (simplify === void 0) { simplify = true; }
        return new scramble_interpreter_1.Interpreter(false).input(scramble, simplify);
    };
    ScrambleParser.parsePyraminxString = function (scramble) {
        return new scramble_interpreter_1.Interpreter(false, "pyraminx").input(scramble);
    };
    ScrambleParser.parseMisc = function (scramble, mode) {
        switch (mode) {
            case "r3":
            case "r3ni":
            case "r234w":
            case "r2345w":
            case "r23456w":
            case "r234567w":
            case "r234":
            case "r2345":
            case "r23456":
            case "r234567": {
                return (0, strings_1.prettyScramble)(scramble)
                    .split("\n")
                    .map(function (s) { return s.replace(/^\d+\)(.+)$/, "$1").trim(); });
            }
            case "sq2":
            case "gearso":
            case "gearo":
            case "gear":
            case "redi":
            case "redim":
            case "bic":
            case "ivy":
            case "ivyo":
            case "ivyso":
            case "prcp":
            case "prco":
            case "heli":
            case "888":
            case "999":
            case "101010":
            case "111111":
            case "mpyr":
            case "223":
            case "233":
            case "334":
            case "336":
            case "ssq1t":
            case "fto":
            case "sfl": {
                return [scramble];
            }
            case "133": {
                return [
                    scramble
                        .split(" ")
                        .map(function (mv) { return mv[0] + "2"; })
                        .join(" "),
                ];
            }
            default: {
                return [];
            }
        }
    };
    ScrambleParser.inverse = function (type, sequence) {
        var arr = [];
        var res = [];
        if (type === "clock") {
            res = sequence
                .split(" ")
                .filter(function (s) { return !/^[UD][RL]$/.test(s) && s.trim(); })
                .reverse()
                .map(function (s) {
                return s.endsWith("0+") || s === "y2"
                    ? s
                    : s.slice(0, -1) + { "+": "-", "-": "+" }[s[s.length - 1]];
            });
        }
        else if (type === "square1") {
            var sqre = /\s*\(?(-?\d+), *(-?\d+)\)?\s*/;
            arr = sequence.replace(/\s+/g, "").split("/");
            for (var i = arr.length - 1; i >= 0; i -= 1) {
                var m = arr[i].match(sqre);
                if (m) {
                    res.push("(".concat(-m[1], ", ").concat(-m[2], ")"));
                }
                if (i > 0) {
                    res.push("/");
                }
            }
        }
        else if (type === "megaminx") {
            arr = (0, strings_1.parseReconstruction)(sequence, type, 3).sequence;
            for (var i = arr.length - 1; i >= 0; i -= 1) {
                var mv = arr[i];
                if (/^([LRDlrd](\+|-){1,2})$/.test(mv)) {
                    res.push(mv[0] +
                        (mv[1] === "+" ? mv.slice(1).replace(/\+/g, "-") : mv.slice(1).replace(/-/g, "+")));
                }
                else {
                    var turns = (5 -
                        (((parseInt(mv.replace(/\D*(\d+)\D*/g, "$1")) || 1) *
                            Math.sign(mv.indexOf("'") + 0.2)) %
                            5)) %
                        5;
                    if (/^([ULFRBDy]\d*'?)$/.test(mv)) {
                        res.push("".concat(mv[0]).concat(turns === 1 || turns === -1 ? "" : Math.abs(turns)).concat(turns < 0 ? "" : "'"));
                    }
                    else if (/^([dbDB][RL]\d*'?)$/.test(mv)) {
                        res.push("".concat(mv.slice(0, 2)).concat(turns === 1 || turns === -1 ? "" : Math.abs(turns)).concat(turns < 0 ? "" : "'"));
                    }
                    else if (/^(DB[RL]\d*'?)$/.test(mv)) {
                        res.push("".concat(mv.slice(0, 3)).concat(turns === 1 || turns === -1 ? "" : Math.abs(turns)).concat(turns < 0 ? "" : "'"));
                    }
                    else {
                        res.push("[".concat(mv[1]).concat(turns === 1 || turns === -1 ? "" : Math.abs(turns)).concat(turns < 0 ? "" : "'", "]"));
                    }
                }
            }
        }
        else {
            var fn = type === "pyraminx" ? ScrambleParser.parsePyraminxString : ScrambleParser.parseNNNString;
            var arr_1 = fn(sequence)
                .trim()
                .split(" ")
                .map(function (e) { return e.trim(); })
                .filter(function (e) { return e != ""; });
            for (var i = arr_1.length - 1; i >= 0; i -= 1) {
                if (arr_1[i].indexOf("2") > -1) {
                    res.push(arr_1[i].replace("'", ""));
                }
                else if (arr_1[i].indexOf("'") > -1) {
                    res.push(arr_1[i].replace("'", ""));
                }
                else {
                    res.push(arr_1[i] + "'");
                }
            }
        }
        return res.join(" ");
    };
    return ScrambleParser;
}());
exports.ScrambleParser = ScrambleParser;
