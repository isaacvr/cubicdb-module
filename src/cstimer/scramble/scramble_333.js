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
exports.ollfilter = exports.pllfilter = exports.f2lfilter = exports.f2l_map = void 0;
exports.getRandomScramble = getRandomScramble;
exports.getFMCScramble = getFMCScramble;
exports.getEdgeScramble = getEdgeScramble;
exports.getCornerScramble = getCornerScramble;
exports.getLLScramble = getLLScramble;
exports.getLSLLScramble = getLSLLScramble;
exports.getF2LScramble = getF2LScramble;
exports.getZBLLScramble = getZBLLScramble;
exports.getZZLLScramble = getZZLLScramble;
exports.getZBLSScramble = getZBLSScramble;
exports.getLSEScramble = getLSEScramble;
exports.getCMLLScramble = getCMLLScramble;
exports.getCLLScramble = getCLLScramble;
exports.getELLScramble = getELLScramble;
exports.get2GLLScramble = get2GLLScramble;
exports.getPLLScramble = getPLLScramble;
exports.getOLLScramble = getOLLScramble;
exports.getEOLineScramble = getEOLineScramble;
exports.getEasyCrossScramble = getEasyCrossScramble;
exports.genFacelet = genFacelet;
exports.solvFacelet = solvFacelet;
exports.getCustomScramble = getCustomScramble;
var cross_1 = require("../lib/cross");
var mathlib_1 = require("../lib/mathlib");
var min2phase_1 = require("../lib/min2phase");
var cross_2 = require("../tools/cross");
var scramble_1 = require("./scramble");
function between(n, a, b) {
    var na = Math.min(a, b);
    var nb = Math.max(a, b);
    return Math.min(nb, Math.max(na, n));
}
var Ux1 = 0;
var Ux2 = 1;
var Ux3 = 2;
var Rx1 = 3;
var Rx2 = 4;
var Rx3 = 5;
var Fx1 = 6;
var Fx2 = 7;
var Fx3 = 8;
var Dx1 = 9;
var Dx2 = 10;
var Dx3 = 11;
var Lx1 = 12;
var Lx2 = 13;
var Lx3 = 14;
var Bx1 = 15;
var Bx2 = 16;
var Bx3 = 17;
function $setFlip(obj, idx) {
    var i, parity;
    parity = 0;
    for (i = 10; i >= 0; --i) {
        parity ^= obj.eo[i] = idx & 1;
        idx >>= 1;
    }
    obj.eo[11] = parity;
}
function $setTwist(obj, idx) {
    var i, twst;
    twst = 0;
    for (i = 6; i >= 0; --i) {
        twst += obj.co[i] = idx % 3;
        idx = ~~(idx / 3);
    }
    obj.co[7] = (15 - twst) % 3;
}
function CornMult(a, b, prod) {
    var corn, ori, oriA, oriB;
    for (corn = 0; corn < 8; ++corn) {
        prod.cp[corn] = a.cp[b.cp[corn]];
        oriA = a.co[b.cp[corn]];
        oriB = b.co[corn];
        ori = oriA;
        ori += oriA < 3 ? oriB : 6 - oriB;
        ori %= 3;
        oriA >= 3 !== oriB >= 3 && (ori += 3);
        prod.co[corn] = ori;
    }
}
var CubieCube = /** @class */ (function () {
    function CubieCube() {
        this.cp = [0, 1, 2, 3, 4, 5, 6, 7];
        this.co = [0, 0, 0, 0, 0, 0, 0, 0];
        this.ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    return CubieCube;
}());
var CubieCube1 = /** @class */ (function () {
    function CubieCube1(cperm, twist, eperm, flip) {
        this.cp = [0, 1, 2, 3, 4, 5, 6, 7];
        this.co = [0, 0, 0, 0, 0, 0, 0, 0];
        this.ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        (0, mathlib_1.set8Perm)(this.cp, cperm);
        $setTwist(this, twist);
        (0, mathlib_1.setNPerm)(this.ep, eperm, 12);
        $setFlip(this, flip);
    }
    return CubieCube1;
}());
function EdgeMult(a, b, prod) {
    var ed;
    for (ed = 0; ed < 12; ++ed) {
        prod.ep[ed] = a.ep[b.ep[ed]];
        prod.eo[ed] = b.eo[ed] ^ a.eo[b.ep[ed]];
    }
}
var ret = false;
function initMove() {
    if (ret) {
        return;
    }
    ret = true;
    var a, p;
    moveCube[0] = new CubieCube1(15120, 0, 119750400, 0);
    moveCube[3] = new CubieCube1(21021, 1494, 323403417, 0);
    moveCube[6] = new CubieCube1(8064, 1236, 29441808, 550);
    moveCube[9] = new CubieCube1(9, 0, 5880, 0);
    moveCube[12] = new CubieCube1(1230, 412, 2949660, 0);
    moveCube[15] = new CubieCube1(224, 137, 328552, 137);
    for (a = 0; a < 18; a += 3) {
        for (p = 0; p < 2; ++p) {
            moveCube[a + p + 1] = new CubieCube();
            EdgeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
            CornMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
        }
    }
}
var moveCube = [];
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
function toFaceCube(cc) {
    var c, e, f, i, j, n, ori, ts;
    f = [];
    ts = [85, 82, 70, 68, 76, 66];
    for (i = 0; i < 54; ++i) {
        f[i] = ts[~~(i / 9)];
    }
    for (c = 0; c < 8; ++c) {
        j = cc.cp[c];
        ori = cc.co[c];
        for (n = 0; n < 3; ++n)
            f[cornerFacelet[c][(n + ori) % 3]] = ts[~~(cornerFacelet[j][n] / 9)];
    }
    for (e = 0; e < 12; ++e) {
        j = cc.ep[e];
        ori = cc.eo[e];
        for (n = 0; n < 2; ++n)
            f[edgeFacelet[e][(n + ori) % 2]] = ts[~~(edgeFacelet[j][n] / 9)];
    }
    return String.fromCharCode.apply(null, f);
}
// SCRAMBLERS
// @ts-ignore
var search = new min2phase_1.Search();
function getRandomScramble() {
    return getAnyScramble(0xffffffffffff, 0xffffffffffff, 0xffffffff, 0xffffffff);
}
function getFMCScramble() {
    var scramble = "", axis1, axis2, axisl1, axisl2;
    do {
        scramble = getRandomScramble();
        var moveseq = scramble.split(" ");
        if (moveseq.length < 3) {
            continue;
        }
        axis1 = moveseq[0][0];
        axis2 = moveseq[1][0];
        axisl1 = moveseq[moveseq.length - 2][0];
        axisl2 = moveseq[moveseq.length - 3][0];
    } while (axis1 == "F" ||
        (axis1 == "B" && axis2 == "F") ||
        axisl1 == "R" ||
        (axisl1 == "L" && axisl2 == "R"));
    return "R' U' F " + scramble + "R' U' F";
}
function cntU(b) {
    var c, a;
    for (c = 0, a = 0; a < b.length; a++)
        -1 == b[a] && c++;
    return c;
}
function fixOri(arr, cntU, base) {
    var sum = 0;
    var idx = 0;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] != -1) {
            sum += arr[i];
        }
    }
    sum %= base;
    for (var i = 0; i < arr.length - 1; i++) {
        if (arr[i] == -1) {
            if (cntU-- == 1) {
                arr[i] = ((base << 4) - sum) % base;
            }
            else {
                arr[i] = (0, mathlib_1.rn)(base);
                sum += arr[i];
            }
        }
        idx *= base;
        idx += arr[i];
    }
    return idx;
}
function fixPerm(arr, cntU, parity) {
    var val = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    for (var i_1 = 0; i_1 < arr.length; i_1++) {
        if (arr[i_1] != -1) {
            val[arr[i_1]] = -1;
        }
    }
    for (var i_2 = 0, j = 0; i_2 < val.length; i_2++) {
        if (val[i_2] != -1) {
            val[j++] = val[i_2];
        }
    }
    var last = 0;
    var i;
    for (i = 0; i < arr.length && cntU > 0; i++) {
        if (arr[i] == -1) {
            var r = (0, mathlib_1.rn)(cntU);
            arr[i] = val[r];
            for (var j = r; j < 11; j++) {
                val[j] = val[j + 1];
            }
            if (cntU-- == 2) {
                last = i;
            }
        }
    }
    if ((0, mathlib_1.getNParity)((0, mathlib_1.getNPerm)(arr, arr.length), arr.length) == 1 - parity) {
        var temp = arr[i - 1];
        arr[i - 1] = arr[last];
        arr[last] = temp;
    }
    return (0, mathlib_1.getNPerm)(arr, arr.length);
}
//arr: 53 bit integer
function parseMask(arr, length) {
    if ("number" !== typeof arr) {
        return arr;
    }
    var ret = [];
    for (var i = 0; i < length; i++) {
        var val = arr & 0xf; // should use "/" instead of ">>" to avoid unexpected type conversion
        ret[i] = val == 15 ? -1 : val;
        arr /= 16;
    }
    return ret;
}
var aufsuff = [[], [Ux1], [Ux2], [Ux3]];
var rlpresuff = [[], [Rx1, Lx3], [Rx2, Lx2], [Rx3, Lx1]];
var rlappsuff = ["", "x'", "x2", "x"];
var emptysuff = [[]];
function getAnyScramble(_ep, _eo, _cp, _co, _rndapp, _rndpre) {
    initMove();
    _rndapp = _rndapp || emptysuff;
    _rndpre = _rndpre || emptysuff;
    var $_ep = parseMask(_ep, 12);
    var $_eo = parseMask(_eo, 12);
    var $_cp = parseMask(_cp, 8);
    var $_co = parseMask(_co, 8);
    var solution = "";
    do {
        var eo = $_eo.slice();
        var ep = $_ep.slice();
        var co = $_co.slice();
        var cp = $_cp.slice();
        var neo = fixOri(eo, cntU(eo), 2);
        var nco = fixOri(co, cntU(co), 3);
        var nep = void 0, ncp = void 0;
        var ue = cntU(ep);
        var uc = cntU(cp);
        if (ue == 0 && uc == 0) {
            nep = (0, mathlib_1.getNPerm)(ep, 12);
            ncp = (0, mathlib_1.getNPerm)(cp, 8);
        }
        else if (ue != 0 && uc == 0) {
            ncp = (0, mathlib_1.getNPerm)(cp, 8);
            nep = fixPerm(ep, ue, (0, mathlib_1.getNParity)(ncp, 8));
        }
        else if (ue == 0 && uc != 0) {
            nep = (0, mathlib_1.getNPerm)(ep, 12);
            ncp = fixPerm(cp, uc, (0, mathlib_1.getNParity)(nep, 12));
        }
        else {
            nep = fixPerm(ep, ue, -1);
            ncp = fixPerm(cp, uc, (0, mathlib_1.getNParity)(nep, 12));
        }
        if (ncp + nco + nep + neo == 0) {
            continue;
        }
        var cc = new CubieCube1(ncp, nco, nep, neo);
        var cc2 = new CubieCube();
        var rndpre = (0, mathlib_1.rndEl)(_rndpre);
        var rndapp = (0, mathlib_1.rndEl)(_rndapp);
        for (var i = 0; i < rndpre.length; i++) {
            CornMult(moveCube[rndpre[i]], cc, cc2);
            EdgeMult(moveCube[rndpre[i]], cc, cc2);
            var tmp = cc2;
            cc2 = cc;
            cc = tmp;
        }
        for (var i = 0; i < rndapp.length; i++) {
            CornMult(cc, moveCube[rndapp[i]], cc2);
            EdgeMult(cc, moveCube[rndapp[i]], cc2);
            var tmp = cc2;
            cc2 = cc;
            cc = tmp;
        }
        var posit = toFaceCube(cc);
        // @ts-ignore
        var search0 = new min2phase_1.Search();
        solution = search0.solution(posit, 21, 1e9, 50, 2);
    } while (solution.length <= 3);
    return solution.replace(/ +/g, " ");
}
function getEdgeScramble() {
    return getAnyScramble(0xffffffffffff, 0xffffffffffff, 0x76543210, 0x00000000);
}
function getCornerScramble() {
    return getAnyScramble(0xba9876543210, 0x000000000000, 0xffffffff, 0xffffffff);
}
function getLLScramble() {
    return getAnyScramble(0xba987654ffff, 0x00000000ffff, 0x7654ffff, 0x0000ffff);
}
exports.f2l_map = [
    [0x2000, 4, "Easy-01"],
    [0x1011, 4, "Easy-02"],
    [0x2012, 4, "Easy-03"],
    [0x1003, 4, "Easy-04"],
    [0x2003, 4, "RE-05"],
    [0x1012, 4, "RE-06"],
    [0x2002, 4, "RE-07"],
    [0x1013, 4, "RE-08"],
    [0x2013, 4, "REFC-09"],
    [0x1002, 4, "REFC-10"],
    [0x2010, 4, "REFC-11"],
    [0x1001, 4, "REFC-12"],
    [0x2011, 4, "REFC-13"],
    [0x1000, 4, "REFC-14"],
    [0x2001, 4, "SPGO-15"],
    [0x1010, 4, "SPGO-16"],
    [0x0000, 4, "SPGO-17"],
    [0x0011, 4, "SPGO-18"],
    [0x0003, 4, "PMS-19"],
    [0x0012, 4, "PMS-20"],
    [0x0002, 4, "PMS-21"],
    [0x0013, 4, "PMS-22"],
    [0x0001, 4, "Weird-23"],
    [0x0010, 4, "Weird-24"],
    [0x0400, 4, "CPEU-25"],
    [0x0411, 4, "CPEU-26"],
    [0x1400, 4, "CPEU-27"],
    [0x2411, 4, "CPEU-28"],
    [0x1411, 4, "CPEU-29"],
    [0x2400, 4, "CPEU-30"],
    [0x0018, 4, "EPCU-31"],
    [0x0008, 4, "EPCU-32"],
    [0x2008, 4, "EPCU-33"],
    [0x1008, 4, "EPCU-34"],
    [0x2018, 4, "EPCU-35"],
    [0x1018, 4, "EPCU-36"],
    [0x0418, 1, "ECP-37"],
    [0x1408, 1, "ECP-38"],
    [0x2408, 1, "ECP-39"],
    [0x1418, 1, "ECP-40"],
    [0x2418, 1, "ECP-41"],
    [0x0408, 1, "Solved-42"],
];
var f2lprobs = (0, mathlib_1.idxArray)(exports.f2l_map, 1);
exports.f2lfilter = (0, mathlib_1.idxArray)(exports.f2l_map, 2);
function getLSLLScramble(type, length, cases) {
    var caze = exports.f2l_map[(0, scramble_1.fixCase)(cases, f2lprobs)][0];
    var ep = Math.pow(16, caze & 0xf);
    var eo = 0xf ^ ((caze >> 4) & 1);
    var cp = Math.pow(16, (caze >> 8) & 0xf);
    var co = 0xf ^ ((caze >> 12) & 3);
    return getAnyScramble(0xba9f7654ffff - 7 * ep, 0x000f0000ffff - eo * ep, 0x765fffff - 0xb * cp, 0x000fffff - co * cp);
}
var crossProbs = [
    [0xffffffff3210, 0xffffffff0000],
    [0xbff8fff4fff0, 0x0ff0fff0fff0],
    [0xff98ff5fff1f, 0xff00ff0fff0f],
    [0xffff7654ffff, 0xffff0000ffff],
    [0xfa9ff6fff2ff, 0xf00ff0fff0ff],
    [0xbaff7fff3fff, 0x00ff0fff0fff],
];
var crossFilter = ["U", "R", "F", "D", "L", "B"];
function getF2LScramble(_type, _length, prob) {
    /*
    0xabcdefghijkl
  
    a = BR    b = BL    c = FL    d = FR
    e = DB    f = DL    g = DF    h = DR
    i = UB    j = UL    k = UF    l = UR
  
    */
    var p = between(prob || 0, 0, crossProbs.length - 1);
    var _prob = crossProbs[p];
    if (typeof prob != "number" || prob < 0 || prob >= crossProbs.length) {
        _prob = (0, mathlib_1.rndEl)(crossProbs);
    }
    return getAnyScramble(_prob[0], _prob[1], 0xffffffff, 0xffffffff);
}
function genZBLLMap() {
    var isVisited = [];
    var zbll_map = [];
    var cc = new CubieCube();
    for (var idx = 0; idx < 27 * 24 * 24; idx++) {
        if ((isVisited[idx >> 5] >> (idx & 0x1f)) & 1) {
            continue;
        }
        var epi = idx % 24;
        var cpi = ~~(idx / 24) % 24;
        var coi = ~~(idx / 24 / 24);
        if ((0, mathlib_1.getNParity)(cpi, 4) != (0, mathlib_1.getNParity)(epi, 4)) {
            continue;
        }
        var co = (0, mathlib_1.setNOri)(cc.co, coi, 4, -3);
        var cp = (0, mathlib_1.setNPerm)(cc.cp, cpi, 4, 0);
        var ep = (0, mathlib_1.setNPerm)(cc.ep, epi, 4, 0);
        var zbcase = [0, 0, 0, 0, null];
        for (var i = 0; i < 4; i++) {
            zbcase[0] += cp[i] << (i * 4);
            zbcase[1] += co[i] << (i * 4);
            zbcase[2] += ep[i] << (i * 4);
        }
        for (var conj = 0; conj < 16; conj++) {
            var c0 = conj >> 2;
            var c1 = conj & 3;
            var co2 = [], cp2 = [], ep2 = [];
            for (var i = 0; i < 4; i++) {
                co2[(i + c0) & 3] = co[i];
                cp2[(i + c0) & 3] = (cp[i] + c1) & 3;
                ep2[(i + c0) & 3] = (ep[i] + c1) & 3;
            }
            var co2i = (0, mathlib_1.getNOri)(co2, 4, -3);
            var cp2i = (0, mathlib_1.getNPerm)(cp2, 4, 0);
            var ep2i = (0, mathlib_1.getNPerm)(ep2, 4, 0);
            var idx2 = (co2i * 24 + cp2i) * 24 + ep2i;
            if ((isVisited[idx2 >> 5] >> (idx2 & 0x1f)) & 1) {
                continue;
            }
            isVisited[idx2 >> 5] |= 1 << (idx2 & 0x1f);
            zbcase[3]++;
        }
        if (idx > 0) {
            // skip solved state
            zbll_map.push(zbcase);
        }
    }
    var coNames = {};
    coNames[0x0000] = "O";
    coNames[0x0012] = "U";
    coNames[0x0021] = "T";
    coNames[0x0102] = "L";
    coNames[0x0111] = "aS";
    coNames[0x0222] = "S";
    coNames[0x1122] = "Pi";
    coNames[0x1212] = "H";
    var coCnts = {};
    for (var i = 0; i < zbll_map.length; i++) {
        var zbcase = zbll_map[i];
        var coName = coNames[zbcase[1]];
        coCnts[coName] = coCnts[coName] || [];
        var coCnt = coCnts[coName];
        var cpIdx = coCnt.indexOf(zbcase[0]);
        if (cpIdx == -1) {
            cpIdx = coCnt.length;
            coCnt.push(zbcase[0], 1);
        }
        else {
            coCnt[cpIdx + 1]++;
        }
        zbcase[4] = coName + ((cpIdx >> 1) + 1) + "-" + coCnts[coName][cpIdx + 1];
    }
    return zbll_map;
}
var zbll_map = genZBLLMap();
var zbprobs = (0, mathlib_1.idxArray)(zbll_map, 3);
var zbfilter = (0, mathlib_1.idxArray)(zbll_map, 4);
var coll_map = [
    [0x3210, 0x1101, "LeFeeeDeRRGFDGLDGBDGB", 4, "aS-1"],
    [0x2301, 0x1110, "ReFeeeDeLRGBDGLDGFDGB", 4, "aS-2"],
    [0x3021, 0x1101, "LeBeeeDeFFGLDGRDGBDGR", 4, "aS-3"],
    [0x2013, 0x1011, "LeFeeeDeBFGRDGLDGBDGR", 4, "aS-4"],
    [0x1203, 0x1011, "FeBeeeDeLFGBDGRDGLDGR", 4, "aS-5"],
    [0x3102, 0x1101, "FeBeeeDeRBGFDGRDGLDGL", 4, "aS-6"],
    [0x3210, 0x2121, "FeFeeeBeBLGRDGDRGLDGD", 2, "H-1"],
    [0x2301, 0x1212, "ReLeeeReLBGBDGDFGFDGD", 2, "H-2"],
    [0x1203, 0x1212, "ReBeeeLeBFGRDGDLGFDGD", 4, "H-3"],
    [0x2013, 0x1212, "LeReeeFeFRGLDGDBGBDGD", 4, "H-4"],
    [0x3021, 0x1020, "DeLeeeReDBGRFGBDGFLGD", 4, "L-1"],
    [0x1203, 0x0201, "DeReeeLeDFDBRDFDGLBGD", 4, "L-2"],
    [0x2301, 0x0102, "DeBeeeLeDFGRFGRDGLBGD", 4, "L-3"],
    [0x3210, 0x1020, "DeLeeeFeDRGFLGBDGBRGD", 4, "L-4"],
    [0x3102, 0x1020, "DeLeeeLeDFGBRGBDGRFGD", 4, "L-5"],
    [0x2013, 0x0201, "DeReeeReDBGLBGFDGFLGD", 4, "L-6"],
    [0x3210, 0x1122, "LeFeeeReFBGDRGLDGBDGD", 4, "Pi-1"],
    [0x2301, 0x2112, "FeLeeeFeRRGDBGBDGLDGD", 4, "Pi-2"],
    [0x1203, 0x1221, "ReLeeeReLBGDFGBDGFDGD", 4, "Pi-3"],
    [0x3102, 0x1122, "BeFeeeFeBRGDLGLDGRDGD", 4, "Pi-4"],
    [0x2013, 0x1221, "BeLeeeLeFFGDRGBDGRDGD", 4, "Pi-5"],
    [0x3021, 0x1122, "BeReeeLeBFGDLGFDGRDGD", 4, "Pi-6"],
    [0x3210, 0x2220, "ReBeeeFeDRGFLGDLGDBGD", 4, "S-1"],
    [0x2301, 0x0222, "BeReeeLeDFGRFGDBGDLGD", 4, "S-2"],
    [0x3021, 0x2220, "BeReeeFeDRGFLGDBGDLGD", 4, "S-3"],
    [0x2013, 0x2202, "ReBeeeLeDFGRFGDLGDBGD", 4, "S-4"],
    [0x3102, 0x2220, "FeBeeeLeDFGBRGDLGDRGD", 4, "S-5"],
    [0x1203, 0x2202, "LeReeeFeDRGLBGDBGDFGD", 4, "S-6"],
    [0x1203, 0x1002, "BeLeeeDeDBGRFGDFGRDGL", 4, "T-1"],
    [0x3102, 0x2100, "ReBeeeDeDLGBRGDLGFDGF", 4, "T-2"],
    [0x2301, 0x0210, "BeFeeeDeDBGFLGDRGRDGL", 4, "T-3"],
    [0x3210, 0x2100, "FeFeeeDeDBGBRGDRGLDGL", 4, "T-4"],
    [0x2013, 0x1002, "BeBeeeDeDLGRFGDLGRDGF", 4, "T-5"],
    [0x3021, 0x2100, "FeBeeeDeDRGRFGDLGLDGB", 4, "T-6"],
    [0x2301, 0x0120, "LeLeeeDeDFGBRGBDGDFGR", 4, "U-1"],
    [0x3210, 0x1200, "LeReeeDeDBGBRGFDGDFGL", 4, "U-2"],
    [0x3021, 0x1200, "FeFeeeDeDBGBRGLDGDRGL", 4, "U-3"],
    [0x2013, 0x2001, "BeFeeeDeDFGBRGLDGDLGR", 4, "U-4"],
    [0x1203, 0x2001, "ReFeeeDeDBGRFGLDGDBGL", 4, "U-5"],
    [0x3102, 0x1200, "LeBeeeDeDBGRFGRDGDFGL", 4, "U-6"],
    [0x3021, 0x0000, "DeDeeeDeDBGRFGBRGFLGL", 4, "O-Adj"],
    [0x2301, 0x0000, "DeDeeeDeDBGFLGRFGBRGL", 1, "O-Diag"],
    [0x3210, 0x0000, "DeDeeeDeDBGBRGRFGFLGL", 1, "O-AUF"],
];
var coprobs = (0, mathlib_1.idxArray)(coll_map, 3);
var cofilter = (0, mathlib_1.idxArray)(coll_map, 4);
function getCOLLScramble(type, length, cases) {
    var cocase = coll_map[(0, scramble_1.fixCase)(cases, coprobs)];
    return getAnyScramble(0xba987654ffff, 0, cocase[0] + 0x76540000, cocase[1], aufsuff, aufsuff);
}
function getZBLLScramble(type, length, cases) {
    var zbcase = zbll_map[(0, scramble_1.fixCase)(cases, zbprobs)];
    return getAnyScramble(0xba987654ffff, 0, zbcase[0] + 0x76540000, zbcase[1], aufsuff, aufsuff);
}
function getZZLLScramble() {
    return getAnyScramble(0xba9876543f1f, 0x000000000000, 0x7654ffff, 0x0000ffff, aufsuff);
}
function getZBLSScramble() {
    return getAnyScramble(0xba9f7654ffff, 0x000000000000, 0x765fffff, 0x000fffff);
}
function getLSEScramble() {
    var rnd4 = (0, mathlib_1.rn)(4);
    return (getAnyScramble(0xba98f6f4ffff, 0x0000f0f0ffff, 0x76543210, 0x00000000, [rlpresuff[rnd4]], aufsuff) + rlappsuff[rnd4]);
}
var cmll_map = [
    0x0000, // O or solved
    0x1212, // H
    0x0102, // L
    0x1122, // Pi
    0x0222, // S
    0x0021, // T
    0x0012, // U
    0x0111, // aS
];
var cmprobs = [6, 12, 24, 24, 24, 24, 24, 24];
var cmfilter = ["O", "H", "L", "Pi", "S", "T", "U", "aS"];
function getCMLLScramble(type, length, cases) {
    var rnd4 = (0, mathlib_1.rn)(4);
    var presuff = [];
    for (var i = 0; i < aufsuff.length; i++) {
        presuff.push(aufsuff[i].concat(rlpresuff[rnd4]));
    }
    return (getAnyScramble(0xba98f6f4ffff, 0x0000f0f0ffff, 0x7654ffff, cmll_map[(0, scramble_1.fixCase)(cases, cmprobs)], presuff, aufsuff) + rlappsuff[rnd4]);
}
function getCLLScramble() {
    return getAnyScramble(0xba9876543210, 0x000000000000, 0x7654ffff, 0x0000ffff);
}
function getELLScramble() {
    return getAnyScramble(0xba987654ffff, 0x00000000ffff, 0x76543210, 0x00000000);
}
function get2GLLScramble() {
    return getAnyScramble(0xba987654ffff, 0x000000000000, 0x76543210, 0x0000ffff, aufsuff);
}
var pll_map = [
    [0x3210, 0x3021, 4, "Aa"],
    [0x3210, 0x3102, 4, "Ab"],
    [0x3210, 0x2301, 2, "E"],
    [0x3012, 0x3201, 4, "F"],
    [0x2130, 0x3021, 4, "Ga"],
    [0x1320, 0x3102, 4, "Gb"],
    [0x3021, 0x3102, 4, "Gc"],
    [0x3102, 0x3021, 4, "Gd"],
    [0x1032, 0x3210, 1, "H"],
    [0x3201, 0x3201, 4, "Ja"],
    [0x3120, 0x3201, 4, "Jb"],
    [0x1230, 0x3012, 1, "Na"],
    [0x3012, 0x3012, 1, "Nb"],
    [0x0213, 0x3201, 4, "Ra"],
    [0x2310, 0x3201, 4, "Rb"],
    [0x1230, 0x3201, 4, "T"],
    [0x3102, 0x3210, 4, "Ua"],
    [0x3021, 0x3210, 4, "Ub"],
    [0x3120, 0x3012, 4, "V"],
    [0x3201, 0x3012, 4, "Y"],
    [0x2301, 0x3210, 2, "Z"],
];
var pllprobs = (0, mathlib_1.idxArray)(pll_map, 2);
exports.pllfilter = (0, mathlib_1.idxArray)(pll_map, 3);
function getPLLScramble(type, length, cases) {
    var pllcase = pll_map[(0, scramble_1.fixCase)(cases, pllprobs)];
    return getAnyScramble(pllcase[0] + 0xba9876540000, 0x000000000000, pllcase[1] + 0x76540000, 0x00000000, aufsuff, aufsuff);
}
var oll_map = [
    [0x1111, 0x1212, 2, "Point-1", 0xeba00],
    [0x1111, 0x1122, 4, "Point-2", 0xdda00],
    [0x1111, 0x0222, 4, "Point-3", 0x5b620],
    [0x1111, 0x0111, 4, "Point-4", 0x6d380],
    [0x0011, 0x2022, 4, "Square-5", 0x8360b],
    [0x0011, 0x1011, 4, "Square-6", 0x60b16],
    [0x0011, 0x2202, 4, "SLBS-7", 0x1362a],
    [0x0011, 0x0111, 4, "SLBS-8", 0x64392],
    [0x0011, 0x1110, 4, "Fish-9", 0x2538a],
    [0x0011, 0x2220, 4, "Fish-10", 0x9944c],
    [0x0011, 0x0222, 4, "SLBS-11", 0x9160e],
    [0x0011, 0x1101, 4, "SLBS-12", 0x44b13],
    [0x0101, 0x2022, 4, "Knight-13", 0x1a638],
    [0x0101, 0x0111, 4, "Knight-14", 0x2c398],
    [0x0101, 0x0222, 4, "Knight-15", 0x8a619],
    [0x0101, 0x1011, 4, "Knight-16", 0x28b1c],
    [0x1111, 0x0102, 4, "Point-17", 0x4b381],
    [0x1111, 0x0012, 4, "Point-18", 0x49705],
    [0x1111, 0x0021, 4, "Point-19", 0xc9a05],
    [0x1111, 0x0000, 1, "CO-20", 0x492a5],
    [0x0000, 0x1212, 2, "OCLL-21", 0x1455a],
    [0x0000, 0x1122, 4, "OCLL-22", 0xa445a],
    [0x0000, 0x0012, 4, "OCLL-23", 0x140fa],
    [0x0000, 0x0021, 4, "OCLL-24", 0x101de],
    [0x0000, 0x0102, 4, "OCLL-25", 0x2047e],
    [0x0000, 0x0111, 4, "OCLL-26", 0x2095e],
    [0x0000, 0x0222, 4, "OCLL-27", 0x1247a],
    [0x0011, 0x0000, 4, "CO-28", 0x012af],
    [0x0011, 0x0210, 4, "Awkward-29", 0x1138e],
    [0x0011, 0x2100, 4, "Awkward-30", 0x232aa],
    [0x0011, 0x0021, 4, "P-31", 0x50396],
    [0x0011, 0x1002, 4, "P-32", 0x0562b],
    [0x0101, 0x0021, 4, "T-33", 0x1839c],
    [0x0101, 0x0210, 4, "C-34", 0x2a2b8],
    [0x0011, 0x1020, 4, "Fish-35", 0x4a1d1],
    [0x0011, 0x0102, 4, "W-36", 0xc4293],
    [0x0011, 0x2010, 4, "Fish-37", 0x0338b],
    [0x0011, 0x0201, 4, "W-38", 0x11a2e],
    [0x0101, 0x1020, 4, "BLBS-39", 0x18a3c],
    [0x0101, 0x0102, 4, "BLBS-40", 0x8c299],
    [0x0011, 0x1200, 4, "Awkward-41", 0x152aa],
    [0x0011, 0x0120, 4, "Awkward-42", 0x0954d],
    [0x0011, 0x0012, 4, "P-43", 0xe0296],
    [0x0011, 0x2001, 4, "P-44", 0x03a2b],
    [0x0101, 0x0012, 4, "T-45", 0xa829c],
    [0x0101, 0x0120, 4, "C-46", 0x43863],
    [0x0011, 0x1221, 4, "L-47", 0x52b12],
    [0x0011, 0x1122, 4, "L-48", 0xa560a],
    [0x0011, 0x2112, 4, "L-49", 0xe4612],
    [0x0011, 0x2211, 4, "L-50", 0xec450],
    [0x0101, 0x1221, 4, "I-51", 0x1ab18],
    [0x0101, 0x1122, 4, "I-52", 0x53942],
    [0x0011, 0x2121, 4, "L-53", 0x54712],
    [0x0011, 0x1212, 4, "L-54", 0x1570a],
    [0x0101, 0x2121, 2, "I-55", 0x1c718],
    [0x0101, 0x1212, 2, "I-56", 0xaaa18],
    [0x0101, 0x0000, 2, "CO-57", 0x082bd],
];
var ollprobs = (0, mathlib_1.idxArray)(oll_map, 2);
exports.ollfilter = (0, mathlib_1.idxArray)(oll_map, 3);
function getOLLScramble(type, length, cases) {
    var ollcase = oll_map[(0, scramble_1.fixCase)(cases, ollprobs)];
    return getAnyScramble(0xba987654ffff, ollcase[0], 0x7654ffff, ollcase[1], aufsuff, aufsuff);
}
function getEOLineScramble() {
    return getAnyScramble(0xffff7f5fffff, 0x000000000000, 0xffffffff, 0xffffffff);
}
function getEasyCrossScramble(type, length) {
    var cases = (0, cross_2.getEasyCross)(length);
    return getAnyScramble(cases[0], cases[1], 0xffffffff, 0xffffffff);
}
function genFacelet(facelet) {
    return search.solution(facelet, 21, 1e9, 50, 2);
}
function solvFacelet(facelet) {
    return search.solution(facelet, 21, 1e9, 50, 0);
}
function getCustomScramble(type, length, cases) {
    var ep = 0;
    var eo = 0;
    var cp = 0;
    var co = 0;
    var chk = 0x1100; //ep+cp|ep+1|cp+1|eo|co
    cases = cases || (0, mathlib_1.valuedArray)(40, 1);
    for (var i = 0; i < 12; i++) {
        chk += (cases[i] ? 0x11000 : 0) + (cases[i + 20] ? 0x10 : 0);
        ep += (cases[i] ? 0xf : i) * Math.pow(16, i);
        eo += (cases[i + 20] ? 0xf : 0) * Math.pow(16, i);
    }
    for (var i = 0; i < 8; i++) {
        chk += (cases[i + 12] ? 0x10100 : 0) + (cases[i + 32] ? 0x1 : 0);
        cp += (cases[i + 12] ? 0xf : i) * Math.pow(16, i);
        co += (cases[i + 32] ? 0xf : 0) * Math.pow(16, i);
    }
    if ((chk & 0x1cccee) == 0) {
        return "U' U ";
    }
    return getAnyScramble(ep, eo, cp, co);
}
var daufsuff = [[], [Dx1], [Dx2], [Dx3]];
var daufrot = ["", "y", "y2", "y'"];
function getMehta3QBScramble() {
    var rnd4 = (0, mathlib_1.rn)(4);
    return (getAnyScramble(0xffff765fffff, 0xffff000fffff, 0xf65fffff, 0xf00fffff, [
        daufsuff[rnd4],
    ]) + daufrot[rnd4]);
}
function getMehtaEOLEScramble() {
    var skip = (0, mathlib_1.rn)(4);
    var rnd4 = (0, mathlib_1.rn)(4);
    return (getAnyScramble(0xba98765fffff + (0x4567 & (0xf << (skip * 4))) * 0x100000000, 0x0000000fffff + (0xf << (skip * 4)) * 0x100000000, 0xf65fffff, 0xf00fffff, [daufsuff[rnd4]]) + daufrot[rnd4]);
}
function getMehtaTDRScramble() {
    return getAnyScramble(0xba98765fffff, 0x000000000000, 0xf65fffff, 0xf00fffff);
}
function getMehta6CPScramble() {
    return getAnyScramble(0xba98765fffff, 0x000000000000, 0xf65fffff, 0x00000000);
}
function getMehtaL5EPScramble() {
    return getAnyScramble(0xba98765fffff, 0x000000000000, 0x76543210, 0x00000000);
}
function getMehtaCDRLLScramble() {
    return getAnyScramble(0xba98765fffff, 0x000000000000, 0x7654ffff, 0x0000ffff);
}
var customfilter = [
    "UR",
    "UF",
    "UL",
    "UB",
    "DR",
    "DF",
    "DL",
    "DB",
    "RF",
    "LF",
    "LB",
    "RB",
    "URF",
    "UFL",
    "ULB",
    "UBR",
    "DFR",
    "DLF",
    "DBL",
    "DRB",
];
for (var i = 0; i < 20; i++) {
    var piece = customfilter[i];
    customfilter[i + 20] = (piece.length == 2 ? "OriE-" : "OriC-") + piece;
    customfilter[i] = (piece.length == 2 ? "PermE-" : "PermC-") + piece;
}
var customprobs = (0, mathlib_1.valuedArray)(40, 0);
var ttll_map = [
    [0x32410, 0x3210, "FBar-1"],
    [0x32410, 0x3102, "FBar-2"],
    [0x32410, 0x3021, "FBar-3"],
    [0x32410, 0x2301, "FBar-4"],
    [0x32410, 0x2130, "FBar-5"],
    [0x32410, 0x2013, "FBar-6"],
    [0x32410, 0x1320, "FBar-7"],
    [0x32410, 0x1203, "FBar-8"],
    [0x32410, 0x1032, "FBar-9"],
    [0x32410, 0x0312, "FBar-10"],
    [0x32410, 0x0231, "FBar-11"],
    [0x32410, 0x0123, "FBar-12"],
    [0x32401, 0x3201, "2Opp-1"],
    [0x32401, 0x3120, "2Opp-2"],
    [0x32401, 0x3012, "2Opp-3"],
    [0x32401, 0x2310, "2Opp-4"],
    [0x32401, 0x2103, "2Opp-5"],
    [0x32401, 0x2031, "2Opp-6"],
    [0x32401, 0x1302, "2Opp-7"],
    [0x32401, 0x1230, "2Opp-8"],
    [0x32401, 0x1023, "2Opp-9"],
    [0x32401, 0x0321, "2Opp-10"],
    [0x32401, 0x0213, "2Opp-11"],
    [0x32401, 0x0132, "2Opp-12"],
    [0x31420, 0x3201, "ROpp-1"],
    [0x31420, 0x3120, "ROpp-2"],
    [0x31420, 0x3012, "ROpp-3"],
    [0x31420, 0x2310, "ROpp-4"],
    [0x31420, 0x2103, "ROpp-5"],
    [0x31420, 0x2031, "ROpp-6"],
    [0x31420, 0x1302, "ROpp-7"],
    [0x31420, 0x1230, "ROpp-8"],
    [0x31420, 0x1023, "ROpp-9"],
    [0x31420, 0x0321, "ROpp-10"],
    [0x31420, 0x0213, "ROpp-11"],
    [0x31420, 0x0132, "ROpp-12"],
    [0x31402, 0x3210, "RBar-1"],
    [0x31402, 0x3102, "RBar-2"],
    [0x31402, 0x3021, "RBar-3"],
    [0x31402, 0x2301, "RBar-4"],
    [0x31402, 0x2130, "RBar-5"],
    [0x31402, 0x2013, "RBar-6"],
    [0x31402, 0x1320, "RBar-7"],
    [0x31402, 0x1203, "RBar-8"],
    [0x31402, 0x1032, "RBar-9"],
    [0x31402, 0x0312, "RBar-10"],
    [0x31402, 0x0231, "RBar-11"],
    [0x31402, 0x0123, "RBar-12"],
    [0x30421, 0x3210, "2Bar-1"],
    [0x30421, 0x3102, "2Bar-2"],
    [0x30421, 0x3021, "2Bar-3"],
    [0x30421, 0x2301, "2Bar-4"],
    [0x30421, 0x2130, "2Bar-5"],
    [0x30421, 0x2013, "2Bar-6"],
    [0x30421, 0x1320, "2Bar-7"],
    [0x30421, 0x1203, "2Bar-8"],
    [0x30421, 0x1032, "2Bar-9"],
    [0x30421, 0x0312, "2Bar-10"],
    [0x30421, 0x0231, "2Bar-11"],
    [0x30421, 0x0123, "2Bar-12"],
    [0x30412, 0x3201, "FOpp-1"],
    [0x30412, 0x3120, "FOpp-2"],
    [0x30412, 0x3012, "FOpp-3"],
    [0x30412, 0x2310, "FOpp-4"],
    [0x30412, 0x2103, "FOpp-5"],
    [0x30412, 0x2031, "FOpp-6"],
    [0x30412, 0x1302, "FOpp-7"],
    [0x30412, 0x1230, "FOpp-8"],
    [0x30412, 0x1023, "FOpp-9"],
    [0x30412, 0x0321, "FOpp-10"],
    [0x30412, 0x0213, "FOpp-11"],
    [0x30412, 0x0132, "FOpp-12"],
];
var ttllprobs = [];
var ttllfilter = [];
for (var i = 0; i < ttll_map.length; i++) {
    ttllprobs[i] = 1;
    ttllfilter[i] = ttll_map[i][2];
}
function getTTLLScramble(type, length, cases) {
    var ttllcase = ttll_map[(0, scramble_1.fixCase)(cases, ttllprobs)];
    return getAnyScramble(0xba9876540000 + ttllcase[1], 0x000000000000, 0x76500000 + ttllcase[0], 0x00000000, aufsuff, aufsuff);
}
var eols_map = [];
var eolsprobs = [];
var eolsfilter = [];
for (var i = 0; i < exports.f2l_map.length; i++) {
    if (exports.f2l_map[i][0] & 0xf0) {
        continue;
    }
    eols_map.push(exports.f2l_map[i][0]);
    eolsprobs.push(f2lprobs[i]);
    eolsfilter.push(exports.f2lfilter[i]);
}
function getEOLSScramble(type, length, cases) {
    var caze = eols_map[(0, scramble_1.fixCase)(cases, eolsprobs)];
    var ep = Math.pow(16, caze & 0xf);
    var cp = Math.pow(16, (caze >> 8) & 0xf);
    var co = 0xf ^ ((caze >> 12) & 3);
    return getAnyScramble(0xba9f7654ffff - 7 * ep, 0x000000000000, 0x765fffff - 0xb * cp, 0x000fffff - co * cp, aufsuff);
}
var wvls_map = [];
var wvlsprobs = [];
var wvlsfilter = [
    "Oriented",
    "Rectangle-1",
    "Rectangle-2",
    "Tank-1",
    "Bowtie-1",
    "Bowtie-3",
    "Tank-2",
    "Bowtie-2",
    "Bowtie-4",
    "Snake-1",
    "Adjacent-1",
    "Adjacent-2",
    "Gun-Far",
    "Sune-1",
    "Pi-Near",
    "Gun-Back",
    "Pi-Front",
    "H-Side",
    "Snake-2",
    "Adjacent-3",
    "Adjacent-4",
    "Gun-Sides",
    "H-Front",
    "Pi-Back",
    "Gun-Near",
    "Pi-Far",
    "Sune-2",
];
for (var i = 0; i < 27; i++) {
    wvls_map[i] = (~~(i / 9) << 12) | (~~(i / 3) % 3 << 8) | i % 3;
    wvlsprobs[i] = 1;
}
function getWVLSScramble(type, length, cases) {
    var caze = wvls_map[(0, scramble_1.fixCase)(cases, wvlsprobs)];
    return getAnyScramble(0xba9f7654ff8f, 0x000000000000, 0x765fff4f, 0x000f0020 | caze);
}
var vls_map = [];
var vlsprobs = [];
var vlsfilter = [];
for (var i = 0; i < 27 * 8; i++) {
    var co = i % 27;
    var eo = ~~(i / 27);
    vls_map[i] = [
        (~~(co / 9) % 3 << 12) | (~~(co / 3) % 3 << 8) | co % 3,
        (((eo >> 2) & 1) << 12) | (((eo >> 1) & 1) << 8) | (eo & 1),
    ];
    vlsprobs[i] = 1;
    vlsfilter[i] =
        ["WVLS", "UB", "UF", "UF UB", "UL", "UB UL", "UF UL", "No Edge"][eo] +
            "-" +
            (co + 1);
}
function getVLSScramble(type, length, cases) {
    var caze = vls_map[(0, scramble_1.fixCase)(cases, vlsprobs)];
    return getAnyScramble(0xba9f7654ff8f, 0x000f00000000 + caze[1], 0x765fff4f, 0x000f0020 + caze[0], [[Ux3]]);
}
function getSBRouxScramble() {
    var rnd4 = (0, mathlib_1.rn)(4);
    return (getAnyScramble(0xfa9ff6ffffff, 0xf00ff0ffffff, 0xf65fffff, 0xf00fffff, [
        rlpresuff[rnd4],
    ]) + rlappsuff[rnd4]);
}
function getEasyXCrossScramble(type, length) {
    var cases = (0, cross_1.getEasyXCross)(length);
    return getAnyScramble(cases[0], cases[1], cases[2], cases[3]);
}
(0, scramble_1.regScrambler)("333", getRandomScramble)("333oh", getRandomScramble)("333ft", getRandomScramble)("333fm", getFMCScramble)("edges", getEdgeScramble)("corners", getCornerScramble)("ll", getLLScramble)("lsll2", getLSLLScramble, [exports.f2lfilter, f2lprobs])("f2l", getF2LScramble, [crossFilter, crossProbs])("zbll", getZBLLScramble, [zbfilter, zbprobs])("zzll", getZZLLScramble)("zbls", getZBLSScramble)("lse", getLSEScramble)("cmll", getCMLLScramble, [cmfilter, cmprobs])("cll", getCLLScramble)("ell", getELLScramble)("pll", getPLLScramble, [exports.pllfilter, pllprobs])("oll", getOLLScramble, [exports.ollfilter, ollprobs])("2gll", get2GLLScramble)("easyc", getEasyCrossScramble)("eoline", getEOLineScramble)("333custom", getCustomScramble, [customfilter, customprobs])("ttll", getTTLLScramble, [ttllfilter, ttllprobs])("eols", getEOLSScramble, [eolsfilter, eolsprobs])("wvls", getWVLSScramble, [
    wvlsfilter,
    wvlsprobs,
])("vls", getVLSScramble, [vlsfilter, vlsprobs])("coll", getCOLLScramble, [
    cofilter,
    coprobs,
])("sbrx", getSBRouxScramble)("mt3qb", getMehta3QBScramble)("mteole", getMehtaEOLEScramble)("mttdr", getMehtaTDRScramble)("mt6cp", getMehta6CPScramble)("mtl5ep", getMehtaL5EPScramble)("mtcdrll", getMehtaCDRLLScramble)("easyxc", getEasyXCrossScramble);
