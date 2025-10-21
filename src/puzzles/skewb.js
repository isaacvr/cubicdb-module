"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKEWB = SKEWB;
var constants_1 = require("./constants");
var utils_1 = require("./utils");
function SKEWB() {
    var skewb = {
        palette: constants_1.STANDARD_PALETTE,
        move: function () { return true; },
    };
    var FACE_COLOR = {
        U: "white",
        R: "red",
        F: "green",
        D: "yellow",
        L: "orange",
        B: "blue",
    };
    var faces = {
        U: ["U", "U", "U", "U", "U"], // C1, C2, C3, C4 (clockwise), CENTER
        R: ["R", "R", "R", "R", "R"],
        F: ["F", "F", "F", "F", "F"],
        D: ["D", "D", "D", "D", "D"],
        L: ["L", "L", "L", "L", "L"],
        B: ["B", "B", "B", "B", "B"],
    };
    function update(NU, NR, NF, ND, NL, NB) {
        faces.U = NU;
        faces.R = NR;
        faces.F = NF;
        faces.D = ND;
        faces.L = NL;
        faces.B = NB;
    }
    function pick(arr, indexes) {
        return indexes.map(function (n) { return arr[n]; });
    }
    var cycles = {
        R: function (dir) {
            var times = ((dir % 3) + 3) % 3;
            for (var i = 0; i < times; i += 1) {
                var NU = __spreadArray([faces.U[0], faces.F[2]], pick(faces.U, [2, 3, 4]), true);
                var NR = __spreadArray([faces.R[0]], faces.D.slice(1), true);
                var NF = faces.F.map(function (v, p) { return (p === 2 ? faces.L[3] : v); });
                var ND = __spreadArray([faces.D[0]], pick(faces.B, [2, 3, 0, 4]), true);
                var NL = faces.L.map(function (v, p) { return (p === 3 ? faces.U[1] : v); });
                var NB = pick(faces.R, [3, 0, 1, 2, 4]).map(function (v, p) {
                    return p === 1 ? faces.B[1] : v;
                });
                update(NU, NR, NF, ND, NL, NB);
            }
        },
        L: function (dir) {
            var times = ((dir % 3) + 3) % 3;
            for (var i = 0; i < times; i += 1) {
                var NU = faces.U.map(function (v, p) { return (p === 3 ? faces.B[2] : v); });
                var NR = faces.R.map(function (v, p) { return (p === 3 ? faces.U[3] : v); });
                var NF = pick(faces.L, [3, 1, 1, 2, 4]).map(function (v, p) {
                    return p === 1 ? faces.F[1] : v;
                });
                var ND = pick(faces.F, [3, 0, 1, 2, 4]).map(function (v, p) {
                    return p === 2 ? faces.D[2] : v;
                });
                var NL = pick(faces.D, [0, 3, 0, 1, 4]).map(function (v, p) {
                    return p === 0 ? faces.L[0] : v;
                });
                var NB = faces.B.map(function (v, p) { return (p === 2 ? faces.R[3] : v); });
                update(NU, NR, NF, ND, NL, NB);
            }
        },
        U: function (dir) {
            var times = ((dir % 3) + 3) % 3;
            for (var i = 0; i < times; i += 1) {
                var NU = pick(faces.B, [1, 2, 0, 0, 4]).map(function (v, p) {
                    return p === 2 ? faces.U[2] : v;
                });
                var NR = faces.R.map(function (v, p) { return (p === 1 ? faces.D[3] : v); });
                var NF = faces.F.map(function (v, p) { return (p === 0 ? faces.R[1] : v); });
                var ND = faces.D.map(function (v, p) { return (p === 3 ? faces.F[0] : v); });
                var NL = faces.U.map(function (v, p) { return (p === 2 ? faces.L[2] : v); });
                var NB = pick(faces.L, [3, 0, 1, 0, 4]).map(function (v, p) {
                    return p === 3 ? faces.B[3] : v;
                });
                update(NU, NR, NF, ND, NL, NB);
            }
        },
        B: function (dir) {
            var times = ((dir % 3) + 3) % 3;
            for (var i = 0; i < times; i += 1) {
                var NU = faces.U.map(function (v, p) { return (p === 0 ? faces.R[2] : v); });
                var NR = faces.R.map(function (v, p) { return (p === 2 ? faces.F[3] : v); });
                var NF = faces.F.map(function (v, p) { return (p === 3 ? faces.U[0] : v); });
                var ND = faces.L.map(function (v, p) { return (p === 1 ? faces.D[1] : v); });
                var NL = pick(faces.B, [3, 0, 1, 2, 4]).map(function (v, p) {
                    return p === 1 ? faces.L[1] : v;
                });
                var NB = pick(faces.D, [0, 2, 3, 0, 4]).map(function (v, p) {
                    return p === 0 ? faces.B[0] : v;
                });
                update(NU, NR, NF, ND, NL, NB);
            }
        },
    };
    var moveMap = "FURLBfrlbxyz";
    skewb.move = function (moves) {
        moves.forEach(function (mv) {
            cycles[moveMap[mv[0]]](mv[1]);
        });
    };
    skewb.getImage = function () {
        var BOX = 100;
        var W = BOX * 4;
        var H = BOX * 3;
        var BOX_FACTOR = 0.9;
        var BOX_OFFSET = (BOX * (1 - BOX_FACTOR)) / 2;
        var drawFace = function (bx, by, fn) {
            var rx = bx * BOX + BOX_OFFSET;
            var ry = by * BOX + BOX_OFFSET;
            var BX = BOX * BOX_FACTOR;
            var BX2 = BX / 2;
            var cols = fn.map(function (c) { return constants_1.STANDARD_PALETTE[FACE_COLOR[c]]; });
            return "<path stroke=\"black\" stroke-width=\"2\" fill=\"".concat(cols[0], "\" d=\"").concat((0, utils_1.getRoundedPath)([
                [rx, ry],
                [rx, ry + BX2],
                [rx + BX2, ry],
            ]), "\" /><path stroke=\"black\" stroke-width=\"2\" fill=\"").concat(cols[1], "\" d=\"").concat((0, utils_1.getRoundedPath)([
                [rx + BX2, ry],
                [rx + BX, ry + BX2],
                [rx + BX, ry],
            ]), "\" /><path stroke=\"black\" stroke-width=\"2\" fill=\"").concat(cols[2], "\" d=\"").concat((0, utils_1.getRoundedPath)([
                [rx + BX, ry + BX2],
                [rx + BX2, ry + BX],
                [rx + BX, ry + BX],
            ]), "\" /><path stroke=\"black\" stroke-width=\"2\" fill=\"").concat(cols[3], "\" d=\"").concat((0, utils_1.getRoundedPath)([
                [rx + BX2, ry + BX],
                [rx, ry + BX2],
                [rx, ry + BX],
            ]), "\" /><path stroke=\"black\" stroke-width=\"2\" fill=\"").concat(cols[4], "\" d=\"").concat((0, utils_1.getRoundedPath)([
                [rx + BX2, ry],
                [rx + BX, ry + BX2],
                [rx + BX2, ry + BX],
                [rx, ry + BX2],
            ]), "\" />");
        };
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><svg xmlns=\"http://www.w3.org/2000/svg\" x=\"0\" y=\"0\" viewBox=\"0 0 ".concat(W, " ").concat(H, "\" preserveAspectRatio=\"xMidYMin\">").concat(drawFace(1, 0, faces.U)).concat(drawFace(0, 1, faces.L)).concat(drawFace(1, 1, faces.F)).concat(drawFace(2, 1, faces.R)).concat(drawFace(3, 1, faces.B)).concat(drawFace(1, 2, faces.D), "</svg>");
    };
    return skewb;
}
