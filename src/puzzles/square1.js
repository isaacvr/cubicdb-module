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
exports.SQUARE1 = SQUARE1;
var constants_1 = require("./constants");
var utils_1 = require("./utils");
var vector2d_1 = require("./vector2d");
function SQUARE1() {
    var sq1 = {
        palette: constants_1.STANDARD_PALETTE,
        move: function () { return true; },
    };
    var faces = {
        U: [
            { l: 2, c: ["U", "L", "F"] }, // Start with the front-left piece of the / clockwise
            { l: 1, c: ["U", "L"] },
            { l: 2, c: ["U", "B", "L"] },
            { l: 1, c: ["U", "B"] },
            { l: 2, c: ["U", "R", "B"] },
            { l: 1, c: ["U", "R"] },
            { l: 2, c: ["U", "F", "R"] },
            { l: 1, c: ["U", "F"] },
        ],
        E: [{ l: 1, c: ["F"] }],
        D: [
            { l: 2, c: ["D", "F", "L"] },
            { l: 1, c: ["D", "L"] },
            { l: 2, c: ["D", "L", "B"] },
            { l: 1, c: ["D", "B"] },
            { l: 2, c: ["D", "B", "R"] },
            { l: 1, c: ["D", "R"] },
            { l: 2, c: ["D", "R", "F"] },
            { l: 1, c: ["D", "F"] },
        ],
    };
    var cycles = {
        slash: function () {
            var pos1 = 0;
            var pos2 = 0;
            var UF = faces.U;
            var DF = faces.D;
            for (var i = 0, acc = 0, maxi = UF.length; i < maxi; i += 1) {
                acc += UF[i].l;
                if (acc === 6) {
                    pos1 = i;
                    break;
                }
            }
            for (var i = 0, acc = 0, maxi = DF.length; i < maxi; i += 1) {
                acc += DF[i].l;
                if (acc === 6) {
                    pos2 = i;
                    break;
                }
            }
            faces.E[0].l = faces.E[0].l === 1 ? 2 : 1;
            var topSlice = UF.slice(pos1 + 1).reverse();
            var bottomSlice = DF.slice(pos2 + 1).reverse();
            faces.U = __spreadArray(__spreadArray([], UF.slice(0, pos1 + 1), true), bottomSlice, true);
            faces.D = __spreadArray(__spreadArray([], DF.slice(0, pos2 + 1), true), topSlice, true);
        },
        U: function (count) {
            var rcount = 12 - (((count % 12) + 12) % 12);
            var fc = faces.U;
            for (var i = 0, s = 0, maxi = fc.length; i < maxi; i += 1) {
                s += fc[i].l;
                if (s === rcount) {
                    faces.U = __spreadArray(__spreadArray([], faces.U.slice(i + 1), true), faces.U.slice(0, i + 1), true);
                    break;
                }
            }
        },
        D: function (count) {
            var rcount = ((count % 12) + 12) % 12;
            var fc = faces.D;
            for (var i = 0, s = 0, maxi = fc.length; i < maxi; i += 1) {
                s += fc[i].l;
                if (s === rcount) {
                    faces.D = __spreadArray(__spreadArray([], faces.D.slice(i + 1), true), faces.D.slice(0, i + 1), true);
                    break;
                }
            }
        },
    };
    sq1.move = function (moves) {
        moves.forEach(function (mv) {
            if (mv[0] === 0)
                cycles.slash();
            else if (mv[0] === 1)
                cycles.U(mv[1]);
            else if (mv[0] === 2)
                cycles.D(mv[1]);
        });
    };
    var colors = {
        U: "white",
        R: "blue",
        F: "red",
        D: "yellow",
        L: "green",
        B: "orange",
    };
    function getColor(fc) {
        return constants_1.STANDARD_PALETTE[colors[fc]];
    }
    sq1.getImage = function () {
        var W = 200;
        var W_2 = W / 2;
        var FACTOR = 0.5;
        var LFactor = 1.3;
        var L = W_2 * FACTOR;
        var R = L * Math.tan(Math.PI / 12);
        var EPath = function (my) { return [
            [W_2, W_2],
            [W_2 - R, W_2 + my * L],
            [W_2 + R, W_2 + my * L],
        ]; };
        var CPath = function (my) { return [
            [W_2, W_2],
            [W_2 - L, W_2 + my * R],
            [W_2 - L, W_2 + my * L],
            [W_2 - R, W_2 + my * L],
        ]; };
        var convertPath = function (path, REF, OFF, OX, OY, my) {
            return path.map(function (c) {
                return new vector2d_1.Vector2D(c[0], c[1])
                    .sub(REF)
                    .rot(my * OFF)
                    .add(new vector2d_1.Vector2D(REF.x + OX, REF.y + OY))
                    .toArr();
            });
        };
        var getFace = function (fc, OX, OY, my) {
            if (my === void 0) { my = 1; }
            var REF = new vector2d_1.Vector2D(W_2, W_2);
            var ANG = Math.PI / 6;
            var res = [];
            var acc = 0;
            var _loop_1 = function (i, maxi) {
                var pc = fc[i];
                var OFF = acc * ANG + (pc.l === 1 ? ANG : 0);
                var paths = [
                    convertPath(pc.l === 1 ? EPath(my) : CPath(my), REF, OFF, OX, OY, my),
                ];
                if (pc.l === 1) {
                    var EP1 = EPath(my)
                        .slice(1)
                        .reverse()
                        .map(function (c) {
                        return new vector2d_1.Vector2D(c[0], c[1]).sub(REF).mul(LFactor).add(REF).toArr();
                    });
                    paths.push(convertPath(__spreadArray(__spreadArray([], EPath(my).slice(1), true), EP1, true), REF, OFF, OX, OY, my));
                }
                else {
                    var pos = [
                        [1, 3],
                        [2, 4],
                    ];
                    if (my < 0)
                        pos.reverse();
                    pos.forEach(function (p) {
                        var EP1 = CPath(my)
                            .slice(p[0], p[1])
                            .reverse()
                            .map(function (c) {
                            return new vector2d_1.Vector2D(c[0], c[1]).sub(REF).mul(LFactor).add(REF).toArr();
                        });
                        paths.push(convertPath(__spreadArray(__spreadArray([], CPath(my).slice(p[0], p[1]), true), EP1, true), REF, OFF, OX, OY, my));
                    });
                }
                acc += pc.l;
                res.push(paths
                    .map(function (path, p) {
                    return "<path d=\"".concat((0, utils_1.getRoundedPath)(path, 0.15), "\" fill=\"").concat(getColor(fc[i].c[p]), "\" stroke=\"black\" stroke-width=\"2\" />");
                })
                    .join(""));
            };
            for (var i = 0, maxi = fc.length; i < maxi; i += 1) {
                _loop_1(i, maxi);
            }
            return res.join("");
        };
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><svg xmlns=\"http://www.w3.org/2000/svg\" x=\"0\" y=\"0\" viewBox=\"0 0 200 400\" class=\"NzJiZmJlZDYtZjgx\">".concat(getFace(faces.U, 0, 0)).concat(getFace(faces.D, 0, W, -1), "<rect x=\"").concat((0, utils_1.svgnum)(W * 0.175), "\" y=\"").concat((0, utils_1.svgnum)(W * 0.95), "\" width=\"").concat((0, utils_1.svgnum)(W * 0.239), "\" height=\"").concat((0, utils_1.svgnum)(W * 0.09), "\" rx=\"").concat((0, utils_1.svgnum)(W * 0.02), "\" ry=\"").concat((0, utils_1.svgnum)(W * 0.02), "\" stroke=\"black\" stroke-width=\"2\" fill=").concat(getColor("F"), " /> <rect x=\"").concat((0, utils_1.svgnum)(W * 0.414), "\" y=\"").concat((0, utils_1.svgnum)(W * 0.95), "\" width=\"").concat((0, utils_1.svgnum)(W * (faces.E[0].l & 1 ? 0.412 : 0.239)), "\" height=\"").concat((0, utils_1.svgnum)(W * 0.09), "\" rx=\"").concat((0, utils_1.svgnum)(W * 0.02), "\" ry=\"").concat((0, utils_1.svgnum)(W * 0.02), "\" stroke=\"black\" stroke-width=\"2\" fill=").concat(faces.E[0].l & 1 ? getColor("F") : getColor("B"), " /> </svg>");
    };
    return sq1;
}
