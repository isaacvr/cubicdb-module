"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOCK = CLOCK;
var utils_1 = require("./utils");
var vector3d_1 = require("./vector3d");
var lineWidth = 0.4;
function circle(parts, x, y, rad, col, omitStroke) {
    if (omitStroke === void 0) { omitStroke = false; }
    parts.push("<circle cx=\"".concat((0, utils_1.svgnum)(x), "\" cy=\"").concat((0, utils_1.svgnum)(y), "\" r=\"").concat((0, utils_1.svgnum)(rad * 0.95), "\" fill=\"").concat(col, "\" stroke-width=\"").concat(lineWidth, "\" ").concat(!omitStroke ? "stroke=\"".concat(col, "\"") : "", " />"));
}
function drawSingleClock(parts, RAD, X, Y, MAT, PINS, BLACK, WHITE, GRAY) {
    var W = RAD * 0.582491582491582;
    var RAD_CLOCK = RAD * 0.2020202020202;
    var BORDER = RAD * 0.0909090909090909;
    var BORDER1 = RAD * 0.02;
    var PI = Math.PI;
    var TAU = PI * 2;
    var arrow = [
        new vector3d_1.Vector3D(0.0, 1.0),
        new vector3d_1.Vector3D(0.1491, 0.4056),
        new vector3d_1.Vector3D(0.0599, 0.2551),
        new vector3d_1.Vector3D(0.0, 0.0),
        new vector3d_1.Vector3D(-0.0599, 0.2551),
        new vector3d_1.Vector3D(-0.1491, 0.4056),
    ].map(function (v) { return v.mul(RAD_CLOCK); });
    var circles = [new vector3d_1.Vector3D(0.1672), new vector3d_1.Vector3D(0.1254)].map(function (v) {
        return v.mul(RAD_CLOCK);
    });
    var R_PIN = circles[0].x * 2.3;
    lineWidth = 0.4;
    circle(parts, X, Y, RAD, WHITE);
    for (var i = -1; i < 2; i += 2) {
        for (var j = -1; j < 2; j += 2) {
            circle(parts, X + W * i, Y + W * j, RAD_CLOCK + BORDER + BORDER1, WHITE);
            circle(parts, X + W * i, Y + W * j, RAD_CLOCK + BORDER, BLACK);
        }
    }
    circle(parts, X, Y, RAD - BORDER1, BLACK);
    for (var i = -1; i < 2; i += 1) {
        var _loop_1 = function (j) {
            circle(parts, X + W * i, Y + W * j, RAD_CLOCK, WHITE);
            var ANCHOR = new vector3d_1.Vector3D(X + W * i, Y + W * j);
            var angId = MAT[j + 1][i + 1];
            var ang = (angId * TAU) / 12;
            var pts = arrow.map(function (v) {
                return v.rotate(vector3d_1.CENTER, vector3d_1.FRONT, PI + ang).add(ANCHOR);
            });
            var pathParts = [];
            lineWidth = 0.2;
            for (var p = 0, maxp = pts.length; p < maxp; p += 1) {
                if (p === 0)
                    pathParts.push("M ".concat((0, utils_1.svgnum)(pts[p].x), " ").concat((0, utils_1.svgnum)(pts[p].y)));
                else
                    pathParts.push("L ".concat((0, utils_1.svgnum)(pts[p].x), " ").concat((0, utils_1.svgnum)(pts[p].y)));
            }
            pathParts.push("Z");
            parts.push("<path d=\"".concat(pathParts.join(" "), "\" stroke=\"").concat(BLACK, "\" stroke-width=\"").concat(0.2, "\" fill=\"").concat(BLACK, "\" />"));
            lineWidth = 0.4;
            circle(parts, ANCHOR.x, ANCHOR.y, circles[0].x, BLACK);
            circle(parts, ANCHOR.x, ANCHOR.y, circles[1].x, WHITE);
            for (var a = 0; a < 12; a += 1) {
                var pt = ANCHOR.add(vector3d_1.DOWN.mul(RAD_CLOCK + BORDER / 2).rotate(vector3d_1.CENTER, vector3d_1.FRONT, (a * TAU) / 12));
                var r = (circles[0].x / 4) * (a ? 1 : 1.6);
                var c = a ? WHITE : "#ff0000";
                circle(parts, pt.x, pt.y, r, c);
            }
            if (i <= 0 && j <= 0) {
                var val = PINS[(j + 1) * 2 + i + 1];
                circle(parts, ANCHOR.x + W / 2, ANCHOR.y + W / 2, R_PIN, GRAY);
                circle(parts, ANCHOR.x + W / 2, ANCHOR.y + W / 2, R_PIN * 0.7, val ? "#181818" : GRAY);
            }
        };
        for (var j = -1; j < 2; j += 1) {
            _loop_1(j);
        }
    }
}
function clockImage(cube, DIM) {
    var W = (0, utils_1.svgnum)(DIM * 2.2);
    var PINS1 = cube.raw[0];
    var PINS2 = cube.raw[0].map(function (e, p) { return !PINS1[((p >> 1) << 1) + 1 - (p & 1)]; });
    var MAT = cube.raw[1];
    var RAD = DIM / 2;
    var BLACK = cube.palette.black;
    var WHITE = cube.palette.white;
    var GRAY = cube.palette.gray;
    var parts = [];
    drawSingleClock(parts, RAD, RAD, RAD, MAT[0], PINS2, BLACK, WHITE, GRAY);
    drawSingleClock(parts, RAD, W - RAD, RAD, MAT[1], PINS1, WHITE, BLACK, GRAY);
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><svg xmlns=\"http://www.w3.org/2000/svg\" x=\"0\" y=\"0\" viewBox=\"0 0 ".concat(W, " ").concat(DIM, "\">").concat(parts.join(""), "</svg>");
}
function CLOCK() {
    var clock = {
        move: function () { return true; },
        palette: {
            black: "#181818",
            white: "#aaa",
            gray: "#7f7f7f",
        },
    };
    var pins = [false, false, false, false];
    var clocks = [
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
    ];
    var add = function (i, j, k, val) {
        clocks[i][j][k] = (((clocks[i][j][k] + val) % 12) + 12) % 12;
    };
    var mat = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    clock.move = function (moves) {
        var first = true;
        var upFace = 0;
        for (var i = 0, maxi = moves.length; i < maxi; i += 1) {
            var mv = moves[i];
            var pinCode = mv[0];
            var up = mv[1];
            var down = mv[2];
            if (mv[0] === -1) {
                upFace ^= 1;
                continue;
            }
            for (var x = 0; x < 3; x += 1) {
                for (var y = 0; y < 3; y += 1) {
                    mat[x][y] = 0;
                }
            }
            for (var j = 0, mask = 8; j < 4; j += 1, mask >>= 1) {
                if (isNaN(up) || isNaN(down)) {
                    if (first) {
                        pins.length = 0;
                        pins.push(false, false, false, false);
                        first = false;
                    }
                    pins[j] = pinCode & mask ? true : pins[j];
                }
                else {
                    pins[j] = !!(pinCode & mask);
                }
                if (pins[j]) {
                    var x = j >> 1;
                    var y = j & 1;
                    mat[x][y] = mat[x + 1][y] = mat[x][y + 1] = mat[x + 1][y + 1] = 1;
                }
            }
            if (!isNaN(up) && !isNaN(down)) {
                for (var x = 0; x < 3; x += 1) {
                    for (var y = 0; y < 3; y += 1) {
                        if (mat[x][y]) {
                            add(upFace, x, y, up);
                            if ((x & 1) == 0 && (y & 1) == 0) {
                                add(1 - upFace, x, 2 - y, -up);
                            }
                        }
                    }
                }
            }
        }
    };
    clock.getImage = function () { return clockImage(clock, 100); };
    clock.raw = [pins, clocks];
    return clock;
}
