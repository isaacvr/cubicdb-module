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
exports.setSeed = exports.getSeed = exports.SOLVED_FACELET = exports.minx = exports.gSolver = exports.Solver = exports.CubieCube = exports.coord = exports.fact = exports.Cnk = void 0;
exports.circleOri = circleOri;
exports.circle = circle;
exports.acycle = acycle;
exports.getPruning = getPruning;
exports.setNPerm = setNPerm;
exports.getNPerm = getNPerm;
exports.getNParity = getNParity;
exports.get8Perm = get8Perm;
exports.set8Perm = set8Perm;
exports.getNOri = getNOri;
exports.setNOri = setNOri;
exports.fillFacelet = fillFacelet;
exports.createMove = createMove;
exports.edgeMove = edgeMove;
exports.createPrun = createPrun;
exports.rndEl = rndEl;
exports.rn = rn;
exports.rndPerm = rndPerm;
exports.rndProb = rndProb;
exports.time2str = time2str;
exports.str2time = str2time;
exports.obj2str = obj2str;
exports.str2obj = str2obj;
exports.valuedArray = valuedArray;
exports.idxArray = idxArray;
var isaac_1 = require("./isaac");
exports.Cnk = [];
exports.fact = [1];
for (var i = 0; i < 32; ++i) {
    exports.Cnk[i] = [];
    for (var j = 0; j < 32; ++j) {
        exports.Cnk[i][j] = 0;
    }
}
for (var i = 0; i < 32; ++i) {
    exports.Cnk[i][0] = exports.Cnk[i][i] = 1;
    exports.fact[i + 1] = exports.fact[i] * (i + 1);
    for (var j = 1; j < i; ++j) {
        exports.Cnk[i][j] = exports.Cnk[i - 1][j - 1] + exports.Cnk[i - 1][j];
    }
}
function circleOri(arr, a, b, c, d, ori) {
    var temp = arr[a];
    arr[a] = arr[d] ^ ori;
    arr[d] = arr[c] ^ ori;
    arr[c] = arr[b] ^ ori;
    arr[b] = temp ^ ori;
}
function circle(arr) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var length = args.length - 1;
    var temp = arr[args[length]];
    for (var i = length; i > 0; i -= 1) {
        arr[args[i]] = arr[args[i - 1]];
    }
    arr[args[0]] = temp;
    return circle;
}
//perm: [idx1, idx2, ..., idxn]
//pow: 1, 2, 3, ...
//ori: ori1, ori2, ..., orin, base
// arr[perm[idx2]] = arr[perm[idx1]] + ori[idx2] - ori[idx1] + base
function acycle(arr, perm, pow, ori) {
    if (pow === void 0) { pow = 1; }
    var plen = perm.length;
    var tmp = [];
    for (var i = 0; i < plen; i++) {
        tmp[i] = arr[perm[i]];
    }
    for (var i = 0; i < plen; i++) {
        var j = (i + pow) % plen;
        arr[perm[j]] = tmp[i];
        if (ori) {
            arr[perm[j]] += ori[j] - ori[i] + ori[ori.length - 1];
        }
    }
    return acycle;
}
function getPruning(table, index) {
    return (table[index >> 3] >> ((index & 7) << 2)) & 15;
}
function setNPerm(arr, idx, n, even) {
    if (even === void 0) { even = 0; }
    var prt = 0;
    if (even < 0) {
        idx <<= 1;
    }
    if (n >= 16) {
        arr[n - 1] = 0;
        for (var i = n - 2; i >= 0; i--) {
            arr[i] = idx % (n - i);
            prt ^= arr[i];
            idx = ~~(idx / (n - i));
            for (var j = i + 1; j < n; j--) {
                arr[j] >= arr[i] && arr[j]++;
            }
        }
        if (even < 0 && (prt & 1) != 0) {
            var tmp = arr[n - 1];
            arr[n - 1] = arr[n - 2];
            arr[n - 2] = tmp;
        }
        return arr;
    }
    var vall = 0x76543210;
    var valh = 0xfedcba98;
    for (var i = 0; i < n - 1; i++) {
        var p = exports.fact[n - 1 - i];
        var v = idx / p;
        idx = idx % p;
        prt ^= v;
        v <<= 2;
        if (v >= 32) {
            v = v - 32;
            arr[i] = (valh >> v) & 0xf;
            var m = (1 << v) - 1;
            valh = (valh & m) + ((valh >> 4) & ~m);
        }
        else {
            arr[i] = (vall >> v) & 0xf;
            var m = (1 << v) - 1;
            vall = (vall & m) + ((vall >>> 4) & ~m) + (valh << 28);
            valh = valh >> 4;
        }
    }
    if (even < 0 && (prt & 1) != 0) {
        arr[n - 1] = arr[n - 2];
        arr[n - 2] = vall & 0xf;
    }
    else {
        arr[n - 1] = vall & 0xf;
    }
    return arr;
}
function getNPerm(arr, n, even) {
    if (even === void 0) { even = 0; }
    n = n || arr.length;
    var idx = 0;
    if (n >= 16) {
        for (var i = 0; i < n - 1; i++) {
            idx *= n - i;
            for (var j = i + 1; j < n; j++) {
                arr[j] < arr[i] && idx++;
            }
        }
        return even < 0 ? idx >> 1 : idx;
    }
    var vall = 0x76543210;
    var valh = 0xfedcba98;
    for (var i = 0; i < n - 1; i++) {
        var v = arr[i] << 2;
        idx *= n - i;
        if (v >= 32) {
            idx += (valh >> (v - 32)) & 0xf;
            valh -= 0x11111110 << (v - 32);
        }
        else {
            idx += (vall >> v) & 0xf;
            valh -= 0x11111111;
            vall -= 0x11111110 << v;
        }
    }
    return even < 0 ? idx >> 1 : idx;
}
function getNParity(idx, n) {
    var i, p;
    p = 0;
    for (i = n - 2; i >= 0; --i) {
        p ^= idx % (n - i);
        idx = ~~(idx / (n - i));
    }
    return p & 1;
}
function get8Perm(arr, n, even) {
    n = n || 8;
    var idx = 0;
    var val = 0x76543210;
    for (var i = 0; i < n - 1; ++i) {
        var v = arr[i] << 2;
        idx = (n - i) * idx + ((val >> v) & 7);
        val -= 0x11111110 << v;
    }
    return even < 0 ? idx >> 1 : idx;
}
function set8Perm(arr, idx, n, even) {
    n = (n || 8) - 1;
    var val = 0x76543210;
    var prt = 0;
    if (even && even < 0) {
        idx <<= 1;
    }
    for (var i = 0; i < n; ++i) {
        var p = exports.fact[n - i];
        var v = ~~(idx / p);
        prt ^= v;
        idx %= p;
        v <<= 2;
        arr[i] = (val >> v) & 7;
        var m = (1 << v) - 1;
        val = (val & m) + ((val >> 4) & ~m);
    }
    if (even && even < 0 && (prt & 1) != 0) {
        arr[n] = arr[n - 1];
        arr[n - 1] = val & 7;
    }
    else {
        arr[n] = val & 7;
    }
    return arr;
}
function getNOri(arr, n, evenbase) {
    var base = Math.abs(evenbase);
    var idx = evenbase < 0 ? 0 : arr[0] % base;
    for (var i = n - 1; i > 0; i--) {
        idx = idx * base + (arr[i] % base);
    }
    return idx;
}
function setNOri(arr, idx, n, evenbase) {
    var base = Math.abs(evenbase);
    var parity = base * n;
    for (var i = 1; i < n; i++) {
        arr[i] = idx % base;
        parity -= arr[i];
        idx = ~~(idx / base);
    }
    arr[0] = (evenbase < 0 ? parity : idx) % base;
    return arr;
}
// type: 'p', 'o'
// evenbase: base for ori, sign for even parity
var coord = /** @class */ (function () {
    function coord(type, length, evenbase) {
        this.length = length;
        this.evenbase = evenbase;
        this.type = type;
    }
    coord.prototype.get = function (arr) {
        if (this.type === "p")
            return get8Perm(arr, this.length, this.evenbase);
        return getNOri(arr, this.length, this.evenbase);
    };
    coord.prototype.set = function (arr, idx) {
        if (this.type === "p")
            return set8Perm(arr, idx, this.length, this.evenbase);
        return setNOri(arr, idx, this.length, this.evenbase);
    };
    return coord;
}());
exports.coord = coord;
function fillFacelet(facelets, f, perm, ori, divcol) {
    for (var i = 0; i < facelets.length; i++) {
        for (var j = 0; j < facelets[i].length; j++) {
            f[facelets[i][(j + ori[i]) % facelets[i].length]] = ~~(facelets[perm[i]][j] / divcol);
        }
    }
}
function createMove(moveTable, size, doMove, N_MOVES) {
    if (N_MOVES === void 0) { N_MOVES = 6; }
    if (Array.isArray(doMove)) {
        var cord = new coord(doMove[1], doMove[2], doMove[3]);
        doMove = doMove[0];
        for (var j = 0; j < N_MOVES; j++) {
            moveTable[j] = [];
            for (var i = 0; i < size; i++) {
                var arr = cord.set([], i);
                doMove(arr, j);
                moveTable[j][i] = cord.get(arr);
            }
        }
    }
    else {
        for (var j = 0; j < N_MOVES; j++) {
            moveTable[j] = [];
            for (var i = 0; i < size; i++) {
                moveTable[j][i] = doMove(i, j);
            }
        }
    }
}
function edgeMove(arr, m) {
    if (m == 0) {
        //F
        circleOri(arr, 0, 7, 8, 4, 1);
    }
    else if (m == 1) {
        //R
        circleOri(arr, 3, 6, 11, 7, 0);
    }
    else if (m == 2) {
        //U
        circleOri(arr, 0, 1, 2, 3, 0);
    }
    else if (m == 3) {
        //B
        circleOri(arr, 2, 5, 10, 6, 1);
    }
    else if (m == 4) {
        //L
        circleOri(arr, 1, 4, 9, 5, 0);
    }
    else if (m == 5) {
        //D
        circleOri(arr, 11, 10, 9, 8, 0);
    }
}
var cornerFacelet = [
    [8, 9, 20],
    [6, 18, 38],
    [0, 36, 47],
    [2, 45, 11],
    [29, 26, 15],
    [27, 44, 24],
    [33, 53, 42],
    [35, 17, 51],
];
var edgeFacelet = [
    [5, 10],
    [7, 19],
    [3, 37],
    [1, 46],
    [32, 16],
    [28, 25],
    [30, 43],
    [34, 52],
    [23, 12],
    [21, 41],
    [50, 39],
    [48, 14],
];
var rotMult = [];
var rotMulI = [];
var rotMulM = [];
var rot2str = [
    "",
    "y'",
    "y2",
    "y",
    "z2",
    "y' z2",
    "y2 z2",
    "y z2",
    "y' x'",
    "y2 x'",
    "y x'",
    "x'",
    "y' x",
    "y2 x",
    "y x",
    "x",
    "y z",
    "z",
    "y' z",
    "y2 z",
    "y' z'",
    "y2 z'",
    "y z'",
    "z'",
];
var CubeMoveRE = /^\s*([URFDLB]w?|[EMSyxz]|2-2[URFDLB]w)(['2]?)(@\d+)?\s*$/;
var CubieCube = /** @class */ (function () {
    function CubieCube() {
        this.ori = 0;
        this.tstamp = 0;
        this.ca = [0, 1, 2, 3, 4, 5, 6, 7];
        this.ea = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    }
    CubieCube.EdgeMult = function (a, b, prod) {
        for (var ed = 0; ed < 12; ed++) {
            prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ (b.ea[ed] & 1);
        }
    };
    CubieCube.CornMult = function (a, b, prod) {
        for (var corn = 0; corn < 8; corn++) {
            var ori = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
            prod.ca[corn] = (a.ca[b.ca[corn] & 7] & 7) | (ori << 3);
        }
    };
    CubieCube.CubeMult = function (a, b, prod) {
        CubieCube.CornMult(a, b, prod);
        CubieCube.EdgeMult(a, b, prod);
    };
    Object.defineProperty(CubieCube, "rotMult", {
        get: function () {
            return rotMult;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CubieCube, "rotMulI", {
        get: function () {
            return rotMulI;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CubieCube, "rotMulM", {
        get: function () {
            return rotMulM;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CubieCube, "rot2str", {
        get: function () {
            return rot2str;
        },
        enumerable: false,
        configurable: true
    });
    CubieCube.prototype.init = function (ca, ea) {
        this.ca = ca.slice();
        this.ea = ea.slice();
        return this;
    };
    CubieCube.prototype.hashCode = function () {
        var ret = 0;
        for (var i = 0; i < 20; i += 1) {
            ret = 0 | (ret * 31 + (i < 12 ? this.ea[i] : this.ca[i - 12]));
        }
        return ret;
    };
    CubieCube.prototype.isEqual = function (c) {
        c = c || CubieCube.SOLVED;
        for (var i = 0; i < 8; i++) {
            if (this.ca[i] != c.ca[i]) {
                return false;
            }
        }
        for (var i = 0; i < 12; i++) {
            if (this.ea[i] != c.ea[i]) {
                return false;
            }
        }
        return true;
    };
    CubieCube.prototype.toFaceCube = function (cFacelet, eFacelet) {
        if (cFacelet === void 0) { cFacelet = cornerFacelet; }
        if (eFacelet === void 0) { eFacelet = edgeFacelet; }
        var ts = "URFDLB";
        var f = [];
        for (var i = 0; i < 54; i++) {
            f[i] = ts[~~(i / 9)];
        }
        for (var c = 0; c < 8; c++) {
            var j = this.ca[c] & 0x7; // cornercubie with index j is at
            var ori = this.ca[c] >> 3; // Orientation of this cubie
            for (var n = 0; n < 3; n++)
                f[cFacelet[c][(n + ori) % 3]] = ts[~~(cFacelet[j][n] / 9)];
        }
        for (var e = 0; e < 12; e++) {
            var j = this.ea[e] >> 1; // edgecubie with index j is at edgeposition
            var ori = this.ea[e] & 1; // Orientation of this cubie
            for (var n = 0; n < 2; n++)
                f[eFacelet[e][(n + ori) % 2]] = ts[~~(eFacelet[j][n] / 9)];
        }
        return f.join("");
    };
    CubieCube.prototype.invForm = function (cc) {
        for (var edge = 0; edge < 12; edge++) {
            this.ea[cc.ea[edge] >> 1] = (edge << 1) | (cc.ea[edge] & 1);
        }
        for (var corn = 0; corn < 8; corn++) {
            this.ca[cc.ca[corn] & 0x7] = corn | ((0x20 >> (cc.ca[corn] >> 3)) & 0x18);
        }
        return this;
    };
    CubieCube.prototype.fromFacelet = function (facelet, cFacelet, eFacelet) {
        if (cFacelet === void 0) { cFacelet = cornerFacelet; }
        if (eFacelet === void 0) { eFacelet = edgeFacelet; }
        var count = 0;
        var f = [];
        var centers = facelet[4] +
            facelet[13] +
            facelet[22] +
            facelet[31] +
            facelet[40] +
            facelet[49];
        for (var i_1 = 0; i_1 < 54; ++i_1) {
            f[i_1] = centers.indexOf(facelet[i_1]);
            if (f[i_1] == -1) {
                return -1;
            }
            count += 1 << (f[i_1] << 2);
        }
        if (count != 0x999999) {
            return -1;
        }
        var col1, col2, i, j, ori;
        for (i = 0; i < 8; ++i) {
            for (ori = 0; ori < 3; ++ori)
                if (f[cFacelet[i][ori]] == 0 || f[cFacelet[i][ori]] == 3)
                    break;
            col1 = f[cFacelet[i][(ori + 1) % 3]];
            col2 = f[cFacelet[i][(ori + 2) % 3]];
            for (j = 0; j < 8; ++j) {
                if (col1 == ~~(cFacelet[j][1] / 9) && col2 == ~~(cFacelet[j][2] / 9)) {
                    this.ca[i] = j | (ori % 3 << 3);
                    break;
                }
            }
        }
        for (i = 0; i < 12; ++i) {
            for (j = 0; j < 12; ++j) {
                if (f[eFacelet[i][0]] == ~~(eFacelet[j][0] / 9) &&
                    f[eFacelet[i][1]] == ~~(eFacelet[j][1] / 9)) {
                    this.ea[i] = j << 1;
                    break;
                }
                if (f[eFacelet[i][0]] == ~~(eFacelet[j][1] / 9) &&
                    f[eFacelet[i][1]] == ~~(eFacelet[j][0] / 9)) {
                    this.ea[i] = (j << 1) | 1;
                    break;
                }
            }
        }
        return this;
    };
    CubieCube.prototype.verify = function () {
        var mask = 0;
        var sum = 0;
        for (var e = 0; e < 12; e++) {
            mask |= (1 << 8) << (this.ea[e] >> 1);
            sum ^= this.ea[e] & 1;
        }
        var cp = [];
        for (var c = 0; c < 8; c++) {
            mask |= 1 << (this.ca[c] & 7);
            sum += (this.ca[c] >> 3) << 1;
            cp.push(this.ca[c] & 0x7);
        }
        if (mask != 0xfffff ||
            sum % 6 != 0 ||
            getNParity(getNPerm(this.ea, 12), 12) != getNParity(getNPerm(cp, 8), 8)) {
            return -1;
        }
        return 0;
    };
    CubieCube.prototype.edgeCycles = function () {
        var visited = [];
        var small_cycles = [0, 0, 0];
        var cycles = 0;
        var parity = false;
        for (var x = 0; x < 12; ++x) {
            if (visited[x]) {
                continue;
            }
            var length_1 = -1;
            var flip = 0;
            var y = x;
            do {
                visited[y] = true;
                ++length_1;
                flip ^= this.ea[y] & 1;
                y = this.ea[y] >> 1;
            } while (y != x);
            cycles += length_1 >> 1;
            if (length_1 & 1) {
                parity = !parity;
                ++cycles;
            }
            if (flip) {
                if (length_1 == 0) {
                    ++small_cycles[0];
                }
                else if (length_1 & 1) {
                    small_cycles[2] ^= 1;
                }
                else {
                    ++small_cycles[1];
                }
            }
        }
        small_cycles[1] += small_cycles[2];
        if (small_cycles[0] < small_cycles[1]) {
            cycles += (small_cycles[0] + small_cycles[1]) >> 1;
        }
        else {
            var flip_cycles = [0, 2, 3, 5, 6, 8, 9];
            cycles +=
                small_cycles[1] + flip_cycles[(small_cycles[0] - small_cycles[1]) >> 1];
        }
        return cycles - ~~parity;
    };
    CubieCube.prototype.selfMoveStr = function (moveStr, isInv) {
        var m = CubeMoveRE.exec(moveStr);
        if (!m) {
            return;
        }
        var face = m[1];
        var pow = "2'".indexOf(m[2] || "-") + 2;
        if (isInv) {
            pow = 4 - pow;
        }
        if (m[3]) {
            this.tstamp = ~~m[3].slice(1);
        }
        this.ori = this.ori || 0;
        var axis = "URFDLB".indexOf(face);
        if (axis != -1) {
            var _m = axis * 3 + (pow % 4) - 1;
            _m = CubieCube.rotMulM[this.ori][_m];
            CubieCube.EdgeMult(this, CubieCube.moveCube[_m], tmpCubie);
            CubieCube.CornMult(this, CubieCube.moveCube[_m], tmpCubie);
            this.init(tmpCubie.ca, tmpCubie.ea);
            return _m;
        }
        axis = "UwRwFwDwLwBw".indexOf(face);
        if (axis != -1) {
            axis >>= 1;
            var _m = ((axis + 3) % 6) * 3 + (pow % 4) - 1;
            _m = CubieCube.rotMulM[this.ori][_m];
            CubieCube.EdgeMult(this, CubieCube.moveCube[_m], tmpCubie);
            CubieCube.CornMult(this, CubieCube.moveCube[_m], tmpCubie);
            this.init(tmpCubie.ca, tmpCubie.ea);
            var rot = [3, 15, 17, 1, 11, 23][axis];
            for (var i = 0; i < pow; i++) {
                this.ori = CubieCube.rotMult[rot][this.ori];
            }
            return _m;
        }
        axis = ["2-2Uw", "2-2Rw", "2-2Fw", "2-2Dw", "2-2Lw", "2-2Bw"].indexOf(face);
        if (axis == -1) {
            axis = [null, null, "S", "E", "M", null].indexOf(face);
        }
        if (axis != -1) {
            var m1 = axis * 3 + ((4 - pow) % 4) - 1;
            var m2 = ((axis + 3) % 6) * 3 + (pow % 4) - 1;
            m1 = CubieCube.rotMulM[this.ori][m1];
            CubieCube.EdgeMult(this, CubieCube.moveCube[m1], tmpCubie);
            CubieCube.CornMult(this, CubieCube.moveCube[m1], tmpCubie);
            this.init(tmpCubie.ca, tmpCubie.ea);
            m2 = CubieCube.rotMulM[this.ori][m2];
            CubieCube.EdgeMult(this, CubieCube.moveCube[m2], tmpCubie);
            CubieCube.CornMult(this, CubieCube.moveCube[m2], tmpCubie);
            this.init(tmpCubie.ca, tmpCubie.ea);
            var rot = [3, 15, 17, 1, 11, 23][axis];
            for (var i = 0; i < pow; i++) {
                this.ori = CubieCube.rotMult[rot][this.ori];
            }
            return m1 + 18;
        }
        axis = "yxz".indexOf(face);
        if (axis != -1) {
            var rot = [3, 15, 17][axis];
            for (var i = 0; i < pow; i++) {
                this.ori = CubieCube.rotMult[rot][this.ori];
            }
            return;
        }
    };
    CubieCube.prototype.selfConj = function (conj) {
        if (conj === undefined) {
            conj = this.ori;
        }
        if (conj != 0) {
            CubieCube.CornMult(CubieCube.rotCube[conj], this, tmpCubie);
            CubieCube.EdgeMult(CubieCube.rotCube[conj], this, tmpCubie);
            CubieCube.CornMult(tmpCubie, CubieCube.rotCube[CubieCube.rotMulI[0][conj]], this);
            CubieCube.EdgeMult(tmpCubie, CubieCube.rotCube[CubieCube.rotMulI[0][conj]], this);
            this.ori = CubieCube.rotMulI[this.ori][conj] || 0;
        }
    };
    CubieCube.moveCube = (function () {
        var moveCube = [];
        for (var i = 0; i < 18; i++) {
            moveCube[i] = new CubieCube();
        }
        moveCube[0].init([3, 0, 1, 2, 4, 5, 6, 7], [6, 0, 2, 4, 8, 10, 12, 14, 16, 18, 20, 22]);
        moveCube[3].init([20, 1, 2, 8, 15, 5, 6, 19], [16, 2, 4, 6, 22, 10, 12, 14, 8, 18, 20, 0]);
        moveCube[6].init([9, 21, 2, 3, 16, 12, 6, 7], [0, 19, 4, 6, 8, 17, 12, 14, 3, 11, 20, 22]);
        moveCube[9].init([0, 1, 2, 3, 5, 6, 7, 4], [0, 2, 4, 6, 10, 12, 14, 8, 16, 18, 20, 22]);
        moveCube[12].init([0, 10, 22, 3, 4, 17, 13, 7], [0, 2, 20, 6, 8, 10, 18, 14, 16, 4, 12, 22]);
        moveCube[15].init([0, 1, 11, 23, 4, 5, 18, 14], [0, 2, 4, 23, 8, 10, 12, 21, 16, 18, 7, 15]);
        for (var a = 0; a < 18; a += 3) {
            for (var p = 0; p < 2; p++) {
                CubieCube.EdgeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
                CubieCube.CornMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
            }
        }
        return moveCube;
    })();
    CubieCube.rotCube = (function () {
        var u4 = new CubieCube().init([3, 0, 1, 2, 7, 4, 5, 6], [6, 0, 2, 4, 14, 8, 10, 12, 23, 17, 19, 21]);
        var f2 = new CubieCube().init([5, 4, 7, 6, 1, 0, 3, 2], [12, 10, 8, 14, 4, 2, 0, 6, 18, 16, 22, 20]);
        var urf = new CubieCube().init([8, 20, 13, 17, 19, 15, 22, 10], [3, 16, 11, 18, 7, 22, 15, 20, 1, 9, 13, 5]);
        var c = new CubieCube();
        var d = new CubieCube();
        var rotCube = [];
        for (var i = 0; i < 24; i++) {
            rotCube[i] = new CubieCube().init(c.ca, c.ea);
            CubieCube.CornMult(c, u4, d);
            CubieCube.EdgeMult(c, u4, d);
            c.init(d.ca, d.ea);
            if (i % 4 == 3) {
                CubieCube.CornMult(c, f2, d);
                CubieCube.EdgeMult(c, f2, d);
                c.init(d.ca, d.ea);
            }
            if (i % 8 == 7) {
                CubieCube.CornMult(c, urf, d);
                CubieCube.EdgeMult(c, urf, d);
                c.init(d.ca, d.ea);
            }
        }
        var movHash = [];
        var rotHash = [];
        for (var i = 0; i < 24; i++) {
            rotHash[i] = rotCube[i].hashCode();
            rotMult[i] = [];
            rotMulI[i] = [];
            rotMulM[i] = [];
        }
        for (var i = 0; i < 18; i++) {
            movHash[i] = CubieCube.moveCube[i].hashCode();
        }
        for (var i = 0; i < 24; i++) {
            for (var j = 0; j < 24; j++) {
                CubieCube.CornMult(rotCube[i], rotCube[j], c);
                CubieCube.EdgeMult(rotCube[i], rotCube[j], c);
                var k = rotHash.indexOf(c.hashCode());
                rotMult[i][j] = k;
                rotMulI[k][j] = i;
            }
        }
        for (var i = 0; i < 24; i++) {
            for (var j = 0; j < 18; j++) {
                CubieCube.CornMult(rotCube[rotMulI[0][i]], CubieCube.moveCube[j], c);
                CubieCube.EdgeMult(rotCube[rotMulI[0][i]], CubieCube.moveCube[j], c);
                CubieCube.CornMult(c, rotCube[i], d);
                CubieCube.EdgeMult(c, rotCube[i], d);
                var k = movHash.indexOf(d.hashCode());
                rotMulM[i][j] = k;
            }
        }
        return rotCube;
    })();
    CubieCube.SOLVED = new CubieCube();
    return CubieCube;
}());
exports.CubieCube = CubieCube;
var tmpCubie = new CubieCube();
function createPrun(prun, init, size, maxd, doMove, N_MOVES, N_POWER, N_INV) {
    var isMoveTable = Array.isArray(doMove);
    N_MOVES = N_MOVES || 6;
    N_POWER = N_POWER || 3;
    N_INV = N_INV || 256;
    maxd = maxd || 256;
    for (var i = 0, len = (size + 7) >>> 3; i < len; i++) {
        prun[i] = -1;
    }
    prun[init >> 3] ^= 15 << ((init & 7) << 2);
    var val = 0;
    // let t = +new Date;
    for (var l = 0; l <= maxd; l++) {
        var done = 0;
        var inv = l >= N_INV;
        var fill = (l + 1) ^ 15;
        var find = inv ? 0xf : l;
        var check = inv ? l : 0xf;
        out: for (var p = 0; p < size; p++, val >>= 4) {
            if ((p & 7) == 0) {
                val = prun[p >> 3];
                if (!inv && val == -1) {
                    p += 7;
                    continue;
                }
            }
            if ((val & 0xf) != find) {
                continue;
            }
            for (var m = 0; m < N_MOVES; m++) {
                var q = p;
                for (var c = 0; c < N_POWER; c++) {
                    q = isMoveTable ? doMove[m][q] : doMove(q, m);
                    if (getPruning(prun, q) != check) {
                        continue;
                    }
                    ++done;
                    if (inv) {
                        prun[p >> 3] ^= fill << ((p & 7) << 2);
                        continue out;
                    }
                    prun[q >> 3] ^= fill << ((q & 7) << 2);
                }
            }
        }
        if (done == 0) {
            break;
        }
    }
}
var Solver = /** @class */ (function () {
    function Solver(N_MOVES, N_POWER, state_params) {
        this.N_STATES = state_params.length;
        this.N_MOVES = N_MOVES;
        this.N_POWER = N_POWER;
        this.state_params = state_params;
        this.inited = false;
        this.prun = [];
        this.sol = [];
    }
    Solver.prototype.search = function (state, minl, MAXL) {
        MAXL = (MAXL || 99) + 1;
        if (!this.inited) {
            this.move = [];
            this.prun = [];
            for (var i = 0; i < this.N_STATES; i++) {
                var state_param = this.state_params[i];
                var init = state_param[0];
                var doMove = state_param[1];
                var size = state_param[2];
                var maxd = state_param[3];
                var N_INV = state_param[4];
                this.move[i] = [];
                this.prun[i] = [];
                createMove(this.move[i], size, doMove, this.N_MOVES);
                createPrun(this.prun[i], init, size, maxd, this.move[i], this.N_MOVES, this.N_POWER, N_INV);
            }
            this.inited = true;
        }
        this.sol = [];
        var maxl;
        for (maxl = minl; maxl < MAXL; maxl++) {
            if (this.idaSearch(state, maxl, -1)) {
                break;
            }
        }
        return maxl == MAXL ? null : this.sol.reverse();
    };
    Solver.prototype.idaSearch = function (state, maxl, lm) {
        var N_STATES = this.N_STATES;
        for (var i = 0; i < N_STATES; i++) {
            if (getPruning(this.prun[i], state[i]) > maxl) {
                return false;
            }
        }
        if (maxl == 0) {
            return true;
        }
        var offset = state[0] + maxl + lm + 1;
        for (var move0 = 0; move0 < this.N_MOVES; move0++) {
            var move = (move0 + offset) % this.N_MOVES;
            if (move == lm) {
                continue;
            }
            var cur_state = state.slice();
            for (var power = 0; power < this.N_POWER; power++) {
                for (var i = 0; i < N_STATES; i++) {
                    cur_state[i] = this.move[i][move][cur_state[i]];
                }
                if (this.idaSearch(cur_state, maxl - 1, move)) {
                    this.sol.push([move, power]);
                    return true;
                }
            }
        }
        return false;
    };
    Solver.prototype.toStr = function (sol, move_map, power_map) {
        var ret = [];
        for (var i = 0; i < sol.length; i++) {
            ret.push(move_map[sol[i][0]] + power_map[sol[i][1]]);
        }
        return ret.join(" ").replace(/ +/g, " ");
    };
    return Solver;
}());
exports.Solver = Solver;
// state: string not null
// solvedStates: [solvedstate, solvedstate, ...], string not null
// moveFunc: function(state, move);
// moves: {move: face0 | axis0}, face0 | axis0 = 4 + 4 bits
var gSolver = /** @class */ (function () {
    function gSolver(solvedStates, doMove, moves) {
        this.solvedStates = solvedStates;
        this.doMove = doMove;
        this.movesList = [];
        for (var move in moves) {
            this.movesList.push([move, moves[move]]);
        }
        this.prunTable = {};
        this.toUpdateArr = null;
        this.prunTableSize = 0;
        this.prunDepth = -1;
        this.state = "";
        this.prevSize = 0;
        this.cost = 0;
        this.MAX_PRUN_SIZE = 100000;
        this.solArr = null;
        this.prevSolStr = "";
    }
    gSolver.prototype.updatePrun = function (targetDepth) {
        targetDepth = targetDepth === undefined ? this.prunDepth + 1 : targetDepth;
        for (var depth = this.prunDepth + 1; depth <= targetDepth; depth++) {
            if (this.prevSize >= this.MAX_PRUN_SIZE) {
                break;
            }
            var t = +new Date();
            if (depth < 1) {
                this.prevSize = 0;
                for (var i = 0; i < this.solvedStates.length; i++) {
                    var state = this.solvedStates[i];
                    if (!(state in this.prunTable)) {
                        this.prunTable[state] = depth;
                        this.prunTableSize++;
                    }
                }
            }
            else {
                this.updatePrunBFS(depth - 1);
            }
            if (this.cost == 0) {
                return;
            }
            this.prunDepth = depth;
            this.prevSize = this.prunTableSize;
        }
    };
    gSolver.prototype.updatePrunBFS = function (fromDepth) {
        if (this.toUpdateArr == null) {
            this.toUpdateArr = [];
            for (var state in this.prunTable) {
                if (this.prunTable[state] != fromDepth) {
                    continue;
                }
                this.toUpdateArr.push(state);
            }
        }
        while (this.toUpdateArr.length != 0) {
            var state = this.toUpdateArr.pop();
            for (var moveIdx = 0; moveIdx < this.movesList.length; moveIdx++) {
                var newState = this.doMove(state, this.movesList[moveIdx][0]);
                if (!newState || newState in this.prunTable) {
                    continue;
                }
                this.prunTable[newState] = fromDepth + 1;
                this.prunTableSize++;
            }
            if (this.cost >= 0) {
                if (this.cost == 0) {
                    return;
                }
                this.cost--;
            }
        }
        this.toUpdateArr = null;
    };
    gSolver.prototype.search = function (state, minl, MAXL) {
        if (MAXL === void 0) { MAXL = 98; }
        this.sol = [];
        this.subOpt = false;
        this.state = state;
        this.visited = {};
        this.maxl = minl = minl || 0;
        return this.searchNext(MAXL);
    };
    gSolver.prototype.searchNext = function (MAXL, cost) {
        if (MAXL === void 0) { MAXL = 98; }
        if (cost === void 0) { cost = -1; }
        MAXL = MAXL + 1;
        this.cost = cost;
        this.prevSolStr = this.solArr ? this.solArr.join(",") : null;
        this.solArr = null;
        for (; this.maxl < MAXL; this.maxl += 1) {
            this.updatePrun(Math.ceil(this.maxl / 2));
            if (this.cost == 0) {
                return null;
            }
            if (this.idaSearch(this.state, this.maxl, null, 0)) {
                break;
            }
        }
        return this.solArr;
    };
    gSolver.prototype.getPruning = function (state) {
        var prun = this.prunTable[state];
        return prun === undefined ? this.prunDepth + 1 : prun;
    };
    gSolver.prototype.idaSearch = function (state, maxl, lm, depth) {
        if (this.getPruning(state) > maxl) {
            return false;
        }
        if (maxl == 0) {
            if (this.solvedStates.indexOf(state) == -1) {
                return false;
            }
            var solArr = this.getSolArr();
            this.subOpt = true;
            if (solArr.join(",") == this.prevSolStr) {
                return false;
            }
            this.solArr = solArr;
            return true;
        }
        if (!this.subOpt) {
            if (state in this.visited && this.visited[state] < depth) {
                return false;
            }
            this.visited[state] = depth;
        }
        if (this.cost >= 0) {
            if (this.cost == 0) {
                return true;
            }
            this.cost--;
        }
        var lastMove = lm == null ? "" : this.movesList[lm][0];
        var lastAxisFace = lm == null ? -1 : this.movesList[lm][1];
        for (var moveIdx = this.sol[depth] || 0; moveIdx < this.movesList.length; moveIdx++) {
            var moveArgs = this.movesList[moveIdx];
            var axisface = moveArgs[1] ^ lastAxisFace;
            var move = moveArgs[0];
            if (axisface == 0 || ((axisface & 0xf) == 0 && move <= lastMove)) {
                continue;
            }
            var newState = this.doMove(state, move);
            if (!newState || newState == state) {
                continue;
            }
            this.sol[depth] = moveIdx;
            if (this.idaSearch(newState, maxl - 1, moveIdx, depth + 1)) {
                return true;
            }
            this.sol.pop();
        }
        return false;
    };
    gSolver.prototype.getSolArr = function () {
        var solArr = [];
        for (var i = 0; i < this.sol.length; i++) {
            solArr.push(this.movesList[this.sol[i]][0]);
        }
        return solArr;
    };
    return gSolver;
}());
exports.gSolver = gSolver;
var randGen = (function () {
    var isaac = new isaac_1.Isaac();
    var rndCnt;
    var seedStr; // '' + new Date().getTime();
    function random() {
        rndCnt++;
        return isaac.random();
    }
    function getSeed() {
        return [rndCnt, seedStr];
    }
    function setSeed(_rndCnt, _seedStr) {
        if (_seedStr && (_seedStr != seedStr || rndCnt > _rndCnt)) {
            var seed = [];
            for (var i = 0; i < _seedStr.length; i++) {
                seed[i] = _seedStr.charCodeAt(i);
            }
            isaac.seed(seed);
            rndCnt = 0;
            seedStr = _seedStr;
        }
        while (rndCnt < _rndCnt) {
            isaac.random();
            rndCnt++;
        }
    }
    // setSeed(0, '1576938267035');
    setSeed(0, "" + new Date().getTime());
    return {
        random: random,
        getSeed: getSeed,
        setSeed: setSeed,
    };
})();
function rndEl(x) {
    return x[~~(randGen.random() * x.length)];
}
function rn(n) {
    return ~~(randGen.random() * n);
}
function rndPerm(n, isEven) {
    var p = 0;
    var arr = [];
    for (var i = 0; i < n; i++) {
        arr[i] = i;
    }
    for (var i = 0; i < n - 1; i++) {
        var k = rn(n - i);
        circle(arr, i, i + k);
        p ^= Number(k != 0);
    }
    if (isEven && p) {
        circle(arr, 0, 1);
    }
    return arr;
}
function rndProb(plist) {
    var cum = 0;
    var curIdx = 0;
    for (var i = 0; i < plist.length; i++) {
        if (plist[i] == 0) {
            continue;
        }
        if (randGen.random() < plist[i] / (cum + plist[i])) {
            curIdx = i;
        }
        cum += plist[i];
    }
    return curIdx;
}
function time2str(unix, format) {
    if (!unix) {
        return "N/A";
    }
    format = format || "%Y-%M-%D %h:%m:%s";
    var date = new Date(unix * 1000);
    return format
        .replace("%Y", date.getFullYear().toString())
        .replace("%M", ("0" + (date.getMonth() + 1)).slice(-2))
        .replace("%D", ("0" + date.getDate()).slice(-2))
        .replace("%h", ("0" + date.getHours()).slice(-2))
        .replace("%m", ("0" + date.getMinutes()).slice(-2))
        .replace("%s", ("0" + date.getSeconds()).slice(-2));
}
var timeRe = /^\s*(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)\s*$/;
function str2time(val) {
    var m = timeRe.exec(val);
    if (!m) {
        return null;
    }
    var date = new Date(0);
    date.setFullYear(~~m[1]);
    date.setMonth(~~m[2] - 1);
    date.setDate(~~m[3]);
    date.setHours(~~m[4]);
    date.setMinutes(~~m[5]);
    date.setSeconds(~~m[6]);
    return ~~(date.getTime() / 1000);
}
function obj2str(val) {
    if (typeof val == "string") {
        return val;
    }
    return JSON.stringify(val);
}
function str2obj(val) {
    if (typeof val != "string") {
        return val;
    }
    return JSON.parse(val);
}
function valuedArray(len, val) {
    var ret = [];
    for (var i = 0; i < len; i++) {
        ret[i] = val;
    }
    return ret;
}
function idxArray(arr, idx) {
    var ret = [];
    for (var i = 0; i < arr.length; i++) {
        ret.push(arr[i][idx]);
    }
    return ret;
}
exports.minx = (function () {
    var U = 0, R = 1, F = 2, L = 3, BL = 4, BR = 5, DR = 6, DL = 7, DBL = 8, B = 9, DBR = 10, D = 11;
    var oppFace = [D, DBL, B, DBR, DR, DL, BL, BR, R, F, L, U];
    var adjFaces = [
        [BR, R, F, L, BL], //U
        [DBR, DR, F, U, BR], //R
        [DR, DL, L, U, R], //F
        [DL, DBL, BL, U, F], //L
        [DBL, B, BR, U, L], //BL
        [B, DBR, R, U, BL], //BR
        [D, DL, F, R, DBR], //DR
        [D, DBL, L, F, DR], //DL
        [D, B, BL, L, DL], //DBL
        [D, DBR, BR, BL, DBL], //B
        [D, DR, R, BR, B], //DBR
        [DR, DBR, B, DBL, DL], //D
    ];
    // wide: 0=single, 1=all, 2=all but single
    // state: corn*5, edge*5, center*1
    function doMove(state, face, pow, wide) {
        pow = ((pow % 5) + 5) % 5;
        if (pow == 0) {
            return;
        }
        var base = face * 11;
        var adjs = [];
        var swaps = [[], [], [], [], []];
        for (var i = 0; i < 5; i++) {
            var aface = adjFaces[face][i];
            var ridx = adjFaces[aface].indexOf(face);
            if (wide == 0 || wide == 1) {
                swaps[i].push(base + i);
                swaps[i].push(base + i + 5);
                swaps[i].push(aface * 11 + (ridx % 5) + 5);
                swaps[i].push(aface * 11 + (ridx % 5));
                swaps[i].push(aface * 11 + ((ridx + 1) % 5));
            }
            if (wide == 1 || wide == 2) {
                swaps[i].push(aface * 11 + 10);
                for (var j = 1; j < 5; j++) {
                    swaps[i].push(aface * 11 + ((ridx + j) % 5) + 5);
                }
                for (var j = 2; j < 5; j++) {
                    swaps[i].push(aface * 11 + ((ridx + j) % 5));
                }
                var ii = 4 - i;
                var opp = oppFace[face];
                var oaface = adjFaces[opp][ii];
                var oridx = adjFaces[oaface].indexOf(opp);
                swaps[i].push(opp * 11 + ii);
                swaps[i].push(opp * 11 + ii + 5);
                swaps[i].push(oaface * 11 + 10);
                for (var j = 0; j < 5; j++) {
                    swaps[i].push(oaface * 11 + ((oridx + j) % 5) + 5);
                    swaps[i].push(oaface * 11 + ((oridx + j) % 5));
                }
            }
        }
        for (var i = 0; i < swaps[0].length; i++) {
            acycle(state, [swaps[0][i], swaps[1][i], swaps[2][i], swaps[3][i], swaps[4][i]], pow);
        }
    }
    return {
        doMove: doMove,
        oppFace: oppFace,
        adjFaces: adjFaces,
    };
})();
exports.SOLVED_FACELET = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
exports.getSeed = randGen.getSeed;
exports.setSeed = randGen.setSeed;
