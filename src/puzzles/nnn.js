"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUBIK = RUBIK;
var constants_1 = require("./constants");
var utils_1 = require("./utils");
function RUBIK(n) {
    var rubik = {
        palette: constants_1.STANDARD_PALETTE,
        move: function () { return false; },
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
        U: [],
        R: [],
        F: [],
        D: [],
        L: [],
        B: [],
    };
    Object.entries(faces).forEach(function (_a) {
        var e = _a[0];
        var fn = e;
        faces[e] = Array.from({ length: n })
            .fill("")
            .map(function () { return Array.from({ length: n }).fill(fn); });
    });
    var cycles = {
        U: [
            function (f, k) { return ({
                get: function () { return f.F[k]; },
                set: function (vals) {
                    f.F[k] = vals;
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.L[k]; },
                set: function (vals) {
                    f.L[k] = vals;
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.B[k]; },
                set: function (vals) {
                    f.B[k] = vals;
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.R[k]; },
                set: function (vals) {
                    f.R[k] = vals;
                },
            }); },
        ],
        D: [
            function (f, k) { return ({
                get: function () { return f.F[f.F.length - 1 - k]; },
                set: function (vals) {
                    f.F[f.F.length - 1 - k] = vals;
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.R[f.R.length - 1 - k]; },
                set: function (vals) {
                    f.R[f.R.length - 1 - k] = vals;
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.B[f.B.length - 1 - k]; },
                set: function (vals) {
                    f.B[f.B.length - 1 - k] = vals;
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.L[f.L.length - 1 - k]; },
                set: function (vals) {
                    f.L[f.L.length - 1 - k] = vals;
                },
            }); },
        ],
        R: [
            function (f, k) { return ({
                get: function () { return f.F.map(function (row) { return row[f.F.length - 1 - k]; }); },
                set: function (vals) {
                    return f.F.forEach(function (row, i) { return (row[f.F.length - 1 - k] = vals[i]); });
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.U.map(function (row) { return row[f.U.length - 1 - k]; }); },
                set: function (vals) {
                    return f.U.forEach(function (row, i) { return (row[f.U.length - 1 - k] = vals[i]); });
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.B.map(function (row) { return row[k]; }).reverse(); },
                set: function (vals) {
                    return f.B.forEach(function (row, i) { return (row[k] = vals[f.B.length - 1 - i]); });
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.D.map(function (row) { return row[f.D.length - 1 - k]; }); },
                set: function (vals) {
                    return f.D.forEach(function (row, i) { return (row[f.D.length - 1 - k] = vals[i]); });
                },
            }); },
        ],
        L: [
            function (f, k) { return ({
                get: function () { return f.F.map(function (row) { return row[k]; }); },
                set: function (vals) { return f.F.forEach(function (row, i) { return (row[k] = vals[i]); }); },
            }); },
            function (f, k) { return ({
                get: function () { return f.D.map(function (row) { return row[k]; }); },
                set: function (vals) { return f.D.forEach(function (row, i) { return (row[k] = vals[i]); }); },
            }); },
            function (f, k) { return ({
                get: function () { return f.B.map(function (row) { return row[f.B.length - 1 - k]; }).reverse(); },
                set: function (vals) {
                    return f.B.forEach(function (row, i) { return (row[f.B.length - 1 - k] = vals[f.B.length - 1 - i]); });
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.U.map(function (row) { return row[k]; }); },
                set: function (vals) { return f.U.forEach(function (row, i) { return (row[k] = vals[i]); }); },
            }); },
        ],
        F: [
            function (f, k) { return ({
                get: function () { return f.U[f.U.length - 1 - k]; },
                set: function (vals) {
                    f.U[f.U.length - 1 - k] = vals;
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.R.map(function (row) { return row[k]; }); },
                set: function (vals) { return f.R.forEach(function (row, i) { return (row[k] = vals[i]); }); },
            }); },
            function (f, k) { return ({
                get: function () { return f.D[k].slice().reverse(); },
                set: function (vals) {
                    f.D[k] = vals.slice().reverse();
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.L.map(function (row) { return row[f.L.length - 1 - k]; }).reverse(); },
                set: function (vals) {
                    return f.L.forEach(function (row, i) { return (row[f.L.length - 1 - k] = vals[f.L.length - 1 - i]); });
                },
            }); },
        ],
        B: [
            function (f, k) { return ({
                get: function () { return f.U[k].slice().reverse(); },
                set: function (vals) {
                    f.U[k] = vals.slice().reverse();
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.L.map(function (row) { return row[k]; }); },
                set: function (vals) { return f.L.forEach(function (row, i) { return (row[k] = vals[i]); }); },
            }); },
            function (f, k) { return ({
                get: function () { return f.D[f.D.length - 1 - k]; },
                set: function (vals) {
                    f.D[f.D.length - 1 - k] = vals;
                },
            }); },
            function (f, k) { return ({
                get: function () { return f.R.map(function (row) { return row[f.R.length - 1 - k]; }).reverse(); },
                set: function (vals) {
                    return f.R.forEach(function (row, i) { return (row[f.R.length - 1 - k] = vals[f.R.length - 1 - i]); });
                },
            }); },
        ],
    };
    function rotateFace(face, count) {
        var n = face.length;
        var times = ((count % 4) + 4) % 4;
        var result = Array.from({ length: n }, function () { return Array(n).fill(""); });
        var mapIndex = [
            function (i, j) { return [i, j]; },
            function (i, j) { return [j, n - 1 - i]; },
            function (i, j) { return [n - 1 - i, n - 1 - j]; },
            function (i, j) { return [n - 1 - j, i]; },
        ];
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                var _a = mapIndex[times](i, j), ni = _a[0], nj = _a[1];
                result[ni][nj] = face[i][j];
            }
        }
        return result;
    }
    function doMove(f, move) {
        var layers = move[0], base = move[1], dir = move[2], span = move[3];
        var sp = span || layers;
        if (sp === layers) {
            f[base] = rotateFace(f[base], dir);
        }
        if (sp === n) {
            var e = Object.entries(faces);
            var opBase = e[(e.reduce(function (acc, e, p) { return (e[0] === base ? p : acc); }, -1) + 3) % 6][0];
            f[opBase] = rotateFace(f[opBase], -dir);
        }
        var cycle = cycles[base];
        if (!cycle)
            return;
        var _loop_1 = function (k) {
            var strips = cycle.map(function (fn) { return fn(f, k).get(); });
            var shift = ((dir % cycle.length) + cycle.length) % cycle.length;
            var rotated = strips.map(function (_, i) { return strips[(i - shift + cycle.length) % cycle.length]; });
            rotated.forEach(function (strip, i) {
                cycle[i](f, k).set(strip);
            });
        };
        for (var k = layers - sp; k < layers; k += 1) {
            _loop_1(k);
        }
    }
    rubik.move = function (moves) {
        moves.forEach(function (mv) { return doMove(faces, mv); });
    };
    rubik.getImage = function () {
        var BOX = 100;
        var W = BOX * 4;
        var H = BOX * 3;
        var CW = BOX / n;
        var PIECE_FACTOR = 0.9;
        var BOX_FACTOR = 0.9;
        var OFFSET = (CW * (1 - PIECE_FACTOR)) / 2;
        var BOX_OFFSET = (BOX * (1 - BOX_FACTOR)) / 2;
        var RX = 3 / n + 0.4;
        var getRect = function (x, y, bx, by, fc) {
            return "<rect x=\"".concat((0, utils_1.svgnum)(bx * BOX + BOX_OFFSET + x * CW * BOX_FACTOR + OFFSET), "\" y=\"").concat((0, utils_1.svgnum)(by * BOX + BOX_OFFSET + y * CW * BOX_FACTOR + OFFSET), "\" width=\"").concat((0, utils_1.svgnum)(CW * PIECE_FACTOR * BOX_FACTOR), "\" height=\"").concat((0, utils_1.svgnum)(CW * PIECE_FACTOR * BOX_FACTOR), "\" fill=\"").concat(constants_1.STANDARD_PALETTE[FACE_COLOR[fc]], "\" rx=\"").concat((0, utils_1.svgnum)(RX), "\" />");
        };
        var allPieces = [
            ["U", 1, 0],
            ["L", 0, 1],
            ["F", 1, 1],
            ["R", 2, 1],
            ["B", 3, 1],
            ["D", 1, 2],
        ]
            .map(function (e) {
            return faces[e[0]]
                .map(function (v, y) {
                return v
                    .map(function (fc, x) { return getRect(x, y, e[1], e[2], fc); })
                    .join("");
            })
                .join("");
        })
            .join("");
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><svg xmlns=\"http://www.w3.org/2000/svg\" x=\"0\" y=\"0\" viewBox=\"0 0 ".concat(W, " ").concat(H, "\" preserveAspectRatio=\"xMidYMin\">").concat(allPieces, "</svg>");
    };
    return rubik;
}
