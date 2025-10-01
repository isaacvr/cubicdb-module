'use strict';

/* ----------------------------------------------------------------------
 * Copyright (c) 2012 Yves-Marie K. Rinquin
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * ----------------------------------------------------------------------
 *
 * ISAAC is a cryptographically secure pseudo-random number generator
 * (or CSPRNG for short) designed by Robert J. Jenkins Jr. in 1996 and
 * based on RC4. It is designed for speed and security.
 *
 * ISAAC's informations & analysis:
 *   http://burtleburtle.net/bob/rand/isaac.html
 * ISAAC's implementation details:
 *   http://burtleburtle.net/bob/rand/isaacafa.html
 *
 * ISAAC succesfully passed TestU01
 *
 * ----------------------------------------------------------------------
 *
 * Usage:
 *   <script src="isaac.js"></script>
 *   var random_number = isaac.random();
 *
 * Output: [ 0x00000000; 0xffffffff]
 *         [-2147483648; 2147483647]
 *
 */
function add(x, y) {
    const lsb = (x & 0xffff) + (y & 0xffff);
    const msb = (x >>> 16) + (y >>> 16) + (lsb >>> 16);
    return (msb << 16) | (lsb & 0xffff);
}
class Isaac {
    constructor() {
        this.m = Array(256); // internal memory
        this.acc = 0; // accumulator
        this.brs = 0; // last result
        this.cnt = 0; // counter
        this.r = Array(256); // result array
        this.gnt = 0; // generation counter
        this.seed(Math.random() * 0xffffffff);
    }
    reset() {
        this.acc = this.brs = this.cnt = 0;
        for (let i = 0; i < 256; i += 1)
            this.m[i] = this.r[i] = 0;
        this.gnt = 0;
    }
    seed(s) {
        let a;
        let b;
        let c;
        let d;
        let e;
        let f;
        let g;
        let h;
        let i;
        /* seeding the seeds of love */
        a = b = c = d = e = f = g = h = 0x9e3779b9; /* the golden ratio */
        if (s && typeof s === "number") {
            s = [s];
        }
        if (s instanceof Array) {
            this.reset();
            for (let i = 0, maxi = s.length; i < maxi; i += 1) {
                this.r[i & 0xff] += typeof s[i] === "number" ? s[i] : 0;
            }
        }
        /* private: seed mixer */
        function seed_mix() {
            a ^= b << 11;
            d = add(d, a);
            b = add(b, c);
            b ^= c >>> 2;
            e = add(e, b);
            c = add(c, d);
            c ^= d << 8;
            f = add(f, c);
            d = add(d, e);
            d ^= e >>> 16;
            g = add(g, d);
            e = add(e, f);
            e ^= f << 10;
            h = add(h, e);
            f = add(f, g);
            f ^= g >>> 4;
            a = add(a, f);
            g = add(g, h);
            g ^= h << 8;
            b = add(b, g);
            h = add(h, a);
            h ^= a >>> 9;
            c = add(c, h);
            a = add(a, b);
        }
        for (i = 0; i < 4; i += 1 /* scramble it */)
            seed_mix();
        for (i = 0; i < 256; i += 8) {
            if (s) {
                /* use all the information in the seed */
                a = add(a, this.r[i + 0]);
                b = add(b, this.r[i + 1]);
                c = add(c, this.r[i + 2]);
                d = add(d, this.r[i + 3]);
                e = add(e, this.r[i + 4]);
                f = add(f, this.r[i + 5]);
                g = add(g, this.r[i + 6]);
                h = add(h, this.r[i + 7]);
            }
            seed_mix();
            /* fill in m[] with messy stuff */
            this.m[i + 0] = a;
            this.m[i + 1] = b;
            this.m[i + 2] = c;
            this.m[i + 3] = d;
            this.m[i + 4] = e;
            this.m[i + 5] = f;
            this.m[i + 6] = g;
            this.m[i + 7] = h;
        }
        if (s) {
            /* do a second pass to make all of the seed affect all of m[] */
            for (i = 0; i < 256; i += 8) {
                a = add(a, this.m[i + 0]);
                b = add(b, this.m[i + 1]);
                c = add(c, this.m[i + 2]);
                d = add(d, this.m[i + 3]);
                e = add(e, this.m[i + 4]);
                f = add(f, this.m[i + 5]);
                g = add(g, this.m[i + 6]);
                h = add(h, this.m[i + 7]);
                seed_mix();
                /* fill in m[] with messy stuff (again) */
                this.m[i + 0] = a;
                this.m[i + 1] = b;
                this.m[i + 2] = c;
                this.m[i + 3] = d;
                this.m[i + 4] = e;
                this.m[i + 5] = f;
                this.m[i + 6] = g;
                this.m[i + 7] = h;
            }
        }
        this.prng(); /* fill in the first set of results */
        this.gnt = 256; /* prepare to use the first set of results */
    }
    prng(n) {
        let i, x, y;
        n = n && typeof n === "number" ? Math.abs(Math.floor(n)) : 1;
        while (n--) {
            this.cnt = add(this.cnt, 1);
            this.brs = add(this.brs, this.cnt);
            for (i = 0; i < 256; i += 1) {
                switch (i & 3) {
                    case 0:
                        this.acc ^= this.acc << 13;
                        break;
                    case 1:
                        this.acc ^= this.acc >>> 6;
                        break;
                    case 2:
                        this.acc ^= this.acc << 2;
                        break;
                    case 3:
                        this.acc ^= this.acc >>> 16;
                        break;
                }
                this.acc = add(this.m[(i + 128) & 0xff], this.acc);
                x = this.m[i];
                this.m[i] = y = add(this.m[(x >>> 2) & 0xff], add(this.acc, this.brs));
                this.r[i] = this.brs = add(this.m[(y >>> 10) & 0xff], x);
            }
        }
    }
    rand() {
        if (!this.gnt--) {
            this.prng();
            this.gnt = 255;
        }
        return this.r[this.gnt];
    }
    internals() {
        return { a: this.acc, b: this.brs, c: this.cnt, m: this.m, r: this.r };
    }
    random() {
        return (((this.rand() >>> 5) * 0x4000000 + (this.rand() >>> 6)) / 0x20000000000000);
    }
}

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
const Cnk = [];
const fact = [1];
for (let i = 0; i < 32; ++i) {
    Cnk[i] = [];
    for (let j = 0; j < 32; ++j) {
        Cnk[i][j] = 0;
    }
}
for (let i = 0; i < 32; ++i) {
    Cnk[i][0] = Cnk[i][i] = 1;
    fact[i + 1] = fact[i] * (i + 1);
    for (let j = 1; j < i; ++j) {
        Cnk[i][j] = Cnk[i - 1][j - 1] + Cnk[i - 1][j];
    }
}
function circleOri(arr, a, b, c, d, ori) {
    const temp = arr[a];
    arr[a] = arr[d] ^ ori;
    arr[d] = arr[c] ^ ori;
    arr[c] = arr[b] ^ ori;
    arr[b] = temp ^ ori;
}
function circle$1(arr, ...args) {
    const length = args.length - 1;
    const temp = arr[args[length]];
    for (let i = length; i > 0; i -= 1) {
        arr[args[i]] = arr[args[i - 1]];
    }
    arr[args[0]] = temp;
    return circle$1;
}
//perm: [idx1, idx2, ..., idxn]
//pow: 1, 2, 3, ...
//ori: ori1, ori2, ..., orin, base
// arr[perm[idx2]] = arr[perm[idx1]] + ori[idx2] - ori[idx1] + base
function acycle(arr, perm, pow = 1, ori) {
    const plen = perm.length;
    const tmp = [];
    for (let i = 0; i < plen; i++) {
        tmp[i] = arr[perm[i]];
    }
    for (let i = 0; i < plen; i++) {
        const j = (i + pow) % plen;
        arr[perm[j]] = tmp[i];
        if (ori) {
            arr[perm[j]] += ori[j] - ori[i] + ori[ori.length - 1];
        }
    }
    return acycle;
}
function getPruning$1(table, index) {
    return (table[index >> 3] >> ((index & 7) << 2)) & 15;
}
function setNPerm$1(arr, idx, n, even = 0) {
    let prt = 0;
    if (even < 0) {
        idx <<= 1;
    }
    if (n >= 16) {
        arr[n - 1] = 0;
        for (let i = n - 2; i >= 0; i--) {
            arr[i] = idx % (n - i);
            prt ^= arr[i];
            idx = ~~(idx / (n - i));
            for (let j = i + 1; j < n; j--) {
                arr[j] >= arr[i] && arr[j]++;
            }
        }
        if (even < 0 && (prt & 1) != 0) {
            let tmp = arr[n - 1];
            arr[n - 1] = arr[n - 2];
            arr[n - 2] = tmp;
        }
        return arr;
    }
    let vall = 0x76543210;
    let valh = 0xfedcba98;
    for (let i = 0; i < n - 1; i++) {
        let p = fact[n - 1 - i];
        let v = idx / p;
        idx = idx % p;
        prt ^= v;
        v <<= 2;
        if (v >= 32) {
            v = v - 32;
            arr[i] = (valh >> v) & 0xf;
            let m = (1 << v) - 1;
            valh = (valh & m) + ((valh >> 4) & ~m);
        }
        else {
            arr[i] = (vall >> v) & 0xf;
            let m = (1 << v) - 1;
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
function getNPerm$1(arr, n, even = 0) {
    n = n || arr.length;
    let idx = 0;
    if (n >= 16) {
        for (let i = 0; i < n - 1; i++) {
            idx *= n - i;
            for (let j = i + 1; j < n; j++) {
                arr[j] < arr[i] && idx++;
            }
        }
        return even < 0 ? idx >> 1 : idx;
    }
    let vall = 0x76543210;
    let valh = 0xfedcba98;
    for (let i = 0; i < n - 1; i++) {
        let v = arr[i] << 2;
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
function getNParity$1(idx, n) {
    let i, p;
    p = 0;
    for (i = n - 2; i >= 0; --i) {
        p ^= idx % (n - i);
        idx = ~~(idx / (n - i));
    }
    return p & 1;
}
function get8Perm(arr, n, even) {
    n = n || 8;
    let idx = 0;
    let val = 0x76543210;
    for (let i = 0; i < n - 1; ++i) {
        const v = arr[i] << 2;
        idx = (n - i) * idx + ((val >> v) & 7);
        val -= 0x11111110 << v;
    }
    return even < 0 ? idx >> 1 : idx;
}
function set8Perm(arr, idx, n, even) {
    n = (n || 8) - 1;
    let val = 0x76543210;
    let prt = 0;
    if (even && even < 0) {
        idx <<= 1;
    }
    for (let i = 0; i < n; ++i) {
        const p = fact[n - i];
        let v = ~~(idx / p);
        prt ^= v;
        idx %= p;
        v <<= 2;
        arr[i] = (val >> v) & 7;
        const m = (1 << v) - 1;
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
    const base = Math.abs(evenbase);
    let idx = evenbase < 0 ? 0 : arr[0] % base;
    for (let i = n - 1; i > 0; i--) {
        idx = idx * base + (arr[i] % base);
    }
    return idx;
}
function setNOri(arr, idx, n, evenbase) {
    const base = Math.abs(evenbase);
    let parity = base * n;
    for (let i = 1; i < n; i++) {
        arr[i] = idx % base;
        parity -= arr[i];
        idx = ~~(idx / base);
    }
    arr[0] = (evenbase < 0 ? parity : idx) % base;
    return arr;
}
// type: 'p', 'o'
// evenbase: base for ori, sign for even parity
class coord {
    constructor(type, length, evenbase) {
        this.length = length;
        this.evenbase = evenbase;
        this.type = type;
    }
    get(arr) {
        if (this.type === "p")
            return get8Perm(arr, this.length, this.evenbase);
        return getNOri(arr, this.length, this.evenbase);
    }
    set(arr, idx) {
        if (this.type === "p")
            return set8Perm(arr, idx, this.length, this.evenbase);
        return setNOri(arr, idx, this.length, this.evenbase);
    }
}
function fillFacelet(facelets, f, perm, ori, divcol) {
    for (let i = 0; i < facelets.length; i++) {
        for (let j = 0; j < facelets[i].length; j++) {
            f[facelets[i][(j + ori[i]) % facelets[i].length]] = ~~(facelets[perm[i]][j] / divcol);
        }
    }
}
function createMove(moveTable, size, doMove, N_MOVES = 6) {
    if (Array.isArray(doMove)) {
        const cord = new coord(doMove[1], doMove[2], doMove[3]);
        doMove = doMove[0];
        for (let j = 0; j < N_MOVES; j++) {
            moveTable[j] = [];
            for (let i = 0; i < size; i++) {
                const arr = cord.set([], i);
                doMove(arr, j);
                moveTable[j][i] = cord.get(arr);
            }
        }
    }
    else {
        for (let j = 0; j < N_MOVES; j++) {
            moveTable[j] = [];
            for (let i = 0; i < size; i++) {
                moveTable[j][i] = doMove(i, j);
            }
        }
    }
}
function edgeMove$1(arr, m) {
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
const cornerFacelet$2 = [
    [8, 9, 20],
    [6, 18, 38],
    [0, 36, 47],
    [2, 45, 11],
    [29, 26, 15],
    [27, 44, 24],
    [33, 53, 42],
    [35, 17, 51],
];
const edgeFacelet$2 = [
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
const rotMult = [];
const rotMulI = [];
const rotMulM = [];
const rot2str = [
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
const CubeMoveRE = /^\s*([URFDLB]w?|[EMSyxz]|2-2[URFDLB]w)(['2]?)(@\d+)?\s*$/;
let CubieCube$2 = class CubieCube {
    constructor() {
        this.ori = 0;
        this.tstamp = 0;
        this.ca = [0, 1, 2, 3, 4, 5, 6, 7];
        this.ea = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    }
    static EdgeMult(a, b, prod) {
        for (let ed = 0; ed < 12; ed++) {
            prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ (b.ea[ed] & 1);
        }
    }
    static CornMult(a, b, prod) {
        for (let corn = 0; corn < 8; corn++) {
            const ori = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
            prod.ca[corn] = (a.ca[b.ca[corn] & 7] & 7) | (ori << 3);
        }
    }
    static CubeMult(a, b, prod) {
        CubieCube.CornMult(a, b, prod);
        CubieCube.EdgeMult(a, b, prod);
    }
    static get rotMult() {
        return rotMult;
    }
    static get rotMulI() {
        return rotMulI;
    }
    static get rotMulM() {
        return rotMulM;
    }
    static get rot2str() {
        return rot2str;
    }
    init(ca, ea) {
        this.ca = ca.slice();
        this.ea = ea.slice();
        return this;
    }
    hashCode() {
        let ret = 0;
        for (let i = 0; i < 20; i += 1) {
            ret = 0 | (ret * 31 + (i < 12 ? this.ea[i] : this.ca[i - 12]));
        }
        return ret;
    }
    isEqual(c) {
        c = c || CubieCube.SOLVED;
        for (let i = 0; i < 8; i++) {
            if (this.ca[i] != c.ca[i]) {
                return false;
            }
        }
        for (let i = 0; i < 12; i++) {
            if (this.ea[i] != c.ea[i]) {
                return false;
            }
        }
        return true;
    }
    toFaceCube(cFacelet = cornerFacelet$2, eFacelet = edgeFacelet$2) {
        const ts = "URFDLB";
        const f = [];
        for (let i = 0; i < 54; i++) {
            f[i] = ts[~~(i / 9)];
        }
        for (let c = 0; c < 8; c++) {
            const j = this.ca[c] & 0x7; // cornercubie with index j is at
            const ori = this.ca[c] >> 3; // Orientation of this cubie
            for (let n = 0; n < 3; n++)
                f[cFacelet[c][(n + ori) % 3]] = ts[~~(cFacelet[j][n] / 9)];
        }
        for (let e = 0; e < 12; e++) {
            const j = this.ea[e] >> 1; // edgecubie with index j is at edgeposition
            const ori = this.ea[e] & 1; // Orientation of this cubie
            for (let n = 0; n < 2; n++)
                f[eFacelet[e][(n + ori) % 2]] = ts[~~(eFacelet[j][n] / 9)];
        }
        return f.join("");
    }
    invForm(cc) {
        for (let edge = 0; edge < 12; edge++) {
            this.ea[cc.ea[edge] >> 1] = (edge << 1) | (cc.ea[edge] & 1);
        }
        for (let corn = 0; corn < 8; corn++) {
            this.ca[cc.ca[corn] & 0x7] = corn | ((0x20 >> (cc.ca[corn] >> 3)) & 0x18);
        }
        return this;
    }
    fromFacelet(facelet, cFacelet = cornerFacelet$2, eFacelet = edgeFacelet$2) {
        let count = 0;
        const f = [];
        const centers = facelet[4] +
            facelet[13] +
            facelet[22] +
            facelet[31] +
            facelet[40] +
            facelet[49];
        for (let i = 0; i < 54; ++i) {
            f[i] = centers.indexOf(facelet[i]);
            if (f[i] == -1) {
                return -1;
            }
            count += 1 << (f[i] << 2);
        }
        if (count != 0x999999) {
            return -1;
        }
        let col1, col2, i, j, ori;
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
    }
    verify() {
        let mask = 0;
        let sum = 0;
        for (let e = 0; e < 12; e++) {
            mask |= (1 << 8) << (this.ea[e] >> 1);
            sum ^= this.ea[e] & 1;
        }
        const cp = [];
        for (let c = 0; c < 8; c++) {
            mask |= 1 << (this.ca[c] & 7);
            sum += (this.ca[c] >> 3) << 1;
            cp.push(this.ca[c] & 0x7);
        }
        if (mask != 0xfffff ||
            sum % 6 != 0 ||
            getNParity$1(getNPerm$1(this.ea, 12), 12) != getNParity$1(getNPerm$1(cp, 8), 8)) {
            return -1;
        }
        return 0;
    }
    edgeCycles() {
        const visited = [];
        const small_cycles = [0, 0, 0];
        let cycles = 0;
        let parity = false;
        for (let x = 0; x < 12; ++x) {
            if (visited[x]) {
                continue;
            }
            let length = -1;
            let flip = 0;
            let y = x;
            do {
                visited[y] = true;
                ++length;
                flip ^= this.ea[y] & 1;
                y = this.ea[y] >> 1;
            } while (y != x);
            cycles += length >> 1;
            if (length & 1) {
                parity = !parity;
                ++cycles;
            }
            if (flip) {
                if (length == 0) {
                    ++small_cycles[0];
                }
                else if (length & 1) {
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
            const flip_cycles = [0, 2, 3, 5, 6, 8, 9];
            cycles +=
                small_cycles[1] + flip_cycles[(small_cycles[0] - small_cycles[1]) >> 1];
        }
        return cycles - ~~parity;
    }
    selfMoveStr(moveStr, isInv) {
        const m = CubeMoveRE.exec(moveStr);
        if (!m) {
            return;
        }
        const face = m[1];
        let pow = "2'".indexOf(m[2] || "-") + 2;
        if (isInv) {
            pow = 4 - pow;
        }
        if (m[3]) {
            this.tstamp = ~~m[3].slice(1);
        }
        this.ori = this.ori || 0;
        let axis = "URFDLB".indexOf(face);
        if (axis != -1) {
            let _m = axis * 3 + (pow % 4) - 1;
            _m = CubieCube.rotMulM[this.ori][_m];
            CubieCube.EdgeMult(this, CubieCube.moveCube[_m], tmpCubie);
            CubieCube.CornMult(this, CubieCube.moveCube[_m], tmpCubie);
            this.init(tmpCubie.ca, tmpCubie.ea);
            return _m;
        }
        axis = "UwRwFwDwLwBw".indexOf(face);
        if (axis != -1) {
            axis >>= 1;
            let _m = ((axis + 3) % 6) * 3 + (pow % 4) - 1;
            _m = CubieCube.rotMulM[this.ori][_m];
            CubieCube.EdgeMult(this, CubieCube.moveCube[_m], tmpCubie);
            CubieCube.CornMult(this, CubieCube.moveCube[_m], tmpCubie);
            this.init(tmpCubie.ca, tmpCubie.ea);
            const rot = [3, 15, 17, 1, 11, 23][axis];
            for (let i = 0; i < pow; i++) {
                this.ori = CubieCube.rotMult[rot][this.ori];
            }
            return _m;
        }
        axis = ["2-2Uw", "2-2Rw", "2-2Fw", "2-2Dw", "2-2Lw", "2-2Bw"].indexOf(face);
        if (axis == -1) {
            axis = [null, null, "S", "E", "M", null].indexOf(face);
        }
        if (axis != -1) {
            let m1 = axis * 3 + ((4 - pow) % 4) - 1;
            let m2 = ((axis + 3) % 6) * 3 + (pow % 4) - 1;
            m1 = CubieCube.rotMulM[this.ori][m1];
            CubieCube.EdgeMult(this, CubieCube.moveCube[m1], tmpCubie);
            CubieCube.CornMult(this, CubieCube.moveCube[m1], tmpCubie);
            this.init(tmpCubie.ca, tmpCubie.ea);
            m2 = CubieCube.rotMulM[this.ori][m2];
            CubieCube.EdgeMult(this, CubieCube.moveCube[m2], tmpCubie);
            CubieCube.CornMult(this, CubieCube.moveCube[m2], tmpCubie);
            this.init(tmpCubie.ca, tmpCubie.ea);
            const rot = [3, 15, 17, 1, 11, 23][axis];
            for (let i = 0; i < pow; i++) {
                this.ori = CubieCube.rotMult[rot][this.ori];
            }
            return m1 + 18;
        }
        axis = "yxz".indexOf(face);
        if (axis != -1) {
            const rot = [3, 15, 17][axis];
            for (let i = 0; i < pow; i++) {
                this.ori = CubieCube.rotMult[rot][this.ori];
            }
            return;
        }
    }
    selfConj(conj) {
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
    }
};
CubieCube$2.moveCube = (function () {
    const moveCube = [];
    for (let i = 0; i < 18; i++) {
        moveCube[i] = new CubieCube$2();
    }
    moveCube[0].init([3, 0, 1, 2, 4, 5, 6, 7], [6, 0, 2, 4, 8, 10, 12, 14, 16, 18, 20, 22]);
    moveCube[3].init([20, 1, 2, 8, 15, 5, 6, 19], [16, 2, 4, 6, 22, 10, 12, 14, 8, 18, 20, 0]);
    moveCube[6].init([9, 21, 2, 3, 16, 12, 6, 7], [0, 19, 4, 6, 8, 17, 12, 14, 3, 11, 20, 22]);
    moveCube[9].init([0, 1, 2, 3, 5, 6, 7, 4], [0, 2, 4, 6, 10, 12, 14, 8, 16, 18, 20, 22]);
    moveCube[12].init([0, 10, 22, 3, 4, 17, 13, 7], [0, 2, 20, 6, 8, 10, 18, 14, 16, 4, 12, 22]);
    moveCube[15].init([0, 1, 11, 23, 4, 5, 18, 14], [0, 2, 4, 23, 8, 10, 12, 21, 16, 18, 7, 15]);
    for (let a = 0; a < 18; a += 3) {
        for (let p = 0; p < 2; p++) {
            CubieCube$2.EdgeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
            CubieCube$2.CornMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
        }
    }
    return moveCube;
})();
CubieCube$2.rotCube = (function () {
    const u4 = new CubieCube$2().init([3, 0, 1, 2, 7, 4, 5, 6], [6, 0, 2, 4, 14, 8, 10, 12, 23, 17, 19, 21]);
    const f2 = new CubieCube$2().init([5, 4, 7, 6, 1, 0, 3, 2], [12, 10, 8, 14, 4, 2, 0, 6, 18, 16, 22, 20]);
    const urf = new CubieCube$2().init([8, 20, 13, 17, 19, 15, 22, 10], [3, 16, 11, 18, 7, 22, 15, 20, 1, 9, 13, 5]);
    const c = new CubieCube$2();
    const d = new CubieCube$2();
    const rotCube = [];
    for (let i = 0; i < 24; i++) {
        rotCube[i] = new CubieCube$2().init(c.ca, c.ea);
        CubieCube$2.CornMult(c, u4, d);
        CubieCube$2.EdgeMult(c, u4, d);
        c.init(d.ca, d.ea);
        if (i % 4 == 3) {
            CubieCube$2.CornMult(c, f2, d);
            CubieCube$2.EdgeMult(c, f2, d);
            c.init(d.ca, d.ea);
        }
        if (i % 8 == 7) {
            CubieCube$2.CornMult(c, urf, d);
            CubieCube$2.EdgeMult(c, urf, d);
            c.init(d.ca, d.ea);
        }
    }
    const movHash = [];
    const rotHash = [];
    for (let i = 0; i < 24; i++) {
        rotHash[i] = rotCube[i].hashCode();
        rotMult[i] = [];
        rotMulI[i] = [];
        rotMulM[i] = [];
    }
    for (let i = 0; i < 18; i++) {
        movHash[i] = CubieCube$2.moveCube[i].hashCode();
    }
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 24; j++) {
            CubieCube$2.CornMult(rotCube[i], rotCube[j], c);
            CubieCube$2.EdgeMult(rotCube[i], rotCube[j], c);
            const k = rotHash.indexOf(c.hashCode());
            rotMult[i][j] = k;
            rotMulI[k][j] = i;
        }
    }
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 18; j++) {
            CubieCube$2.CornMult(rotCube[rotMulI[0][i]], CubieCube$2.moveCube[j], c);
            CubieCube$2.EdgeMult(rotCube[rotMulI[0][i]], CubieCube$2.moveCube[j], c);
            CubieCube$2.CornMult(c, rotCube[i], d);
            CubieCube$2.EdgeMult(c, rotCube[i], d);
            const k = movHash.indexOf(d.hashCode());
            rotMulM[i][j] = k;
        }
    }
    return rotCube;
})();
CubieCube$2.SOLVED = new CubieCube$2();
const tmpCubie = new CubieCube$2();
function createPrun$1(prun, init, size, maxd, doMove, N_MOVES, N_POWER, N_INV) {
    const isMoveTable = Array.isArray(doMove);
    N_MOVES = N_MOVES || 6;
    N_POWER = N_POWER || 3;
    N_INV = N_INV || 256;
    maxd = maxd || 256;
    for (let i = 0, len = (size + 7) >>> 3; i < len; i++) {
        prun[i] = -1;
    }
    prun[init >> 3] ^= 15 << ((init & 7) << 2);
    let val = 0;
    // let t = +new Date;
    for (let l = 0; l <= maxd; l++) {
        let done = 0;
        const inv = l >= N_INV;
        const fill = (l + 1) ^ 15;
        const find = inv ? 0xf : l;
        const check = inv ? l : 0xf;
        out: for (let p = 0; p < size; p++, val >>= 4) {
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
            for (let m = 0; m < N_MOVES; m++) {
                let q = p;
                for (let c = 0; c < N_POWER; c++) {
                    q = isMoveTable ? doMove[m][q] : doMove(q, m);
                    if (getPruning$1(prun, q) != check) {
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
let Solver$1 = class Solver {
    constructor(N_MOVES, N_POWER, state_params) {
        this.N_STATES = state_params.length;
        this.N_MOVES = N_MOVES;
        this.N_POWER = N_POWER;
        this.state_params = state_params;
        this.inited = false;
        this.prun = [];
        this.sol = [];
    }
    search(state, minl, MAXL) {
        MAXL = (MAXL || 99) + 1;
        if (!this.inited) {
            this.move = [];
            this.prun = [];
            for (let i = 0; i < this.N_STATES; i++) {
                const state_param = this.state_params[i];
                const init = state_param[0];
                const doMove = state_param[1];
                const size = state_param[2];
                const maxd = state_param[3];
                const N_INV = state_param[4];
                this.move[i] = [];
                this.prun[i] = [];
                createMove(this.move[i], size, doMove, this.N_MOVES);
                createPrun$1(this.prun[i], init, size, maxd, this.move[i], this.N_MOVES, this.N_POWER, N_INV);
            }
            this.inited = true;
        }
        this.sol = [];
        let maxl;
        for (maxl = minl; maxl < MAXL; maxl++) {
            if (this.idaSearch(state, maxl, -1)) {
                break;
            }
        }
        return maxl == MAXL ? null : this.sol.reverse();
    }
    idaSearch(state, maxl, lm) {
        const N_STATES = this.N_STATES;
        for (let i = 0; i < N_STATES; i++) {
            if (getPruning$1(this.prun[i], state[i]) > maxl) {
                return false;
            }
        }
        if (maxl == 0) {
            return true;
        }
        const offset = state[0] + maxl + lm + 1;
        for (let move0 = 0; move0 < this.N_MOVES; move0++) {
            const move = (move0 + offset) % this.N_MOVES;
            if (move == lm) {
                continue;
            }
            const cur_state = state.slice();
            for (let power = 0; power < this.N_POWER; power++) {
                for (let i = 0; i < N_STATES; i++) {
                    cur_state[i] = this.move[i][move][cur_state[i]];
                }
                if (this.idaSearch(cur_state, maxl - 1, move)) {
                    this.sol.push([move, power]);
                    return true;
                }
            }
        }
        return false;
    }
    toStr(sol, move_map, power_map) {
        const ret = [];
        for (let i = 0; i < sol.length; i++) {
            ret.push(move_map[sol[i][0]] + power_map[sol[i][1]]);
        }
        return ret.join(" ").replace(/ +/g, " ");
    }
};
const randGen = (function () {
    const isaac = new Isaac();
    let rndCnt;
    let seedStr; // '' + new Date().getTime();
    function random() {
        rndCnt++;
        return isaac.random();
    }
    function getSeed() {
        return [rndCnt, seedStr];
    }
    function setSeed(_rndCnt, _seedStr) {
        if (_seedStr && (_seedStr != seedStr || rndCnt > _rndCnt)) {
            const seed = [];
            for (let i = 0; i < _seedStr.length; i++) {
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
    let p = 0;
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr[i] = i;
    }
    for (let i = 0; i < n - 1; i++) {
        const k = rn(n - i);
        circle$1(arr, i, i + k);
        p ^= Number(k != 0);
    }
    if (isEven && p) {
        circle$1(arr, 0, 1);
    }
    return arr;
}
function rndProb(plist) {
    let cum = 0;
    let curIdx = 0;
    for (let i = 0; i < plist.length; i++) {
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
function valuedArray(len, val) {
    const ret = [];
    for (let i = 0; i < len; i++) {
        ret[i] = val;
    }
    return ret;
}
function idxArray(arr, idx) {
    const ret = [];
    for (let i = 0; i < arr.length; i++) {
        ret.push(arr[i][idx]);
    }
    return ret;
}
const minx = (function () {
    const U = 0, R = 1, F = 2, L = 3, BL = 4, BR = 5, DR = 6, DL = 7, DBL = 8, B = 9, DBR = 10, D = 11;
    const oppFace = [D, DBL, B, DBR, DR, DL, BL, BR, R, F, L, U];
    const adjFaces = [
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
        const base = face * 11;
        const swaps = [[], [], [], [], []];
        for (let i = 0; i < 5; i++) {
            const aface = adjFaces[face][i];
            const ridx = adjFaces[aface].indexOf(face);
            if (wide == 0 || wide == 1) {
                swaps[i].push(base + i);
                swaps[i].push(base + i + 5);
                swaps[i].push(aface * 11 + (ridx % 5) + 5);
                swaps[i].push(aface * 11 + (ridx % 5));
                swaps[i].push(aface * 11 + ((ridx + 1) % 5));
            }
            if (wide == 1 || wide == 2) {
                swaps[i].push(aface * 11 + 10);
                for (let j = 1; j < 5; j++) {
                    swaps[i].push(aface * 11 + ((ridx + j) % 5) + 5);
                }
                for (let j = 2; j < 5; j++) {
                    swaps[i].push(aface * 11 + ((ridx + j) % 5));
                }
                const ii = 4 - i;
                const opp = oppFace[face];
                const oaface = adjFaces[opp][ii];
                const oridx = adjFaces[oaface].indexOf(opp);
                swaps[i].push(opp * 11 + ii);
                swaps[i].push(opp * 11 + ii + 5);
                swaps[i].push(oaface * 11 + 10);
                for (let j = 0; j < 5; j++) {
                    swaps[i].push(oaface * 11 + ((oridx + j) % 5) + 5);
                    swaps[i].push(oaface * 11 + ((oridx + j) % 5));
                }
            }
        }
        for (let i = 0; i < swaps[0].length; i++) {
            acycle(state, [swaps[0][i], swaps[1][i], swaps[2][i], swaps[3][i], swaps[4][i]], pow);
        }
    }
    return {
        doMove: doMove,
        oppFace: oppFace,
        adjFaces: adjFaces,
    };
})();
const getSeed$1 = randGen.getSeed;
const setSeed$1 = randGen.setSeed;

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
function mega(turns, suffixes, length) {
    turns = turns || [[""]];
    suffixes = suffixes || [""];
    length = length || 0;
    let donemoves = 0;
    let lastaxis = -1;
    const s = [];
    let first, second;
    for (let i = 0; i < length; i++) {
        do {
            first = rn(turns.length);
            second = rn(turns[first].length);
            if (first != lastaxis) {
                donemoves = 0;
                lastaxis = first;
            }
        } while (((donemoves >> second) & 1) != 0);
        donemoves |= 1 << second;
        if (turns[first][second].constructor == Array) {
            s.push(rndEl(turns[first][second]) + rndEl(suffixes));
        }
        else {
            s.push(turns[first][second] + rndEl(suffixes));
        }
    }
    return s.join(" ");
}
const scramblers = new Map();
const filters = new Map();
const probs = new Map();
function regScrambler(mode, callback, filter_and_probs) {
    if (Array.isArray(mode)) {
        for (let i = 0; i < mode.length; i++) {
            scramblers.set(mode[i], callback);
            filters.set(mode[i], []);
            probs.set(mode[i], []);
        }
    }
    else {
        scramblers.set(mode, callback);
        if (filter_and_probs != undefined) {
            filters.set(mode, filter_and_probs[0]);
            probs.set(mode, filter_and_probs[1]);
        }
    }
    return regScrambler;
}
/**
 *	format string,
 *		${args} => scramblers[scrType](scrType, scrArg)
 *		#{args} => mega(args)
 */
function formatScramble$1(str) {
    const repfunc = function (match, p1) {
        if (match[0] == "$") {
            let args = [p1];
            if (p1[0] == "[") {
                args = JSON.parse(p1);
            }
            return scramblers.get(args[0].toString())?.apply(this, args);
        }
        else if (match[0] == "#") {
            return mega.apply(this, JSON.parse("[" + p1 + "]"));
        }
        else {
            return "";
        }
    };
    const re1 = /[$#]\{([^}]+)\}/g;
    return str.replace(re1, repfunc);
}
function fixCase(cases, probs) {
    return cases == undefined ? rndProb(probs) : cases;
}

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
const solv$5 = new Solver$1(4, 1, [[0, doMove$1, 384]]);
const movePieces$2 = [
    [0, 1],
    [2, 3],
    [0, 3],
    [1, 2],
];
function doMove$1(idx, m) {
    const arr = set8Perm([], idx >> 4, 4);
    acycle(arr, movePieces$2[m]);
    return (get8Perm(arr, 4) << 4) + ((idx & 15) ^ (1 << m));
}
function generateScramble$2() {
    let c = 1 + rn(191);
    c = c * 2 + ((getNParity$1(c >> 3, 4) ^ (c >> 1) ^ (c >> 2) ^ c) & 1);
    return solv$5.toStr(solv$5.search([c], 0), "RLFB", [""]);
}
regScrambler("133", generateScramble$2);

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
const solv$4 = new Solver$1(3, 3, [
    [0, [doPermMove$1, "p", 7], 5040],
    [0, [doOriMove$1, "o", 7, -3], 729],
]);
const movePieces$1 = [
    [0, 2, 3, 1],
    [0, 1, 5, 4],
    [0, 4, 6, 2],
];
const moveOris$1 = [undefined, [0, 1, 0, 1, 3], [1, 0, 1, 0, 3]];
// @ts-ignore
const oriCoord = new coord("o", 7, -3);
function doPermMove$1(arr, m) {
    acycle(arr, movePieces$1[m]);
}
function doOriMove$1(arr, m) {
    acycle(arr, movePieces$1[m], 1, moveOris$1[m]);
}
const cFacelet$1 = [
    [3, 4, 9],
    [1, 20, 5],
    [2, 8, 17],
    [0, 16, 21],
    [13, 11, 6],
    [15, 7, 22],
    [12, 19, 10],
];
function checkNoBar$2(pidx, oidx) {
    const perm = set8Perm([], pidx, 7);
    const ori = oriCoord.set([], oidx);
    const f = [];
    for (let i = 0; i < 24; i++) {
        f[i] = i >> 2;
    }
    fillFacelet(cFacelet$1, f, perm, ori, 4);
    for (let i = 0; i < 24; i += 4) {
        if (((1 << f[i]) | (1 << f[i + 3])) & ((1 << f[i + 1]) | (1 << f[i + 2]))) {
            return false;
        }
    }
    return true;
}
const egprobs = [
    1, 2, 4, 4, 4, 4, 4, 4, 1, 2, 4, 4, 4, 4, 4, 4, 1, 2, 4, 4, 4, 4, 4, 4, 1, 2, 4, 4, 4, 4, 4, 4, 1,
    2, 4, 4, 4, 4, 4, 4, 1, 2, 4, 4, 4, 4, 4, 4,
];
const egmap = [0, 17, 5, 14, 8, 1, 2, 4];
const egfilter = [
    "EG0-O",
    "EG0-H",
    "EG0-L",
    "EG0-Pi",
    "EG0-S",
    "EG0-T",
    "EG0-U",
    "EG0-aS",
    "EG1B-O",
    "EG1B-H",
    "EG1B-L",
    "EG1B-Pi",
    "EG1B-S",
    "EG1B-T",
    "EG1B-U",
    "EG1B-aS",
    "EG1L-O",
    "EG1L-H",
    "EG1L-L",
    "EG1L-Pi",
    "EG1L-S",
    "EG1L-T",
    "EG1L-U",
    "EG1L-aS",
    "EG1F-O",
    "EG1F-H",
    "EG1F-L",
    "EG1F-Pi",
    "EG1F-S",
    "EG1F-T",
    "EG1F-U",
    "EG1F-aS",
    "EG1R-O",
    "EG1R-H",
    "EG1R-L",
    "EG1R-Pi",
    "EG1R-S",
    "EG1R-T",
    "EG1R-U",
    "EG1R-aS",
    "EG2-O",
    "EG2-H",
    "EG2-L",
    "EG2-Pi",
    "EG2-S",
    "EG2-T",
    "EG2-U",
    "EG2-aS",
];
const egperms = [
    [4, 5, 6],
    [4, 6, 5],
    [6, 5, 4],
    [5, 4, 6],
    [5, 6, 4],
    [6, 4, 5],
];
const egll_map = [
    [0x3210, 0x1221, 2, "H-1"],
    [0x3120, 0x1221, 2, "H-2"],
    [0x2310, 0x1221, 4, "H-3"],
    [0x3012, 0x1221, 4, "H-4"],
    [0x0312, 0x0210, 4, "L-1"],
    [0x2310, 0x0210, 4, "L-2"],
    [0x0213, 0x0210, 4, "L-3"],
    [0x3210, 0x0210, 4, "L-4"],
    [0x2013, 0x0210, 4, "L-5"],
    [0x3012, 0x0210, 4, "L-6"],
    [0x3210, 0x1212, 4, "Pi-1"],
    [0x0213, 0x1212, 4, "Pi-2"],
    [0x2310, 0x1212, 4, "Pi-3"],
    [0x2013, 0x1212, 4, "Pi-4"],
    [0x3012, 0x1212, 4, "Pi-5"],
    [0x0312, 0x1212, 4, "Pi-6"],
    [0x3210, 0x2220, 4, "S-1"],
    [0x0213, 0x2220, 4, "S-2"],
    [0x0312, 0x2220, 4, "S-3"],
    [0x3012, 0x2220, 4, "S-4"],
    [0x2013, 0x2220, 4, "S-5"],
    [0x2310, 0x2220, 4, "S-6"],
    [0x2310, 0x1020, 4, "T-1"],
    [0x2013, 0x1020, 4, "T-2"],
    [0x0213, 0x1020, 4, "T-3"],
    [0x3210, 0x1020, 4, "T-4"],
    [0x3012, 0x1020, 4, "T-5"],
    [0x0312, 0x1020, 4, "T-6"],
    [0x0213, 0x2010, 4, "U-1"],
    [0x3210, 0x2010, 4, "U-2"],
    [0x0312, 0x2010, 4, "U-3"],
    [0x3012, 0x2010, 4, "U-4"],
    [0x2310, 0x2010, 4, "U-5"],
    [0x2013, 0x2010, 4, "U-6"],
    [0x3210, 0x1011, 4, "aS-1"],
    [0x0213, 0x1011, 4, "aS-2"],
    [0x0312, 0x1011, 4, "aS-3"],
    [0x3012, 0x1011, 4, "aS-4"],
    [0x2310, 0x1011, 4, "aS-5"],
    [0x2013, 0x1011, 4, "aS-6"],
];
const tcllp_map = [
    [0x0123, 0x0221, 4, "Hammer-1"],
    [0x3021, 0x0221, 4, "Hammer-2"],
    [0x0132, 0x0221, 4, "Hammer-3"],
    [0x0231, 0x0221, 4, "Hammer-4"],
    [0x0321, 0x0221, 4, "Hammer-5"],
    [0x2301, 0x0221, 4, "Hammer-6"],
    [0x0123, 0x1022, 4, "Spaceship-1"],
    [0x2301, 0x1022, 4, "Spaceship-2"],
    [0x1320, 0x1022, 4, "Spaceship-3"],
    [0x3021, 0x1022, 4, "Spaceship-4"],
    [0x3012, 0x1022, 4, "Spaceship-5"],
    [0x0231, 0x1022, 4, "Spaceship-6"],
    [0x2031, 0x0002, 4, "Stollery-1"],
    [0x3120, 0x0002, 4, "Stollery-2"],
    [0x3201, 0x0002, 4, "Stollery-3"],
    [0x2103, 0x0002, 4, "Stollery-4"],
    [0x0231, 0x0002, 4, "Stollery-5"],
    [0x2130, 0x0002, 4, "Stollery-6"],
    [0x0123, 0x2222, 1, "Pinwheel-1"],
    [0x1032, 0x2222, 1, "Pinwheel-2"],
    [0x3201, 0x2222, 4, "Pinwheel-3"],
    [0x2031, 0x0110, 2, "2Face-1"],
    [0x3102, 0x0110, 4, "2Face-2"],
    [0x0213, 0x0110, 2, "2Face-3"],
    [0x3021, 0x0110, 4, "2Face-4"],
    [0x1302, 0x0122, 4, "Turtle-1"],
    [0x1032, 0x0122, 4, "Turtle-2"],
    [0x3201, 0x0122, 4, "Turtle-3"],
    [0x1230, 0x0122, 4, "Turtle-4"],
    [0x2310, 0x0122, 4, "Turtle-5"],
    [0x0321, 0x0122, 4, "Turtle-6"],
    [0x3210, 0x1112, 4, "Pinwheel Poser-1"],
    [0x3120, 0x1112, 4, "Pinwheel Poser-2"],
    [0x3201, 0x1112, 4, "Pinwheel Poser-3"],
    [0x2103, 0x1112, 4, "Pinwheel Poser-4"],
    [0x2310, 0x1112, 4, "Pinwheel Poser-5"],
    [0x2130, 0x1112, 4, "Pinwheel Poser-6"],
    [0x2031, 0x0011, 4, "Gun-1"],
    [0x1032, 0x0011, 4, "Gun-2"],
    [0x0132, 0x0011, 4, "Gun-3"],
    [0x3021, 0x0011, 4, "Gun-4"],
    [0x2310, 0x0011, 4, "Gun-5"],
    [0x2130, 0x0011, 4, "Gun-6"],
];
const tclln_map = [
    [0x1302, 0x1201, 4, "Hammer-1"],
    [0x3021, 0x1201, 4, "Hammer-2"],
    [0x2310, 0x1201, 4, "Hammer-3"],
    [0x3201, 0x1201, 4, "Hammer-4"],
    [0x1203, 0x1201, 4, "Hammer-5"],
    [0x3120, 0x1201, 4, "Hammer-6"],
    [0x0123, 0x1012, 4, "Spaceship-1"],
    [0x1032, 0x1012, 4, "Spaceship-2"],
    [0x0312, 0x1012, 4, "Spaceship-3"],
    [0x3201, 0x1012, 4, "Spaceship-4"],
    [0x1023, 0x1012, 4, "Spaceship-5"],
    [0x2130, 0x1012, 4, "Spaceship-6"],
    [0x0123, 0x0001, 4, "Stollery-1"],
    [0x3120, 0x0001, 4, "Stollery-2"],
    [0x0132, 0x0001, 4, "Stollery-3"],
    [0x2103, 0x0001, 4, "Stollery-4"],
    [0x3102, 0x0001, 4, "Stollery-5"],
    [0x1203, 0x0001, 4, "Stollery-6"],
    [0x0123, 0x1111, 1, "Pinwheel-1"],
    [0x1032, 0x1111, 1, "Pinwheel-2"],
    [0x1320, 0x1111, 4, "Pinwheel-3"],
    [0x2031, 0x2002, 2, "2Face-1"],
    [0x0132, 0x2002, 4, "2Face-2"],
    [0x1032, 0x2002, 2, "2Face-3"],
    [0x3021, 0x2002, 4, "2Face-4"],
    [0x2031, 0x1102, 4, "Turtle-1"],
    [0x3120, 0x1102, 4, "Turtle-2"],
    [0x1023, 0x1102, 4, "Turtle-3"],
    [0x3021, 0x1102, 4, "Turtle-4"],
    [0x0132, 0x1102, 4, "Turtle-5"],
    [0x1203, 0x1102, 4, "Turtle-6"],
    [0x1302, 0x2122, 4, "Pinwheel Poser-1"],
    [0x0213, 0x2122, 4, "Pinwheel Poser-2"],
    [0x2013, 0x2122, 4, "Pinwheel Poser-3"],
    [0x0312, 0x2122, 4, "Pinwheel Poser-4"],
    [0x2310, 0x2122, 4, "Pinwheel Poser-5"],
    [0x0321, 0x2122, 4, "Pinwheel Poser-6"],
    [0x0123, 0x0022, 4, "Gun-1"],
    [0x1032, 0x0022, 4, "Gun-2"],
    [0x0132, 0x0022, 4, "Gun-3"],
    [0x2310, 0x0022, 4, "Gun-4"],
    [0x0312, 0x0022, 4, "Gun-5"],
    [0x2130, 0x0022, 4, "Gun-6"],
];
const lsall_map = [
    [0x00000, "LS1-PBL"],
    [0x00222, "LS1-Sune"],
    [0x00111, "LS1-aSune"],
    [0x00102, "LS1-Ua"],
    [0x00021, "LS1-Ub"],
    [0x00120, "LS1-La"],
    [0x00210, "LS1-Lb"],
    [0x00201, "LS1-Ta"],
    [0x00012, "LS1-Tb"],
    [0x10221, "LS2-Hammer"],
    [0x10212, "LS2-Spaceship"],
    [0x10200, "LS2-StolleryA"],
    [0x10002, "LS2-StolleryB"],
    [0x10020, "LS2-StolleryC"],
    [0x10110, "LS2-2Face"],
    [0x10122, "LS2-Turtle"],
    [0x10011, "LS2-GunA"],
    [0x10101, "LS2-GunB"],
    [0x20112, "LS3-Hammer"],
    [0x20211, "LS3-Spaceship"],
    [0x20100, "LS3-StolleryA"],
    [0x20001, "LS3-StolleryB"],
    [0x20010, "LS3-StolleryC"],
    [0x20220, "LS3-2Face"],
    [0x20121, "LS3-Turtle"],
    [0x20022, "LS3-GunA"],
    [0x20202, "LS3-GunB"],
    [0x02022, "LS4-SuneA"],
    [0x02220, "LS4-SuneB"],
    [0x02202, "LS4-SuneC"],
    [0x02211, "LS4-PiA"],
    [0x02121, "LS4-PiB"],
    [0x02010, "LS4-U"],
    [0x02001, "LS4-L"],
    [0x02100, "LS4-T"],
    [0x02112, "LS4-H"],
    [0x12012, "LS5-HammerA"],
    [0x12102, "LS5-HammerB"],
    [0x12120, "LS5-SpaceshipA"],
    [0x12201, "LS5-SpaceshipB"],
    [0x12000, "LS5-Stollery"],
    [0x12222, "LS5-Pinwheel"],
    [0x12021, "LS5-TurtleA"],
    [0x12210, "LS5-TurtleB"],
    [0x12111, "LS5-Pinwheel Poser"],
    [0x22110, "LS6-Hammer"],
    [0x22101, "LS6-Spaceship"],
    [0x22002, "LS6-2Face"],
    [0x22011, "LS6-Turtle"],
    [0x22122, "LS6-Pinwheel PoserA"],
    [0x22221, "LS6-Pinwheel PoserB"],
    [0x22212, "LS6-Pinwheel PoserC"],
    [0x22200, "LS6-GunA"],
    [0x22020, "LS6-GunB"],
    [0x01011, "LS7-aSuneA"],
    [0x01110, "LS7-aSuneB"],
    [0x01101, "LS7-aSuneC"],
    [0x01212, "LS7-PiA"],
    [0x01122, "LS7-PiB"],
    [0x01200, "LS7-U"],
    [0x01002, "LS7-L"],
    [0x01020, "LS7-T"],
    [0x01221, "LS7-H"],
    [0x11220, "LS8-Hammer"],
    [0x11022, "LS8-Spaceship"],
    [0x11001, "LS8-2Face"],
    [0x11202, "LS8-Turtle"],
    [0x11121, "LS8-Pinwheel PoserA"],
    [0x11112, "LS8-Pinwheel PoserB"],
    [0x11211, "LS8-Pinwheel PoserC"],
    [0x11010, "LS8-GunA"],
    [0x11100, "LS8-GunB"],
    [0x21201, "LS9-HammerA"],
    [0x21021, "LS9-HammerB"],
    [0x21012, "LS9-SpaceshipA"],
    [0x21120, "LS9-SpaceshipB"],
    [0x21000, "LS9-Stollery"],
    [0x21111, "LS9-Pinwheel"],
    [0x21102, "LS9-TurtleA"],
    [0x21210, "LS9-TurtleB"],
    [0x21222, "LS9-Pinwheel Poser"],
];
const egllprobs = idxArray(egll_map, 2);
const egllfilter = idxArray(egll_map, 3);
const tcllpprobs = idxArray(tcllp_map, 2);
const tcllpfilter = idxArray(tcllp_map, 3);
const tcllnprobs = idxArray(tclln_map, 2);
const tcllnfilter = idxArray(tclln_map, 3);
const lsallprobs = valuedArray(lsall_map.length, 1);
const lsallfilter = idxArray(lsall_map, 1);
function getScramble$6(type, length, state) {
    let ori, perm, lim;
    const maxl = type == "222o" ? 0 : 9;
    do {
        lim = 2;
        if (type == "222o" || type == "222so") {
            perm = rn(5040);
            ori = rn(729);
            lim = 3;
        }
        else if (type == "222eg") {
            ori = egmap[state & 0x7];
            perm = [0, 2, 3, 4, 5, 1][state >> 3];
            const arr = set8Perm([0, 0, 0, 0].concat(egperms[perm]), rn(24), 4);
            perm = get8Perm(arr, 7);
            let rndU = rn(4);
            ori = oriCoord.set([], ori);
            while (rndU-- > 0) {
                doOriMove$1(ori, 0);
            }
            ori = oriCoord.get(ori);
        }
        else if (/^222eg[012]$/.exec(type)) {
            return getScramble$6("222eg", length, [0, 8, 40][~~type[5]] + state);
        }
        else if (type == "222nb") {
            do {
                perm = rn(5040);
                ori = rn(729);
            } while (!checkNoBar$2(perm, ori));
        }
    } while ((perm == 0 && ori == 0) || solv$4.search([perm, ori], 0, lim) != null);
    return solv$4.toStr(solv$4.search([perm, ori], maxl)?.reverse() || [], "URF", "'2 ");
}
function getLLScramble$1(type, length, cases) {
    let llcase;
    let ncubie = 4;
    let perm = [0, 1, 2, 3];
    let ori = [0, 0, 0, 0, 0, 0, 0];
    if (type == "222tcp") {
        llcase = tcllp_map[fixCase(cases, tcllpprobs)];
        ori = [0, 0, 0, 0, 1, 0, 0];
        perm = perm.concat(egperms[0]);
    }
    else if (type == "222tcn") {
        llcase = tclln_map[fixCase(cases, tcllnprobs)];
        ori = [0, 0, 0, 0, 2, 0, 0];
        perm = perm.concat(egperms[0]);
    }
    else if (type == "222eg0") {
        llcase = egll_map[fixCase(cases, egllprobs)];
        perm = perm.concat(egperms[0]);
    }
    else if (type == "222eg1") {
        llcase = egll_map[fixCase(cases, egllprobs)];
        perm = perm.concat(egperms[2 + rn(4)]);
    }
    else if (type == "222eg2") {
        llcase = egll_map[fixCase(cases, egllprobs)];
        perm = perm.concat(egperms[1]);
    }
    else if (type == "222lsall") {
        perm = perm.concat(egperms[0]);
        const perm4 = rndPerm(4);
        perm4.push(perm4[3]);
        perm4[3] = 4;
        llcase = [0, lsall_map[fixCase(cases, lsallprobs)][0]];
        for (let i = 0; i < 5; i++) {
            llcase[0] |= perm4[i] << (i * 4);
        }
        ncubie = 5;
    }
    let rndA = rn(4);
    while (rndA-- > 0) {
        doPermMove$1(perm, 0);
    }
    const perm0 = perm.slice();
    for (let i = 0; i < ncubie; i++) {
        perm[i] = perm0[(llcase[0] >> (i * 4)) & 0xf];
        ori[i] = (llcase[1] >> (i * 4)) & 0xf;
    }
    let rndU = rn(4);
    while (rndU-- > 0) {
        doOriMove$1(ori, 0);
        doPermMove$1(perm, 0);
    }
    const p = get8Perm(perm, 7);
    const o = oriCoord.get(ori);
    return solv$4.toStr(solv$4.search([p, o], 9)?.reverse() || [], "URF", "'2 ");
}
regScrambler(["222o", "222so", "222nb"], getScramble$6)("222eg0", getLLScramble$1, [
    egllfilter,
    egllprobs,
])("222eg1", getLLScramble$1, [egllfilter, egllprobs])("222eg2", getLLScramble$1, [
    egllfilter,
    egllprobs,
])("222tcp", getLLScramble$1, [tcllpfilter, tcllpprobs])("222tcn", getLLScramble$1, [
    tcllnfilter,
    tcllnprobs,
])("222lsall", getLLScramble$1, [lsallfilter, lsallprobs])("222eg", getScramble$6, [egfilter, egprobs]);

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
const cmv$3 = [];
const cprun = [];
function initCornerMoveTable() {
    let g = [], temp;
    for (let i = 0; i < 40320; i++) {
        cmv$3[i] = [];
    }
    for (let i = 0; i < 40320; i++) {
        set8Perm(g, i);
        circle$1(g, 0, 1, 2, 3);
        temp = cmv$3[0][i] = get8Perm(g); //U
        circle$1(g, 4, 5, 6, 7);
        temp = cmv$3[1][temp] = get8Perm(g); //D
        circle$1(g, 2, 5)(g, 3, 6);
        temp = cmv$3[2][temp] = get8Perm(g); //R
        circle$1(g, 0, 5)(g, 3, 4);
        cmv$3[3][temp] = get8Perm(g); //F
    }
}
function doEdgeMove(idx, m) {
    if (m < 2) {
        return idx;
    }
    const g = set8Perm([], idx, 3);
    if (m == 2) {
        circle$1(g, 0, 1);
    }
    else if (m == 3) {
        circle$1(g, 0, 2);
    }
    return get8Perm(g, 3);
}
let initRet$2 = false;
function init$4() {
    if (initRet$2) {
        return;
    }
    initRet$2 = true;
    initCornerMoveTable();
    createPrun$1(cprun, 0, 40320, 12, cmv$3, 4, 3);
}
function search$2(corner, edge, maxl, lm, sol) {
    if (maxl == 0) {
        return corner + edge == 0;
    }
    if (getPruning$1(cprun, corner) > maxl)
        return false;
    let h, g, f, i;
    for (i = 0; i < 4; i++) {
        if (i != lm) {
            h = corner;
            g = edge;
            for (f = 0; f < (i < 2 ? 3 : 1); f++) {
                h = cmv$3[i][h];
                g = doEdgeMove(g, i);
                if (search$2(h, g, maxl - 1, i, sol)) {
                    sol.push(["U", "D", "R2", "F2"][i] + (i < 2 ? " 2'".charAt(f) : ""));
                    return true;
                }
            }
        }
    }
}
function generateScramble$1() {
    init$4();
    let b, c;
    do {
        c = rn(40320);
        b = rn(6);
    } while (b + c == 0);
    const d = [];
    for (let a = 0; a < 99; a++) {
        if (search$2(c, b, a, -1, d)) {
            break;
        }
    }
    return d.reverse().join(" ");
}
regScrambler("223", generateScramble$1);

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
const edgePerms = [
    [0, 1, 2, 3],
    [0, 2, 5, 4],
];
const edgeOris = [
    [0, 0, 0, 0, 2],
    [0, 1, 0, 1, 2],
];
function doPermMove(idx, m) {
    const edge = idx >> 3;
    let corn = idx;
    let cent = (idx << 1) | (getNParity$1(edge, 6) ^ ((corn >> 1) & 1));
    const g = set8Perm([], edge, 6);
    acycle(g, edgePerms[m]);
    if (m == 0) {
        //U
        corn = corn + 2;
    }
    if (m == 1) {
        //M
        cent = cent + 1;
    }
    return (getNPerm$1(g, 6) << 3) | (corn & 6) | ((cent >> 1) & 1);
}
function doOriMove(arr, m) {
    acycle(arr, edgePerms[m], 1, edgeOris[m]);
}
const solv$3 = new Solver$1(2, 3, [
    [0, doPermMove, 5760],
    [0, [doOriMove, "o", 6, -2], 32],
]);
function generateScramble() {
    let b, c;
    do {
        c = rn(5760);
        b = rn(32);
    } while (b + c == 0);
    return solv$3.toStr(solv$3.search([c, b], 0), "UM", " 2'").replace(/ +/g, " ");
}
regScrambler("lsemu", generateScramble);

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
const moveArr = [
    [0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], //UR
    [0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0], //DR
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0], //DL
    [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], //UL
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], //U
    [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0], //R
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], //D
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0], //L
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], //ALL
    [11, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0], //UR
    [0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 1, 1, 1], //DR
    [0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 1, 1, 0, 1], //DL
    [0, 0, 11, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0], //UL
    [11, 0, 11, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0], //U
    [11, 0, 0, 0, 0, 0, 11, 0, 0, 1, 0, 1, 1, 1], //R
    [0, 0, 0, 0, 0, 0, 11, 0, 11, 0, 1, 1, 1, 1], //D
    [0, 0, 11, 0, 0, 0, 0, 0, 11, 1, 1, 1, 0, 1], //L
    [11, 0, 11, 0, 0, 0, 11, 0, 11, 1, 1, 1, 1, 1], //ALL
];
function select(n, k, idx) {
    let r = k;
    let val = 0;
    for (let i = n - 1; i >= 0; i--) {
        if (idx >= Cnk[i][r]) {
            idx -= Cnk[i][r--];
            val |= 1 << i;
        }
    }
    return val;
}
//invert table 0  1  2  3  4  5  6  7  8  9 10 11
const invert = [-1, 1, -1, -1, -1, 5, -1, 7, -1, -1, -1, 11];
function randomState() {
    const ret = [];
    for (let i = 0; i < 14; i++) {
        ret[i] = rn(12);
    }
    return ret;
}
/**
 *	@return the length of the solution (the number of non-zero elements in the solution array)
 *		-1: invalid input
 */
function Solution(clock, solution) {
    if (clock.length != 14 || solution.length != 18) {
        return -1;
    }
    return solveIn(14, clock, solution);
}
function swap$1(arr, row1, row2) {
    const tmp = arr[row1];
    arr[row1] = arr[row2];
    arr[row2] = tmp;
}
function addTo(arr, row1, row2, startidx, mul) {
    const length = arr[0].length;
    for (let i = startidx; i < length; i++) {
        arr[row2][i] = (arr[row2][i] + arr[row1][i] * mul) % 12;
    }
}
//linearly dependent
const ld_list = [7695, 42588, 47187, 85158, 86697, 156568, 181700, 209201, 231778];
function solveIn(k, numbers, solution) {
    const n = 18;
    let min_nz = k + 1;
    for (let idx = 0; idx < Cnk[n][k]; idx++) {
        const val = select(n, k, idx);
        let isLD = false;
        for (let r = 0; r < ld_list.length; r++) {
            if ((val & ld_list[r]) == ld_list[r]) {
                isLD = true;
                break;
            }
        }
        if (isLD) {
            continue;
        }
        const map = [];
        let cnt = 0;
        for (let j = 0; j < n; j++) {
            if (((val >> j) & 1) == 1) {
                map[cnt++] = j;
            }
        }
        const arr = [];
        for (let i = 0; i < 14; i++) {
            arr[i] = [];
            for (let j = 0; j < k; j++) {
                arr[i][j] = moveArr[map[j]][i];
            }
            arr[i][k] = numbers[i];
        }
        const ret = GaussianElimination(arr);
        if (ret != 0) {
            continue;
        }
        let isSolved = true;
        for (let i = k; i < 14; i++) {
            if (arr[i][k] != 0) {
                isSolved = false;
                break;
            }
        }
        if (!isSolved) {
            continue;
        }
        backSubstitution(arr);
        let cnt_nz = 0;
        for (let i = 0; i < k; i++) {
            if (arr[i][k] != 0) {
                cnt_nz++;
            }
        }
        if (cnt_nz < min_nz) {
            for (let i = 0; i < 18; i++) {
                solution[i] = 0;
            }
            for (let i = 0; i < k; i++) {
                solution[map[i]] = arr[i][k];
            }
            min_nz = cnt_nz;
        }
    }
    return min_nz == k + 1 ? -1 : min_nz;
}
function GaussianElimination(arr) {
    const m = 14;
    const n = arr[0].length;
    for (let i = 0; i < n - 1; i++) {
        if (invert[arr[i][i]] == -1) {
            let ivtidx = -1;
            for (let j = i + 1; j < m; j++) {
                if (invert[arr[j][i]] != -1) {
                    ivtidx = j;
                    break;
                }
            }
            if (ivtidx == -1) {
                OUT: for (let j1 = i; j1 < m - 1; j1++) {
                    for (let j2 = j1 + 1; j2 < m; j2++) {
                        if (invert[(arr[j1][i] + arr[j2][i]) % 12] != -1) {
                            addTo(arr, j2, j1, i, 1);
                            ivtidx = j1;
                            break OUT;
                        }
                    }
                }
            }
            if (ivtidx == -1) {
                //k vectors are linearly dependent
                for (let j = i + 1; j < m; j++) {
                    if (arr[j][i] != 0) {
                        return -1;
                    }
                }
                return i + 1;
            }
            swap$1(arr, i, ivtidx);
        }
        const inv = invert[arr[i][i]];
        for (let j = i; j < n; j++) {
            arr[i][j] = (arr[i][j] * inv) % 12;
        }
        for (let j = i + 1; j < m; j++) {
            addTo(arr, i, j, i, 12 - arr[j][i]);
        }
    }
    return 0;
}
function backSubstitution(arr) {
    const n = arr[0].length;
    for (let i = n - 2; i > 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            if (arr[j][i] != 0) {
                addTo(arr, i, j, i, 12 - arr[j][i]);
            }
        }
    }
}
const turns = ["UR", "DR", "DL", "UL", "U", "R", "D", "L", "ALL"];
function getScramble$5(type) {
    const rndarr = randomState();
    const solution = [];
    solution.length = 18;
    Solution(rndarr, solution);
    let scramble = "";
    for (let x = 0; x < 9; x++) {
        let turn = solution[x];
        if (turn == 0) {
            continue;
        }
        const clockwise = turn <= 6;
        if (turn > 6) {
            turn = 12 - turn;
        }
        scramble += turns[x] + turn + (clockwise ? "+" : "-") + " ";
    }
    scramble += "y2 ";
    for (let x = 0; x < 9; x++) {
        let turn = solution[x + 9];
        if (turn == 0) {
            continue;
        }
        const clockwise = turn <= 6;
        if (turn > 6) {
            turn = 12 - turn;
        }
        scramble += turns[x] + turn + (clockwise ? "+" : "-") + " ";
    }
    let isFirst = true;
    for (let x = 0; x < 4; x++) {
        if (rn(2) == 1) {
            scramble += (isFirst ? "" : " ") + turns[x];
            isFirst = false;
        }
    }
    return scramble;
}
regScrambler("clko", getScramble$5);

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
const cmv$2 = [];
const emv = [];
const prun = [[], [], []];
const moveEdges = [
    [0, 3, 2, 1],
    [0, 1],
    [0, 3],
];
function cornerMove(arr, m) {
    acycle(arr, [0, m + 1]);
}
function edgeMove(idx, m) {
    const arr = set8Perm([], ~~(idx / 3), 4);
    acycle(arr, moveEdges[m]);
    return get8Perm(arr, 4) * 3 + (((idx % 3) + (m == 0 ? 1 : 0)) % 3);
}
function doMove(off, idx, m) {
    let edge = idx % 72;
    let corner = ~~(idx / 72);
    corner = cmv$2[m][corner];
    edge = emv[(m + off) % 3][edge];
    return corner * 72 + edge;
}
function getPrun(state) {
    return Math.max(getPruning$1(prun[0], state[0] * 72 + state[1]), getPruning$1(prun[1], state[0] * 72 + state[2]), getPruning$1(prun[2], state[0] * 72 + state[3]));
}
function search$1(state, maxl, lm, sol) {
    if (maxl == 0) {
        return state[0] == 0 && state[1] == 0 && state[2] == 0 && state[3] == 0;
    }
    if (getPrun(state) > maxl) {
        return false;
    }
    for (let m = 0; m < 3; m++) {
        if (m == lm) {
            continue;
        }
        const statex = state.slice();
        for (let a = 0; a < 11; a++) {
            statex[0] = cmv$2[m][statex[0]];
            for (let i = 1; i < 4; i++) {
                statex[i] = emv[(m + i - 1) % 3][statex[i]];
            }
            if (search$1(statex, maxl - 1, m, sol)) {
                sol.push("URF".charAt(m) + ["'", "2'", "3'", "4'", "5'", "6", "5", "4", "3", "2", ""][a]);
                return true;
            }
        }
    }
}
let initRet$1 = false;
function init$3() {
    if (initRet$1) {
        return;
    }
    initRet$1 = true;
    createMove(emv, 72, edgeMove, 3);
    createMove(cmv$2, 24, [cornerMove, "p", 4], 3);
    for (let i = 0; i < 3; i++) {
        createPrun$1(prun[i], 0, 24 * 72, 5, doMove.bind(null, i), 3, 12, 0);
    }
}
function getRandomState() {
    const ret = [rn(24)];
    for (let i = 0; i < 3; i++) {
        do {
            ret[i + 1] = rn(72);
        } while (getPruning$1(prun[i], ret[0] * 72 + ret[i + 1]) == 15);
    }
    return ret;
}
function generateGearScramble(type) {
    init$3();
    let state;
    do {
        state = getRandomState();
    } while (state == 0);
    let len = type == "gearso" ? 4 : 0;
    const sol = [];
    while (true) {
        if (search$1(state, len, -1, sol)) {
            break;
        }
        len++;
    }
    return sol.reverse().join(" ");
}
regScrambler(["gearo", "gearso"], generateGearScramble);

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
const cubesuff$1 = ["", "2", "'"];
const minxsuff$1 = ["", "2", "'", "2'"];
const args = {
    "111": [[["x"], ["y"], ["z"]], cubesuff$1], // 1x1x1
    "2223": [[["U"], ["R"], ["F"]], cubesuff$1], // 2x2x2 (3-gen)
    "2226": [[[["U", "D"]], [["R", "L"]], [["F", "B"]]], cubesuff$1], // 2x2x2 (6-gen)
    "333o": [
        [
            ["U", "D"],
            ["R", "L"],
            ["F", "B"],
        ],
        cubesuff$1,
    ], // 3x3x3 (old style)
    "334": [
        [
            [
                ["U", "U'", "U2"],
                ["u", "u'", "u2"],
            ],
            [["R2", "L2", "M2"]],
            [["F2", "B2", "S2"]],
        ],
    ], // 3x3x4
    "336": [
        [
            [
                ["U", "U'", "U2"],
                ["u", "u'", "u2"],
                ["3u", "3u2", "3u'"],
            ],
            [["R2", "L2", "M2"]],
            [["F2", "B2", "S2"]],
        ],
    ], // 3x3x6
    "888": [
        [
            ["U", "D", "u", "d", "3u", "3d", "4u"],
            ["R", "L", "r", "l", "3r", "3l", "4r"],
            ["F", "B", "f", "b", "3f", "3b", "4f"],
        ],
        cubesuff$1,
    ], // 8x8x8 (SiGN)
    "999": [
        [
            ["U", "D", "u", "d", "3u", "3d", "4u", "4d"],
            ["R", "L", "r", "l", "3r", "3l", "4r", "4l"],
            ["F", "B", "f", "b", "3f", "3b", "4f", "4b"],
        ],
        cubesuff$1,
    ], // 9x9x9 (SiGN)
    "101010": [
        [
            ["U", "D", "u", "d", "3u", "3d", "4u", "4d", "5u"],
            ["R", "L", "r", "l", "3r", "3l", "4r", "4l", "5r"],
            ["F", "B", "f", "b", "3f", "3b", "4f", "4b", "5f"],
        ],
        cubesuff$1,
    ], // 10x10x10 (SiGN)
    "111111": [
        [
            ["U", "D", "u", "d", "3u", "3d", "4u", "4d", "5u", "5d"],
            ["R", "L", "r", "l", "3r", "3l", "4r", "4l", "5r", "5l"],
            ["F", "B", "f", "b", "3f", "3b", "4f", "4b", "5f", "5b"],
        ],
        cubesuff$1,
    ], // 11x11x11 (SiGN)
    "444": [
        [
            ["U", "D", "u"],
            ["R", "L", "r"],
            ["F", "B", "f"],
        ],
        cubesuff$1,
    ], // 4x4x4 (SiGN)
    "444m": [
        [
            ["U", "D", "Uw"],
            ["R", "L", "Rw"],
            ["F", "B", "Fw"],
        ],
        cubesuff$1,
    ], // 4x4x4 (WCA)
    "555": [
        [
            ["U", "D", "u", "d"],
            ["R", "L", "r", "l"],
            ["F", "B", "f", "b"],
        ],
        cubesuff$1,
    ], // 5x5x5 (SiGN)
    "555wca": [
        [
            ["U", "D", "Uw", "Dw"],
            ["R", "L", "Rw", "Lw"],
            ["F", "B", "Fw", "Bw"],
        ],
        cubesuff$1,
    ], // 5x5x5 (WCA)
    "666p": [
        [
            ["U", "D", "2U", "2D", "3U"],
            ["R", "L", "2R", "2L", "3R"],
            ["F", "B", "2F", "2B", "3F"],
        ],
        cubesuff$1,
    ], // 6x6x6 (prefix)
    "666wca": [
        [
            ["U", "D", "Uw", "Dw", "3Uw"],
            ["R", "L", "Rw", "Lw", "3Rw"],
            ["F", "B", "Fw", "Bw", "3Fw"],
        ],
        cubesuff$1,
    ], // 6x6x6 (WCA)
    "666s": [
        [
            ["U", "D", "U&sup2;", "D&sup2;", "U&sup3;"],
            ["R", "L", "R&sup2;", "L&sup2;", "R&sup3;"],
            ["F", "B", "F&sup2;", "B&sup2;", "F&sup3;"],
        ],
        cubesuff$1,
    ], // 6x6x6 (suffix)
    "666si": [
        [
            ["U", "D", "u", "d", "3u"],
            ["R", "L", "r", "l", "3r"],
            ["F", "B", "f", "b", "3f"],
        ],
        cubesuff$1,
    ], // 6x6x6 (SiGN)
    "777p": [
        [
            ["U", "D", "2U", "2D", "3U", "3D"],
            ["R", "L", "2R", "2L", "3R", "3L"],
            ["F", "B", "2F", "2B", "3F", "3B"],
        ],
        cubesuff$1,
    ], // 7x7x7 (prefix)
    "777wca": [
        [
            ["U", "D", "Uw", "Dw", "3Uw", "3Dw"],
            ["R", "L", "Rw", "Lw", "3Rw", "3Lw"],
            ["F", "B", "Fw", "Bw", "3Fw", "3Bw"],
        ],
        cubesuff$1,
    ], // 7x7x7 (prefix)
    "777s": [
        [
            ["U", "D", "U&sup2;", "D&sup2;", "U&sup3;", "D&sup3;"],
            ["R", "L", "R&sup2;", "L&sup2;", "R&sup3;", "L&sup3;"],
            ["F", "B", "F&sup2;", "B&sup2;", "F&sup3;", "B&sup3;"],
        ],
        cubesuff$1,
    ], // 7x7x7 (suffix)
    "777si": [
        [
            ["U", "D", "u", "d", "3u", "3d"],
            ["R", "L", "r", "l", "3r", "3l"],
            ["F", "B", "f", "b", "3f", "3b"],
        ],
        cubesuff$1,
    ], // 7x7x7 (SiGN)
    cm3: [
        [
            [
                ["U<", "U>", "U2"],
                ["E<", "E>", "E2"],
                ["D<", "D>", "D2"],
            ],
            [
                ["R^", "Rv", "R2"],
                ["M^", "Mv", "M2"],
                ["L^", "Lv", "L2"],
            ],
        ],
    ], // Cmetrick
    cm2: [
        [
            [
                ["U<", "U>", "U2"],
                ["D<", "D>", "D2"],
            ],
            [
                ["R^", "Rv", "R2"],
                ["L^", "Lv", "L2"],
            ],
        ],
    ], // Cmetrick Mini
    "233": [[[["U", "U'", "U2"]], ["R2", "L2"], ["F2", "B2"]]], // Domino/2x3x3
    fto: [
        [
            ["U", "D"],
            ["F", "B"],
            ["L", "BR"],
            ["R", "BL"],
        ],
        ["", "'"],
    ], // FTO/Face-Turning Octa
    gear: [
        [["U"], ["R"], ["F"]],
        ["", "2", "3", "4", "5", "6", "'", "2'", "3'", "4'", "5'"],
    ],
    sfl: [
        [
            ["R", "L"],
            ["U", "D"],
        ],
        cubesuff$1,
    ], // Super Floppy Cube
    ufo: [[["A"], ["B"], ["C"], [["U", "U'", "U2'", "U2", "U3"]]]], // UFO
    "2gen": [[["U"], ["R"]], cubesuff$1], // 2-generator <R,U>
    "2genl": [[["U"], ["L"]], cubesuff$1], // 2-generator <L,U>
    roux: [[["U"], ["M"]], cubesuff$1], // Roux-generator <M,U>
    "3gen_F": [[["U"], ["R"], ["F"]], cubesuff$1], // 3-generator <F,R,U>
    "3gen_L": [[["U"], ["R", "L"]], cubesuff$1], // 3-generator <R,U,L>
    RrU: [[["U"], ["R", "r"]], cubesuff$1], // 3-generator <R,r,U>
    RrUu: [
        [
            ["U", "u"],
            ["R", "r"],
        ],
        cubesuff$1,
    ], // <R,r,U,u>
    minx2g: [[["U"], ["R"]], minxsuff$1], // megaminx 2-gen
    half: [
        [
            ["U", "D"],
            ["R", "L"],
            ["F", "B"],
        ],
        ["2"],
    ], // 3x3x3 half turns
    lsll: [
        [[["R U R'", "R U2 R'", "R U' R'"]], [["F' U F", "F' U2 F", "F' U' F"]], [["U", "U2", "U'"]]],
    ], // 3x3x3 last slot + last layer (old)
    prco: [
        [
            ["F", "B"],
            ["U", "D"],
            ["L", "DBR"],
            ["R", "DBL"],
            ["BL", "DR"],
            ["BR", "DL"],
        ],
        minxsuff$1,
    ], // Pyraminx Crystal (old style)
    skb: [
        [["R"], ["L"], ["B"], ["U"]],
        ["", "'"],
    ], // Skewb
    ivy: [
        [["R"], ["L"], ["D"], ["B"]],
        ["", "'"],
    ], // Ivy
    "112": [[["R"], ["R"]], cubesuff$1], // 1x1x2
    eide: [
        [
            ["OMG"],
            ["WOW"],
            ["WTF"],
            [["WOO-HOO", "WOO-HOO", "MATYAS", "YES", "YES", "YAY", "YEEEEEEEEEEEES"]],
            ["HAHA"],
            ["XD"],
            [":D"],
            ["LOL"],
        ],
        ["", "", "", "!!!"],
    ], // Derrick Eide
};
const args2 = {
    sia113: '#{[["U","u"],["R","r"]],%c,%l} z2 #{[["U","u"],["R","r"]],%c,%l}',
    sia123: '#{[["U"],["R","r"]],%c,%l} z2 #{[["U"],["R","r"]],%c,%l}',
    sia222: '#{[["U"],["R"],["F"]],%c,%l} z2 y #{[["U"],["R"],["F"]],%c,%l}',
    "335": '#{[[["U","U\'","U2"],["D","D\'","D2"]],["R2","L2"],["F2","B2"]],0,%l} / ${333}',
    "337": '#{[[["U","U\'","U2","u","u\'","u2","U u","U u\'","U u2","U\' u","U\' u\'","U\' u2","U2 u","U2 u\'","U2 u2"],["D","D\'","D2","d","d\'","d2","D d","D d\'","D d2","D\' d","D\' d\'","D\' d2","D2 d","D2 d\'","D2 d2"]],["R2","L2"],["F2","B2"]],0,%l} / ${333}',
    r234: "2) ${222so}\\n3) ${333}\\n4) ${[444,40]}",
    r2345: '${r234}\\n5) ${["555",60]}',
    r23456: '${r2345}\\n6) ${["666p",80]}',
    r234567: '${r23456}\\n7) ${["777p",100]}',
    r234w: '2) ${222so}\\n3) ${333}\\n4) ${["444m",40]}',
    r2345w: '${r234w}\\n5) ${["555wca",60]}',
    r23456w: '${r2345w}\\n6) ${["666wca",80]}',
    r234567w: '${r23456w}\\n7) ${["777wca",100]}',
    "333ni": '${333}#{[[""]],["","Rw ","Rw2 ","Rw\' ","Fw ","Fw\' "],1}#{[[""]],["","Uw","Uw2","Uw\'"],1}',
    "444bld": '${444wca}#{[[""]],[""," x"," x2"," x\'"," z"," z\'"],1}#{[[""]],[""," y"," y2"," y\'"],1}',
    "555bld": '${["555wca",%l]}#{[[""]],[""," 3Rw"," 3Rw2"," 3Rw\'"," 3Fw"," 3Fw\'"],1}#{[[""]],[""," 3Uw"," 3Uw2"," 3Uw\'"],1}',
};
const edges = {
    "4edge": ["r b2", ["b2 r'", "b2 U2 r U2 r U2 r U2 r"], ["u"]],
    "5edge": ["r R b B", ["B' b' R' r'", "B' b' R' U2 r U2 r U2 r U2 r"], ["u", "d"]],
    "6edge": [
        "3r r 3b b",
        [
            "3b' b' 3r' r'",
            "3b' b' 3r' U2 r U2 r U2 r U2 r",
            "3b' b' r' U2 3r U2 3r U2 3r U2 3r",
            "3b' b' r2 U2 3r U2 3r U2 3r U2 3r U2 r",
        ],
        ["u", "3u", "d"],
    ],
    "7edge": [
        "3r r 3b b",
        [
            "3b' b' 3r' r'",
            "3b' b' 3r' U2 r U2 r U2 r U2 r",
            "3b' b' r' U2 3r U2 3r U2 3r U2 3r",
            "3b' b' r2 U2 3r U2 3r U2 3r U2 3r U2 r",
        ],
        ["u", "3u", "3d", "d"],
    ],
};
function megascramble(type, length) {
    // @ts-ignore
    const value = args[type];
    switch (value.length) {
        case 1:
            return mega(value[0], [""], length);
        case 2:
            return mega(value[0], value[1], length);
        case 3:
            return mega(value[0], value[1], value[2]);
    }
}
function edgescramble(type, length) {
    // @ts-ignore
    const value = edges[type];
    return edge(value[0], value[1], value[2], length);
}
function formatScramble(type, length) {
    // @ts-ignore
    const value = args2[type].replace(/%l/g, length).replace(/%c/g, '["","2","\'"]');
    return formatScramble$1(value);
}
for (const i in args) {
    regScrambler(i, megascramble);
}
for (const i in args2) {
    regScrambler(i, formatScramble);
}
for (const i in edges) {
    regScrambler(i, edgescramble);
}
function cubeNNN(type, len) {
    const size = len;
    if (size <= 1) {
        return "N/A";
    }
    const data = [[], [], []];
    for (let i = 0; i < len - 1; i++) {
        if (i % 2 == 0) {
            data[0].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "U" : "u"));
            data[1].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "R" : "r"));
            data[2].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "F" : "f"));
        }
        else {
            data[0].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "D" : "d"));
            data[1].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "L" : "l"));
            data[2].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "B" : "b"));
        }
    }
    return mega(data, cubesuff$1, size * 10);
}
regScrambler("cubennn", cubeNNN);
function edge(start, end, moves, len) {
    let u = 0, d = 0, movemis = [];
    const triggers = [
        ["R", "R'"],
        ["R'", "R"],
        ["L", "L'"],
        ["L'", "L"],
        ["F'", "F"],
        ["F", "F'"],
        ["B", "B'"],
        ["B'", "B"],
    ];
    const ud = ["U", "D"];
    let scramble = start;
    // initialize move misalignments
    for (let i = 0; i < moves.length; i++) {
        movemis[i] = 0;
    }
    for (let i = 0; i < len; i++) {
        // apply random moves
        let done = false;
        let v = "";
        while (!done) {
            for (let j = 0; j < moves.length; j++) {
                const x = rn(4);
                movemis[j] += x;
                if (x != 0) {
                    done = true;
                    v += " " + moves[j] + cubesuff$1[x - 1];
                }
            }
        }
        // apply random trigger, update U/D
        const trigger = rn(8);
        const layer = rn(2);
        const turn = rn(3);
        scramble +=
            v +
                " " +
                triggers[trigger][0] +
                " " +
                ud[layer] +
                cubesuff$1[turn] +
                " " +
                triggers[trigger][1];
        if (layer == 0) {
            u += turn + 1;
        }
        if (layer == 1) {
            d += turn + 1;
        }
    }
    // fix everything
    for (let i = 0; i < moves.length; i++) {
        const x = 4 - (movemis[i] % 4);
        if (x < 4) {
            scramble += " " + moves[i] + cubesuff$1[x - 1];
        }
    }
    u = 4 - (u % 4);
    d = 4 - (d % 4);
    if (u < 4) {
        scramble += " U" + cubesuff$1[u - 1];
    }
    if (d < 4) {
        scramble += " D" + cubesuff$1[d - 1];
    }
    scramble += " " + rndEl(end);
    return scramble;
}
// Megaminx
const epcord = new coord("p", 6, -1);
const eocord = new coord("o", 6, -2);
const cpcord$1 = new coord("p", 6, -1);
const cocord = new coord("o", 6, -3);
function eMove(idx, m) {
    const perm = epcord.set([], idx >> 5);
    const twst = eocord.set([], idx & 0x1f);
    if (m == 0) {
        acycle(twst, [0, 1, 2, 3, 4], 1);
        acycle(perm, [0, 1, 2, 3, 4], 1);
    }
    else if (m == 1) {
        acycle(twst, [0, 1, 2, 3, 5], 1);
        acycle(perm, [0, 1, 2, 3, 5], 1);
    }
    else if (m == 2) {
        acycle(twst, [1, 2, 3, 4, 5], 1, [0, 0, 0, 0, 1, 2]);
        acycle(perm, [1, 2, 3, 4, 5]);
    }
    return (epcord.get(perm) << 5) | eocord.get(twst);
}
function cMove(idx, m) {
    const perm = cpcord$1.set([], ~~(idx / 243));
    const twst = cocord.set([], idx % 243);
    if (m == 0) {
        acycle(twst, [0, 1, 2, 3, 4], 1);
        acycle(perm, [0, 1, 2, 3, 4], 1);
    }
    else if (m == 1) {
        acycle(twst, [0, 5, 1, 2, 3], 1, [2, 0, 0, 0, 0, 3]);
        acycle(perm, [0, 5, 1, 2, 3]);
    }
    else if (m == 2) {
        acycle(twst, [0, 2, 3, 4, 5], 1, [1, 0, 0, 0, 1, 3]);
        acycle(perm, [0, 2, 3, 4, 5]);
    }
    return cpcord$1.get(perm) * 243 + cocord.get(twst);
}
const solv$2 = new Solver$1(3, 4, [
    [0, eMove, 32 * 360],
    [0, cMove, 243 * 360],
]);
function getMinxLSScramble(type, length, cases) {
    let edge = 0;
    let corn = 0;
    do {
        if (type == "mlsll") {
            edge = rn(32 * 360);
            corn = rn(243 * 360);
        }
        else if (type == "mgmpll") {
            edge = epcord.get(rndPerm(5, true).concat([5])) * 32;
            corn = cpcord$1.get(rndPerm(5, true).concat([5])) * 243;
        }
        else if (type == "mgmll") {
            const eo = eocord.set([], rn(32));
            eo[0] += eo[5];
            eo[5] = 0;
            const co = cocord.set([], rn(243));
            co[0] += co[5];
            co[5] = 0;
            edge = epcord.get(rndPerm(5, true).concat([5])) * 32 + eocord.get(eo);
            corn = cpcord$1.get(rndPerm(5, true).concat([5])) * 243 + cocord.get(co);
        }
    } while (edge == 0 && corn == 0);
    const sol = solv$2.search([edge, corn], 0);
    const ret = [];
    for (let i = 0; i < sol.length; i++) {
        const move = sol[i];
        ret.push(["U", "R U", "F' U"][move[0]] + ["", "2", "2'", "'"][move[1]] + ["", " R'", " F"][move[0]]);
    }
    return ret.join(" ").replace(/ +/g, " ");
}
regScrambler("mlsll", getMinxLSScramble)("mgmpll", getMinxLSScramble)("mgmll", getMinxLSScramble);

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
/*
x504x x x504x
    132 231 132
    x x405x x
        x504x
            132
            x  */
const cFacelet = [
    [3, 16, 11], // F3, L4, R5
    [4, 23, 15], // F4, D5, L3
    [5, 9, 22], // F5, R3, D4
    [10, 17, 21], // R4, L5, D3
];
const eFacelet = [
    [1, 7], // F1, R1
    [2, 14], // F2, L2
    [0, 18], // F0, D0
    [6, 12], // R0, L0
    [8, 20], // R2, D2
    [13, 19], // L1, D1
];
function checkNoBar$1(perm, ori) {
    const edgeOri = eocoord.set([], ori & 0x1f);
    const cornOri = cocoord.set([], ori >> 5);
    const edgePerm = epcoord.set([], perm);
    const f = [];
    fillFacelet(cFacelet, f, [0, 1, 2, 3], cornOri, 6);
    fillFacelet(eFacelet, f, edgePerm, edgeOri, 6);
    const pieces = [4, 2, 3, 1, 5, 0];
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 2; j++) {
            const p1 = eFacelet[i][0 ^ j];
            const p2 = eFacelet[i][1 ^ j];
            const nb1 = ~~(p1 / 6) * 6 + pieces[(pieces.indexOf(p1 % 6) + 5) % 6];
            const nb2 = ~~(p2 / 6) * 6 + pieces[(pieces.indexOf(p2 % 6) + 1) % 6];
            if (f[nb1] == f[p1] && f[nb2] == f[p2]) {
                return false;
            }
        }
    }
    return true;
}
const solv$1 = new Solver$1(4, 2, [
    [0, [epermMove, "p", 6, -1], 360],
    [0, oriMove, 2592],
]);
const movePieces = [
    [0, 1, 3],
    [1, 2, 5],
    [0, 4, 2],
    [3, 5, 4],
];
const moveOris = [
    [0, 1, 0, 2],
    [0, 1, 0, 2],
    [0, 0, 1, 2],
    [0, 0, 1, 2],
];
function epermMove(arr, m) {
    acycle(arr, movePieces[m]);
}
const eocoord = new coord("o", 6, -2);
const epcoord = new coord("p", 6, -1);
const cocoord = new coord("o", 4, 3);
function oriMove(a, c) {
    const edgeOri = eocoord.set([], a & 0x1f);
    const cornOri = cocoord.set([], a >> 5);
    cornOri[c]++;
    acycle(edgeOri, movePieces[c], 1, moveOris[c]);
    return (cocoord.get(cornOri) << 5) | eocoord.get(edgeOri);
}
function getScramble$4(type) {
    const minl = type == "pyro" ? 0 : 8;
    const limit = type == "pyrl4e" ? 2 : 7;
    let len = 0;
    let sol;
    let perm;
    let ori;
    do {
        if (type == "pyro" || type == "pyrso" || type == "pyr4c") {
            perm = rn(360);
            ori = rn(2592);
        }
        else if (type == "pyrl4e") {
            perm = get8Perm(set8Perm([], rn(12), 4, -1).concat([4, 5]), 6, -1);
            ori = rn(3) * 864 + rn(8);
        }
        else if (type == "pyrnb") {
            do {
                perm = rn(360);
                ori = rn(2592);
            } while (!checkNoBar$1(perm, ori));
        }
        len = solv$1.search([perm, ori], 0).length;
        sol = solv$1.toStr(solv$1.search([perm, ori], minl).reverse(), "ULRB", ["'", ""]) + " ";
        for (let i = 0; i < 4; i++) {
            const r = rn(type == "pyr4c" ? 2 : 3);
            if (r < 2) {
                sol += "lrbu".charAt(i) + [" ", "' "][r];
                len++;
            }
        }
    } while (len < limit);
    return sol;
}
regScrambler(["pyro", "pyrso", "pyrl4e", "pyrnb", "pyr4c"], getScramble$4);

function getRoundedPath(path, _rd = 0.2) {
    const res = [];
    const rd = _rd || 0.11;
    for (let i = 0, maxi = path.length; i < maxi; i += 1) {
        let p1 = path[(i - 1 + maxi) % maxi];
        let p2 = path[i];
        let p3 = path[(i + 1) % maxi];
        let pt1 = [p2[0] + (p1[0] - p2[0]) * rd, p2[1] + (p1[1] - p2[1]) * rd];
        let pt2 = [p2[0] + (p3[0] - p2[0]) * rd, p2[1] + (p3[1] - p2[1]) * rd];
        if (i === 0) {
            res.push(`M ${pt1[0]} ${pt1[1]}`);
        }
        else {
            res.push(`L ${pt1[0]} ${pt1[1]}`);
        }
        res.push(`Q ${p2[0]} ${p2[1]} ${pt2[0]} ${pt2[1]}`);
    }
    res.push("Z");
    return res.join(" ");
}
function clone(obj) {
    switch (typeof obj) {
        case "boolean":
        case "number":
        case "string":
        case "undefined":
        case "function":
            return obj;
    }
    if (obj === null)
        return obj;
    if (typeof obj === "bigint") {
        return BigInt(obj);
    }
    if (Array.isArray(obj))
        return obj.map(clone);
    return Object.entries(obj).reduce((acc, e) => {
        acc[e[0]] = clone(e[1]);
        return acc;
    }, {});
}
function newArr(length) {
    return Array.from({ length });
}

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
let permPrun$1, flipPrun$1, ecPrun, fullPrun$1;
const cmv$1 = [];
const pmul$1 = [];
const fmul$1 = [];
const e1mv = [];
const c1mv = [];
function pmv$2(a, c) {
    const b = cmv$1[c][~~(a / 24)];
    return 24 * ~~(b / 384) + pmul$1[a % 24][(b >> 4) % 24];
}
function fmv$1(b, c) {
    const a = cmv$1[c][b >> 4];
    return (~~(a / 384) << 4) | (fmul$1[b & 15][(a >> 4) % 24] ^ (a & 15));
}
function i2f$1(a, c) {
    for (let b = 3; 0 <= b; b--)
        (c[b] = a & 1), (a >>= 1);
}
function f2i$1(c) {
    for (var a = 0, b = 0; 4 > b; b++)
        (a <<= 1), (a |= c[b]);
    return a;
}
function fullmv$1(idx, move) {
    const slice = cmv$1[move][~~(idx / 384)];
    const flip = fmul$1[idx & 15][(slice >> 4) % 24] ^ (slice & 15);
    const perm = pmul$1[(idx >> 4) % 24][(slice >> 4) % 24];
    return ~~(slice / 384) * 384 + 16 * perm + flip;
}
let isInit$1 = false;
function init$2() {
    if (isInit$1)
        return;
    isInit$1 = true;
    for (var i = 0; i < 24; i++) {
        pmul$1[i] = [];
    }
    for (var i = 0; i < 16; i++) {
        fmul$1[i] = [];
    }
    const pm1 = [];
    const pm2 = [];
    const pm3 = [];
    for (var i = 0; i < 24; i++) {
        for (let j = 0; j < 24; j++) {
            setNPerm$1(pm1, i, 4);
            setNPerm$1(pm2, j, 4);
            for (var k = 0; k < 4; k++) {
                pm3[k] = pm1[pm2[k]];
            }
            pmul$1[i][j] = getNPerm$1(pm3, 4);
            if (i < 16) {
                i2f$1(i, pm1);
                for (var k = 0; k < 4; k++) {
                    pm3[k] = pm1[pm2[k]];
                }
                fmul$1[i][j] = f2i$1(pm3);
            }
        }
    }
    createMove(cmv$1, 495, getmv);
    permPrun$1 = [];
    flipPrun$1 = [];
    createPrun$1(permPrun$1, 0, 11880, 5, pmv$2);
    createPrun$1(flipPrun$1, 0, 7920, 6, fmv$1);
    //combMove[comb][m] = comb*, flip*, perm*
    //newcomb = comb*, newperm = perm x perm*, newflip = flip x perm* ^ flip*
    function getmv(comb, m) {
        const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let r = 4;
        for (var i = 0; i < 12; i++) {
            if (comb >= Cnk[11 - i][r]) {
                comb -= Cnk[11 - i][r--];
                arr[i] = r << 1;
            }
            else {
                arr[i] = -1;
            }
        }
        edgeMove$1(arr, m);
        (comb = 0), (r = 4);
        let t = 0;
        const pm = [];
        for (var i = 0; i < 12; i++) {
            if (arr[i] >= 0) {
                comb += Cnk[11 - i][r--];
                pm[r] = arr[i] >> 1;
                t |= (arr[i] & 1) << (3 - r);
            }
        }
        return ((comb * 24 + getNPerm$1(pm, 4)) << 4) | t;
    }
}
let isxInit = false;
function xinit() {
    if (isxInit)
        return;
    isxInit = true;
    init$2();
    for (let i = 0; i < 24; i++) {
        c1mv[i] = [];
        e1mv[i] = [];
        for (let m = 0; m < 6; m++) {
            c1mv[i][m] = cornMove(i, m);
            const edge = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
            edge[i >> 1] = i & 1;
            edgeMove$1(edge, m);
            for (let e = 0; e < 12; e++) {
                if (edge[e] >= 0) {
                    e1mv[i][m] = (e << 1) | edge[e];
                    break;
                }
            }
        }
    }
    ecPrun = [];
    for (let obj = 0; obj < 4; obj++) {
        const prun = [];
        createPrun$1(prun, (obj + 4) * 3 * 24 + (obj + 4) * 2, 576, 5, function (q, m) {
            return c1mv[~~(q / 24)][m] * 24 + e1mv[q % 24][m];
        });
        ecPrun[obj] = prun;
    }
    function cornMove(corn, m) {
        const idx = ~~(corn / 3);
        let twst = corn % 3;
        const idxt = [
            [3, 1, 2, 7, 0, 5, 6, 4],
            [0, 1, 6, 2, 4, 5, 7, 3],
            [1, 2, 3, 0, 4, 5, 6, 7],
            [0, 5, 1, 3, 4, 6, 2, 7],
            [4, 0, 2, 3, 5, 1, 6, 7],
            [0, 1, 2, 3, 7, 4, 5, 6],
        ];
        const twstt = [
            [2, 0, 0, 1, 1, 0, 0, 2],
            [0, 0, 1, 2, 0, 0, 2, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 2, 0, 0, 2, 1, 0],
            [1, 2, 0, 0, 2, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
        ];
        twst = (twst + twstt[m][idx]) % 3;
        return idxt[m][idx] * 3 + twst;
    }
}
//e4perm, e4flip, e1, c1
//obj: -1:only cross.
//	i-4: end when e==i*2, c==i*3
function idaxcross(q, t, e, c, obj, l, lm, sol) {
    if (l == 0) {
        return q == 0 && t == 0 && e == (obj + 4) * 2 && c == (obj + 4) * 3;
    }
    else {
        if (getPruning$1(permPrun$1, q) > l ||
            getPruning$1(flipPrun$1, t) > l ||
            getPruning$1(ecPrun[obj], c * 24 + e) > l)
            return false;
        let p, s, ex, cx, a, m;
        for (m = 0; m < 6; m++) {
            if (m != lm && m != lm - 3) {
                p = q;
                s = t;
                ex = e;
                cx = c;
                for (a = 0; a < 3; a++) {
                    p = pmv$2(p, m);
                    s = fmv$1(s, m);
                    ex = e1mv[ex][m];
                    cx = c1mv[cx][m];
                    if (idaxcross(p, s, ex, cx, obj, l - 1, m, sol)) {
                        sol.push("FRUBLD".charAt(m) + " 2'".charAt(a));
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
//e4perm, e4flip
function idacross(q, t, l, lm, sol) {
    if (l == 0) {
        return q == 0 && t == 0;
    }
    else {
        if (getPruning$1(permPrun$1, q) > l || getPruning$1(flipPrun$1, t) > l)
            return false;
        let p, s, a, m;
        for (m = 0; m < 6; m++) {
            if (m != lm && m != lm - 3) {
                p = q;
                s = t;
                for (a = 0; a < 3; a++) {
                    p = pmv$2(p, m);
                    s = fmv$1(s, m);
                    if (idacross(p, s, l - 1, m, sol)) {
                        sol.push("FRUBLD".charAt(m) + " 2'".charAt(a));
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
let isFullInit = false;
function fullInit$1() {
    if (isFullInit)
        return;
    isFullInit = true;
    init$2();
    fullPrun$1 = [];
    createPrun$1(fullPrun$1, 0, 190080, 7, fullmv$1, 6, 3, 6);
}
function mapCross$1(idx) {
    let comb = ~~(idx / 384);
    const perm = (idx >> 4) % 24;
    const flip = idx & 15;
    const arrp = [];
    const arrf = [];
    const pm = [];
    const fl = [];
    i2f$1(flip, fl);
    setNPerm$1(pm, perm, 4);
    let r = 4;
    const map = [7, 6, 5, 4, 10, 9, 8, 11, 3, 2, 1, 0];
    for (let i = 0; i < 12; i++) {
        if (comb >= Cnk[11 - i][r]) {
            comb -= Cnk[11 - i][r--];
            arrp[map[i]] = pm[r];
            arrf[map[i]] = fl[r];
        }
        else {
            arrp[map[i]] = arrf[map[i]] = -1;
        }
    }
    return [arrp, arrf];
}
function getEasyXCross(length) {
    fullInit$1();
    xinit();
    const ncase = [1, 16, 174, 1568, 11377, 57758, 155012, 189978, 190080];
    length = Math.max(0, Math.min(length, 8));
    const remain = ncase[length];
    let isFound = false;
    while (!isFound) {
        let rndIdx = [];
        const sample = 500;
        for (var i = 0; i < sample; i++) {
            rndIdx.push(rn(remain));
        }
        rndIdx.sort(function (a, b) {
            return b - a;
        });
        const rndCases = [];
        let cnt = 0;
        for (var i = 0; i < 190080; i++) {
            const prun = getPruning$1(fullPrun$1, i);
            if (prun > length) {
                continue;
            }
            while (rndIdx[rndIdx.length - 1] == cnt) {
                rndCases.push(i);
                rndIdx.pop();
            }
            if (rndIdx.length == 0) {
                break;
            }
            cnt++;
        }
        rndIdx = rndPerm(sample);
        for (var i = 0; i < sample; i++) {
            const caze = rndCases[rndIdx[i]];
            let comb = ~~(caze / 384);
            const perm = comb * 24 + ((caze >> 4) % 24);
            const flip = (comb << 4) | (caze & 15);
            var sol = [];
            idacross(perm, flip, length, -1, sol);
            const corns = rndPerm(8).slice(4);
            const edges = rndPerm(8);
            const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let r = 4;
            for (var j = 0; j < 12; j++) {
                if (comb >= Cnk[11 - j][r]) {
                    comb -= Cnk[11 - j][r--];
                    arr[j] = -1;
                }
                else {
                    arr[j] = edges.pop();
                }
            }
            for (var j = 0; j < 4; j++) {
                corns[j] = corns[j] * 3 + rn(3);
                edges[j] = arr.indexOf(j) * 2 + rn(2);
                if (isFound || getPruning$1(ecPrun[j], corns[j] * 24 + edges[j]) > length) {
                    continue;
                }
                var sol = [];
                for (let depth = 0; depth <= length; depth++) {
                    if (idaxcross(perm, flip, edges[j], corns[j], j, depth, -1, sol)) {
                        isFound = true;
                        break;
                    }
                }
            }
            if (!isFound) {
                continue;
            }
            const crossArr = mapCross$1(caze);
            crossArr[2] = valuedArray(8, -1);
            crossArr[3] = valuedArray(8, -1);
            const map = [7, 6, 5, 4, 10, 9, 8, 11, 3, 2, 1, 0];
            const map2 = [6, 5, 4, 7, 2, 1, 0, 3];
            for (var i = 0; i < 4; i++) {
                crossArr[0][map[edges[i] >> 1]] = map[i + 4];
                crossArr[1][map[edges[i] >> 1]] = edges[i] % 2;
                crossArr[2][map2[~~(corns[i] / 3)]] = map2[i + 4];
                crossArr[3][map2[~~(corns[i] / 3)]] = (30 - corns[i]) % 3;
            }
            return crossArr;
        }
    }
}

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
// COMMON FUNCTIONS
const SYM_E2C_MAGIC = 0x00dddd00;
const SymCube = [];
const SymMult = [];
const SymMultInv = [];
const FlipR2S = [];
const TwistR2S = [];
const EPermR2S = [];
const PermInvEdgeSym = [];
const SymMove = [];
const Sym8Move = [];
const SymMoveUD = [];
const moveCube$1 = [];
const FlipS2R = [];
const Perm2CombP = [];
const TwistS2R = [];
const EPermS2R = [];
const SymStateFlip = [];
const SymStateTwist = [];
const SymStatePerm = [];
const FlipS2RF = [];
const FlipMove = [];
const UDSliceMove = [];
const TwistMove = [];
const UDSliceConj = [];
const UDSliceTwistPrun = [];
const UDSliceFlipPrun = [];
const TwistFlipPrun = [];
function setVal(val0, val, isEdge) {
    return isEdge ? (val << 1) | (val0 & 1) : val | (val0 & 0xf8);
}
function getVal(val0, isEdge) {
    return isEdge ? val0 >> 1 : val0 & 7;
}
function setPruning(table, index, value) {
    table[index >> 3] ^= value << (index << 2); // index << 2 <=> (index & 7) << 2
}
function getPruning(table, index) {
    return (table[index >> 3] >> (index << 2)) & 0xf; // index << 2 <=> (index & 7) << 2
}
function getPruningMax(maxValue, table, index) {
    return Math.min(maxValue, (table[index >> 3] >> (index << 2)) & 0xf);
}
function hasZero(val) {
    return ((val - 0x11111111) & ~val & 0x88888888) != 0;
}
function setNPerm(arr, idx, n, isEdge) {
    n--;
    let val = 0x76543210;
    for (let i = 0; i < n; ++i) {
        const p = fact[n - i];
        let v = ~~(idx / p);
        idx %= p;
        v <<= 2;
        arr[i] = setVal(arr[i], (val >> v) & 0xf, isEdge);
        const m = (1 << v) - 1;
        val = (val & m) + ((val >> 4) & ~m);
    }
    arr[n] = setVal(arr[n], val & 0xf, isEdge);
}
function getNPerm(arr, n, isEdge) {
    let idx = 0, val = 0x76543210;
    for (let i = 0; i < n - 1; ++i) {
        const v = getVal(arr[i], isEdge) << 2;
        idx = (n - i) * idx + ((val >> v) & 0xf);
        val -= 0x11111110 << v;
    }
    return idx;
}
function setNPermFull(arr, idx, n, isEdge) {
    arr[n - 1] = setVal(arr[n - 1], 0, isEdge);
    for (let i = n - 2; i >= 0; --i) {
        arr[i] = setVal(arr[i], idx % (n - i), isEdge);
        idx = ~~(idx / (n - i));
        for (let j = i + 1; j < n; ++j) {
            if (getVal(arr[j], isEdge) >= getVal(arr[i], isEdge)) {
                arr[j] = setVal(arr[j], getVal(arr[j], isEdge) + 1, isEdge);
            }
        }
    }
}
function getNPermFull(arr, n, isEdge) {
    let idx = 0;
    for (let i = 0; i < n; ++i) {
        idx *= n - i;
        for (let j = i + 1; j < n; ++j) {
            if (getVal(arr[j], isEdge) < getVal(arr[i], isEdge)) {
                ++idx;
            }
        }
    }
    return idx;
}
function setComb(arr, idxC, mask, isEdge) {
    const end = arr.length - 1;
    let r = 4, fill = end;
    for (let i = end; i >= 0; i--) {
        if (idxC >= Cnk[i][r]) {
            idxC -= Cnk[i][r--];
            arr[i] = setVal(arr[i], r | mask, isEdge);
        }
        else {
            if ((fill & 0xc) == mask) {
                fill -= 4;
            }
            arr[i] = setVal(arr[i], fill--, isEdge);
        }
    }
}
function getComb(arr, mask, isEdge) {
    const end = arr.length - 1;
    let idxC = 0;
    let r = 4;
    for (let i = end; i >= 0; i--) {
        const perm = getVal(arr[i], isEdge);
        if ((perm & 0xc) == mask) {
            idxC += Cnk[i][r--];
        }
    }
    return idxC;
}
function getNParity(idx, n) {
    let p = 0;
    for (let i = n - 2; i >= 0; i--) {
        p ^= idx % (n - i);
        idx = ~~(idx / (n - i));
    }
    return p & 1;
}
function ESym2CSym(idx) {
    return idx ^ ((SYM_E2C_MAGIC >> ((idx & 0xf) << 1)) & 3);
}
function initRawSymPrun(PrunTable, N_RAW, N_SYM, RawMove, RawConj, SymMove, SymState, PrunFlag) {
    const SYM_SHIFT = PrunFlag & 0xf;
    const SYM_E2C_MAGIC = ((PrunFlag >> 4) & 1) == 1 ? 0x00dddd00 : 0x00000000;
    const IS_PHASE2 = ((PrunFlag >> 5) & 1) == 1;
    const INV_DEPTH = (PrunFlag >> 8) & 0xf;
    const MAX_DEPTH = (PrunFlag >> 12) & 0xf;
    const MIN_DEPTH = (PrunFlag >> 16) & 0xf;
    const SYM_MASK = (1 << SYM_SHIFT) - 1;
    const ISTFP = RawMove == null;
    const N_SIZE = N_RAW * N_SYM;
    const N_MOVES = IS_PHASE2 ? 10 : 18;
    const NEXT_AXIS_MAGIC = N_MOVES == 10 ? 0x42 : 0x92492;
    let depth = getPruning(PrunTable, N_SIZE) - 1;
    if (depth == -1) {
        for (let i = 0; i < (N_SIZE >> 3) + 1; i++) {
            PrunTable[i] = 0xffffffff;
        }
        setPruning(PrunTable, 0, 0 ^ 0xf);
        depth = 0;
    }
    else {
        setPruning(PrunTable, N_SIZE, 0xf ^ (depth + 1));
    }
    const SEARCH_DEPTH = Math.min(Math.max(depth + 1, MIN_DEPTH), MAX_DEPTH) ;
    while (depth < SEARCH_DEPTH) {
        const inv = depth > INV_DEPTH;
        const select = inv ? 0xf : depth;
        const selArrMask = select * 0x11111111;
        const check = inv ? depth : 0xf;
        depth++;
        InitPrunProgress++;
        const xorVal = depth ^ 0xf;
        let val = 0;
        for (let i = 0; i < N_SIZE; i++, val >>= 4) {
            if ((i & 7) == 0) {
                val = PrunTable[i >> 3];
                if (!hasZero(val ^ selArrMask)) {
                    i += 7;
                    continue;
                }
            }
            if ((val & 0xf) != select) {
                continue;
            }
            const raw = i % N_RAW;
            const sym = ~~(i / N_RAW);
            let flip = 0, fsym = 0;
            if (ISTFP) {
                flip = FlipR2S[raw];
                fsym = flip & 7;
                flip >>= 3;
            }
            for (let m = 0; m < N_MOVES; m++) {
                let symx = SymMove[sym][m];
                let rawx;
                if (ISTFP) {
                    rawx = FlipS2RF[FlipMove[flip][Sym8Move[(m << 3) | fsym]] ^ fsym ^ (symx & SYM_MASK)];
                }
                else {
                    rawx = RawConj[RawMove[raw][m]][symx & SYM_MASK];
                }
                symx >>= SYM_SHIFT;
                const idx = symx * N_RAW + rawx;
                const prun = getPruning(PrunTable, idx);
                if (prun != check) {
                    if (prun < depth - 1) {
                        m += (NEXT_AXIS_MAGIC >> m) & 3;
                    }
                    continue;
                }
                if (inv) {
                    setPruning(PrunTable, i, xorVal);
                    break;
                }
                setPruning(PrunTable, idx, xorVal);
                for (let j = 1, symState = SymState[symx]; (symState >>= 1) != 0; j++) {
                    if ((symState & 1) != 1) {
                        continue;
                    }
                    let idxx = symx * N_RAW;
                    if (ISTFP) {
                        idxx += FlipS2RF[FlipR2S[rawx] ^ j];
                    }
                    else {
                        idxx += RawConj[rawx][j ^ ((SYM_E2C_MAGIC >> (j << 1)) & 3)];
                    }
                    if (getPruning(PrunTable, idxx) == check) {
                        setPruning(PrunTable, idxx, xorVal);
                    }
                }
            }
        }
    }
    setPruning(PrunTable, N_SIZE, (depth + 1) ^ 0xf);
    return depth + 1;
}
//--------------------------------------------
const cornerFacelet$1 = [
    [8, 9, 20],
    [6, 18, 38],
    [0, 36, 47],
    [2, 45, 11],
    [29, 26, 15],
    [27, 44, 24],
    [33, 53, 42],
    [35, 17, 51],
];
const edgeFacelet$1 = [
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
let CubieCube$1 = class CubieCube {
    constructor() {
        this.ca = [0, 1, 2, 3, 4, 5, 6, 7];
        this.ea = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    }
    static EdgeMult(a, b, prod) {
        for (let ed = 0; ed < 12; ed += 1) {
            prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ (b.ea[ed] & 1);
        }
    }
    static CornMult(a, b, prod) {
        for (let corn = 0; corn < 8; corn += 1) {
            const ori = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
            prod.ca[corn] = (a.ca[b.ca[corn] & 7] & 7) | (ori << 3);
        }
    }
    static CornMultFull(a, b, prod) {
        for (let corn = 0; corn < 8; corn += 1) {
            const oriA = a.ca[b.ca[corn] & 7] >> 3;
            const oriB = b.ca[corn] >> 3;
            let ori = oriA + (oriA < 3 ? oriB : 6 - oriB);
            ori = (ori % 3) + (oriA < 3 == oriB < 3 ? 0 : 3);
            prod.ca[corn] = (a.ca[b.ca[corn] & 7] & 7) | (ori << 3);
        }
    }
    static CornConjugate(a, idx, b) {
        const sinv = SymCube[SymMultInv[0][idx]];
        const s = SymCube[idx];
        for (let corn = 0; corn < 8; corn += 1) {
            const oriA = sinv.ca[a.ca[s.ca[corn] & 7] & 7] >> 3;
            const oriB = a.ca[s.ca[corn] & 7] >> 3;
            const ori = oriA < 3 ? oriB : (3 - oriB) % 3;
            b.ca[corn] = (sinv.ca[a.ca[s.ca[corn] & 7] & 7] & 7) | (ori << 3);
        }
    }
    static EdgeConjugate(a, idx, b) {
        const sinv = SymCube[SymMultInv[0][idx]];
        const s = SymCube[idx];
        for (let ed = 0; ed < 12; ed++) {
            b.ea[ed] = sinv.ea[a.ea[s.ea[ed] >> 1] >> 1] ^ (a.ea[s.ea[ed] >> 1] & 1) ^ (s.ea[ed] & 1);
        }
    }
    init(ca, ea) {
        this.ca = ca.slice();
        this.ea = ea.slice();
        return this;
    }
    initCoord(cperm, twist, eperm, flip) {
        setNPerm(this.ca, cperm, 8, false);
        this.setTwist(twist);
        setNPermFull(this.ea, eperm, 12, true);
        this.setFlip(flip);
        return this;
    }
    isEqual(c) {
        if (this.ca.some((v, i) => v != c.ca[i]) || this.ea.some((v, i) => v != c.ea[i])) {
            return false;
        }
        return true;
    }
    setFlip(idx) {
        let parity = 0;
        let val;
        for (let i = 10; i >= 0; i--, idx >>= 1) {
            parity ^= val = idx & 1;
            this.ea[i] = (this.ea[i] & 0xfe) | val;
        }
        this.ea[11] = (this.ea[11] & 0xfe) | parity;
    }
    getFlip() {
        let idx = 0;
        for (let i = 0; i < 11; i++) {
            idx = (idx << 1) | (this.ea[i] & 1);
        }
        return idx;
    }
    getFlipSym() {
        return FlipR2S[this.getFlip()];
    }
    setTwist(idx) {
        let twst = 15;
        let val;
        for (let i = 6; i >= 0; i--, idx = ~~(idx / 3)) {
            twst -= val = idx % 3;
            this.ca[i] = (this.ca[i] & 0x7) | (val << 3);
        }
        this.ca[7] = (this.ca[7] & 0x7) | (twst % 3 << 3);
    }
    getTwist() {
        let idx = 0;
        for (let i = 0; i < 7; i++) {
            idx += (idx << 1) + (this.ca[i] >> 3);
        }
        return idx;
    }
    getTwistSym() {
        return TwistR2S[this.getTwist()];
    }
    setCPerm(idx) {
        setNPerm(this.ca, idx, 8, false);
    }
    getCPerm() {
        return getNPerm(this.ca, 8, false);
    }
    getCPermSym() {
        return ESym2CSym(EPermR2S[getNPerm(this.ca, 8, false)]);
    }
    setEPerm(idx) {
        setNPerm(this.ea, idx, 8, true);
    }
    getEPerm() {
        return getNPerm(this.ea, 8, true);
    }
    getEPermSym() {
        return EPermR2S[getNPerm(this.ea, 8, true)];
    }
    getUDSlice() {
        return 494 - getComb(this.ea, 8, true);
    }
    setUDSlice(idx) {
        setComb(this.ea, 494 - idx, 8, true);
    }
    getMPerm() {
        return getNPermFull(this.ea, 12, true) % 24;
    }
    setMPerm(idx) {
        setNPermFull(this.ea, idx, 12, true);
    }
    getCComb() {
        return getComb(this.ca, 0, false);
    }
    setCComb(idx) {
        setComb(this.ca, idx, 0, false);
    }
    URFConjugate() {
        const temps = new CubieCube();
        CubieCube.CornMult(CubieCube.urf2, this, temps);
        CubieCube.CornMult(temps, CubieCube.urf1, this);
        CubieCube.EdgeMult(CubieCube.urf2, this, temps);
        CubieCube.EdgeMult(temps, CubieCube.urf1, this);
    }
    toFaceCube(cFacelet = cornerFacelet$1, eFacelet = edgeFacelet$1) {
        const ts = "URFDLB";
        const f = [];
        for (let i = 0; i < 54; i++) {
            f[i] = ts[~~(i / 9)];
        }
        for (let c = 0; c < 8; c++) {
            const j = this.ca[c] & 0x7; // cornercubie with index j is at
            const ori = this.ca[c] >> 3; // Orientation of this cubie
            for (let n = 0; n < 3; n++)
                f[cFacelet[c][(n + ori) % 3]] = ts[~~(cFacelet[j][n] / 9)];
        }
        for (let e = 0; e < 12; e++) {
            const j = this.ea[e] >> 1; // edgecubie with index j is at edgeposition
            const ori = this.ea[e] & 1; // Orientation of this cubie
            for (let n = 0; n < 2; n++)
                f[eFacelet[e][(n + ori) % 2]] = ts[~~(eFacelet[j][n] / 9)];
        }
        return f.join("");
    }
    invFrom(cc) {
        for (let edge = 0; edge < 12; edge++) {
            this.ea[cc.ea[edge] >> 1] = (edge << 1) | (cc.ea[edge] & 1);
        }
        for (let corn = 0; corn < 8; corn++) {
            this.ca[cc.ca[corn] & 0x7] = corn | ((0x20 >> (cc.ca[corn] >> 3)) & 0x18);
        }
        return this;
    }
    fromFacelet(facelet, cFacelet = cornerFacelet$1, eFacelet = edgeFacelet$1) {
        let count = 0;
        const f = [];
        const centers = facelet[4] + facelet[13] + facelet[22] + facelet[31] + facelet[40] + facelet[49];
        for (let i = 0; i < 54; ++i) {
            f[i] = centers.indexOf(facelet[i]);
            if (f[i] == -1) {
                return -1;
            }
            count += 1 << (f[i] << 2);
        }
        if (count != 0x999999) {
            return -1;
        }
        let col1, col2, i, j, ori;
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
    }
};
CubieCube$1.urf1 = new CubieCube$1().initCoord(2531, 1373, 67026819, 1367);
CubieCube$1.urf2 = new CubieCube$1().initCoord(2089, 1906, 322752913, 2040);
//--------------------------------------------
class CoordCube {
    constructor() {
        this.twist = 0;
        this.tsym = 0;
        this.flip = 0;
        this.fsym = 0;
        this.slice = 0;
        this.prun = 0;
        this.twistc = 0;
        this.flipc = 0;
    }
    set(node) {
        this.twist = node.twist;
        this.tsym = node.tsym;
        this.flip = node.flip;
        this.fsym = node.fsym;
        this.slice = node.slice;
        this.prun = node.prun;
        {
            this.twistc = node.twistc;
            this.flipc = node.flipc;
        }
    }
    calcPruning() {
        this.prun = Math.max(Math.max(getPruningMax(CoordCube.UDSliceTwistPrunMax, UDSliceTwistPrun, this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]), getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun, this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])), Math.max(getPruningMax(TwistFlipPrunMax, TwistFlipPrun, ((this.twistc >> 3) << 11) | FlipS2RF[this.flipc ^ (this.twistc & 7)])
            , getPruningMax(TwistFlipPrunMax, TwistFlipPrun, (this.twist << 11) | FlipS2RF[(this.flip << 3) | (this.fsym ^ this.tsym)])
            ));
    }
    setWithPrun(cc, depth) {
        this.twist = cc.getTwistSym();
        this.flip = cc.getFlipSym();
        this.tsym = this.twist & 7;
        this.twist = this.twist >> 3;
        this.prun = getPruningMax(TwistFlipPrunMax, TwistFlipPrun, (this.twist << 11) | FlipS2RF[this.flip ^ this.tsym])
            ;
        if (this.prun > depth) {
            return false;
        }
        this.fsym = this.flip & 7;
        this.flip = this.flip >> 3;
        this.slice = cc.getUDSlice();
        this.prun = Math.max(this.prun, Math.max(getPruningMax(CoordCube.UDSliceTwistPrunMax, UDSliceTwistPrun, this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]), getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun, this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])));
        if (this.prun > depth) {
            return false;
        }
        {
            const pc = new CubieCube$1();
            CubieCube$1.CornConjugate(cc, 1, pc);
            CubieCube$1.EdgeConjugate(cc, 1, pc);
            this.twistc = pc.getTwistSym();
            this.flipc = pc.getFlipSym();
            this.prun = Math.max(this.prun, getPruningMax(TwistFlipPrunMax, TwistFlipPrun, ((this.twistc >> 3) << 11) | FlipS2RF[this.flipc ^ (this.twistc & 7)]));
        }
        return this.prun <= depth;
    }
    doMovePrun(cc, m) {
        this.slice = UDSliceMove[cc.slice][m];
        this.flip = FlipMove[cc.flip][Sym8Move[(m << 3) | cc.fsym]];
        this.fsym = (this.flip & 7) ^ cc.fsym;
        this.flip >>= 3;
        this.twist = TwistMove[cc.twist][Sym8Move[(m << 3) | cc.tsym]];
        this.tsym = (this.twist & 7) ^ cc.tsym;
        this.twist >>= 3;
        this.prun = Math.max(Math.max(getPruningMax(CoordCube.UDSliceTwistPrunMax, UDSliceTwistPrun, this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]), getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun, this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])), getPruningMax(TwistFlipPrunMax, TwistFlipPrun, (this.twist << 11) | FlipS2RF[(this.flip << 3) | (this.fsym ^ this.tsym)])
            );
        return this.prun;
    }
    doMovePrunConj(cc, m) {
        m = SymMove[3][m];
        this.flipc = FlipMove[cc.flipc >> 3][Sym8Move[(m << 3) | (cc.flipc & 7)]] ^ (cc.flipc & 7);
        this.twistc = TwistMove[cc.twistc >> 3][Sym8Move[(m << 3) | (cc.twistc & 7)]] ^ (cc.twistc & 7);
        return getPruningMax(TwistFlipPrunMax, TwistFlipPrun, ((this.twistc >> 3) << 11) | FlipS2RF[this.flipc ^ (this.twistc & 7)]);
    }
}
CoordCube.UDSliceTwistPrunMax = 15;
//--------------------------------------------
const MAX_PRE_MOVES = 20;
const MIN_P1LENGTH_PRE = 7;
const MAX_DEPTH2 = 13;
const INVERSE_SOLUTION = 0x2;
const move2str$1 = [
    "U ",
    "U2",
    "U'",
    "R ",
    "R2",
    "R'",
    "F ",
    "F2",
    "F'",
    "D ",
    "D2",
    "D'",
    "L ",
    "L2",
    "L'",
    "B ",
    "B2",
    "B'",
];
const urfMove = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    [6, 7, 8, 0, 1, 2, 3, 4, 5, 15, 16, 17, 9, 10, 11, 12, 13, 14],
    [3, 4, 5, 6, 7, 8, 0, 1, 2, 12, 13, 14, 15, 16, 17, 9, 10, 11],
    [2, 1, 0, 5, 4, 3, 8, 7, 6, 11, 10, 9, 14, 13, 12, 17, 16, 15],
    [8, 7, 6, 2, 1, 0, 5, 4, 3, 17, 16, 15, 11, 10, 9, 14, 13, 12],
    [5, 4, 3, 8, 7, 6, 2, 1, 0, 14, 13, 12, 17, 16, 15, 11, 10, 9],
];
function getPermSymInv(idx, sym, isCorner) {
    let idxi = PermInvEdgeSym[idx];
    if (isCorner) {
        idxi = ESym2CSym(idxi);
    }
    return (idxi & 0xfff0) | SymMult[idxi & 0xf][sym];
}
let Search$1 = class Search {
    constructor() {
        this.move = [];
        this.moveSol = null;
        this.nodeUD = [];
        this.valid1 = 0;
        this.allowShorter = false;
        this.cc = new CubieCube$1();
        this.urfCubieCube = [];
        this.urfCoordCube = [];
        this.phase1Cubie = [];
        this.preMoveCubes = [];
        this.preMoves = [];
        this.preMoveLen = 0;
        this.maxPreMoves = 0;
        this.sol = 0;
        this.probe = -1;
        this.probeMax = 1e9;
        this.probeMin = 0;
        this.verbose = 0;
        this.conjMask = 0;
        this.length1 = 0;
        this.depth1 = 0;
        this.urfIdx = 0;
        this.isRec = false;
        this.strSolution = "";
        for (let i = 0; i < 21; i++) {
            this.nodeUD[i] = new CoordCube();
            this.phase1Cubie[i] = new CubieCube$1();
        }
        for (let i = 0; i < 6; i++) {
            this.urfCubieCube[i] = new CubieCube$1();
            this.urfCoordCube[i] = new CoordCube();
        }
        for (let i = 0; i < MAX_PRE_MOVES; i++) {
            this.preMoveCubes[i + 1] = new CubieCube$1();
        }
    }
    solution(facelets, maxDepth = 21, probeMax = 1e9, probeMin = 0, verbose = 0) {
        initPrunTables();
        const check = this.verify(facelets);
        if (check != 0) {
            return "Error " + Math.abs(check);
        }
        this.sol = maxDepth + 1;
        this.probe = 0;
        this.probeMax = probeMax;
        this.probeMin = Math.min(probeMin, probeMax);
        this.verbose = verbose;
        this.moveSol = null;
        this.isRec = false;
        this.initSearch();
        return this.search();
    }
    initSearch() {
        this.conjMask = (0 ) | (0 );
        this.maxPreMoves = this.conjMask > 7 ? 0 : MAX_PRE_MOVES;
        for (let i = 0; i < 6; i++) {
            this.urfCubieCube[i].init(this.cc.ca, this.cc.ea);
            this.urfCoordCube[i].setWithPrun(this.urfCubieCube[i], 20);
            this.cc.URFConjugate();
            if (i % 3 == 2) {
                const tmp = new CubieCube$1().invFrom(this.cc);
                this.cc.init(tmp.ca, tmp.ea);
            }
        }
    }
    next(probeMax, probeMin, verbose) {
        this.probe = 0;
        this.probeMax = probeMax;
        this.probeMin = Math.min(probeMin, probeMax);
        this.moveSol = null;
        this.isRec = true;
        this.verbose = verbose;
        return this.search();
    }
    verify(facelets) {
        if (this.cc.fromFacelet(facelets) == -1) {
            return -1;
        }
        let sum = 0;
        let edgeMask = 0;
        for (let e = 0; e < 12; e++) {
            edgeMask |= 1 << (this.cc.ea[e] >> 1);
            sum ^= this.cc.ea[e] & 1;
        }
        if (edgeMask != 0xfff) {
            return -2; // missing edges
        }
        if (sum != 0) {
            return -3;
        }
        let cornMask = 0;
        sum = 0;
        for (let c = 0; c < 8; c++) {
            cornMask |= 1 << (this.cc.ca[c] & 7);
            sum += this.cc.ca[c] >> 3;
        }
        if (cornMask != 0xff) {
            return -4; // missing corners
        }
        if (sum % 3 != 0) {
            return -4 - (sum % 3); // twisted corner
        }
        if ((getNParity(getNPermFull(this.cc.ea, 12, true), 12) ^ getNParity(this.cc.getCPerm(), 8)) !=
            0) {
            return -7; // parity error
        }
        return 0; // cube ok
    }
    phase1PreMoves(maxl, lm, cc) {
        this.preMoveLen = this.maxPreMoves - maxl;
        if (this.isRec
            ? this.depth1 == this.length1 - this.preMoveLen
            : this.preMoveLen == 0 || ((0x36fb7 >> lm) & 1) == 0) {
            this.depth1 = this.length1 - this.preMoveLen;
            this.phase1Cubie[0].init(cc.ca, cc.ea) /* = cc*/;
            this.allowShorter = this.depth1 == MIN_P1LENGTH_PRE && this.preMoveLen != 0;
            if (this.nodeUD[this.depth1 + 1].setWithPrun(cc, this.depth1) &&
                this.phase1(this.nodeUD[this.depth1 + 1], this.depth1, -1) == 0) {
                return 0;
            }
        }
        if (maxl == 0 || this.preMoveLen + MIN_P1LENGTH_PRE >= this.length1) {
            return 1;
        }
        let skipMoves = 0;
        if (maxl == 1 || this.preMoveLen + 1 + MIN_P1LENGTH_PRE >= this.length1) {
            //last pre move
            skipMoves |= 0x36fb7; // 11 0110 1111 1011 0111
        }
        lm = ~~(lm / 3) * 3;
        for (let m = 0; m < 18; m++) {
            if (m == lm || m == lm - 9 || m == lm + 9) {
                m += 2;
                continue;
            }
            if ((this.isRec && m != this.preMoves[this.maxPreMoves - maxl]) ||
                (skipMoves & (1 << m)) != 0) {
                continue;
            }
            CubieCube$1.CornMult(moveCube$1[m], cc, this.preMoveCubes[maxl]);
            CubieCube$1.EdgeMult(moveCube$1[m], cc, this.preMoveCubes[maxl]);
            this.preMoves[this.maxPreMoves - maxl] = m;
            const ret = this.phase1PreMoves(maxl - 1, m, this.preMoveCubes[maxl]);
            if (ret == 0) {
                return 0;
            }
        }
        return 1;
    }
    search() {
        for (this.length1 = this.isRec ? this.length1 : 0; this.length1 < this.sol; this.length1++) {
            for (this.urfIdx = this.isRec ? this.urfIdx : 0; this.urfIdx < 6; this.urfIdx++) {
                if ((this.conjMask & (1 << this.urfIdx)) != 0) {
                    continue;
                }
                if (this.phase1PreMoves(this.maxPreMoves, -30, this.urfCubieCube[this.urfIdx]) == 0) {
                    return this.strSolution == null ? "Error 8" : this.strSolution;
                }
            }
        }
        return this.strSolution == null ? "Error 7" : this.strSolution;
    }
    initPhase2Pre() {
        this.isRec = false;
        if (this.probe >= (this.moveSol == null ? this.probeMax : this.probeMin)) {
            return 0;
        }
        ++this.probe;
        for (let i = this.valid1; i < this.depth1; i++) {
            CubieCube$1.CornMult(this.phase1Cubie[i], moveCube$1[this.move[i]], this.phase1Cubie[i + 1]);
            CubieCube$1.EdgeMult(this.phase1Cubie[i], moveCube$1[this.move[i]], this.phase1Cubie[i + 1]);
        }
        this.valid1 = this.depth1;
        let ret = this.initPhase2(this.phase1Cubie[this.depth1]);
        if (ret == 0 || this.preMoveLen == 0 || ret == 2) {
            return ret;
        }
        const m = ~~(this.preMoves[this.preMoveLen - 1] / 3) * 3 + 1;
        CubieCube$1.CornMult(moveCube$1[m], this.phase1Cubie[this.depth1], this.phase1Cubie[this.depth1 + 1]);
        CubieCube$1.EdgeMult(moveCube$1[m], this.phase1Cubie[this.depth1], this.phase1Cubie[this.depth1 + 1]);
        this.preMoves[this.preMoveLen - 1] += 2 - (this.preMoves[this.preMoveLen - 1] % 3) * 2;
        ret = this.initPhase2(this.phase1Cubie[this.depth1 + 1]);
        this.preMoves[this.preMoveLen - 1] += 2 - (this.preMoves[this.preMoveLen - 1] % 3) * 2;
        return ret;
    }
    initPhase2(phase2Cubie) {
        let p2corn = phase2Cubie.getCPermSym();
        const p2csym = p2corn & 0xf;
        p2corn >>= 4;
        let p2edge = phase2Cubie.getEPermSym();
        const p2esym = p2edge & 0xf;
        p2edge >>= 4;
        const p2mid = phase2Cubie.getMPerm();
        const prun = Math.max(getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun, p2edge * N_COMB + CCombPConj[Perm2CombP[p2corn] & 0xff][SymMultInv[p2esym][p2csym]]), getPruningMax(MCPermPrunMax, MCPermPrun, p2corn * N_MPERM + MPermConj[p2mid][p2csym]));
        const maxDep2 = Math.min(MAX_DEPTH2, this.sol - this.length1);
        if (prun >= maxDep2) {
            return prun > maxDep2 ? 2 : 1;
        }
        let depth2;
        for (depth2 = maxDep2 - 1; depth2 >= prun; depth2--) {
            const ret = this.phase2(p2edge, p2esym, p2corn, p2csym, p2mid, depth2, this.depth1, 10);
            if (ret < 0) {
                break;
            }
            depth2 -= ret;
            this.moveSol = [];
            for (let i = 0; i < this.depth1 + depth2; i++) {
                this.appendSolMove(this.move[i]);
            }
            for (let i = this.preMoveLen - 1; i >= 0; i--) {
                this.appendSolMove(this.preMoves[i]);
            }
            this.sol = this.moveSol.length;
            // FIXME
            this.strSolution = this.solutionToString();
        }
        if (depth2 != maxDep2 - 1) {
            //At least one solution has been found.
            return this.probe >= this.probeMin ? 0 : 1;
        }
        else {
            return 1;
        }
    }
    phase1(node, maxl, lm) {
        if (node.prun == 0 && maxl < 5) {
            if (this.allowShorter || maxl == 0) {
                this.depth1 -= maxl;
                const ret = this.initPhase2Pre();
                this.depth1 += maxl;
                return ret;
            }
            else {
                return 1;
            }
        }
        for (let axis = 0; axis < 18; axis += 3) {
            if (axis == lm || axis == lm - 9) {
                continue;
            }
            for (let power = 0; power < 3; power++) {
                const m = axis + power;
                if (this.isRec && m != this.move[this.depth1 - maxl]) {
                    continue;
                }
                let prun = this.nodeUD[maxl].doMovePrun(node, m);
                if (prun > maxl) {
                    break;
                }
                else if (prun == maxl) {
                    continue;
                }
                {
                    prun = this.nodeUD[maxl].doMovePrunConj(node, m);
                    if (prun > maxl) {
                        break;
                    }
                    else if (prun == maxl) {
                        continue;
                    }
                }
                this.move[this.depth1 - maxl] = m;
                this.valid1 = Math.min(this.valid1, this.depth1 - maxl);
                const ret = this.phase1(this.nodeUD[maxl], maxl - 1, axis);
                if (ret == 0) {
                    return 0;
                }
                else if (ret == 2) {
                    break;
                }
            }
        }
        return 1;
    }
    appendSolMove(curMove) {
        if (!this.moveSol || this.moveSol.length == 0) {
            this.moveSol = [curMove];
            return;
        }
        const axisCur = ~~(curMove / 3);
        const axisLast = ~~(this.moveSol[this.moveSol.length - 1] / 3);
        if (axisCur == axisLast) {
            const pow = ((curMove % 3) + (this.moveSol[this.moveSol.length - 1] % 3) + 1) % 4;
            if (pow == 3) {
                this.moveSol.pop();
            }
            else {
                this.moveSol[this.moveSol.length - 1] = axisCur * 3 + pow;
            }
            return;
        }
        if (this.moveSol.length > 1 &&
            axisCur % 3 == axisLast % 3 &&
            axisCur == ~~(this.moveSol[this.moveSol.length - 2] / 3)) {
            const pow = ((curMove % 3) + (this.moveSol[this.moveSol.length - 2] % 3) + 1) % 4;
            if (pow == 3) {
                this.moveSol[this.moveSol.length - 2] = this.moveSol[this.moveSol.length - 1];
                this.moveSol.pop();
            }
            else {
                this.moveSol[this.moveSol.length - 2] = axisCur * 3 + pow;
            }
            return;
        }
        this.moveSol.push(curMove);
    }
    phase2(edge, esym, corn, csym, mid, maxl, depth, lm) {
        if (edge == 0 && corn == 0 && mid == 0) {
            return maxl;
        }
        const moveMask = ckmv2bit[lm];
        for (let m = 0; m < 10; m++) {
            if (((moveMask >> m) & 1) != 0) {
                m += (0x42 >> m) & 3;
                continue;
            }
            const midx = MPermMove[mid][m];
            let cornx = CPermMove[corn][SymMoveUD[csym][m]];
            const csymx = SymMult[cornx & 0xf][csym];
            cornx >>= 4;
            if (getPruningMax(MCPermPrunMax, MCPermPrun, cornx * N_MPERM + MPermConj[midx][csymx]) >= maxl) {
                continue;
            }
            let edgex = EPermMove[edge][SymMoveUD[esym][m]];
            const esymx = SymMult[edgex & 0xf][esym];
            edgex >>= 4;
            if (getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun, edgex * N_COMB + CCombPConj[Perm2CombP[cornx] & 0xff][SymMultInv[esymx][csymx]]) >= maxl) {
                continue;
            }
            const edgei = getPermSymInv(edgex, esymx, false);
            const corni = getPermSymInv(cornx, csymx, true);
            if (getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun, (edgei >> 4) * N_COMB +
                CCombPConj[Perm2CombP[corni >> 4] & 0xff][SymMultInv[edgei & 0xf][corni & 0xf]]) >= maxl) {
                continue;
            }
            const ret = this.phase2(edgex, esymx, cornx, csymx, midx, maxl - 1, depth + 1, m);
            if (ret >= 0) {
                this.move[depth] = ud2std[m];
                return ret;
            }
        }
        return -1;
    }
    solutionToString() {
        if (!this.moveSol)
            return "";
        let sb = "";
        const urf = (this.verbose & INVERSE_SOLUTION) != 0 ? (this.urfIdx + 3) % 6 : this.urfIdx;
        if (urf < 3) {
            for (let s = 0; s < this.moveSol.length; ++s) {
                sb += move2str$1[urfMove[urf][this.moveSol[s]]] + " ";
            }
        }
        else {
            for (let s = this.moveSol.length - 1; s >= 0; --s) {
                sb += move2str$1[urfMove[urf][this.moveSol[s]]] + " ";
            }
        }
        return sb;
    }
};
const Ux1$1 = 0;
const Ux2$1 = 1;
const Ux3$1 = 2;
const Rx1$1 = 3;
const Rx2$1 = 4;
const Rx3$1 = 5;
const Fx1 = 6;
const Fx2 = 7;
const Fx3 = 8;
const Dx1$1 = 9;
const Dx2$1 = 10;
const Dx3$1 = 11;
const Lx1$1 = 12;
const Lx2$1 = 13;
const Lx3$1 = 14;
const Bx1 = 15;
const Bx2 = 16;
const Bx3 = 17;
const N_MOVES = 18;
const N_MOVES2 = 10;
const N_FLIP = 2048;
const N_FLIP_SYM = 336;
const N_TWIST = 2187;
const N_TWIST_SYM = 324;
const N_PERM = 40320;
const N_PERM_SYM = 2768;
const N_MPERM = 24;
const N_SLICE = 495;
const N_COMB = 140 ;
const P2_PARITY_MOVE = 0xa5 ;
const ud2std = [
    Ux1$1,
    Ux2$1,
    Ux3$1,
    Rx2$1,
    Fx2,
    Dx1$1,
    Dx2$1,
    Dx3$1,
    Lx2$1,
    Bx2,
    Rx1$1,
    Rx3$1,
    Fx1,
    Fx3,
    Lx1$1,
    Lx3$1,
    Bx1,
    Bx3,
];
const std2ud = [];
const ckmv2bit = [];
{
    // init util
    for (let i = 0; i < 18; i++) {
        std2ud[ud2std[i]] = i;
    }
    for (let i = 0; i < 10; i++) {
        const ix = ~~(ud2std[i] / 3);
        ckmv2bit[i] = 0;
        for (let j = 0; j < 10; j++) {
            const jx = ~~(ud2std[j] / 3);
            ckmv2bit[i] |= (ix == jx || (ix % 3 == jx % 3 && ix >= jx) ? 1 : 0) << j;
        }
    }
    ckmv2bit[10] = 0;
}
//phase2
const CPermMove = [];
const EPermMove = [];
let MPermMove = [];
const MPermConj = [];
const CCombPMove = []; // = new char[N_COMB][N_MOVES2];
const CCombPConj = [];
const MCPermPrun = [];
const EPermCCombPPrun = [];
let TwistFlipPrunMax = 15;
let UDSliceFlipPrunMax = 15;
let MCPermPrunMax = 15;
let EPermCCombPPrunMax = 15;
{
    //init move cubes
    for (let i = 0; i < 18; i++) {
        moveCube$1[i] = new CubieCube$1();
    }
    moveCube$1[0].initCoord(15120, 0, 119750400, 0);
    moveCube$1[3].initCoord(21021, 1494, 323403417, 0);
    moveCube$1[6].initCoord(8064, 1236, 29441808, 550);
    moveCube$1[9].initCoord(9, 0, 5880, 0);
    moveCube$1[12].initCoord(1230, 412, 2949660, 0);
    moveCube$1[15].initCoord(224, 137, 328552, 137);
    for (let a = 0; a < 18; a += 3) {
        for (let p = 0; p < 2; p++) {
            CubieCube$1.EdgeMult(moveCube$1[a + p], moveCube$1[a], moveCube$1[a + p + 1]);
            CubieCube$1.CornMult(moveCube$1[a + p], moveCube$1[a], moveCube$1[a + p + 1]);
        }
    }
    CubieCube$1.urf1 = new CubieCube$1().initCoord(2531, 1373, 67026819, 1367);
    CubieCube$1.urf2 = new CubieCube$1().initCoord(2089, 1906, 322752913, 2040);
}
function initBasic() {
    let c = new CubieCube$1();
    {
        //init sym cubes
        const d = new CubieCube$1();
        const f2 = new CubieCube$1().initCoord(28783, 0, 259268407, 0);
        const u4 = new CubieCube$1().initCoord(15138, 0, 119765538, 7);
        const lr2 = new CubieCube$1().initCoord(5167, 0, 83473207, 0);
        for (let i = 0; i < 8; i++) {
            lr2.ca[i] |= 3 << 3;
        }
        for (let i = 0; i < 16; i++) {
            SymCube[i] = new CubieCube$1().init(c.ca, c.ea);
            CubieCube$1.CornMultFull(c, u4, d);
            CubieCube$1.EdgeMult(c, u4, d);
            c.init(d.ca, d.ea);
            if (i % 4 == 3) {
                CubieCube$1.CornMultFull(c, lr2, d);
                CubieCube$1.EdgeMult(c, lr2, d);
                c.init(d.ca, d.ea);
            }
            if (i % 8 == 7) {
                CubieCube$1.CornMultFull(c, f2, d);
                CubieCube$1.EdgeMult(c, f2, d);
                c.init(d.ca, d.ea);
            }
        }
    }
    {
        // gen sym tables
        for (let i = 0; i < 16; i++) {
            SymMult[i] = [];
            SymMultInv[i] = [];
            SymMove[i] = [];
            Sym8Move[i] = 0;
            SymMoveUD[i] = [];
        }
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                SymMult[i][j] = i ^ j ^ ((0x14ab4 >> j) & (i << 1) & 2); // SymMult[i][j] = (i ^ j ^ (0x14ab4 >> j & i << 1 & 2)));
                SymMultInv[SymMult[i][j]][j] = i;
            }
        }
        c = new CubieCube$1();
        for (let s = 0; s < 16; s++) {
            for (let j = 0; j < 18; j++) {
                CubieCube$1.CornConjugate(moveCube$1[j], SymMultInv[0][s], c);
                outloop: for (let m = 0; m < 18; m++) {
                    for (let t = 0; t < 8; t++) {
                        if (moveCube$1[m].ca[t] != c.ca[t]) {
                            continue outloop;
                        }
                    }
                    SymMove[s][j] = m;
                    SymMoveUD[s][std2ud[j]] = std2ud[m];
                    break;
                }
                if (s % 2 == 0) {
                    Sym8Move[(j << 3) | (s >> 1)] = SymMove[s][j];
                }
            }
        }
    }
    {
        // init sym 2 raw tables
        function initSym2Raw(N_RAW, Sym2Raw, Raw2Sym, SymState, coord, setFunc, getFunc) {
            const c = new CubieCube$1();
            const d = new CubieCube$1();
            let count = 0;
            const sym_inc = coord >= 2 ? 1 : 2;
            const conjFunc = coord != 1 ? CubieCube$1.EdgeConjugate : CubieCube$1.CornConjugate;
            for (let i = 0; i < N_RAW; i++) {
                if (Raw2Sym[i] !== undefined) {
                    continue;
                }
                setFunc.call(c, i);
                for (let s = 0; s < 16; s += sym_inc) {
                    conjFunc(c, s, d);
                    const idx = getFunc.call(d);
                    if (coord == 0) {
                        FlipS2RF[(count << 3) | (s >> 1)] = idx;
                    }
                    if (idx == i) {
                        SymState[count] |= 1 << (s / sym_inc);
                    }
                    Raw2Sym[idx] = ((count << 4) | s) / sym_inc;
                }
                Sym2Raw[count++] = i;
            }
            return count;
        }
        initSym2Raw(N_FLIP, FlipS2R, FlipR2S, SymStateFlip, 0, CubieCube$1.prototype.setFlip, CubieCube$1.prototype.getFlip);
        initSym2Raw(N_TWIST, TwistS2R, TwistR2S, SymStateTwist, 1, CubieCube$1.prototype.setTwist, CubieCube$1.prototype.getTwist);
        initSym2Raw(N_PERM, EPermS2R, EPermR2S, SymStatePerm, 2, CubieCube$1.prototype.setEPerm, CubieCube$1.prototype.getEPerm);
        const cc = new CubieCube$1();
        for (let i = 0; i < N_PERM_SYM; i++) {
            setNPerm(cc.ea, EPermS2R[i], 8, true);
            Perm2CombP[i] =
                getComb(cc.ea, 0, true) + (getNParity(EPermS2R[i], 8) * 70 );
            c.invFrom(cc);
            PermInvEdgeSym[i] = EPermR2S[c.getEPerm()];
        }
    }
    {
        // init coord tables
        c = new CubieCube$1();
        const d = new CubieCube$1();
        function initSymMoveTable(moveTable, SymS2R, N_SIZE, N_MOVES, 
        // setFunc: Function,
        // getFunc: Function,
        // multFunc: Function,
        setFunc, getFunc, multFunc, ud2std) {
            for (let i = 0; i < N_SIZE; i++) {
                moveTable[i] = [];
                c[setFunc](SymS2R[i]);
                // setFunc.call(c, SymS2R[i]);
                for (let j = 0; j < N_MOVES; j++) {
                    multFunc(c, moveCube$1[ud2std ? ud2std[j] : j], d);
                    moveTable[i][j] = d[getFunc]();
                }
            }
        }
        initSymMoveTable(FlipMove, FlipS2R, N_FLIP_SYM, N_MOVES, "setFlip", "getFlipSym", 
        // CubieCube.prototype.setFlip,
        // CubieCube.prototype.getFlipSym,
        CubieCube$1.EdgeMult);
        initSymMoveTable(TwistMove, TwistS2R, N_TWIST_SYM, N_MOVES, "setTwist", "getTwistSym", 
        // CubieCube.setTwist,
        // CubieCube.getTwistSym,
        CubieCube$1.CornMult);
        initSymMoveTable(EPermMove, EPermS2R, N_PERM_SYM, N_MOVES2, "setEPerm", "getEPermSym", 
        // CubieCube.prototype.setEPerm,
        // CubieCube.prototype.getEPermSym,
        CubieCube$1.EdgeMult, ud2std);
        initSymMoveTable(CPermMove, EPermS2R, N_PERM_SYM, N_MOVES2, "setCPerm", "getCPermSym", 
        // CubieCube.prototype.setCPerm,
        // CubieCube.prototype.getCPermSym,
        CubieCube$1.CornMult, ud2std);
        for (let i = 0; i < N_SLICE; i++) {
            UDSliceMove[i] = [];
            UDSliceConj[i] = [];
            c.setUDSlice(i);
            for (let j = 0; j < N_MOVES; j++) {
                CubieCube$1.EdgeMult(c, moveCube$1[j], d);
                UDSliceMove[i][j] = d.getUDSlice();
            }
            for (let j = 0; j < 16; j += 2) {
                CubieCube$1.EdgeConjugate(c, SymMultInv[0][j], d);
                UDSliceConj[i][j >> 1] = d.getUDSlice();
            }
        }
        MPermMove = [];
        for (let i = 0; i < N_MPERM; i++) {
            MPermMove[i] = [];
            MPermConj[i] = [];
            c.setMPerm(i);
            for (let j = 0; j < N_MOVES2; j++) {
                CubieCube$1.EdgeMult(c, moveCube$1[ud2std[j]], d);
                MPermMove[i][j] = d.getMPerm();
            }
            for (let j = 0; j < 16; j++) {
                CubieCube$1.EdgeConjugate(c, SymMultInv[0][j], d);
                MPermConj[i][j] = d.getMPerm();
            }
        }
        for (let i = 0; i < N_COMB; i++) {
            CCombPMove[i] = [];
            CCombPConj[i] = [];
            c.setCComb(i % 70);
            for (let j = 0; j < N_MOVES2; j++) {
                CubieCube$1.CornMult(c, moveCube$1[ud2std[j]], d);
                CCombPMove[i][j] = d.getCComb() + 70 * (((P2_PARITY_MOVE >> j) & 1) ^ ~~(i / 70));
            }
            for (let j = 0; j < 16; j++) {
                CubieCube$1.CornConjugate(c, SymMultInv[0][j], d);
                CCombPConj[i][j] = d.getCComb() + 70 * ~~(i / 70);
            }
        }
    }
}
//init pruning tables
let InitPrunProgress = -1;
function doInitPrunTables(targetProgress) {
    {
        TwistFlipPrunMax = initRawSymPrun(TwistFlipPrun, 2048, 324, null, null, TwistMove, SymStateTwist, 0x19603);
    }
    if (InitPrunProgress > targetProgress) {
        return;
    }
    CoordCube.UDSliceTwistPrunMax = initRawSymPrun(UDSliceTwistPrun, 495, 324, UDSliceMove, UDSliceConj, TwistMove, SymStateTwist, 0x69603);
    if (InitPrunProgress > targetProgress) {
        return;
    }
    UDSliceFlipPrunMax = initRawSymPrun(UDSliceFlipPrun, 495, 336, UDSliceMove, UDSliceConj, FlipMove, SymStateFlip, 0x69603);
    if (InitPrunProgress > targetProgress) {
        return;
    }
    MCPermPrunMax = initRawSymPrun(MCPermPrun, 24, 2768, MPermMove, MPermConj, CPermMove, SymStatePerm, 0x8ea34);
    if (InitPrunProgress > targetProgress) {
        return;
    }
    EPermCCombPPrunMax = initRawSymPrun(EPermCCombPPrun, N_COMB, 2768, CCombPMove, CCombPConj, EPermMove, SymStatePerm, 0x7d824);
}
function initPrunTables() {
    if (InitPrunProgress < 0) {
        initBasic();
        InitPrunProgress = 0;
    }
    if (InitPrunProgress == 0) {
        doInitPrunTables(99);
    }
    else if (InitPrunProgress < 54) {
        doInitPrunTables(InitPrunProgress);
    }
    else {
        return true;
    }
    return false;
}

/**
 * Isaac Vega Rodriguez (isaacvega1996@gmail.com)
 * Advanced scramble parser for NxNxN cubes
 *
 * NOTE: Recursive approach can be dangerous.
 * Consider to use stacks or another non-recursive approach.
 */
/**
 * Tokenizer specs.
 */
const RubikSpec = [
    // Whitespaces:
    [/^[\s\n\r\t]+/, "SPACE"],
    [/^\./, null],
    // Comments:
    [/^\/\/.*/, "COMMENT"],
    // Conmutator separator:
    [/^,/, ","],
    [/^:/, ":"],
    // Symbols-delimiters:
    [/^\(/, "("],
    [/^\)([1-9]\d{0,1})?/, ")"],
    [/^\[/, "["],
    [/^\]([1-9]\d{0,1})?/, "]"],
    // Move:
    [/^([\d]+)?([FRUBLDfrubldzxySME])(?:([w])|&sup([\d]);)?('|2'|2|3'|3)?/, "MOVE"],
];
const SquareOneSpec = [
    // Whitespaces:
    [/^[\s\n\r\t]+/, "SPACE"],
    // Comments:
    [/^-[^\d].*/, "COMMENT"],
    // Conmutator separator:
    [/^,/, ","],
    [/^:/, ":"],
    // Move:
    [/^\//, "MOVE"],
    [/^\(\s*(-?\d),\s*(-?\d)\s*\)/, "MOVE"],
    [/^(-?\d),\s*(-?\d)/, "MOVE"],
    [/^(-?\d)(-?\d)/, "MOVE"],
    [/^(-?\d)/, "MOVE"],
    [/^([xyz])2/, "MOVE"],
];
const MegaminxSpec = [
    // Whitespaces:
    [/^[\s\n\r\t]+/, "SPACE"],
    // Comments:
    [/^\/\/.*/, "COMMENT"],
    // Conmutator separator:
    [/^,/, ","],
    [/^:/, ":"],
    // Move:
    [/^DB[RL]\d*'?/, "MOVE"], // Single moves back side
    [/^[dbDB][RL]\d*'?/, "MOVE"], // Side faces move
    [/^\[[ulfrbd]\d*'?\]/, "MOVE"], // Rotation moves
    [/^[LRDlrd](\+|-){1,2}/, "MOVE"], // WCA moves
    [/^[ULFRBDy]\d*'?/, "MOVE"], // Single moves
    // Symbols-delimiters:
    [/^\(/, "("],
    [/^\)([1-9]\d{0,1})?/, ")"],
    [/^\[/, "["],
    [/^\]([1-9]\d{0,1})?/, "]"],
];
const PyraminxSpec = [
    // Whitespaces:
    [/^[\s\n\r\t]+/, "SPACE"],
    [/^\./, null],
    // Comments:
    [/^\/\/.*/, "COMMENT"],
    // Conmutator separator:
    [/^,/, ","],
    [/^:/, ":"],
    // Symbols-delimiters:
    [/^\(/, "("],
    [/^\)([1-9]\d{0,1})?/, ")"],
    [/^\[/, "["],
    [/^\]([1-9]\d{0,1})?/, "]"],
    // Moves
    [/^(([ULRB]w?)|(o?[ULRB])|[urlbdyz])['2]?/, "MOVE"],
];
const HelicopterSpec = [
    // Whitespaces:
    [/^[\s\n\r\t]+/, "SPACE"],
    [/^\./, null],
    // Comments:
    [/^\/\/.*/, "COMMENT"],
    // Conmutator separator:
    [/^,/, ","],
    [/^:/, ":"],
    // Symbols-delimiters:
    [/^\(/, "("],
    [/^\)([1-9]\d{0,1})?/, ")"],
    [/^\[/, "["],
    [/^\]([1-9]\d{0,1})?/, "]"],
    // Moves
    [/^(UR|UF|UL|UB|DR|DF|DL|DB|FR|FL|BL|BR)/, "MOVE"],
];
const ClockSpec = [
    // Whitespaces:
    [/^[\s\n\r\t]+/, "SPACE"],
    [/^\./, null],
    // Comments:
    [/^\/\/.*/, "COMMENT"],
    // Conmutator separator:
    [/^,/, ","],
    [/^:/, ":"],
    // Symbols-delimiters:
    [/^\(/, "("],
    [/^\)([1-9]\d{0,1})?/, ")"],
    [/^\[/, "["],
    [/^\]([1-9]\d{0,1})?/, "]"],
    // Moves
    // WCA
    [
        /^((UR|DR|DL|UL|ur|dr|dl|ul|R|D|L|U|ALL|\/|\\)(\(\d[+-],\s*\d[+-]\)|\d[+-])|y2|x2|z[2']?|UR|DR|DL|UL)/,
        "MOVE",
    ],
    // Jaap
    [/^[Ud]{2}\s+([ud]=?[+-]?\d\s+)*[Ud]{2}(\s+[ud]=?[+-]?\d)*/, "MOVE"],
];
const SpecMap = {
    rubik: RubikSpec,
    square1: SquareOneSpec,
    megaminx: MegaminxSpec,
    pyraminx: PyraminxSpec,
    helicopter: HelicopterSpec,
    clock: ClockSpec,
};
class BaseTokenizer {
    constructor(throwErrors = true, puzzle) {
        this._string = "";
        this._cursor = 0;
        this.throwErrors = throwErrors;
        this.spec = puzzle in SpecMap ? SpecMap[puzzle] : RubikSpec;
    }
    _throwCursor() {
        if (!this.throwErrors) {
            throw this.getCursor();
        }
    }
    getCursor() {
        return this._cursor;
    }
    init(string) {
        this._string = string;
        this._cursor = 0;
    }
    hasMoreTokens() {
        return this._cursor < this._string.length;
    }
    isEOF() {
        return this._cursor === this._string.length;
    }
    getNextToken() {
        if (!this.hasMoreTokens()) {
            return null;
        }
        const string = this._string.slice(this._cursor);
        for (const [regexp, tokenType] of this.spec) {
            const tokenValue = this._match(regexp, string);
            if (tokenValue == null)
                continue;
            if (tokenType == null)
                return this.getNextToken();
            return { type: tokenType, value: tokenValue };
        }
        this._throwCursor();
        throw new SyntaxError(`Unexpected token: ${string[0]}`);
    }
    _match(regexp, string) {
        const matched = regexp.exec(string);
        if (matched == null) {
            return null;
        }
        this._cursor += matched[0].length;
        return matched[0];
    }
}
class Solver {
    constructor(tokenizerType) {
        this.tokenizerType = tokenizerType;
    }
    invert(seq) {
        return seq.map(s => ScrambleParser.inverse(this.tokenizerType, s));
    }
    invertFlat(seq) {
        const res = [];
        for (let i = seq.length - 1; i >= 0; i -= 1) {
            if (seq[i].type === "Move") {
                const cp = clone(seq[i]);
                cp.value = ScrambleParser.inverse(this.tokenizerType, cp.value);
                res.push(cp);
            }
            else {
                res.push(seq[i]);
            }
        }
        return res;
    }
    simplify(seq) {
        const mp = new Map();
        const mp1 = new Map();
        mp.set(-3, "");
        mp.set(-2, "2");
        mp.set(-1, "'");
        mp.set(1, "");
        mp.set(2, "2");
        mp.set(3, "'");
        mp1.set("2", -2);
        mp1.set("'", -1);
        mp1.set("", 1);
        mp1.set("2", 2);
        mp1.set("2'", 2);
        mp1.set("3", -1);
        mp1.set("3'", 1);
        const s1 = seq.map(s => {
            const p = s.replace(/^(\d*)([a-zA-Z]+)('|2'|2|3'|3)?$/, "$1$2 $3").split(" ");
            return [p[0], mp1.get(p[1])];
        });
        for (let i = 1, maxi = s1.length; i < maxi; i += 1) {
            if (s1[i][0] === s1[i - 1][0]) {
                s1[i - 1][1] = (s1[i - 1][1] + s1[i][1]) % 4;
                s1.splice(i, 1);
                i--;
                maxi--;
            }
        }
        return s1.filter(p => p[1]).map(p => p[0] + mp.get(p[1]));
    }
    solve(ast, simplify = true) {
        switch (ast.type) {
            case "Program":
                return (simplify ? this.simplify : (e) => e)(this.solve(ast.value, simplify)).join(" ");
            case "Expression":
                return ast.value
                    .map((e) => this.solve(e, simplify))
                    .reduce((acc, e) => [...acc, ...e], []);
            case "Space":
            case "Comment":
                return [];
            case "Move":
                return [ast.value];
            case "ParentesizedExpression": {
                const seq = this.solve(ast.value.expr, simplify);
                let res = [];
                for (let i = 1, maxi = ast.value.cant; i <= maxi; i += 1) {
                    res = [...res, ...seq];
                }
                return res;
            }
            case "ConmutatorExpression": {
                let seq;
                if (ast.value.setup) {
                    const setup = this.solve(ast.value.setup, simplify);
                    const conmutator = this.solve(ast.value.conmutator, simplify);
                    const setupInv = this.invert(setup);
                    seq = [...setup, ...conmutator, ...setupInv];
                }
                else {
                    const s1 = this.solve(ast.value.expr1, simplify);
                    const s2 = this.solve(ast.value.expr2, simplify);
                    const s1i = this.invert(s1);
                    const s2i = this.invert(s2);
                    seq = [...s1, ...s2, ...s1i, ...s2i];
                }
                let res = [];
                for (let i = 1, maxi = ast.value.cant; i <= maxi; i += 1) {
                    res = [...res, ...seq];
                }
                return res;
            }
            default: {
                throw new SyntaxError(`Unexpected type: "${ast.type}"`);
            }
        }
    }
    flat(ast) {
        switch (ast.type) {
            case "Program":
                return this.flat(ast.value);
            case "Expression":
                return ast.value
                    .map((e) => this.flat(e))
                    .reduce((acc, e) => [...acc, ...e], []);
            case "Space":
            case "Comment":
                return [ast];
            case "Move":
                return [ast];
            case "ParentesizedExpression": {
                const seq = this.flat(ast.value.expr);
                let res = [];
                for (let i = 1, maxi = ast.value.cant; i <= maxi; i += 1) {
                    res = [...res, ...seq];
                }
                return res;
            }
            case "ConmutatorExpression": {
                let seq;
                if (ast.value.setup) {
                    const setup = this.flat(ast.value.setup);
                    const conmutator = this.flat(ast.value.conmutator);
                    const setupInv = this.invertFlat(setup);
                    seq = [...setup, ...conmutator, ...setupInv];
                }
                else {
                    const s1 = this.flat(ast.value.expr1);
                    const s2 = this.flat(ast.value.expr2);
                    const s1i = this.invertFlat(s1);
                    const s2i = this.invertFlat(s2);
                    seq = [...s1, ...s2, ...s1i, ...s2i];
                }
                let res = [];
                for (let i = 1, maxi = ast.value.cant; i <= maxi; i += 1) {
                    res = [...res, ...seq];
                }
                return res;
            }
            default: {
                throw new SyntaxError(`Unexpected type: "${ast.type}"`);
            }
        }
    }
}
class Interpreter {
    constructor(throwErrors = true, tokenizerType = "rubik") {
        this.moveCursor = 0;
        this._tokenizer = new BaseTokenizer(throwErrors, tokenizerType);
        this._solver = new Solver(tokenizerType);
        this._lookahead = null;
        this.throwErrors = throwErrors;
    }
    input(string, simplify = true) {
        this._tokenizer.init(string.replace(/’/g, "'"));
        this._lookahead = this._tokenizer.getNextToken();
        const pr = this.Program();
        if (this._lookahead) {
            throw new SyntaxError(`Missing operators`);
        }
        return this._solver.solve(pr, simplify);
    }
    getTree(string) {
        let pr;
        try {
            this._tokenizer.init(string.replace(/’/g, "'"));
            this._lookahead = this._tokenizer.getNextToken();
            pr = this.Program();
            if (this._lookahead) {
                return {
                    error: true,
                    cursor: this._tokenizer.getCursor(),
                    program: pr,
                };
            }
        }
        catch (cur) {
            return {
                error: true,
                cursor: cur,
                program: {
                    type: "Program",
                    value: { type: "Expression", value: [], cursor: -1 },
                    cursor: -1,
                },
            };
        }
        return {
            error: null,
            cursor: -1,
            program: pr,
        };
    }
    getFlat(program) {
        return this._solver.flat(program);
    }
    /**
     * Program
     * ; Expression
     *
     * This is util only for converting the last sequence to string
     */
    Program() {
        return { type: "Program", value: this.Expression(), cursor: -1 };
    }
    /**
     * Expression
     *  ; Move
     *  ; Space
     *  ; Comment
     *  ; ParentesizedExpression
     *  ; CommutatorExpression
     *  ;
     */
    Expression() {
        if (!this._lookahead)
            return { type: "Expression", value: [], cursor: -1 };
        const moves = [];
        while (this._lookahead) {
            switch (this._lookahead.type) {
                case "MOVE": {
                    moves.push(this.Move());
                    break;
                }
                case "SPACE": {
                    moves.push(this.Space());
                    break;
                }
                case "COMMENT": {
                    moves.push(this.Comment());
                    break;
                }
                case "(": {
                    moves.push(this.ParentesizedExpression());
                    break;
                }
                case "[": {
                    moves.push(this.ConmutatorExpression());
                    break;
                }
                default:
                    return moves.length === 1 ? moves[0] : { type: "Expression", value: moves, cursor: -1 };
            }
        }
        return moves.length === 1 ? moves[0] : { type: "Expression", value: moves, cursor: -1 };
    }
    /**
     * Space
     *  ; " "
     */
    Space() {
        return { type: "Space", value: this._eat("SPACE").value, cursor: -1 };
    }
    /**
     * Comment
     *  ; " "
     */
    Comment() {
        return { type: "Comment", value: this._eat("COMMENT").value, cursor: -1 };
    }
    /**
     * ParentesizedExpression
     *  ; '(' Expression ')'
     */
    ParentesizedExpression() {
        this._eat("(");
        const expr = this.Expression();
        const n = +this._eat(")").value.slice(1);
        const cant = n || 1;
        return { type: "ParentesizedExpression", value: { expr, cant, explicit: !!n }, cursor: -1 };
    }
    /**
     * ConmutatorExpression
     *  ; '[' Expression ',' Expression ']'
     */
    ConmutatorExpression() {
        this._eat("[");
        const expr1 = this.Expression();
        if (this._lookahead?.type === ":") {
            this._eat(":");
            const conmutator = this.Expression();
            const n = +this._eat("]").value.slice(1);
            const cant = n || 1;
            return {
                type: "ConmutatorExpression",
                value: { setup: expr1, conmutator, cant, explicit: !!n },
                cursor: -1,
            };
        }
        this._eat(",");
        const expr2 = this.Expression();
        const n = +this._eat("]").value.slice(1);
        const cant = n || 1;
        return {
            type: "ConmutatorExpression",
            value: { expr1, expr2, cant, explicit: !!n },
            cursor: -1,
        };
    }
    /**
     * Move
     *  ; MOVE
     */
    Move() {
        const token = this._eat("MOVE");
        return { type: "Move", value: token.value, cursor: this.moveCursor++ };
    }
    _throwCursor() {
        if (!this.throwErrors) {
            throw this._tokenizer.getCursor();
        }
    }
    _eat(tokenType, tokenValue) {
        const token = this._lookahead;
        if (token == null) {
            this._throwCursor();
            throw new SyntaxError(`Unexpected end of input, expected: ${tokenType}`);
        }
        if (token.type != tokenType) {
            this._throwCursor();
            throw new SyntaxError(`Unexpected token: ${token.type}, expected: ${tokenType}`);
        }
        if (tokenValue && token.value != tokenValue) {
            this._throwCursor();
            throw new SyntaxError(`Error, expected "${tokenValue}" but got "${token.value}"`);
        }
        this._lookahead = this._tokenizer.getNextToken();
        return token;
    }
}

function defaultInner(s, withSuffix = true) {
    return s.replace(/\n/g, "<br>") + (withSuffix ? "<br>" : "");
}
function getTreeString(token, puzzle) {
    const { value } = token;
    switch (token.type) {
        case "Move": {
            if (puzzle === "square1" && token.value != "/") {
                const regs = [
                    /^(\()(\s*)(-?\d)(,)(\s*)(-?\d)(\s*)(\))/,
                    /^(-?\d)(,)(\s*)(-?\d)/,
                    /^(-?\d)(-?\d)/,
                    /^(-?\d)/,
                ];
                const operators = /^[(,)]$/;
                for (let i = 0, maxi = regs.length; i < maxi; i += 1) {
                    const m = regs[i].exec(value);
                    if (m) {
                        return m
                            .slice(1)
                            .map(s => operators.test(s)
                            ? `<span class="operator" data-cursor="${token.cursor}">${s}</span>`
                            : /\d$/.test(s)
                                ? s === "0"
                                    ? `<span class="move silent">${s}</span>`
                                    : `<span class="move" data-cursor="${token.cursor}">${s}</span>`
                                : defaultInner(s, false))
                            .join("");
                    }
                }
            }
            return `<span class="move" data-cursor="${token.cursor}">${defaultInner(value, false)}</span>`;
        }
        case "Comment": {
            return `<span class="comment" data-cursor="${token.cursor}">${defaultInner(value, false)}</span>`;
        }
        case "Space": {
            return defaultInner(value, false);
        }
        case "Expression": {
            return value.map(t => getTreeString(t, puzzle)).join("");
        }
        case "ParentesizedExpression": {
            return (`<span class="operator" data-cursor="${token.cursor}">(</span>` +
                getTreeString(value.expr, puzzle) +
                `<span class="operator" data-cursor="${token.cursor}">)</span>` +
                (value.cant != 1 || value.explicit
                    ? `<span class="operator" data-cursor="${token.cursor}">${value.cant}</span>`
                    : ""));
        }
        case "ConmutatorExpression": {
            if (value.setup) {
                return (`<span class="operator" data-cursor="${token.cursor}">[</span>` +
                    getTreeString(value.setup, puzzle) +
                    `<span class="operator" data-cursor="${token.cursor}">:</span>` +
                    getTreeString(value.conmutator, puzzle) +
                    `<span class="operator" data-cursor="${token.cursor}">]</span>` +
                    (value.cant != 1 || value.explicit
                        ? `<span class="operator" data-cursor="${token.cursor}">${value.cant}</span>`
                        : ""));
            }
            return (`<span class="operator" data-cursor="${token.cursor}">[</span>` +
                getTreeString(value.expr1, puzzle) +
                `<span class="operator" data-cursor="${token.cursor}">,</span>` +
                getTreeString(value.expr2, puzzle) +
                `<span class="operator" data-cursor="${token.cursor}">]</span>` +
                (value.cant != 1 || value.explicit
                    ? `<span class="operator" data-cursor="${token.cursor}">${value.cant}</span>`
                    : ""));
        }
    }
    return "";
}
function getMoveLength(sequence, puzzle, order) {
    try {
        switch (puzzle) {
            case "rubik":
            case "mirror":
            case "void": {
                return sequence.reduce((acc, e) => [
                    ...acc,
                    ...ScrambleParser.parseNNN(e, { a: order, b: order, c: order }),
                ], []).length;
            }
            case "skewb": {
                return sequence.reduce((acc, e) => [...acc, ...ScrambleParser.parseSkewb(e)], [])
                    .length;
            }
            case "square1": {
                return sequence.reduce((acc, e) => [...acc, ...ScrambleParser.parseSquare1(e)], [])
                    .length;
            }
            case "megaminx": {
                return sequence.reduce((acc, e) => [...acc, ...ScrambleParser.parseMegaminx(e)], [])
                    .length;
            }
            case "pyraminx": {
                return sequence.reduce((acc, e) => [...acc, ...ScrambleParser.parsePyraminx(e)], [])
                    .length;
            }
            case "clock": {
                return ScrambleParser.parseClock(sequence.join(" ")).length;
            }
            case "masterskewb": {
                return ScrambleParser.parseSkewb(sequence.join(" ")).length;
            }
            case "helicopter": {
                return sequence.reduce((acc, e) => [...acc, ...e.split(/\s+/)], []).length;
            }
        }
    }
    catch {
    }
    return 0;
}
function parseReconstruction(s, puzzle, order) {
    const itp = new Interpreter(false, puzzle);
    let errorCursor = -1;
    try {
        const tree = itp.getTree(s);
        if (tree.error) {
            errorCursor = typeof tree.cursor === "number" ? tree.cursor : 0;
        }
        else {
            const program = itp.getFlat(tree.program);
            const flat = program.filter(token => token.cursor >= 0);
            const sequence = flat.map(token => token.value);
            let sequenceIndex = [];
            const finalAlpha = getMoveLength(sequence, puzzle, order);
            switch (puzzle) {
                case "square1": {
                    sequenceIndex = newArr(finalAlpha)
                        .fill(0)
                        .map((_, i) => i);
                    break;
                }
                default: {
                    sequenceIndex = flat.map(token => token.cursor);
                }
            }
            return {
                result: getTreeString(tree.program.value, puzzle) + "<br>",
                finalAlpha,
                sequence,
                sequenceIndex,
                hasError: false,
            };
        }
    }
    catch (e) {
        if (typeof e === "number") {
            errorCursor = e;
        }
    }
    if (errorCursor != -1) {
        const pref = defaultInner(s.slice(0, errorCursor), false);
        let middle = "";
        const match = /^([^\s\n]+)/.exec(s.slice(errorCursor));
        if (match) {
            middle = `<span class="error">${match[0]}</span>`;
            return {
                result: pref + middle + defaultInner(s.slice(errorCursor + match[0].length)),
                finalAlpha: 0,
                sequence: [],
                sequenceIndex: [],
                hasError: true,
            };
        }
    }
    return {
        result: defaultInner(s),
        finalAlpha: 0,
        sequence: [],
        sequenceIndex: [],
        hasError: false,
    };
}
function prettyScramble(scramble) {
    return scramble
        .trim()
        .replace(/\s*<br>\s*/g, "\n")
        .replace(/(\n\s+)/g, "\n");
}

const scrambleReg = /^([\d]+)?([FRUBLDfrubldzxySME])(?:([w])|&sup([\d]);)?('|2'|2|3'|3)?$/;
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
class ScrambleParser {
    constructor() { }
    static parseScramble(scramble, moveMap) {
        const moveseq = [];
        const moves = scramble.split(/\s+/g);
        let m, w, f, p;
        for (let s = 0, maxs = moves.length; s < maxs; s += 1) {
            m = scrambleReg.exec(moves[s]);
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
    }
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
    static parseNNN(scramble, order, MOVE_MAP = "URFDLB", moveToOrder = _moveToOrder, simplify = false) {
        const scr = ScrambleParser.parseNNNString(scramble, simplify);
        const moves = ScrambleParser.parseScramble(scr, MOVE_MAP);
        const res = [];
        for (let i = 0, maxi = moves.length; i < maxi; i += 1) {
            const o = moveToOrder(MOVE_MAP.charAt(moves[i][0]), order);
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
    }
    static parseMegaminx(scramble) {
        const res = [];
        // Carrot Notation
        if (scramble
            .split("\n")
            .filter(e => e)
            .every(e => /^(\s*([+-]{2}|U|U'))*$/.test(e))) {
            const moves = scramble.match(/[+-]{2}|U'?/g);
            if (!moves) {
                return res;
            }
            for (let i = 0, maxi = moves.length; i < maxi; i += 1) {
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
            const moves = scramble.match(/((DB[RL]\d*'?)|([dbDB][RL]\d*'?)|(\[[ulfrbd]\d*'?\])|([LRDlrd](\+|-){1,2})|([ULFRBDy]\d*'?))/g) || [];
            const moveMap = "ULFRBD";
            for (let i = 0, maxi = moves.length; i < maxi; i += 1) {
                const mv = moves[i];
                if (/^([LRDlrd](\+|-){1,2})$/.test(mv)) {
                    const type = { d: 0, r: 1, l: 3 }[mv[0].toLowerCase()] || 0;
                    const turns = mv.indexOf("+") * (mv.length - 1);
                    res.push([type, turns, -1, mv[0] === mv[0].toLowerCase() ? 1 : 0]);
                }
                else {
                    const turns = (parseInt(mv.replace(/\D+(\d+)\D*/g, "$1")) || 1) * Math.sign(mv.indexOf("'") + 0.2);
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
    }
    static parsePyraminx(scramble, moveMap = "URLB") {
        // MOVE_MAP = "URLB"
        // MV = [ plane, turns, layers, direction ] ]
        const res = [];
        const moveReg = /(([ULRB]w?)|(o?[ULRB])|[urlbdyz])['2]?/g;
        const moves = scramble.match(moveReg);
        if (!moves)
            return [];
        for (let i = 0, maxi = moves.length; i < maxi; i += 1) {
            const mv = moves[i];
            const turns = (parseInt(mv.replace(/\D+(\d+)\D*/g, "$1")) || 1) * Math.sign(mv.indexOf("'") + 0.2);
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
                const mmv = mv[0].toUpperCase();
                res.push([
                    moveMap.indexOf(mmv),
                    turns,
                    mv.indexOf("w") > -1 ? 3 : mmv === mv[0] ? 2 : 1,
                    1,
                ]);
            }
        }
        return res;
    }
    static parseSkewb(scramble, moveMap = "FURLBfrlbxyz") {
        const res = [];
        const moveReg = /[FULRBfrlbxyz]['2]?/g;
        const moves = scramble.match(moveReg);
        if (!moves)
            return [];
        for (let i = 0, maxi = moves.length; i < maxi; i += 1) {
            const mv = moves[i];
            const turns = (parseInt(mv.replace(/\D+(\d+)\D*/g, "$1")) || 1) * Math.sign(mv.indexOf("'") + 0.2);
            res.push([moveMap.indexOf(mv[0]), -turns]);
        }
        return res;
    }
    static parseSquare1(scramble) {
        const newScramble = scramble.replace(/\s+/g, "").split("/");
        const sqres = [/^\((-?\d),(-?\d)\)$/, /^(-?\d),(-?\d)$/, /^(-?\d)(-?\d)$/, /^(-?\d)$/];
        const res = [];
        for (let i = 0, maxi = newScramble.length; i < maxi; i += 1) {
            const reg = sqres.find(reg => reg.exec(newScramble[i]));
            if (reg) {
                const m = reg.exec(newScramble[i]);
                const u = ~~m[1];
                const d = ~~m[2];
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
        }
        return res;
    }
    static parseSuperSquare1(scramble) {
        const newScramble = scramble.replace(/\s+/g, "").split("/");
        const sqres = /^\((-?\d),(-?\d),(-?\d),(-?\d)\)$/;
        const res = [];
        for (let i = 0, maxi = newScramble.length; i < maxi; i += 1) {
            const m = sqres.exec(newScramble[i]);
            if (m) {
                for (let n = 1; n <= 4; n += 1) {
                    const mv = ~~m[n];
                    if (mv)
                        res.push([n, mv]);
                }
            }
            if (i != maxi - 1) {
                res.push([0, 6]);
            }
        }
        return res;
    }
    static parseFTO(scramble) {
        const res = [];
        const moveReg = /(BL|BR|[URFDLB])'?/g;
        const moves = scramble.match(moveReg);
        const moveMap = ["U", "R", "F", "D", "L", "B", "BR", "BL"];
        if (!moves)
            return [];
        for (let i = 0, maxi = moves.length; i < maxi; i += 1) {
            const mv = moves[i];
            const turns = mv.endsWith("'") ? -1 : 1;
            res.push([moveMap.indexOf(turns < 0 ? mv.slice(0, -1) : mv), -turns]);
        }
        return res;
    }
    static parseClock(scramble) {
        const parts = scramble.replace(/\n+/g, " ").split(/\s+/g);
        const res = [];
        if (/-\d/.test(scramble)) {
            /// Concise notation
            const pins = [0xc, 0x5, 0x3, 0xa, 0x7, 0xb, 0xe, 0xd, 0xf, 0x0, 0];
            const parts = scramble.replace(/\s+/g, "").split("/");
            if (parts.length != 11)
                return res;
            const BOTH_REG = /^\((-?\d),(-?\d)\)$/;
            const SINGLE_REG = /^\((-?\d)\)$/;
            for (let i = 0, maxi = parts.length; i < maxi; i += 1) {
                const mv = parts[i];
                if (BOTH_REG.test(mv) && i < 4) {
                    const moves = mv.replace(BOTH_REG, "$1 $2").split(" ").map(Number);
                    res.push([pins[i], moves[0], 0]);
                    res.push([-1, -1, -1]);
                    res.push([i & 1 ? pins[i] : pins[(i + 2) & 3], -moves[1], 0]);
                    res.push([-1, -1, -1]);
                }
                else if (SINGLE_REG.test(mv)) {
                    const move = +mv.replace(SINGLE_REG, "$1");
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
                    const pin = parseInt(mv
                        .split("")
                        .map(s => (s === "U" ? 1 : 0))
                        .join(""), 2);
                    res.push([pin, NaN, NaN]);
                }
            }
        }
        else if (!/([Ud]{2})/.test(scramble)) {
            /// Extended WCA notation
            const MOVE_REG = /^((UR|DR|DL|UL|ur|dr|dl|ul|R|D|L|U|ALL|\/|\\)(\(\d[+-],\s*\d[+-]\)|\d[+-])|y2|x2|z[2']?|UR|DR|DL|UL)$/;
            const letters = [
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
            const pins = [0x8, 0x4, 0x2, 0x1, 0xf, 0xc, 0x5, 0x3, 0xa, 0x7, 0xb, 0xd, 0xe, 0x6, 0x9];
            let first = true;
            let pinCode = 0x0;
            for (let i = 0, maxi = parts.length; i < maxi; i += 1) {
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
                    const cmd = [0, 0, 0];
                    for (let j = 0, maxj = letters.length; j < maxj; j += 1) {
                        if (parts[i].startsWith(letters[j])) {
                            cmd[0] = pins[j];
                            if (parts[i].includes("(")) {
                                const mvs = parts[i].slice(letters[j].length).match(/\((\d[+-]),\s*(\d[+-])\)/);
                                if (mvs && mvs.length >= 3) {
                                    const upPos = checkBit(cmd[0], 3) === checkBit(cmd[0], 1)
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
                                let turns = parseInt(parts[i].slice(letters[j].length, letters[j].length + 1));
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
            let pins = "";
            let d = 0;
            let u = 0;
            for (let i = 0, maxi = parts.length; i < maxi; i += 1) {
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
                    const turns = parseInt(parts[i].replace("=", "").slice(1, 3));
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
    }
    static parseNNNString(scramble, simplify = true) {
        return new Interpreter(false).input(scramble, simplify);
    }
    static parsePyraminxString(scramble) {
        return new Interpreter(false, "pyraminx").input(scramble);
    }
    static parseMisc(scramble, mode) {
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
                return prettyScramble(scramble)
                    .split("\n")
                    .map(s => s.replace(/^\d+\)(.+)$/, "$1").trim());
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
                        .map(mv => mv[0] + "2")
                        .join(" "),
                ];
            }
            default: {
                return [];
            }
        }
    }
    static inverse(type, sequence) {
        let arr = [];
        let res = [];
        if (type === "clock") {
            res = sequence
                .split(" ")
                .filter(s => !/^[UD][RL]$/.test(s) && s.trim())
                .reverse()
                .map(s => s.endsWith("0+") || s === "y2"
                ? s
                : s.slice(0, -1) + { "+": "-", "-": "+" }[s[s.length - 1]]);
        }
        else if (type === "square1") {
            const sqre = /\s*\(?(-?\d+), *(-?\d+)\)?\s*/;
            arr = sequence.replace(/\s+/g, "").split("/");
            for (let i = arr.length - 1; i >= 0; i -= 1) {
                const m = arr[i].match(sqre);
                if (m) {
                    res.push(`(${-m[1]}, ${-m[2]})`);
                }
                if (i > 0) {
                    res.push("/");
                }
            }
        }
        else if (type === "megaminx") {
            arr = parseReconstruction(sequence, type, 3).sequence;
            for (let i = arr.length - 1; i >= 0; i -= 1) {
                const mv = arr[i];
                if (/^([LRDlrd](\+|-){1,2})$/.test(mv)) {
                    res.push(mv[0] +
                        (mv[1] === "+" ? mv.slice(1).replace(/\+/g, "-") : mv.slice(1).replace(/-/g, "+")));
                }
                else {
                    const turns = (5 -
                        (((parseInt(mv.replace(/\D*(\d+)\D*/g, "$1")) || 1) *
                            Math.sign(mv.indexOf("'") + 0.2)) %
                            5)) %
                        5;
                    if (/^([ULFRBDy]\d*'?)$/.test(mv)) {
                        res.push(`${mv[0]}${turns === 1 || turns === -1 ? "" : Math.abs(turns)}${turns < 0 ? "" : "'"}`);
                    }
                    else if (/^([dbDB][RL]\d*'?)$/.test(mv)) {
                        res.push(`${mv.slice(0, 2)}${turns === 1 || turns === -1 ? "" : Math.abs(turns)}${turns < 0 ? "" : "'"}`);
                    }
                    else if (/^(DB[RL]\d*'?)$/.test(mv)) {
                        res.push(`${mv.slice(0, 3)}${turns === 1 || turns === -1 ? "" : Math.abs(turns)}${turns < 0 ? "" : "'"}`);
                    }
                    else {
                        res.push(`[${mv[1]}${turns === 1 || turns === -1 ? "" : Math.abs(turns)}${turns < 0 ? "" : "'"}]`);
                    }
                }
            }
        }
        else {
            const fn = type === "pyraminx" ? ScrambleParser.parsePyraminxString : ScrambleParser.parseNNNString;
            const arr = fn(sequence)
                .trim()
                .split(" ")
                .map(e => e.trim())
                .filter(e => e != "");
            for (let i = arr.length - 1; i >= 0; i -= 1) {
                if (arr[i].indexOf("2") > -1) {
                    res.push(arr[i].replace("'", ""));
                }
                else if (arr[i].indexOf("'") > -1) {
                    res.push(arr[i].replace("'", ""));
                }
                else {
                    res.push(arr[i] + "'");
                }
            }
        }
        return res.join(" ");
    }
}

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
let permPrun, flipPrun, fullPrun;
const cmv = [];
const pmul = [];
const fmul = [];
function pmv$1(a, c) {
    const b = cmv[c][~~(a / 24)];
    return 24 * ~~(b / 384) + pmul[a % 24][(b >> 4) % 24];
}
function fmv(b, c) {
    const a = cmv[c][b >> 4];
    return (~~(a / 384) << 4) | (fmul[b & 15][(a >> 4) % 24] ^ (a & 15));
}
function i2f(a, c) {
    for (let b = 3; 0 <= b; b--)
        ((c[b] = a & 1), (a >>= 1));
}
function f2i(c) {
    let a, b;
    for (a = 0, b = 0; 4 > b; b++)
        ((a <<= 1), (a |= c[b]));
    return a;
}
function fullmv(idx, move) {
    const slice = cmv[move][~~(idx / 384)];
    const flip = fmul[idx & 15][(slice >> 4) % 24] ^ (slice & 15);
    const perm = pmul[(idx >> 4) % 24][(slice >> 4) % 24];
    return ~~(slice / 384) * 384 + 16 * perm + flip;
}
let initRet = false;
function init$1() {
    if (initRet) {
        return;
    }
    initRet = true;
    for (let i = 0; i < 24; i++) {
        pmul[i] = [];
    }
    for (let i = 0; i < 16; i++) {
        fmul[i] = [];
    }
    const pm1 = [];
    const pm2 = [];
    const pm3 = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 24; j++) {
            setNPerm$1(pm1, i, 4);
            setNPerm$1(pm2, j, 4);
            for (let k = 0; k < 4; k++) {
                pm3[k] = pm1[pm2[k]];
            }
            pmul[i][j] = getNPerm$1(pm3, 4);
            if (i < 16) {
                i2f(i, pm1);
                for (let k = 0; k < 4; k++) {
                    pm3[k] = pm1[pm2[k]];
                }
                fmul[i][j] = f2i(pm3);
            }
        }
    }
    createMove(cmv, 495, getmv);
    permPrun = [];
    flipPrun = [];
    createPrun$1(permPrun, 0, 11880, 5, pmv$1);
    createPrun$1(flipPrun, 0, 7920, 6, fmv);
    function getmv(comb, m) {
        const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let r = 4;
        for (let i = 0; i < 12; i++) {
            if (comb >= Cnk[11 - i][r]) {
                comb -= Cnk[11 - i][r--];
                arr[i] = r << 1;
            }
            else {
                arr[i] = -1;
            }
        }
        edgeMove$1(arr, m);
        ((comb = 0), (r = 4));
        let t = 0;
        const pm = [];
        for (let i = 0; i < 12; i++) {
            if (arr[i] >= 0) {
                comb += Cnk[11 - i][r--];
                pm[r] = arr[i] >> 1;
                t |= (arr[i] & 1) << (3 - r);
            }
        }
        return ((comb * 24 + getNPerm$1(pm, 4)) << 4) | t;
    }
}
let fullInitRet = false;
function fullInit() {
    if (fullInitRet) {
        return;
    }
    fullInitRet = true;
    init$1();
    fullPrun = [];
    createPrun$1(fullPrun, 0, 190080, 7, fullmv, 6, 3, 6);
}
function mapCross(idx) {
    let comb = ~~(idx / 384);
    const perm = (idx >> 4) % 24;
    const flip = idx & 15;
    const arrp = [];
    const arrf = [];
    const pm = [];
    const fl = [];
    i2f(flip, fl);
    setNPerm$1(pm, perm, 4);
    let r = 4;
    const map = [7, 6, 5, 4, 10, 9, 8, 11, 3, 2, 1, 0];
    for (let i = 0; i < 12; i++) {
        if (comb >= Cnk[11 - i][r]) {
            comb -= Cnk[11 - i][r--];
            arrp[map[i]] = pm[r];
            arrf[map[i]] = fl[r];
        }
        else {
            arrp[map[i]] = arrf[map[i]] = -1;
        }
    }
    return [arrp, arrf];
}
function getEasyCross(length) {
    fullInit();
    const lenA = Math.min(length % 10, 8);
    const lenB = Math.min(~~(length / 10), 8);
    const minLen = Math.min(lenA, lenB);
    const maxLen = Math.max(lenA, lenB);
    const ncase = [0, 1, 16, 174, 1568, 11377, 57758, 155012, 189978, 190080];
    let cases = rn(ncase[maxLen + 1] - ncase[minLen]) + 1;
    let i;
    for (i = 0; i < 190080; i++) {
        const prun = getPruning$1(fullPrun, i);
        if (prun <= maxLen && prun >= minLen && --cases == 0) {
            break;
        }
    }
    return mapCross(i);
}

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
function between(n, a, b) {
    const na = Math.min(a, b);
    const nb = Math.max(a, b);
    return Math.min(nb, Math.max(na, n));
}
const Ux1 = 0;
const Ux2 = 1;
const Ux3 = 2;
const Rx1 = 3;
const Rx2 = 4;
const Rx3 = 5;
const Dx1 = 9;
const Dx2 = 10;
const Dx3 = 11;
const Lx1 = 12;
const Lx2 = 13;
const Lx3 = 14;
function $setFlip(obj, idx) {
    let i, parity;
    parity = 0;
    for (i = 10; i >= 0; --i) {
        parity ^= obj.eo[i] = idx & 1;
        idx >>= 1;
    }
    obj.eo[11] = parity;
}
function $setTwist(obj, idx) {
    let i, twst;
    twst = 0;
    for (i = 6; i >= 0; --i) {
        twst += obj.co[i] = idx % 3;
        idx = ~~(idx / 3);
    }
    obj.co[7] = (15 - twst) % 3;
}
function CornMult(a, b, prod) {
    let corn, ori, oriA, oriB;
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
class CubieCube {
    constructor() {
        this.cp = [0, 1, 2, 3, 4, 5, 6, 7];
        this.co = [0, 0, 0, 0, 0, 0, 0, 0];
        this.ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
}
class CubieCube1 {
    constructor(cperm, twist, eperm, flip) {
        this.cp = [0, 1, 2, 3, 4, 5, 6, 7];
        this.co = [0, 0, 0, 0, 0, 0, 0, 0];
        this.ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        set8Perm(this.cp, cperm);
        $setTwist(this, twist);
        setNPerm$1(this.ep, eperm, 12);
        $setFlip(this, flip);
    }
}
function EdgeMult(a, b, prod) {
    let ed;
    for (ed = 0; ed < 12; ++ed) {
        prod.ep[ed] = a.ep[b.ep[ed]];
        prod.eo[ed] = b.eo[ed] ^ a.eo[b.ep[ed]];
    }
}
let ret = false;
function initMove() {
    if (ret) {
        return;
    }
    ret = true;
    let a, p;
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
const moveCube = [];
const cornerFacelet = [
    [8, 9, 20],
    [6, 18, 38],
    [0, 36, 47],
    [2, 45, 11],
    [29, 26, 15],
    [27, 44, 24],
    [33, 53, 42],
    [35, 17, 51],
];
const edgeFacelet = [
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
    let c, e, f, i, j, n, ori, ts;
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
new Search$1();
function getRandomScramble$1() {
    return getAnyScramble(0xffffffffffff, 0xffffffffffff, 0xffffffff, 0xffffffff);
}
function getFMCScramble() {
    let scramble = "", axis1, axis2, axisl1, axisl2;
    do {
        scramble = getRandomScramble$1();
        const moveseq = scramble.split(" ");
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
    let c, a;
    for (c = 0, a = 0; a < b.length; a++)
        -1 == b[a] && c++;
    return c;
}
function fixOri(arr, cntU, base) {
    let sum = 0;
    let idx = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] != -1) {
            sum += arr[i];
        }
    }
    sum %= base;
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] == -1) {
            if (cntU-- == 1) {
                arr[i] = ((base << 4) - sum) % base;
            }
            else {
                arr[i] = rn(base);
                sum += arr[i];
            }
        }
        idx *= base;
        idx += arr[i];
    }
    return idx;
}
function fixPerm(arr, cntU, parity) {
    const val = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] != -1) {
            val[arr[i]] = -1;
        }
    }
    for (let i = 0, j = 0; i < val.length; i++) {
        if (val[i] != -1) {
            val[j++] = val[i];
        }
    }
    let last = 0;
    let i;
    for (i = 0; i < arr.length && cntU > 0; i++) {
        if (arr[i] == -1) {
            const r = rn(cntU);
            arr[i] = val[r];
            for (let j = r; j < 11; j++) {
                val[j] = val[j + 1];
            }
            if (cntU-- == 2) {
                last = i;
            }
        }
    }
    if (getNParity$1(getNPerm$1(arr, arr.length), arr.length) == 1 - parity) {
        const temp = arr[i - 1];
        arr[i - 1] = arr[last];
        arr[last] = temp;
    }
    return getNPerm$1(arr, arr.length);
}
//arr: 53 bit integer
function parseMask(arr, length) {
    if ("number" !== typeof arr) {
        return arr;
    }
    const ret = [];
    for (let i = 0; i < length; i++) {
        const val = arr & 0xf; // should use "/" instead of ">>" to avoid unexpected type conversion
        ret[i] = val == 15 ? -1 : val;
        arr /= 16;
    }
    return ret;
}
const aufsuff = [[], [Ux1], [Ux2], [Ux3]];
const rlpresuff = [[], [Rx1, Lx3], [Rx2, Lx2], [Rx3, Lx1]];
const rlappsuff = ["", "x'", "x2", "x"];
const emptysuff = [[]];
function getAnyScramble(_ep, _eo, _cp, _co, _rndapp, _rndpre) {
    initMove();
    _rndapp = _rndapp || emptysuff;
    _rndpre = _rndpre || emptysuff;
    const $_ep = parseMask(_ep, 12);
    const $_eo = parseMask(_eo, 12);
    const $_cp = parseMask(_cp, 8);
    const $_co = parseMask(_co, 8);
    let solution = "";
    do {
        const eo = $_eo.slice();
        const ep = $_ep.slice();
        const co = $_co.slice();
        const cp = $_cp.slice();
        const neo = fixOri(eo, cntU(eo), 2);
        const nco = fixOri(co, cntU(co), 3);
        let nep, ncp;
        const ue = cntU(ep);
        const uc = cntU(cp);
        if (ue == 0 && uc == 0) {
            nep = getNPerm$1(ep, 12);
            ncp = getNPerm$1(cp, 8);
        }
        else if (ue != 0 && uc == 0) {
            ncp = getNPerm$1(cp, 8);
            nep = fixPerm(ep, ue, getNParity$1(ncp, 8));
        }
        else if (ue == 0 && uc != 0) {
            nep = getNPerm$1(ep, 12);
            ncp = fixPerm(cp, uc, getNParity$1(nep, 12));
        }
        else {
            nep = fixPerm(ep, ue, -1);
            ncp = fixPerm(cp, uc, getNParity$1(nep, 12));
        }
        if (ncp + nco + nep + neo == 0) {
            continue;
        }
        let cc = new CubieCube1(ncp, nco, nep, neo);
        let cc2 = new CubieCube();
        const rndpre = rndEl(_rndpre);
        const rndapp = rndEl(_rndapp);
        for (let i = 0; i < rndpre.length; i++) {
            CornMult(moveCube[rndpre[i]], cc, cc2);
            EdgeMult(moveCube[rndpre[i]], cc, cc2);
            const tmp = cc2;
            cc2 = cc;
            cc = tmp;
        }
        for (let i = 0; i < rndapp.length; i++) {
            CornMult(cc, moveCube[rndapp[i]], cc2);
            EdgeMult(cc, moveCube[rndapp[i]], cc2);
            const tmp = cc2;
            cc2 = cc;
            cc = tmp;
        }
        const posit = toFaceCube(cc);
        // @ts-ignore
        const search0 = new Search$1();
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
const f2l_map = [
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
const f2lprobs = idxArray(f2l_map, 1);
const f2lfilter = idxArray(f2l_map, 2);
function getLSLLScramble(type, length, cases) {
    const caze = f2l_map[fixCase(cases, f2lprobs)][0];
    const ep = Math.pow(16, caze & 0xf);
    const eo = 0xf ^ ((caze >> 4) & 1);
    const cp = Math.pow(16, (caze >> 8) & 0xf);
    const co = 0xf ^ ((caze >> 12) & 3);
    return getAnyScramble(0xba9f7654ffff - 7 * ep, 0x000f0000ffff - eo * ep, 0x765fffff - 0xb * cp, 0x000fffff - co * cp);
}
const crossProbs = [
    [0xffffffff3210, 0xffffffff0000],
    [0xbff8fff4fff0, 0x0ff0fff0fff0],
    [0xff98ff5fff1f, 0xff00ff0fff0f],
    [0xffff7654ffff, 0xffff0000ffff],
    [0xfa9ff6fff2ff, 0xf00ff0fff0ff],
    [0xbaff7fff3fff, 0x00ff0fff0fff],
];
const crossFilter = ["U", "R", "F", "D", "L", "B"];
function getF2LScramble(_type, _length, prob) {
    /*
    0xabcdefghijkl
  
    a = BR    b = BL    c = FL    d = FR
    e = DB    f = DL    g = DF    h = DR
    i = UB    j = UL    k = UF    l = UR
  
    */
    const p = between(prob || 0, 0, crossProbs.length - 1);
    let _prob = crossProbs[p];
    if (typeof prob != "number" || prob < 0 || prob >= crossProbs.length) {
        _prob = rndEl(crossProbs);
    }
    return getAnyScramble(_prob[0], _prob[1], 0xffffffff, 0xffffffff);
}
function genZBLLMap() {
    let isVisited = [];
    let zbll_map = [];
    let cc = new CubieCube();
    for (let idx = 0; idx < 27 * 24 * 24; idx++) {
        if ((isVisited[idx >> 5] >> (idx & 0x1f)) & 1) {
            continue;
        }
        let epi = idx % 24;
        let cpi = ~~(idx / 24) % 24;
        let coi = ~~(idx / 24 / 24);
        if (getNParity$1(cpi, 4) != getNParity$1(epi, 4)) {
            continue;
        }
        let co = setNOri(cc.co, coi, 4, -3);
        let cp = setNPerm$1(cc.cp, cpi, 4, 0);
        let ep = setNPerm$1(cc.ep, epi, 4, 0);
        let zbcase = [0, 0, 0, 0, null];
        for (let i = 0; i < 4; i++) {
            zbcase[0] += cp[i] << (i * 4);
            zbcase[1] += co[i] << (i * 4);
            zbcase[2] += ep[i] << (i * 4);
        }
        for (let conj = 0; conj < 16; conj++) {
            let c0 = conj >> 2;
            let c1 = conj & 3;
            let co2 = [], cp2 = [], ep2 = [];
            for (let i = 0; i < 4; i++) {
                co2[(i + c0) & 3] = co[i];
                cp2[(i + c0) & 3] = (cp[i] + c1) & 3;
                ep2[(i + c0) & 3] = (ep[i] + c1) & 3;
            }
            let co2i = getNOri(co2, 4, -3);
            let cp2i = getNPerm$1(cp2, 4, 0);
            let ep2i = getNPerm$1(ep2, 4, 0);
            let idx2 = (co2i * 24 + cp2i) * 24 + ep2i;
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
    let coNames = {};
    coNames[0x0000] = "O";
    coNames[0x0012] = "U";
    coNames[0x0021] = "T";
    coNames[0x0102] = "L";
    coNames[0x0111] = "aS";
    coNames[0x0222] = "S";
    coNames[0x1122] = "Pi";
    coNames[0x1212] = "H";
    let coCnts = {};
    for (let i = 0; i < zbll_map.length; i++) {
        let zbcase = zbll_map[i];
        let coName = coNames[zbcase[1]];
        coCnts[coName] = coCnts[coName] || [];
        let coCnt = coCnts[coName];
        let cpIdx = coCnt.indexOf(zbcase[0]);
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
const zbll_map = genZBLLMap();
const zbprobs = idxArray(zbll_map, 3);
const zbfilter = idxArray(zbll_map, 4);
const coll_map = [
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
const coprobs = idxArray(coll_map, 3);
const cofilter = idxArray(coll_map, 4);
function getCOLLScramble(type, length, cases) {
    let cocase = coll_map[fixCase(cases, coprobs)];
    return getAnyScramble(0xba987654ffff, 0, cocase[0] + 0x76540000, cocase[1], aufsuff, aufsuff);
}
function getZBLLScramble(type, length, cases) {
    const zbcase = zbll_map[fixCase(cases, zbprobs)];
    return getAnyScramble(0xba987654ffff, 0, zbcase[0] + 0x76540000, zbcase[1], aufsuff, aufsuff);
}
function getZZLLScramble() {
    return getAnyScramble(0xba9876543f1f, 0x000000000000, 0x7654ffff, 0x0000ffff, aufsuff);
}
function getZBLSScramble() {
    return getAnyScramble(0xba9f7654ffff, 0x000000000000, 0x765fffff, 0x000fffff);
}
function getLSEScramble() {
    const rnd4 = rn(4);
    return (getAnyScramble(0xba98f6f4ffff, 0x0000f0f0ffff, 0x76543210, 0x00000000, [rlpresuff[rnd4]], aufsuff) + rlappsuff[rnd4]);
}
const cmll_map = [
    0x0000, // O or solved
    0x1212, // H
    0x0102, // L
    0x1122, // Pi
    0x0222, // S
    0x0021, // T
    0x0012, // U
    0x0111, // aS
];
const cmprobs = [6, 12, 24, 24, 24, 24, 24, 24];
const cmfilter = ["O", "H", "L", "Pi", "S", "T", "U", "aS"];
function getCMLLScramble(type, length, cases) {
    const rnd4 = rn(4);
    const presuff = [];
    for (let i = 0; i < aufsuff.length; i++) {
        presuff.push(aufsuff[i].concat(rlpresuff[rnd4]));
    }
    return (getAnyScramble(0xba98f6f4ffff, 0x0000f0f0ffff, 0x7654ffff, cmll_map[fixCase(cases, cmprobs)], presuff, aufsuff) + rlappsuff[rnd4]);
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
const pll_map = [
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
const pllprobs = idxArray(pll_map, 2);
const pllfilter = idxArray(pll_map, 3);
function getPLLScramble(type, length, cases) {
    const pllcase = pll_map[fixCase(cases, pllprobs)];
    return getAnyScramble(pllcase[0] + 0xba9876540000, 0x000000000000, pllcase[1] + 0x76540000, 0x00000000, aufsuff, aufsuff);
}
const oll_map = [
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
const ollprobs = idxArray(oll_map, 2);
const ollfilter = idxArray(oll_map, 3);
function getOLLScramble(type, length, cases) {
    const ollcase = oll_map[fixCase(cases, ollprobs)];
    return getAnyScramble(0xba987654ffff, ollcase[0], 0x7654ffff, ollcase[1], aufsuff, aufsuff);
}
function getEOLineScramble() {
    return getAnyScramble(0xffff7f5fffff, 0x000000000000, 0xffffffff, 0xffffffff);
}
function getEasyCrossScramble(type, length) {
    const cases = getEasyCross(length);
    return getAnyScramble(cases[0], cases[1], 0xffffffff, 0xffffffff);
}
function getCustomScramble(type, length, cases) {
    let ep = 0;
    let eo = 0;
    let cp = 0;
    let co = 0;
    let chk = 0x1100; //ep+cp|ep+1|cp+1|eo|co
    cases = cases || valuedArray(40, 1);
    for (let i = 0; i < 12; i++) {
        chk += (cases[i] ? 0x11000 : 0) + (cases[i + 20] ? 0x10 : 0);
        ep += (cases[i] ? 0xf : i) * Math.pow(16, i);
        eo += (cases[i + 20] ? 0xf : 0) * Math.pow(16, i);
    }
    for (let i = 0; i < 8; i++) {
        chk += (cases[i + 12] ? 0x10100 : 0) + (cases[i + 32] ? 0x1 : 0);
        cp += (cases[i + 12] ? 0xf : i) * Math.pow(16, i);
        co += (cases[i + 32] ? 0xf : 0) * Math.pow(16, i);
    }
    if ((chk & 0x1cccee) == 0) {
        return "U' U ";
    }
    return getAnyScramble(ep, eo, cp, co);
}
const daufsuff = [[], [Dx1], [Dx2], [Dx3]];
const daufrot = ["", "y", "y2", "y'"];
function getMehta3QBScramble() {
    const rnd4 = rn(4);
    return (getAnyScramble(0xffff765fffff, 0xffff000fffff, 0xf65fffff, 0xf00fffff, [
        daufsuff[rnd4],
    ]) + daufrot[rnd4]);
}
function getMehtaEOLEScramble() {
    const skip = rn(4);
    const rnd4 = rn(4);
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
const customfilter = [
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
for (let i = 0; i < 20; i++) {
    const piece = customfilter[i];
    customfilter[i + 20] = (piece.length == 2 ? "OriE-" : "OriC-") + piece;
    customfilter[i] = (piece.length == 2 ? "PermE-" : "PermC-") + piece;
}
const customprobs = valuedArray(40, 0);
const ttll_map = [
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
const ttllprobs = [];
const ttllfilter = [];
for (let i = 0; i < ttll_map.length; i++) {
    ttllprobs[i] = 1;
    ttllfilter[i] = ttll_map[i][2];
}
function getTTLLScramble(type, length, cases) {
    const ttllcase = ttll_map[fixCase(cases, ttllprobs)];
    return getAnyScramble(0xba9876540000 + ttllcase[1], 0x000000000000, 0x76500000 + ttllcase[0], 0x00000000, aufsuff, aufsuff);
}
const eols_map = [];
const eolsprobs = [];
const eolsfilter = [];
for (let i = 0; i < f2l_map.length; i++) {
    if (f2l_map[i][0] & 0xf0) {
        continue;
    }
    eols_map.push(f2l_map[i][0]);
    eolsprobs.push(f2lprobs[i]);
    eolsfilter.push(f2lfilter[i]);
}
function getEOLSScramble(type, length, cases) {
    const caze = eols_map[fixCase(cases, eolsprobs)];
    const ep = Math.pow(16, caze & 0xf);
    const cp = Math.pow(16, (caze >> 8) & 0xf);
    const co = 0xf ^ ((caze >> 12) & 3);
    return getAnyScramble(0xba9f7654ffff - 7 * ep, 0x000000000000, 0x765fffff - 0xb * cp, 0x000fffff - co * cp, aufsuff);
}
const wvls_map = [];
const wvlsprobs = [];
const wvlsfilter = [
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
for (let i = 0; i < 27; i++) {
    wvls_map[i] = (~~(i / 9) << 12) | (~~(i / 3) % 3 << 8) | i % 3;
    wvlsprobs[i] = 1;
}
function getWVLSScramble(type, length, cases) {
    const caze = wvls_map[fixCase(cases, wvlsprobs)];
    return getAnyScramble(0xba9f7654ff8f, 0x000000000000, 0x765fff4f, 0x000f0020 | caze);
}
const vls_map = [];
const vlsprobs = [];
const vlsfilter = [];
for (let i = 0; i < 27 * 8; i++) {
    const co = i % 27;
    const eo = ~~(i / 27);
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
    const caze = vls_map[fixCase(cases, vlsprobs)];
    return getAnyScramble(0xba9f7654ff8f, 0x000f00000000 + caze[1], 0x765fff4f, 0x000f0020 + caze[0], [[Ux3]]);
}
function getSBRouxScramble() {
    const rnd4 = rn(4);
    return (getAnyScramble(0xfa9ff6ffffff, 0xf00ff0ffffff, 0xf65fffff, 0xf00fffff, [
        rlpresuff[rnd4],
    ]) + rlappsuff[rnd4]);
}
function getEasyXCrossScramble(type, length) {
    const cases = getEasyXCross(length);
    return getAnyScramble(cases[0], cases[1], cases[2], cases[3]);
}
regScrambler("333", getRandomScramble$1)("333oh", getRandomScramble$1)("333ft", getRandomScramble$1)("333fm", getFMCScramble)("edges", getEdgeScramble)("corners", getCornerScramble)("ll", getLLScramble)("lsll2", getLSLLScramble, [f2lfilter, f2lprobs])("f2l", getF2LScramble, [crossFilter, crossProbs])("zbll", getZBLLScramble, [zbfilter, zbprobs])("zzll", getZZLLScramble)("zbls", getZBLSScramble)("lse", getLSEScramble)("cmll", getCMLLScramble, [cmfilter, cmprobs])("cll", getCLLScramble)("ell", getELLScramble)("pll", getPLLScramble, [pllfilter, pllprobs])("oll", getOLLScramble, [ollfilter, ollprobs])("2gll", get2GLLScramble)("easyc", getEasyCrossScramble)("eoline", getEOLineScramble)("333custom", getCustomScramble, [customfilter, customprobs])("ttll", getTTLLScramble, [ttllfilter, ttllprobs])("eols", getEOLSScramble, [eolsfilter, eolsprobs])("wvls", getWVLSScramble, [
    wvlsfilter,
    wvlsprobs,
])("vls", getVLSScramble, [vlsfilter, vlsprobs])("coll", getCOLLScramble, [
    cofilter,
    coprobs,
])("sbrx", getSBRouxScramble)("mt3qb", getMehta3QBScramble)("mteole", getMehtaEOLEScramble)("mttdr", getMehtaTDRScramble)("mt6cp", getMehta6CPScramble)("mtl5ep", getMehtaL5EPScramble)("mtcdrll", getMehtaCDRLLScramble)("easyxc", getEasyXCrossScramble);

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
function createArray(length1, length2) {
    let result, i;
    result = newArr(length1);
    if (length2 != undefined) {
        for (i = 0; i < length1; i++) {
            result[i] = newArr(length2);
        }
    }
    return result;
}
let _$1, seedTable = {}, CM$ = {};
const Q$Object = 0, Q$Serializable = 30, Q$Center1 = 21, Q$CornerCube = 22, Q$Edge3 = 23, Q$FullCube_0 = 24, Q$FullCube_$1 = 25, Q$Comparable = 34, Q$Search_0 = 26, Q$Object_$1 = 40;
function newSeed(id) {
    return new seedTable[id]();
}
function defineSeed(id, superSeed, castableTypeMap, ...args) {
    let seed = seedTable[id];
    if (seed && !seed.___clazz$) {
        _$1 = seed.prototype;
    }
    else {
        !seed && (seed = seedTable[id] = function () { });
        _$1 = seed.prototype = superSeed < 0 ? {} : newSeed(superSeed);
        _$1.castableTypeMap$ = castableTypeMap;
    }
    for (let i = 0, maxi = args.length; i < maxi; i += 1) {
        args[i].prototype = _$1;
    }
    if (seed.___clazz$) {
        _$1.___clazz$ = seed.___clazz$;
        seed.___clazz$ = null;
    }
}
function makeCastMap(a) {
    const result = {};
    for (let i_0 = 0, c = a.length; i_0 < c; ++i_0) {
        result[a[i_0]] = 1;
    }
    return result;
}
defineSeed(1, -1, CM$);
_$1.value = null;
function Array_0() { }
function createFrom(array, length_0) {
    let a, result;
    a = array;
    result = createFromSeed(0, length_0);
    initValues(a.___clazz$, a.castableTypeMap$, a.queryId$, result);
    return result;
}
function createFromSeed(seedType, length_0) {
    const array = newArr(length_0);
    return array;
}
function initDim(arrayClass, castableTypeMap, queryId, length_0, seedType) {
    let result;
    result = createFromSeed(seedType, length_0);
    initValues(arrayClass, castableTypeMap, queryId, result);
    return result;
}
function initValues(arrayClass, castableTypeMap, queryId, array) {
    $clinit_Array$ExpandoWrapper();
    wrapArray(array, expandoNames_0, expandoValues_0);
    array.___clazz$ = arrayClass;
    array.castableTypeMap$ = castableTypeMap;
    array.queryId$ = queryId;
    return array;
}
function setCheck(array, index, value) {
    return (array[index] = value);
}
defineSeed(73, 1, {}, Array_0);
_$1.queryId$ = 0;
let clinitArrayRet = false;
function $clinit_Array$ExpandoWrapper() {
    if (clinitArrayRet) {
        return;
    }
    clinitArrayRet = true;
    expandoNames_0 = [];
    expandoValues_0 = [];
    initExpandos(new Array_0(), expandoNames_0, expandoValues_0);
}
function initExpandos(protoType, expandoNames, expandoValues) {
    let i_0 = 0, value;
    for (const name_0 in protoType) {
        value = protoType[name_0];
        if (value) {
            expandoNames[i_0] = name_0;
            expandoValues[i_0] = value;
            ++i_0;
        }
    }
}
function wrapArray(array, expandoNames, expandoValues) {
    $clinit_Array$ExpandoWrapper();
    for (let i_0 = 0, c = expandoNames.length; i_0 < c; ++i_0) {
        array[expandoNames[i_0]] = expandoValues[i_0];
    }
}
let expandoNames_0, expandoValues_0;
function canCast(src, dstId) {
    return src.castableTypeMap$ && !!src.castableTypeMap$[dstId];
}
function instanceOf(src, dstId) {
    return src != null && canCast(src, dstId);
}
let clinitCenterRet = false;
function $clinit_Center1() {
    if (clinitCenterRet) {
        return;
    }
    clinitCenterRet = true;
    ctsmv = createArray(15582, 36);
    sym2raw = createArray(15582);
    csprun = createArray(15582);
    symmult = createArray(48, 48);
    symmove = createArray(48, 36);
    syminv = createArray(48);
    finish_0 = createArray(48);
}
function $$init_1(this$static) {
    this$static.ct = createArray(24);
}
function $equals(this$static, obj) {
    let c, i_0;
    if (instanceOf(obj, Q$Center1)) {
        c = obj;
        for (i_0 = 0; i_0 < 24; ++i_0) {
            if (this$static.ct[i_0] != c.ct[i_0]) {
                return false;
            }
        }
        return true;
    }
    return false;
}
function $get_1(this$static) {
    let i_0, idx, r;
    idx = 0;
    r = 8;
    for (i_0 = 23; i_0 >= 0; --i_0) {
        this$static.ct[i_0] == 1 && (idx += Cnk[i_0][r--]);
    }
    return idx;
}
function $getsym(this$static) {
    let cord, j;
    if (raw2sym != null) {
        return raw2sym[$get_1(this$static)];
    }
    for (j = 0; j < 48; ++j) {
        cord = raw2sym_0($get_1(this$static));
        if (cord != -1)
            return cord * 64 + j;
        $rot(this$static, 0);
        j % 2 == 1 && $rot(this$static, 1);
        j % 8 == 7 && $rot(this$static, 2);
        j % 16 == 15 && $rot(this$static, 3);
    }
}
function $move(this$static, m_0) {
    let key;
    key = m_0 % 3;
    m_0 = ~~(m_0 / 3);
    switch (m_0) {
        case 0:
            swap(this$static.ct, 0, 1, 2, 3, key);
            break;
        case 1:
            swap(this$static.ct, 16, 17, 18, 19, key);
            break;
        case 2:
            swap(this$static.ct, 8, 9, 10, 11, key);
            break;
        case 3:
            swap(this$static.ct, 4, 5, 6, 7, key);
            break;
        case 4:
            swap(this$static.ct, 20, 21, 22, 23, key);
            break;
        case 5:
            swap(this$static.ct, 12, 13, 14, 15, key);
            break;
        case 6:
            swap(this$static.ct, 0, 1, 2, 3, key);
            swap(this$static.ct, 8, 20, 12, 16, key);
            swap(this$static.ct, 9, 21, 13, 17, key);
            break;
        case 7:
            swap(this$static.ct, 16, 17, 18, 19, key);
            swap(this$static.ct, 1, 15, 5, 9, key);
            swap(this$static.ct, 2, 12, 6, 10, key);
            break;
        case 8:
            swap(this$static.ct, 8, 9, 10, 11, key);
            swap(this$static.ct, 2, 19, 4, 21, key);
            swap(this$static.ct, 3, 16, 5, 22, key);
            break;
        case 9:
            swap(this$static.ct, 4, 5, 6, 7, key);
            swap(this$static.ct, 10, 18, 14, 22, key);
            swap(this$static.ct, 11, 19, 15, 23, key);
            break;
        case 10:
            swap(this$static.ct, 20, 21, 22, 23, key);
            swap(this$static.ct, 0, 8, 4, 14, key);
            swap(this$static.ct, 3, 11, 7, 13, key);
            break;
        case 11:
            swap(this$static.ct, 12, 13, 14, 15, key);
            swap(this$static.ct, 1, 20, 7, 18, key);
            swap(this$static.ct, 0, 23, 6, 17, key);
    }
}
function $rot(this$static, r) {
    switch (r) {
        case 0:
            $move(this$static, 19);
            $move(this$static, 28);
            break;
        case 1:
            $move(this$static, 21);
            $move(this$static, 32);
            break;
        case 2:
            swap(this$static.ct, 0, 3, 1, 2, 1);
            swap(this$static.ct, 8, 11, 9, 10, 1);
            swap(this$static.ct, 4, 7, 5, 6, 1);
            swap(this$static.ct, 12, 15, 13, 14, 1);
            swap(this$static.ct, 16, 19, 21, 22, 1);
            swap(this$static.ct, 17, 18, 20, 23, 1);
            break;
        case 3:
            $move(this$static, 18);
            $move(this$static, 29);
            $move(this$static, 24);
            $move(this$static, 35);
    }
}
function $rotate(this$static, r) {
    let j;
    for (j = 0; j < r; ++j) {
        $rot(this$static, 0);
        j % 2 == 1 && $rot(this$static, 1);
        j % 8 == 7 && $rot(this$static, 2);
        j % 16 == 15 && $rot(this$static, 3);
    }
}
function $set_0(this$static, idx) {
    let i_0, r;
    r = 8;
    for (i_0 = 23; i_0 >= 0; --i_0) {
        this$static.ct[i_0] = 0;
        if (idx >= Cnk[i_0][r]) {
            idx -= Cnk[i_0][r--];
            this$static.ct[i_0] = 1;
        }
    }
}
function $set_1(this$static, c) {
    let i_0;
    for (i_0 = 0; i_0 < 24; ++i_0) {
        this$static.ct[i_0] = c.ct[i_0];
    }
}
function Center1_0() {
    let i_0;
    $$init_1(this);
    for (i_0 = 0; i_0 < 8; ++i_0) {
        this.ct[i_0] = 1;
    }
    for (i_0 = 8; i_0 < 24; ++i_0) {
        this.ct[i_0] = 0;
    }
}
function Center1_1(c, urf) {
    let i_0;
    $$init_1(this);
    for (i_0 = 0; i_0 < 24; ++i_0) {
        this.ct[i_0] = ~~(c.ct[i_0] / 2) == urf ? 1 : 0;
    }
}
function Center1_2(ct) {
    let i_0;
    $$init_1(this);
    for (i_0 = 0; i_0 < 24; ++i_0) {
        this.ct[i_0] = ct[i_0];
    }
}
function createMoveTable() {
    let c, d, i_0, m_0;
    c = new Center1_0();
    d = new Center1_0();
    for (i_0 = 0; i_0 < 15582; ++i_0) {
        $set_0(d, sym2raw[i_0]);
        for (m_0 = 0; m_0 < 36; ++m_0) {
            $set_1(c, d);
            $move(c, m_0);
            ctsmv[i_0][m_0] = $getsym(c);
        }
    }
}
function createPrun() {
    let check, depth, done, i_0, idx, inv, m_0, select;
    fill_0(csprun);
    csprun[0] = 0;
    depth = 0;
    done = 1;
    while (done != 15582) {
        inv = depth > 4;
        select = inv ? -1 : depth;
        check = inv ? depth : -1;
        ++depth;
        for (i_0 = 0; i_0 < 15582; ++i_0) {
            if (csprun[i_0] != select) {
                continue;
            }
            for (m_0 = 0; m_0 < 27; ++m_0) {
                idx = ~~ctsmv[i_0][m_0] >>> 6;
                if (csprun[idx] != check) {
                    continue;
                }
                ++done;
                if (inv) {
                    csprun[i_0] = depth;
                    break;
                }
                else {
                    csprun[idx] = depth;
                }
            }
        }
    }
}
function getSolvedSym(cube) {
    let c, check, i_0, j;
    c = new Center1_2(cube.ct);
    for (j = 0; j < 48; ++j) {
        check = true;
        for (i_0 = 0; i_0 < 24; ++i_0) {
            if (c.ct[i_0] != ~~(i_0 / 4)) {
                check = false;
                break;
            }
        }
        if (check) {
            return j;
        }
        $rot(c, 0);
        j % 2 == 1 && $rot(c, 1);
        j % 8 == 7 && $rot(c, 2);
        j % 16 == 15 && $rot(c, 3);
    }
    return -1;
}
function initSym_0() {
    let c, d, e, f, i_0, j, k_0;
    c = new Center1_0();
    for (i_0 = 0; i_0 < 24; ++i_0) {
        c.ct[i_0] = i_0;
    }
    d = new Center1_2(c.ct);
    e = new Center1_2(c.ct);
    f = new Center1_2(c.ct);
    for (i_0 = 0; i_0 < 48; ++i_0) {
        for (j = 0; j < 48; ++j) {
            for (k_0 = 0; k_0 < 48; ++k_0) {
                if ($equals(c, d)) {
                    symmult[i_0][j] = k_0;
                    k_0 == 0 && (syminv[i_0] = j);
                }
                $rot(d, 0);
                k_0 % 2 == 1 && $rot(d, 1);
                k_0 % 8 == 7 && $rot(d, 2);
                k_0 % 16 == 15 && $rot(d, 3);
            }
            $rot(c, 0);
            j % 2 == 1 && $rot(c, 1);
            j % 8 == 7 && $rot(c, 2);
            j % 16 == 15 && $rot(c, 3);
        }
        $rot(c, 0);
        i_0 % 2 == 1 && $rot(c, 1);
        i_0 % 8 == 7 && $rot(c, 2);
        i_0 % 16 == 15 && $rot(c, 3);
    }
    for (i_0 = 0; i_0 < 48; ++i_0) {
        $set_1(c, e);
        $rotate(c, syminv[i_0]);
        for (j = 0; j < 36; ++j) {
            $set_1(d, c);
            $move(d, j);
            $rotate(d, i_0);
            for (k_0 = 0; k_0 < 36; ++k_0) {
                $set_1(f, e);
                $move(f, k_0);
                if ($equals(f, d)) {
                    symmove[i_0][j] = k_0;
                    break;
                }
            }
        }
    }
    $set_0(c, 0);
    for (i_0 = 0; i_0 < 48; ++i_0) {
        finish_0[syminv[i_0]] = $get_1(c);
        $rot(c, 0);
        i_0 % 2 == 1 && $rot(c, 1);
        i_0 % 8 == 7 && $rot(c, 2);
        i_0 % 16 == 15 && $rot(c, 3);
    }
}
function initSym2Raw() {
    let c, count, i_0, idx, j, occ;
    c = new Center1_0();
    occ = createArray(22984);
    for (i_0 = 0; i_0 < 22984; i_0++) {
        occ[i_0] = 0;
    }
    count = 0;
    for (i_0 = 0; i_0 < 735471; ++i_0) {
        if ((occ[~~i_0 >>> 5] & (1 << (i_0 & 31))) == 0) {
            $set_0(c, i_0);
            for (j = 0; j < 48; ++j) {
                idx = $get_1(c);
                occ[~~idx >>> 5] |= 1 << (idx & 31);
                raw2sym != null && (raw2sym[idx] = (count << 6) | syminv[j]);
                $rot(c, 0);
                j % 2 == 1 && $rot(c, 1);
                j % 8 == 7 && $rot(c, 2);
                j % 16 == 15 && $rot(c, 3);
            }
            sym2raw[count++] = i_0;
        }
    }
}
function raw2sym_0(n) {
    let m_0;
    m_0 = binarySearch_0(sym2raw, n);
    return m_0 >= 0 ? m_0 : -1;
}
defineSeed(153, 1, makeCastMap([Q$Center1]), Center1_0, Center1_1, Center1_2);
let csprun, ctsmv, finish_0, raw2sym = null, sym2raw, syminv, symmove, symmult;
let clinitCenter2Ret = false;
function $clinit_Center2() {
    if (clinitCenter2Ret) {
        return;
    }
    clinitCenter2Ret = true;
    rlmv = createArray(70, 28);
    ctmv = createArray(6435, 28);
    rlrot = createArray(70, 16);
    ctrot = createArray(6435, 16);
    ctprun = createArray(450450);
    pmv = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0,
        0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0,
    ];
}
function $getct(this$static) {
    let i_0, idx, r;
    idx = 0;
    r = 8;
    for (i_0 = 14; i_0 >= 0; --i_0) {
        this$static.ct[i_0] != this$static.ct[15] && (idx += Cnk[i_0][r--]);
    }
    return idx;
}
function $getrl(this$static) {
    let i_0, idx, r;
    idx = 0;
    r = 4;
    for (i_0 = 6; i_0 >= 0; --i_0) {
        this$static.rl[i_0] != this$static.rl[7] && (idx += Cnk[i_0][r--]);
    }
    return idx * 2 + this$static.parity;
}
function $move_0(this$static, m_0) {
    let key;
    this$static.parity ^= pmv[m_0];
    key = m_0 % 3;
    m_0 = ~~(m_0 / 3);
    switch (m_0) {
        case 0:
            swap(this$static.ct, 0, 1, 2, 3, key);
            break;
        case 1:
            swap(this$static.rl, 0, 1, 2, 3, key);
            break;
        case 2:
            swap(this$static.ct, 8, 9, 10, 11, key);
            break;
        case 3:
            swap(this$static.ct, 4, 5, 6, 7, key);
            break;
        case 4:
            swap(this$static.rl, 4, 5, 6, 7, key);
            break;
        case 5:
            swap(this$static.ct, 12, 13, 14, 15, key);
            break;
        case 6:
            swap(this$static.ct, 0, 1, 2, 3, key);
            swap(this$static.rl, 0, 5, 4, 1, key);
            swap(this$static.ct, 8, 9, 12, 13, key);
            break;
        case 7:
            swap(this$static.rl, 0, 1, 2, 3, key);
            swap(this$static.ct, 1, 15, 5, 9, key);
            swap(this$static.ct, 2, 12, 6, 10, key);
            break;
        case 8:
            swap(this$static.ct, 8, 9, 10, 11, key);
            swap(this$static.rl, 0, 3, 6, 5, key);
            swap(this$static.ct, 3, 2, 5, 4, key);
            break;
        case 9:
            swap(this$static.ct, 4, 5, 6, 7, key);
            swap(this$static.rl, 3, 2, 7, 6, key);
            swap(this$static.ct, 11, 10, 15, 14, key);
            break;
        case 10:
            swap(this$static.rl, 4, 5, 6, 7, key);
            swap(this$static.ct, 0, 8, 4, 14, key);
            swap(this$static.ct, 3, 11, 7, 13, key);
            break;
        case 11:
            swap(this$static.ct, 12, 13, 14, 15, key);
            swap(this$static.rl, 1, 4, 7, 2, key);
            swap(this$static.ct, 1, 0, 7, 6, key);
    }
}
function $rot_0(this$static, r) {
    switch (r) {
        case 0:
            $move_0(this$static, 19);
            $move_0(this$static, 28);
            break;
        case 1:
            $move_0(this$static, 21);
            $move_0(this$static, 32);
            break;
        case 2:
            swap(this$static.ct, 0, 3, 1, 2, 1);
            swap(this$static.ct, 8, 11, 9, 10, 1);
            swap(this$static.ct, 4, 7, 5, 6, 1);
            swap(this$static.ct, 12, 15, 13, 14, 1);
            swap(this$static.rl, 0, 3, 5, 6, 1);
            swap(this$static.rl, 1, 2, 4, 7, 1);
    }
}
function $set_2(this$static, c, edgeParity) {
    let i_0;
    for (i_0 = 0; i_0 < 16; ++i_0) {
        this$static.ct[i_0] = ~~(c.ct[i_0] / 2);
    }
    for (i_0 = 0; i_0 < 8; ++i_0) {
        this$static.rl[i_0] = c.ct[i_0 + 16];
    }
    this$static.parity = edgeParity;
}
function $setct(this$static, idx) {
    let i_0, r;
    r = 8;
    this$static.ct[15] = 0;
    for (i_0 = 14; i_0 >= 0; --i_0) {
        if (idx >= Cnk[i_0][r]) {
            idx -= Cnk[i_0][r--];
            this$static.ct[i_0] = 1;
        }
        else {
            this$static.ct[i_0] = 0;
        }
    }
}
function $setrl(this$static, idx) {
    let i_0, r;
    this$static.parity = idx & 1;
    idx >>>= 1;
    r = 4;
    this$static.rl[7] = 0;
    for (i_0 = 6; i_0 >= 0; --i_0) {
        if (idx >= Cnk[i_0][r]) {
            idx -= Cnk[i_0][r--];
            this$static.rl[i_0] = 1;
        }
        else {
            this$static.rl[i_0] = 0;
        }
    }
}
function Center2_0() {
    this.rl = createArray(8);
    this.ct = createArray(16);
}
function init_3() {
    let c, ct, ctx, depth, done, i_0, idx, j, m_0, rl, rlx;
    c = new Center2_0();
    for (i_0 = 0; i_0 < 70; ++i_0) {
        for (m_0 = 0; m_0 < 28; ++m_0) {
            $setrl(c, i_0);
            $move_0(c, move2std[m_0]);
            rlmv[i_0][m_0] = $getrl(c);
        }
    }
    for (i_0 = 0; i_0 < 70; ++i_0) {
        $setrl(c, i_0);
        for (j = 0; j < 16; ++j) {
            rlrot[i_0][j] = $getrl(c);
            $rot_0(c, 0);
            j % 2 == 1 && $rot_0(c, 1);
            j % 8 == 7 && $rot_0(c, 2);
        }
    }
    for (i_0 = 0; i_0 < 6435; ++i_0) {
        $setct(c, i_0);
        for (j = 0; j < 16; ++j) {
            ctrot[i_0][j] = $getct(c) & 65535;
            $rot_0(c, 0);
            j % 2 == 1 && $rot_0(c, 1);
            j % 8 == 7 && $rot_0(c, 2);
        }
    }
    for (i_0 = 0; i_0 < 6435; ++i_0) {
        for (m_0 = 0; m_0 < 28; ++m_0) {
            $setct(c, i_0);
            $move_0(c, move2std[m_0]);
            ctmv[i_0][m_0] = $getct(c) & 65535;
        }
    }
    fill_0(ctprun);
    ctprun[0] =
        ctprun[18] =
            ctprun[28] =
                ctprun[46] =
                    ctprun[54] =
                        ctprun[56] =
                            0;
    depth = 0;
    done = 6;
    while (done != 450450) {
        const inv = depth > 6;
        const select = inv ? -1 : depth;
        const check = inv ? depth : -1;
        ++depth;
        for (i_0 = 0; i_0 < 450450; ++i_0) {
            if (ctprun[i_0] != select) {
                continue;
            }
            ct = ~~(i_0 / 70);
            rl = i_0 % 70;
            for (m_0 = 0; m_0 < 23; ++m_0) {
                ctx = ctmv[ct][m_0];
                rlx = rlmv[rl][m_0];
                idx = ctx * 70 + rlx;
                if (ctprun[idx] != check) {
                    continue;
                }
                ++done;
                if (inv) {
                    ctprun[i_0] = depth;
                    break;
                }
                else {
                    ctprun[idx] = depth;
                }
            }
        }
    }
}
defineSeed(154, 1, {}, Center2_0);
_$1.parity = 0;
let ctmv, ctprun, ctrot, pmv, rlmv, rlrot;
let clinitCenter3Ret = false;
function $clinit_Center3() {
    if (clinitCenter3Ret) {
        return;
    }
    clinitCenter3Ret = true;
    ctmove = createArray(29400, 20);
    pmove = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
    prun_0 = createArray(29400);
    rl2std = [0, 9, 14, 23, 27, 28, 41, 42, 46, 55, 60, 69];
    std2rl = createArray(70);
}
function $getct_0(this$static) {
    let check, i_0, idx, idxrl, r;
    idx = 0;
    r = 4;
    for (i_0 = 6; i_0 >= 0; --i_0) {
        this$static.ud[i_0] != this$static.ud[7] && (idx += Cnk[i_0][r--]);
    }
    idx *= 35;
    r = 4;
    for (i_0 = 6; i_0 >= 0; --i_0) {
        this$static.fb[i_0] != this$static.fb[7] && (idx += Cnk[i_0][r--]);
    }
    idx *= 12;
    check = this$static.fb[7] ^ this$static.ud[7];
    idxrl = 0;
    r = 4;
    for (i_0 = 7; i_0 >= 0; --i_0) {
        this$static.rl[i_0] != check && (idxrl += Cnk[i_0][r--]);
    }
    return this$static.parity + 2 * (idx + std2rl[idxrl]);
}
function $move_1(this$static, i_0) {
    this$static.parity ^= pmove[i_0];
    switch (i_0) {
        case 0:
        case 1:
        case 2:
            swap(this$static.ud, 0, 1, 2, 3, i_0 % 3);
            break;
        case 3:
            swap(this$static.rl, 0, 1, 2, 3, 1);
            break;
        case 4:
        case 5:
        case 6:
            swap(this$static.fb, 0, 1, 2, 3, (i_0 - 1) % 3);
            break;
        case 7:
        case 8:
        case 9:
            swap(this$static.ud, 4, 5, 6, 7, (i_0 - 1) % 3);
            break;
        case 10:
            swap(this$static.rl, 4, 5, 6, 7, 1);
            break;
        case 11:
        case 12:
        case 13:
            swap(this$static.fb, 4, 5, 6, 7, (i_0 + 1) % 3);
            break;
        case 14:
            swap(this$static.ud, 0, 1, 2, 3, 1);
            swap(this$static.rl, 0, 5, 4, 1, 1);
            swap(this$static.fb, 0, 5, 4, 1, 1);
            break;
        case 15:
            swap(this$static.rl, 0, 1, 2, 3, 1);
            swap(this$static.fb, 1, 4, 7, 2, 1);
            swap(this$static.ud, 1, 6, 5, 2, 1);
            break;
        case 16:
            swap(this$static.fb, 0, 1, 2, 3, 1);
            swap(this$static.ud, 3, 2, 5, 4, 1);
            swap(this$static.rl, 0, 3, 6, 5, 1);
            break;
        case 17:
            swap(this$static.ud, 4, 5, 6, 7, 1);
            swap(this$static.rl, 3, 2, 7, 6, 1);
            swap(this$static.fb, 3, 2, 7, 6, 1);
            break;
        case 18:
            swap(this$static.rl, 4, 5, 6, 7, 1);
            swap(this$static.fb, 0, 3, 6, 5, 1);
            swap(this$static.ud, 0, 3, 4, 7, 1);
            break;
        case 19:
            swap(this$static.fb, 4, 5, 6, 7, 1);
            swap(this$static.ud, 0, 7, 6, 1, 1);
            swap(this$static.rl, 1, 4, 7, 2, 1);
    }
}
function $set_3(this$static, c, eXc_parity) {
    let i_0, parity;
    parity =
        +(c.ct[0] > c.ct[8]) ^ +(c.ct[8] > c.ct[16]) ^ +(c.ct[0] > c.ct[16])
            ? 1
            : 0;
    for (i_0 = 0; i_0 < 8; ++i_0) {
        this$static.ud[i_0] = (c.ct[i_0] & 1) ^ 1;
        this$static.fb[i_0] = (c.ct[i_0 + 8] & 1) ^ 1;
        this$static.rl[i_0] = (c.ct[i_0 + 16] & 1) ^ 1 ^ parity;
    }
    this$static.parity = parity ^ eXc_parity;
}
function $setct_0(this$static, idx) {
    let i_0, idxfb, idxrl, r;
    this$static.parity = idx & 1;
    idx >>>= 1;
    idxrl = rl2std[idx % 12];
    idx = ~~(idx / 12);
    r = 4;
    for (i_0 = 7; i_0 >= 0; --i_0) {
        this$static.rl[i_0] = 0;
        if (idxrl >= Cnk[i_0][r]) {
            idxrl -= Cnk[i_0][r--];
            this$static.rl[i_0] = 1;
        }
    }
    idxfb = idx % 35;
    idx = ~~(idx / 35);
    r = 4;
    this$static.fb[7] = 0;
    for (i_0 = 6; i_0 >= 0; --i_0) {
        if (idxfb >= Cnk[i_0][r]) {
            idxfb -= Cnk[i_0][r--];
            this$static.fb[i_0] = 1;
        }
        else {
            this$static.fb[i_0] = 0;
        }
    }
    r = 4;
    this$static.ud[7] = 0;
    for (i_0 = 6; i_0 >= 0; --i_0) {
        if (idx >= Cnk[i_0][r]) {
            idx -= Cnk[i_0][r--];
            this$static.ud[i_0] = 1;
        }
        else {
            this$static.ud[i_0] = 0;
        }
    }
}
function Center3_0() {
    this.ud = createArray(8);
    this.rl = createArray(8);
    this.fb = createArray(8);
}
function init_4() {
    let c, depth, done, i_0, m_0;
    for (i_0 = 0; i_0 < 12; ++i_0) {
        std2rl[rl2std[i_0]] = i_0;
    }
    c = new Center3_0();
    for (i_0 = 0; i_0 < 29400; ++i_0) {
        for (m_0 = 0; m_0 < 20; ++m_0) {
            $setct_0(c, i_0);
            $move_1(c, m_0);
            ctmove[i_0][m_0] = $getct_0(c) & 65535;
        }
    }
    fill_0(prun_0);
    prun_0[0] = 0;
    depth = 0;
    done = 1;
    while (done != 29400) {
        for (i_0 = 0; i_0 < 29400; ++i_0) {
            if (prun_0[i_0] != depth) {
                continue;
            }
            for (m_0 = 0; m_0 < 17; ++m_0) {
                if (prun_0[ctmove[i_0][m_0]] == -1) {
                    prun_0[ctmove[i_0][m_0]] = depth + 1;
                    ++done;
                }
            }
        }
        ++depth;
    }
}
defineSeed(155, 1, {}, Center3_0);
_$1.parity = 0;
let ctmove, pmove, prun_0, rl2std, std2rl;
function $copy_1(this$static, c) {
    let i_0;
    for (i_0 = 0; i_0 < 24; ++i_0) {
        this$static.ct[i_0] = c.ct[i_0];
    }
}
function $move_2(this$static, m_0) {
    let key;
    key = m_0 % 3;
    m_0 = ~~(m_0 / 3);
    switch (m_0) {
        case 0:
            swap(this$static.ct, 0, 1, 2, 3, key);
            break;
        case 1:
            swap(this$static.ct, 16, 17, 18, 19, key);
            break;
        case 2:
            swap(this$static.ct, 8, 9, 10, 11, key);
            break;
        case 3:
            swap(this$static.ct, 4, 5, 6, 7, key);
            break;
        case 4:
            swap(this$static.ct, 20, 21, 22, 23, key);
            break;
        case 5:
            swap(this$static.ct, 12, 13, 14, 15, key);
            break;
        case 6:
            swap(this$static.ct, 0, 1, 2, 3, key);
            swap(this$static.ct, 8, 20, 12, 16, key);
            swap(this$static.ct, 9, 21, 13, 17, key);
            break;
        case 7:
            swap(this$static.ct, 16, 17, 18, 19, key);
            swap(this$static.ct, 1, 15, 5, 9, key);
            swap(this$static.ct, 2, 12, 6, 10, key);
            break;
        case 8:
            swap(this$static.ct, 8, 9, 10, 11, key);
            swap(this$static.ct, 2, 19, 4, 21, key);
            swap(this$static.ct, 3, 16, 5, 22, key);
            break;
        case 9:
            swap(this$static.ct, 4, 5, 6, 7, key);
            swap(this$static.ct, 10, 18, 14, 22, key);
            swap(this$static.ct, 11, 19, 15, 23, key);
            break;
        case 10:
            swap(this$static.ct, 20, 21, 22, 23, key);
            swap(this$static.ct, 0, 8, 4, 14, key);
            swap(this$static.ct, 3, 11, 7, 13, key);
            break;
        case 11:
            swap(this$static.ct, 12, 13, 14, 15, key);
            swap(this$static.ct, 1, 20, 7, 18, key);
            swap(this$static.ct, 0, 23, 6, 17, key);
    }
}
function CenterCube_0() {
    let i_0;
    this.ct = createArray(24);
    for (i_0 = 0; i_0 < 24; ++i_0) {
        this.ct[i_0] = ~~(i_0 / 4);
    }
}
function CenterCube_1(r) {
    let i_0, m_0, t;
    CenterCube_0.call(this);
    for (i_0 = 0; i_0 < 23; ++i_0) {
        t = i_0 + rn(24 - i_0);
        if (this.ct[t] != this.ct[i_0]) {
            m_0 = this.ct[i_0];
            this.ct[i_0] = this.ct[t];
            this.ct[t] = m_0;
        }
    }
}
defineSeed(156, 1, {}, CenterCube_0, CenterCube_1);
let clinitCornerCubeRet = false;
function $clinit_CornerCube() {
    if (clinitCornerCubeRet) {
        return;
    }
    clinitCornerCubeRet = true;
    moveCube_0 = createArray(18);
    initMove_0();
}
function $$init_2(this$static) {
    this$static.cp = [0, 1, 2, 3, 4, 5, 6, 7];
    this$static.co = [0, 0, 0, 0, 0, 0, 0, 0];
}
function $copy_2(this$static, c) {
    let i_0;
    for (i_0 = 0; i_0 < 8; ++i_0) {
        this$static.cp[i_0] = c.cp[i_0];
        this$static.co[i_0] = c.co[i_0];
    }
}
function $move_3(this$static, idx) {
    !this$static.temps && (this$static.temps = new CornerCube_0());
    CornMult_0(this$static, moveCube_0[idx], this$static.temps);
    $copy_2(this$static, this$static.temps);
}
function $setTwist_0(this$static, idx) {
    let i_0, twst;
    twst = 0;
    for (i_0 = 6; i_0 >= 0; --i_0) {
        twst += this$static.co[i_0] = idx % 3;
        idx = ~~(idx / 3);
    }
    this$static.co[7] = (15 - twst) % 3;
}
function CornMult_0(a, b, prod) {
    let corn, ori, oriA, oriB;
    for (corn = 0; corn < 8; ++corn) {
        prod.cp[corn] = a.cp[b.cp[corn]];
        oriA = a.co[b.cp[corn]];
        oriB = b.co[corn];
        ori = oriA;
        ori = ori + (oriA < 3 ? oriB : 6 - oriB);
        ori = ori % 3;
        +(oriA >= 3) ^ +(oriB >= 3) && (ori = ori + 3);
        prod.co[corn] = ori;
    }
}
function CornerCube_0() {
    $$init_2(this);
}
function CornerCube_1(cperm, twist) {
    $$init_2(this);
    set8Perm(this.cp, cperm);
    $setTwist_0(this, twist);
}
function CornerCube_2(r) {
    CornerCube_1.call(this, rn(40320), rn(2187));
}
function initMove_0() {
    let a, p_0;
    moveCube_0[0] = new CornerCube_1(15120, 0);
    moveCube_0[3] = new CornerCube_1(21021, 1494);
    moveCube_0[6] = new CornerCube_1(8064, 1236);
    moveCube_0[9] = new CornerCube_1(9, 0);
    moveCube_0[12] = new CornerCube_1(1230, 412);
    moveCube_0[15] = new CornerCube_1(224, 137);
    for (a = 0; a < 18; a += 3) {
        for (p_0 = 0; p_0 < 2; ++p_0) {
            moveCube_0[a + p_0 + 1] = new CornerCube_0();
            CornMult_0(moveCube_0[a + p_0], moveCube_0[a], moveCube_0[a + p_0 + 1]);
        }
    }
}
defineSeed(157, 1, makeCastMap([Q$CornerCube]), CornerCube_0, CornerCube_1, CornerCube_2);
_$1.temps = null;
let moveCube_0;
let clinitEdge3Ret = false;
function $clinit_Edge3() {
    if (clinitEdge3Ret) {
        return;
    }
    clinitEdge3Ret = true;
    eprun = createArray(1937880);
    sym2raw_0 = createArray(1538);
    symstate = createArray(1538);
    raw2sym_1 = createArray(11880);
    syminv_0 = [0, 1, 6, 3, 4, 5, 2, 7];
    mvrot = createArray(160, 12);
    mvroto = createArray(160, 12);
    factX = [
        1, 1, 1, 3, 12, 60, 360, 2520, 20160, 181440, 1814400, 19958400, 239500800,
    ];
    FullEdgeMap = [0, 2, 4, 6, 1, 3, 7, 5, 8, 9, 10, 11];
}
function $circlex(this$static, a, b, c, d) {
    let temp;
    temp = this$static.edgeo[d];
    this$static.edgeo[d] = this$static.edge[c];
    this$static.edge[c] = this$static.edgeo[b];
    this$static.edgeo[b] = this$static.edge[a];
    this$static.edge[a] = temp;
}
function $get_2(this$static, end) {
    let i_0, idx, v, valh, vall;
    this$static.isStd || $std(this$static);
    idx = 0;
    vall = 1985229328;
    valh = 47768;
    for (i_0 = 0; i_0 < end; ++i_0) {
        v = this$static.edge[i_0] << 2;
        idx *= 12 - i_0;
        if (v >= 32) {
            idx += (valh >> (v - 32)) & 15;
            valh -= 4368 << (v - 32);
        }
        else {
            idx += (vall >> v) & 15;
            valh -= 4369;
            vall -= 286331152 << v;
        }
    }
    return idx;
}
function $getsym_0(this$static) {
    let cord1x, cord2x, symcord1x, symx;
    cord1x = $get_2(this$static, 4);
    symcord1x = raw2sym_1[cord1x];
    symx = symcord1x & 7;
    symcord1x >>= 3;
    $rotate_0(this$static, symx);
    cord2x = $get_2(this$static, 10) % 20160;
    return symcord1x * 20160 + cord2x;
}
function $move_4(this$static, i_0) {
    this$static.isStd = false;
    switch (i_0) {
        case 0:
            circle$1(this$static.edge, 0, 4, 1, 5);
            circle$1(this$static.edgeo, 0, 4, 1, 5);
            break;
        case 1:
            $swap_0(this$static.edge, 0, 4, 1, 5);
            $swap_0(this$static.edgeo, 0, 4, 1, 5);
            break;
        case 2:
            circle$1(this$static.edge, 0, 5, 1, 4);
            circle$1(this$static.edgeo, 0, 5, 1, 4);
            break;
        case 3:
            $swap_0(this$static.edge, 5, 10, 6, 11);
            $swap_0(this$static.edgeo, 5, 10, 6, 11);
            break;
        case 4:
            circle$1(this$static.edge, 0, 11, 3, 8);
            circle$1(this$static.edgeo, 0, 11, 3, 8);
            break;
        case 5:
            $swap_0(this$static.edge, 0, 11, 3, 8);
            $swap_0(this$static.edgeo, 0, 11, 3, 8);
            break;
        case 6:
            circle$1(this$static.edge, 0, 8, 3, 11);
            circle$1(this$static.edgeo, 0, 8, 3, 11);
            break;
        case 7:
            circle$1(this$static.edge, 2, 7, 3, 6);
            circle$1(this$static.edgeo, 2, 7, 3, 6);
            break;
        case 8:
            $swap_0(this$static.edge, 2, 7, 3, 6);
            $swap_0(this$static.edgeo, 2, 7, 3, 6);
            break;
        case 9:
            circle$1(this$static.edge, 2, 6, 3, 7);
            circle$1(this$static.edgeo, 2, 6, 3, 7);
            break;
        case 10:
            $swap_0(this$static.edge, 4, 8, 7, 9);
            $swap_0(this$static.edgeo, 4, 8, 7, 9);
            break;
        case 11:
            circle$1(this$static.edge, 1, 9, 2, 10);
            circle$1(this$static.edgeo, 1, 9, 2, 10);
            break;
        case 12:
            $swap_0(this$static.edge, 1, 9, 2, 10);
            $swap_0(this$static.edgeo, 1, 9, 2, 10);
            break;
        case 13:
            circle$1(this$static.edge, 1, 10, 2, 9);
            circle$1(this$static.edgeo, 1, 10, 2, 9);
            break;
        case 14:
            $swap_0(this$static.edge, 0, 4, 1, 5);
            $swap_0(this$static.edgeo, 0, 4, 1, 5);
            circle$1(this$static.edge, 9, 11);
            circle$1(this$static.edgeo, 8, 10);
            break;
        case 15:
            $swap_0(this$static.edge, 5, 10, 6, 11);
            $swap_0(this$static.edgeo, 5, 10, 6, 11);
            circle$1(this$static.edge, 1, 3);
            circle$1(this$static.edgeo, 0, 2);
            break;
        case 16:
            $swap_0(this$static.edge, 0, 11, 3, 8);
            $swap_0(this$static.edgeo, 0, 11, 3, 8);
            circle$1(this$static.edge, 5, 7);
            circle$1(this$static.edgeo, 4, 6);
            break;
        case 17:
            $swap_0(this$static.edge, 2, 7, 3, 6);
            $swap_0(this$static.edgeo, 2, 7, 3, 6);
            circle$1(this$static.edge, 8, 10);
            circle$1(this$static.edgeo, 9, 11);
            break;
        case 18:
            $swap_0(this$static.edge, 4, 8, 7, 9);
            $swap_0(this$static.edgeo, 4, 8, 7, 9);
            circle$1(this$static.edge, 0, 2);
            circle$1(this$static.edgeo, 1, 3);
            break;
        case 19:
            $swap_0(this$static.edge, 1, 9, 2, 10);
            $swap_0(this$static.edgeo, 1, 9, 2, 10);
            circle$1(this$static.edge, 4, 6);
            circle$1(this$static.edgeo, 5, 7);
    }
}
function $rot_1(this$static, r) {
    this$static.isStd = false;
    switch (r) {
        case 0:
            $move_4(this$static, 14);
            $move_4(this$static, 17);
            break;
        case 1:
            $circlex(this$static, 11, 5, 10, 6);
            $circlex(this$static, 5, 10, 6, 11);
            $circlex(this$static, 1, 2, 3, 0);
            $circlex(this$static, 4, 9, 7, 8);
            $circlex(this$static, 8, 4, 9, 7);
            $circlex(this$static, 0, 1, 2, 3);
            break;
        case 2:
            $swapx(this$static, 4, 5);
            $swapx(this$static, 5, 4);
            $swapx(this$static, 11, 8);
            $swapx(this$static, 8, 11);
            $swapx(this$static, 7, 6);
            $swapx(this$static, 6, 7);
            $swapx(this$static, 9, 10);
            $swapx(this$static, 10, 9);
            $swapx(this$static, 1, 1);
            $swapx(this$static, 0, 0);
            $swapx(this$static, 3, 3);
            $swapx(this$static, 2, 2);
    }
}
function $rotate_0(this$static, r) {
    while (r >= 2) {
        r -= 2;
        $rot_1(this$static, 1);
        $rot_1(this$static, 2);
    }
    r != 0 && $rot_1(this$static, 0);
}
function $set_4(this$static, idx) {
    let i_0, p_0, parity, v, vall, valh;
    vall = 0x76543210;
    valh = 0xba98;
    parity = 0;
    for (i_0 = 0; i_0 < 11; ++i_0) {
        p_0 = factX[11 - i_0];
        v = ~~(idx / p_0);
        idx = idx % p_0;
        parity ^= v;
        v <<= 2;
        if (v >= 32) {
            v = v - 32;
            this$static.edge[i_0] = (valh >> v) & 15;
            const m = (1 << v) - 1;
            valh = (valh & m) + ((valh >> 4) & ~m);
        }
        else {
            this$static.edge[i_0] = (vall >> v) & 15;
            const m = (1 << v) - 1;
            vall = (vall & m) + ((vall >>> 4) & ~m) + (valh << 28);
            valh = valh >> 4;
        }
    }
    if ((parity & 1) == 0) {
        this$static.edge[11] = vall;
    }
    else {
        this$static.edge[11] = this$static.edge[10];
        this$static.edge[10] = vall;
    }
    for (i_0 = 0; i_0 < 12; ++i_0) {
        this$static.edgeo[i_0] = i_0;
    }
    this$static.isStd = true;
}
function $set_5(this$static, e) {
    let i_0;
    for (i_0 = 0; i_0 < 12; ++i_0) {
        this$static.edge[i_0] = e.edge[i_0];
        this$static.edgeo[i_0] = e.edgeo[i_0];
    }
    this$static.isStd = e.isStd;
}
function $set_6(this$static, c) {
    let i_0, parity, s, t;
    this$static.temp == null && (this$static.temp = createArray(12));
    for (i_0 = 0; i_0 < 12; ++i_0) {
        this$static.temp[i_0] = i_0;
        this$static.edge[i_0] = c.ep[FullEdgeMap[i_0] + 12] % 12;
    }
    parity = 1;
    for (i_0 = 0; i_0 < 12; ++i_0) {
        while (this$static.edge[i_0] != i_0) {
            t = this$static.edge[i_0];
            this$static.edge[i_0] = this$static.edge[t];
            this$static.edge[t] = t;
            s = this$static.temp[i_0];
            this$static.temp[i_0] = this$static.temp[t];
            this$static.temp[t] = s;
            parity ^= 1;
        }
    }
    for (i_0 = 0; i_0 < 12; ++i_0) {
        this$static.edge[i_0] = this$static.temp[c.ep[FullEdgeMap[i_0]] % 12];
    }
    return parity;
}
function $std(this$static) {
    let i_0;
    this$static.temp == null && (this$static.temp = createArray(12));
    for (i_0 = 0; i_0 < 12; ++i_0) {
        this$static.temp[this$static.edgeo[i_0]] = i_0;
    }
    for (i_0 = 0; i_0 < 12; ++i_0) {
        this$static.edge[i_0] = this$static.temp[this$static.edge[i_0]];
        this$static.edgeo[i_0] = i_0;
    }
    this$static.isStd = true;
}
function $swap_0(arr, a, b, c, d) {
    let temp;
    temp = arr[a];
    arr[a] = arr[c];
    arr[c] = temp;
    temp = arr[b];
    arr[b] = arr[d];
    arr[d] = temp;
}
function $swapx(this$static, x, y) {
    let temp;
    temp = this$static.edge[x];
    this$static.edge[x] = this$static.edgeo[y];
    this$static.edgeo[y] = temp;
}
function Edge3_0() {
    this.edge = createArray(12);
    this.edgeo = createArray(12);
}
function createPrun_0() {
    let chk, cord1, cord1x, cord2, cord2x, dep1m3, depm3, depth, e, end, f, find_0, g, i_0, i_, idx, idxx, inv, j, m_0, symState, symcord1, symcord1x, symx, val;
    e = new Edge3_0();
    f = new Edge3_0();
    g = new Edge3_0();
    fill_0(eprun);
    depth = 0;
    done_0 = 1;
    setPruning_0(eprun, 0, 0);
    // let start = +new Date;
    while (done_0 != 31006080) {
        inv = depth > 9;
        depm3 = depth % 3;
        dep1m3 = (depth + 1) % 3;
        find_0 = inv ? 3 : depm3;
        chk = inv ? depm3 : 3;
        if (depth >= 9) {
            break;
        }
        for (i_ = 0; i_ < 31006080; i_ += 16) {
            val = eprun[~~i_ >> 4];
            if (!inv && val == -1) {
                continue;
            }
            for (i_0 = i_, end = i_ + 16; i_0 < end; ++i_0, val >>= 2) {
                if ((val & 3) != find_0) {
                    continue;
                }
                symcord1 = ~~(i_0 / 20160);
                cord1 = sym2raw_0[symcord1];
                cord2 = i_0 % 20160;
                $set_4(e, cord1 * 20160 + cord2);
                for (m_0 = 0; m_0 < 17; ++m_0) {
                    cord1x = getmvrot(e.edge, m_0 << 3, 4);
                    symcord1x = raw2sym_1[cord1x];
                    symx = symcord1x & 7;
                    symcord1x >>= 3;
                    cord2x = getmvrot(e.edge, (m_0 << 3) | symx, 10) % 20160;
                    idx = symcord1x * 20160 + cord2x;
                    if (getPruning_0(eprun, idx) != chk) {
                        continue;
                    }
                    setPruning_0(eprun, inv ? i_0 : idx, dep1m3);
                    ++done_0;
                    if (inv) {
                        break;
                    }
                    symState = symstate[symcord1x];
                    if (symState == 1) {
                        continue;
                    }
                    $set_5(f, e);
                    $move_4(f, m_0);
                    $rotate_0(f, symx);
                    for (j = 1; (symState = (~~symState >> 1) & 65535) != 0; ++j) {
                        if ((symState & 1) != 1) {
                            continue;
                        }
                        $set_5(g, f);
                        $rotate_0(g, j);
                        idxx = symcord1x * 20160 + ($get_2(g, 10) % 20160);
                        if (getPruning_0(eprun, idxx) == chk) {
                            setPruning_0(eprun, idxx, dep1m3);
                            ++done_0;
                        }
                    }
                }
            }
        }
        ++depth;
    }
}
function getPruning_0(table, index) {
    return (table[index >> 4] >> ((index & 15) << 1)) & 3;
}
function getmvrot(ep, mrIdx, end) {
    let i_0, idx, mov, movo, v, valh, vall;
    movo = mvroto[mrIdx];
    mov = mvrot[mrIdx];
    idx = 0;
    vall = 1985229328;
    valh = 47768;
    for (i_0 = 0; i_0 < end; ++i_0) {
        v = movo[ep[mov[i_0]]] << 2;
        idx *= 12 - i_0;
        if (v >= 32) {
            idx += (valh >> (v - 32)) & 15;
            valh -= 4368 << (v - 32);
        }
        else {
            idx += (vall >> v) & 15;
            valh -= 4369;
            vall -= 286331152 << v;
        }
    }
    return idx;
}
function getprun(edge) {
    let cord1, cord1x, cord2, cord2x, depm3, depth, e, idx, m_0, symcord1, symcord1x, symx;
    e = new Edge3_0();
    depth = 0;
    depm3 = getPruning_0(eprun, edge);
    if (depm3 == 3) {
        return 10;
    }
    while (edge != 0) {
        depm3 == 0 ? (depm3 = 2) : --depm3;
        symcord1 = ~~(edge / 20160);
        cord1 = sym2raw_0[symcord1];
        cord2 = edge % 20160;
        $set_4(e, cord1 * 20160 + cord2);
        for (m_0 = 0; m_0 < 17; ++m_0) {
            cord1x = getmvrot(e.edge, m_0 << 3, 4);
            symcord1x = raw2sym_1[cord1x];
            symx = symcord1x & 7;
            symcord1x >>= 3;
            cord2x = getmvrot(e.edge, (m_0 << 3) | symx, 10) % 20160;
            idx = symcord1x * 20160 + cord2x;
            if (getPruning_0(eprun, idx) == depm3) {
                ++depth;
                edge = idx;
                break;
            }
        }
    }
    return depth;
}
function getprun_0(edge, prun) {
    let depm3;
    depm3 = getPruning_0(eprun, edge);
    if (depm3 == 3) {
        return 10;
    }
    return (((0x49249249 << depm3) >> prun) & 3) + prun - 1;
    // (depm3 - prun + 16) % 3 + prun - 1;
}
function initMvrot() {
    let e, i_0, m_0, r;
    e = new Edge3_0();
    for (m_0 = 0; m_0 < 20; ++m_0) {
        for (r = 0; r < 8; ++r) {
            $set_4(e, 0);
            $move_4(e, m_0);
            $rotate_0(e, r);
            for (i_0 = 0; i_0 < 12; ++i_0) {
                mvrot[(m_0 << 3) | r][i_0] = e.edge[i_0];
            }
            $std(e);
            for (i_0 = 0; i_0 < 12; ++i_0) {
                mvroto[(m_0 << 3) | r][i_0] = e.temp[i_0];
            }
        }
    }
}
function initRaw2Sym() {
    let count, e, i_0, idx, j, occ;
    e = new Edge3_0();
    occ = createArray(1485);
    for (i_0 = 0; i_0 < 1485; i_0++) {
        occ[i_0] = 0;
    }
    count = 0;
    for (i_0 = 0; i_0 < 11880; ++i_0) {
        if ((occ[~~i_0 >>> 3] & (1 << (i_0 & 7))) == 0) {
            $set_4(e, i_0 * factX[8]);
            for (j = 0; j < 8; ++j) {
                idx = $get_2(e, 4);
                idx == i_0 && (symstate[count] = (symstate[count] | (1 << j)) & 65535);
                occ[~~idx >> 3] = occ[~~idx >> 3] | (1 << (idx & 7));
                raw2sym_1[idx] = (count << 3) | syminv_0[j];
                $rot_1(e, 0);
                if (j % 2 == 1) {
                    $rot_1(e, 1);
                    $rot_1(e, 2);
                }
            }
            sym2raw_0[count++] = i_0;
        }
    }
}
function setPruning_0(table, index, value) {
    table[index >> 4] ^= (3 ^ value) << ((index & 15) << 1);
}
defineSeed(158, 1, makeCastMap([Q$Edge3]), Edge3_0);
_$1.isStd = true;
_$1.temp = null;
let FullEdgeMap, done_0 = 0, eprun, factX, mvrot, mvroto, raw2sym_1, sym2raw_0, syminv_0, symstate;
function $checkEdge(this$static) {
    let ck, i_0, parity;
    ck = 0;
    parity = false;
    for (i_0 = 0; i_0 < 12; ++i_0) {
        ck |= 1 << this$static.ep[i_0];
        parity = parity != this$static.ep[i_0] >= 12;
    }
    ck &= ~~ck >> 12;
    return ck == 0 && !parity;
}
function $copy_3(this$static, c) {
    let i_0;
    for (i_0 = 0; i_0 < 24; ++i_0) {
        this$static.ep[i_0] = c.ep[i_0];
    }
}
function $move_5(this$static, m_0) {
    let key;
    key = m_0 % 3;
    m_0 = ~~(m_0 / 3);
    switch (m_0) {
        case 0:
            swap(this$static.ep, 0, 1, 2, 3, key);
            swap(this$static.ep, 12, 13, 14, 15, key);
            break;
        case 1:
            swap(this$static.ep, 11, 15, 10, 19, key);
            swap(this$static.ep, 23, 3, 22, 7, key);
            break;
        case 2:
            swap(this$static.ep, 0, 11, 6, 8, key);
            swap(this$static.ep, 12, 23, 18, 20, key);
            break;
        case 3:
            swap(this$static.ep, 4, 5, 6, 7, key);
            swap(this$static.ep, 16, 17, 18, 19, key);
            break;
        case 4:
            swap(this$static.ep, 1, 20, 5, 21, key);
            swap(this$static.ep, 13, 8, 17, 9, key);
            break;
        case 5:
            swap(this$static.ep, 2, 9, 4, 10, key);
            swap(this$static.ep, 14, 21, 16, 22, key);
            break;
        case 6:
            swap(this$static.ep, 0, 1, 2, 3, key);
            swap(this$static.ep, 12, 13, 14, 15, key);
            swap(this$static.ep, 9, 22, 11, 20, key);
            break;
        case 7:
            swap(this$static.ep, 11, 15, 10, 19, key);
            swap(this$static.ep, 23, 3, 22, 7, key);
            swap(this$static.ep, 2, 16, 6, 12, key);
            break;
        case 8:
            swap(this$static.ep, 0, 11, 6, 8, key);
            swap(this$static.ep, 12, 23, 18, 20, key);
            swap(this$static.ep, 3, 19, 5, 13, key);
            break;
        case 9:
            swap(this$static.ep, 4, 5, 6, 7, key);
            swap(this$static.ep, 16, 17, 18, 19, key);
            swap(this$static.ep, 8, 23, 10, 21, key);
            break;
        case 10:
            swap(this$static.ep, 1, 20, 5, 21, key);
            swap(this$static.ep, 13, 8, 17, 9, key);
            swap(this$static.ep, 14, 0, 18, 4, key);
            break;
        case 11:
            swap(this$static.ep, 2, 9, 4, 10, key);
            swap(this$static.ep, 14, 21, 16, 22, key);
            swap(this$static.ep, 7, 15, 1, 17, key);
    }
}
function EdgeCube_0() {
    let i_0;
    this.ep = createArray(24);
    for (i_0 = 0; i_0 < 24; ++i_0) {
        this.ep[i_0] = i_0;
    }
}
function EdgeCube_1(r) {
    let i_0, m_0, t;
    EdgeCube_0.call(this);
    for (i_0 = 0; i_0 < 23; ++i_0) {
        t = i_0 + rn(24 - i_0);
        if (t != i_0) {
            m_0 = this.ep[i_0];
            this.ep[i_0] = this.ep[t];
            this.ep[t] = m_0;
        }
    }
}
defineSeed(159, 1, {}, EdgeCube_0, EdgeCube_1);
let clinitFullCubeRet = false;
function $clinit_FullCube_0() {
    if (clinitFullCubeRet) {
        return;
    }
    clinitFullCubeRet = true;
    move2rot = [35, 1, 34, 2, 4, 6, 22, 5, 19];
}
function $$init_3(this$static) {
    this$static.moveBuffer = createArray(60);
}
function $compareTo_1(this$static, c) {
    return this$static.value - c.value;
}
function $copy_4(this$static, c) {
    let i_0;
    $copy_3(this$static.edge, c.edge);
    $copy_1(this$static.center, c.center);
    $copy_2(this$static.corner, c.corner);
    this$static.value = c.value;
    this$static.add1 = c.add1;
    this$static.length1 = c.length1;
    this$static.length2 = c.length2;
    this$static.length3 = c.length3;
    this$static.sym = c.sym;
    for (i_0 = 0; i_0 < 60; ++i_0) {
        this$static.moveBuffer[i_0] = c.moveBuffer[i_0];
    }
    this$static.moveLength = c.moveLength;
    this$static.edgeAvail = c.edgeAvail;
    this$static.centerAvail = c.centerAvail;
    this$static.cornerAvail = c.cornerAvail;
}
function $getCenter(this$static) {
    while (this$static.centerAvail < this$static.moveLength) {
        $move_2(this$static.center, this$static.moveBuffer[this$static.centerAvail++]);
    }
    return this$static.center;
}
function $getCorner(this$static) {
    while (this$static.cornerAvail < this$static.moveLength) {
        $move_3(this$static.corner, this$static.moveBuffer[this$static.cornerAvail++] % 18);
    }
    return this$static.corner;
}
function $getEdge(this$static) {
    while (this$static.edgeAvail < this$static.moveLength) {
        $move_5(this$static.edge, this$static.moveBuffer[this$static.edgeAvail++]);
    }
    return this$static.edge;
}
function $getMoveString(this$static) {
    let finishSym, fixedMoves, i_0, idx, move, rot, sb, sym;
    fixedMoves = newArr(this$static.moveLength - (this$static.add1 ? 2 : 0));
    idx = 0;
    for (i_0 = 0; i_0 < this$static.length1; ++i_0) {
        fixedMoves[idx++] = this$static.moveBuffer[i_0];
    }
    sym = this$static.sym;
    for (i_0 = this$static.length1 + (this$static.add1 ? 2 : 0); i_0 < this$static.moveLength; ++i_0) {
        if (symmove[sym][this$static.moveBuffer[i_0]] >= 27) {
            fixedMoves[idx++] = symmove[sym][this$static.moveBuffer[i_0]] - 9;
            rot = move2rot[symmove[sym][this$static.moveBuffer[i_0]] - 27];
            sym = symmult[sym][rot];
        }
        else {
            fixedMoves[idx++] = symmove[sym][this$static.moveBuffer[i_0]];
        }
    }
    finishSym = symmult[syminv[sym]][getSolvedSym($getCenter(this$static))];
    sb = "";
    sym = finishSym;
    for (i_0 = idx - 1; i_0 >= 0; --i_0) {
        move = fixedMoves[i_0];
        move = ~~(move / 3) * 3 + (2 - (move % 3));
        if (symmove[sym][move] >= 27) {
            sb = sb + move2str_1[symmove[sym][move] - 9] + " ";
            rot = move2rot[symmove[sym][move] - 27];
            sym = symmult[sym][rot];
        }
        else {
            sb = sb + move2str_1[symmove[sym][move]] + " ";
        }
    }
    return sb;
}
function $move_6(this$static, m_0) {
    this$static.moveBuffer[this$static.moveLength++] = m_0;
    return;
}
function FullCube_3() {
    $$init_3(this);
    this.edge = new EdgeCube_0();
    this.center = new CenterCube_0();
    this.corner = new CornerCube_0();
}
function FullCube_4(c) {
    FullCube_3.call(this);
    $copy_4(this, c);
}
function FullCube_5(r) {
    $$init_3(this);
    this.edge = new EdgeCube_1();
    this.center = new CenterCube_1();
    this.corner = new CornerCube_2();
}
defineSeed(160, 1, makeCastMap([Q$FullCube_0, Q$Comparable]), FullCube_3, FullCube_4, FullCube_5);
_$1.compareTo$ = function compareTo_1(c) {
    return $compareTo_1(this, c);
};
_$1.add1 = false;
_$1.center = null;
_$1.centerAvail = 0;
_$1.corner = null;
_$1.cornerAvail = 0;
_$1.edge = null;
_$1.edgeAvail = 0;
_$1.length1 = 0;
_$1.length2 = 0;
_$1.length3 = 0;
_$1.moveLength = 0;
_$1.sym = 0;
_$1.value = 0;
let move2rot;
function $compare(c1, c2) {
    return c2.value - c1.value;
}
function $compare_0(c1, c2) {
    return $compare(c1, c2);
}
function FullCube$ValueComparator_0() { }
defineSeed(161, 1, {}, FullCube$ValueComparator_0);
_$1.compare = function compare(c1, c2) {
    return $compare_0(c1, c2);
};
let clinitMovesRet = false;
function $clinit_Moves() {
    if (clinitMovesRet) {
        return;
    }
    clinitMovesRet = true;
    let i_0, j;
    move2str_1 = [
        "U  ",
        "U2 ",
        "U' ",
        "R  ",
        "R2 ",
        "R' ",
        "F  ",
        "F2 ",
        "F' ",
        "D  ",
        "D2 ",
        "D' ",
        "L  ",
        "L2 ",
        "L' ",
        "B  ",
        "B2 ",
        "B' ",
        "Uw ",
        "Uw2",
        "Uw'",
        "Rw ",
        "Rw2",
        "Rw'",
        "Fw ",
        "Fw2",
        "Fw'",
        "Dw ",
        "Dw2",
        "Dw'",
        "Lw ",
        "Lw2",
        "Lw'",
        "Bw ",
        "Bw2",
        "Bw'",
    ];
    move2std = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 22,
        23, 25, 28, 30, 31, 32, 34, 36,
    ];
    move3std = [
        0, 1, 2, 4, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17, 19, 22, 25, 28, 31, 34, 36,
    ];
    std2move = createArray(37);
    std3move = createArray(37);
    ckmv$1 = createArray(37, 36);
    ckmv2_0 = createArray(29, 28);
    ckmv3 = createArray(21, 20);
    skipAxis = createArray(36);
    skipAxis2 = createArray(28);
    skipAxis3 = createArray(20);
    for (i_0 = 0; i_0 < 29; ++i_0) {
        std2move[move2std[i_0]] = i_0;
    }
    for (i_0 = 0; i_0 < 21; ++i_0) {
        std3move[move3std[i_0]] = i_0;
    }
    for (i_0 = 0; i_0 < 36; ++i_0) {
        for (j = 0; j < 36; ++j) {
            ckmv$1[i_0][j] =
                ~~(i_0 / 3) == ~~(j / 3) ||
                    (~~(i_0 / 3) % 3 == ~~(j / 3) % 3 && i_0 > j);
        }
        ckmv$1[36][i_0] = false;
    }
    for (i_0 = 0; i_0 < 29; ++i_0) {
        for (j = 0; j < 28; ++j) {
            ckmv2_0[i_0][j] = ckmv$1[move2std[i_0]][move2std[j]];
        }
    }
    for (i_0 = 0; i_0 < 21; ++i_0) {
        for (j = 0; j < 20; ++j) {
            ckmv3[i_0][j] = ckmv$1[move3std[i_0]][move3std[j]];
        }
    }
    for (i_0 = 0; i_0 < 36; ++i_0) {
        skipAxis[i_0] = 36;
        for (j = i_0; j < 36; ++j) {
            if (!ckmv$1[i_0][j]) {
                skipAxis[i_0] = j - 1;
                break;
            }
        }
    }
    for (i_0 = 0; i_0 < 28; ++i_0) {
        skipAxis2[i_0] = 28;
        for (j = i_0; j < 28; ++j) {
            if (!ckmv2_0[i_0][j]) {
                skipAxis2[i_0] = j - 1;
                break;
            }
        }
    }
    for (i_0 = 0; i_0 < 20; ++i_0) {
        skipAxis3[i_0] = 20;
        for (j = i_0; j < 20; ++j) {
            if (!ckmv3[i_0][j]) {
                skipAxis3[i_0] = j - 1;
                break;
            }
        }
    }
}
let ckmv$1, ckmv2_0, ckmv3, move2std, move2str_1, move3std, skipAxis, skipAxis2, skipAxis3, std2move, std3move;
function $doSearch(this$static) {
    let MAX_LENGTH2, MAX_LENGTH3, ct, edge, eparity, fb, fbprun, i_0, index, length_0, length12, length123, p1SolsArr, prun, rl, rlprun, s2ct, s2rl, solcube, ud, udprun;
    this$static.solution = "";
    ud = $getsym(new Center1_1($getCenter(this$static.c), 0));
    fb = $getsym(new Center1_1($getCenter(this$static.c), 1));
    rl = $getsym(new Center1_1($getCenter(this$static.c), 2));
    udprun = csprun[~~ud >> 6];
    fbprun = csprun[~~fb >> 6];
    rlprun = csprun[~~rl >> 6];
    this$static.p1SolsCnt = 0;
    this$static.arr2idx = 0;
    $clear(this$static.p1sols.heap);
    for (this$static.length1 =
        (udprun < fbprun ? udprun : fbprun) < rlprun
            ? udprun < fbprun
                ? udprun
                : fbprun
            : rlprun; this$static.length1 < 100; ++this$static.length1) {
        if ((rlprun <= this$static.length1 &&
            $search1(this$static, ~~rl >>> 6, rl & 63, this$static.length1, -1, 0)) ||
            (udprun <= this$static.length1 &&
                $search1(this$static, ~~ud >>> 6, ud & 63, this$static.length1, -1, 0)) ||
            (fbprun <= this$static.length1 &&
                $search1(this$static, ~~fb >>> 6, fb & 63, this$static.length1, -1, 0))) {
            break;
        }
    }
    p1SolsArr = $toArray_1(this$static.p1sols, initDim(_3Lcs_threephase_FullCube_2_classLit, makeCastMap([Q$FullCube_$1, Q$Serializable, Q$Object_$1]), Q$FullCube_0, 0, 0));
    p1SolsArr.sort(function (a, b) {
        return a.value - b.value;
    });
    MAX_LENGTH2 = 9;
    do {
        OUT: for (length12 = p1SolsArr[0].value; length12 < 100; ++length12) {
            for (i_0 = 0; i_0 < p1SolsArr.length; ++i_0) {
                if (p1SolsArr[i_0].value > length12) {
                    break;
                }
                if (length12 - p1SolsArr[i_0].length1 > MAX_LENGTH2) {
                    continue;
                }
                $copy_4(this$static.c1, p1SolsArr[i_0]);
                $set_2(this$static.ct2, $getCenter(this$static.c1), parity_0($getEdge(this$static.c1).ep));
                s2ct = $getct(this$static.ct2);
                s2rl = $getrl(this$static.ct2);
                this$static.length1 = p1SolsArr[i_0].length1;
                this$static.length2 = length12 - p1SolsArr[i_0].length1;
                if ($search2(this$static, s2ct, s2rl, this$static.length2, 28, 0)) {
                    break OUT;
                }
            }
        }
        ++MAX_LENGTH2;
    } while (length12 == 100);
    this$static.arr2.sort(function (a, b) {
        return a.value - b.value;
    });
    index = 0;
    MAX_LENGTH3 = 13;
    do {
        OUT2: for (length123 = this$static.arr2[0].value; length123 < 100; ++length123) {
            for (i_0 = 0; i_0 < Math.min(this$static.arr2idx, 100); ++i_0) {
                if (this$static.arr2[i_0].value > length123) {
                    break;
                }
                if (length123 -
                    this$static.arr2[i_0].length1 -
                    this$static.arr2[i_0].length2 >
                    MAX_LENGTH3) {
                    continue;
                }
                eparity = $set_6(this$static.e12, $getEdge(this$static.arr2[i_0]));
                $set_3(this$static.ct3, $getCenter(this$static.arr2[i_0]), eparity ^ parity_0($getCorner(this$static.arr2[i_0]).cp));
                ct = $getct_0(this$static.ct3);
                edge = $get_2(this$static.e12, 10);
                prun = getprun($getsym_0(this$static.e12));
                if (prun <=
                    length123 -
                        this$static.arr2[i_0].length1 -
                        this$static.arr2[i_0].length2 &&
                    $search3(this$static, edge, ct, prun, length123 -
                        this$static.arr2[i_0].length1 -
                        this$static.arr2[i_0].length2, 20, 0)) {
                    index = i_0;
                    break OUT2;
                }
            }
        }
        ++MAX_LENGTH3;
    } while (length123 == 100);
    solcube = new FullCube_4(this$static.arr2[index]);
    this$static.length1 = solcube.length1;
    this$static.length2 = solcube.length2;
    length_0 = length123 - this$static.length1 - this$static.length2;
    for (i_0 = 0; i_0 < length_0; ++i_0) {
        $move_6(solcube, move3std[this$static.move3[i_0]]);
    }
    this$static.solution = $getMoveString(solcube);
}
function $init2_0(this$static, sym) {
    let ctp, i_0, next, s2ct, s2rl;
    $copy_4(this$static.c1, this$static.c);
    for (i_0 = 0; i_0 < this$static.length1; ++i_0) {
        $move_6(this$static.c1, this$static.move1[i_0]);
    }
    switch (finish_0[sym]) {
        case 0:
            $move_6(this$static.c1, 24);
            $move_6(this$static.c1, 35);
            this$static.move1[this$static.length1] = 24;
            this$static.move1[this$static.length1 + 1] = 35;
            this$static.add1 = true;
            sym = 19;
            break;
        case 12869:
            $move_6(this$static.c1, 18);
            $move_6(this$static.c1, 29);
            this$static.move1[this$static.length1] = 18;
            this$static.move1[this$static.length1 + 1] = 29;
            this$static.add1 = true;
            sym = 34;
            break;
        case 735470:
            this$static.add1 = false;
            sym = 0;
    }
    $set_2(this$static.ct2, $getCenter(this$static.c1), parity_0($getEdge(this$static.c1).ep));
    s2ct = $getct(this$static.ct2);
    s2rl = $getrl(this$static.ct2);
    ctp = ctprun[s2ct * 70 + s2rl];
    this$static.c1.value = ctp + this$static.length1;
    this$static.c1.length1 = this$static.length1;
    this$static.c1.add1 = this$static.add1;
    this$static.c1.sym = sym;
    ++this$static.p1SolsCnt;
    if (this$static.p1sols.heap.size < 500) {
        next = new FullCube_4(this$static.c1);
    }
    else {
        next = $poll(this$static.p1sols);
        next.value > this$static.c1.value && $copy_4(next, this$static.c1);
    }
    $add(this$static.p1sols, next);
    return this$static.p1SolsCnt == 10000;
}
function $init3(this$static) {
    let ct, eparity, i_0, prun;
    $copy_4(this$static.c2, this$static.c1);
    for (i_0 = 0; i_0 < this$static.length2; ++i_0) {
        $move_6(this$static.c2, this$static.move2[i_0]);
    }
    if (!$checkEdge($getEdge(this$static.c2))) {
        return false;
    }
    eparity = $set_6(this$static.e12, $getEdge(this$static.c2));
    $set_3(this$static.ct3, $getCenter(this$static.c2), eparity ^ parity_0($getCorner(this$static.c2).cp));
    ct = $getct_0(this$static.ct3);
    $get_2(this$static.e12, 10);
    prun = getprun($getsym_0(this$static.e12));
    !this$static.arr2[this$static.arr2idx]
        ? (this$static.arr2[this$static.arr2idx] = new FullCube_4(this$static.c2))
        : $copy_4(this$static.arr2[this$static.arr2idx], this$static.c2);
    this$static.arr2[this$static.arr2idx].value =
        this$static.length1 + this$static.length2 + Math.max(prun, prun_0[ct]);
    this$static.arr2[this$static.arr2idx].length2 = this$static.length2;
    ++this$static.arr2idx;
    return this$static.arr2idx == this$static.arr2.length;
}
function $randomState(this$static, r) {
    init_5();
    this$static.c = new FullCube_5();
    $doSearch(this$static);
    return this$static.solution;
}
function $search1(this$static, ct, sym, maxl, lm, depth) {
    let axis, ctx, m_0, power, prun, symx;
    if (ct == 0) {
        return maxl == 0 && $init2_0(this$static, sym);
    }
    for (axis = 0; axis < 27; axis += 3) {
        if (axis == lm || axis == lm - 9 || axis == lm - 18) {
            continue;
        }
        for (power = 0; power < 3; ++power) {
            m_0 = axis + power;
            ctx = ctsmv[ct][symmove[sym][m_0]];
            prun = csprun[~~ctx >>> 6];
            if (prun >= maxl) {
                if (prun > maxl) {
                    break;
                }
                continue;
            }
            symx = symmult[sym][ctx & 63];
            ctx >>>= 6;
            this$static.move1[depth] = m_0;
            if ($search1(this$static, ctx, symx, maxl - 1, axis, depth + 1)) {
                return true;
            }
        }
    }
    return false;
}
function $search2(this$static, ct, rl, maxl, lm, depth) {
    let ctx, m_0, prun, rlx;
    if (ct == 0 && ctprun[rl] == 0) {
        return maxl == 0 && $init3(this$static);
    }
    for (m_0 = 0; m_0 < 23; ++m_0) {
        if (ckmv2_0[lm][m_0]) {
            m_0 = skipAxis2[m_0];
            continue;
        }
        ctx = ctmv[ct][m_0];
        rlx = rlmv[rl][m_0];
        prun = ctprun[ctx * 70 + rlx];
        if (prun >= maxl) {
            prun > maxl && (m_0 = skipAxis2[m_0]);
            continue;
        }
        this$static.move2[depth] = move2std[m_0];
        if ($search2(this$static, ctx, rlx, maxl - 1, m_0, depth + 1)) {
            return true;
        }
    }
    return false;
}
function $search3(this$static, edge, ct, prun, maxl, lm, depth) {
    let cord1x, cord2x, ctx, edgex, m_0, prun1, prunx, symcord1x, symx;
    if (maxl == 0) {
        return edge == 0 && ct == 0;
    }
    $set_4(this$static.tempe[depth], edge);
    for (m_0 = 0; m_0 < 17; ++m_0) {
        if (ckmv3[lm][m_0]) {
            m_0 = skipAxis3[m_0];
            continue;
        }
        ctx = ctmove[ct][m_0];
        prun1 = prun_0[ctx];
        if (prun1 >= maxl) {
            prun1 > maxl && m_0 < 14 && (m_0 = skipAxis3[m_0]);
            continue;
        }
        edgex = getmvrot(this$static.tempe[depth].edge, m_0 << 3, 10);
        cord1x = ~~(edgex / 20160);
        symcord1x = raw2sym_1[cord1x];
        symx = symcord1x & 7;
        symcord1x >>= 3;
        cord2x =
            getmvrot(this$static.tempe[depth].edge, (m_0 << 3) | symx, 10) % 20160;
        prunx = getprun_0(symcord1x * 20160 + cord2x, prun);
        if (prunx >= maxl) {
            prunx > maxl && m_0 < 14 && (m_0 = skipAxis3[m_0]);
            continue;
        }
        if ($search3(this$static, edgex, ctx, prunx, maxl - 1, m_0, depth + 1)) {
            this$static.move3[depth] = m_0;
            return true;
        }
    }
    return false;
}
function Search_4() {
    let i_0;
    this.p1sols = new PriorityQueue_0(new FullCube$ValueComparator_0());
    this.move1 = createArray(15);
    this.move2 = createArray(20);
    this.move3 = createArray(20);
    this.c1 = new FullCube_3();
    this.c2 = new FullCube_3();
    this.ct2 = new Center2_0();
    this.ct3 = new Center3_0();
    this.e12 = new Edge3_0();
    this.tempe = createArray(20);
    this.arr2 = createArray(100);
    for (i_0 = 0; i_0 < 20; ++i_0) {
        this.tempe[i_0] = new Edge3_0();
    }
}
function init_5() {
    if (inited_2) {
        return;
    }
    initSym_0();
    raw2sym = createArray(735471);
    initSym2Raw();
    createMoveTable();
    raw2sym = null;
    createPrun();
    init_3();
    init_4();
    initMvrot();
    initRaw2Sym();
    createPrun_0();
    inited_2 = true;
}
defineSeed(163, 1, makeCastMap([Q$Search_0]), Search_4);
_$1.add1 = false;
_$1.arr2idx = 0;
_$1.c = null;
_$1.length1 = 0;
_$1.length2 = 0;
_$1.p1SolsCnt = 0;
_$1.solution = "";
let inited_2 = false;
function parity_0(arr) {
    let i_0, j, len, parity;
    parity = 0;
    for (i_0 = 0, len = arr.length; i_0 < len; ++i_0) {
        for (j = i_0; j < len; ++j) {
            arr[i_0] > arr[j] && (parity ^= 1);
        }
    }
    return parity;
}
function swap(arr, a, b, c, d, key) {
    let temp;
    switch (key) {
        case 0:
            temp = arr[d];
            arr[d] = arr[c];
            arr[c] = arr[b];
            arr[b] = arr[a];
            arr[a] = temp;
            return;
        case 1:
            temp = arr[a];
            arr[a] = arr[c];
            arr[c] = temp;
            temp = arr[b];
            arr[b] = arr[d];
            arr[d] = temp;
            return;
        case 2:
            temp = arr[a];
            arr[a] = arr[b];
            arr[b] = arr[c];
            arr[c] = arr[d];
            arr[d] = temp;
            return;
    }
}
function Class_0() { }
function createForArray(packageName, className, seedId, componentType) {
    let clazz;
    clazz = new Class_0();
    clazz.typeName = packageName + className;
    isInstantiable(seedId != 0 ? -seedId : 0) &&
        setClassLiteral(seedId != 0 ? -seedId : 0, clazz);
    clazz.modifiers = 4;
    clazz.superclass = Ljava_lang_Object_2_classLit;
    clazz.componentType = componentType;
    return clazz;
}
function createForClass(packageName, className, seedId, superclass) {
    let clazz;
    clazz = new Class_0();
    clazz.typeName = packageName + className;
    isInstantiable(seedId) && setClassLiteral(seedId, clazz);
    clazz.superclass = superclass;
    return clazz;
}
function getSeedFunction(clazz) {
    const func = seedTable[clazz.seedId];
    clazz = null;
    return func;
}
function isInstantiable(seedId) {
    return typeof seedId == "number" && seedId > 0;
}
function setClassLiteral(seedId, clazz) {
    let proto;
    clazz.seedId = seedId;
    if (seedId == 2) {
        proto = String.prototype;
    }
    else {
        if (seedId > 0) {
            let seed = getSeedFunction(clazz);
            if (seed) {
                proto = seed.prototype;
            }
            else {
                seed = seedTable[seedId] = function () { };
                seed.___clazz$ = clazz;
                return;
            }
        }
        else {
            return;
        }
    }
    proto.___clazz$ = clazz;
}
_$1.val$outerIter = null;
function $add(this$static, o) {
    if ($offer(this$static, o)) {
        return true;
    }
}
function $$init_6(this$static) {
    this$static.array = initDim(_3Ljava_lang_Object_2_classLit, makeCastMap([Q$Serializable, Q$Object_$1]), Q$Object, 0, 0);
}
function $add_0(this$static, o) {
    setCheck(this$static.array, this$static.size++, o);
    return true;
}
function $clear(this$static) {
    this$static.array = initDim(_3Ljava_lang_Object_2_classLit, makeCastMap([Q$Serializable, Q$Object_$1]), Q$Object, 0, 0);
    this$static.size = 0;
}
function $get_4(this$static, index) {
    return this$static.array[index];
}
function $remove_0(this$static, index) {
    let previous;
    previous = this$static.array[index];
    splice_0(this$static.array, index, 1);
    --this$static.size;
    return previous;
}
function $set_7(this$static, index, o) {
    let previous;
    previous = this$static.array[index];
    setCheck(this$static.array, index, o);
    return previous;
}
function $toArray_0(this$static, out) {
    let i_0;
    out.length < this$static.size && (out = createFrom(out, this$static.size));
    for (i_0 = 0; i_0 < this$static.size; ++i_0) {
        setCheck(out, i_0, this$static.array[i_0]);
    }
    out.length > this$static.size && setCheck(out, this$static.size, null);
    return out;
}
function ArrayList_1() {
    $$init_6(this);
    this.array.length = 500;
}
function splice_0(array, index, deleteCount) {
    array.splice(index, deleteCount);
}
_$1.size = 0;
function binarySearch_0(sortedArray, key) {
    let high, low, mid, midVal;
    low = 0;
    high = sortedArray.length - 1;
    while (low <= high) {
        mid = low + (~~(high - low) >> 1);
        midVal = sortedArray[mid];
        if (midVal < key) {
            low = mid + 1;
        }
        else if (midVal > key) {
            high = mid - 1;
        }
        else {
            return mid;
        }
    }
    return -low - 1;
}
function fill_0(a) {
    fill_1(a, a.length);
}
function fill_1(a, toIndex) {
    let i_0;
    for (i_0 = 0; i_0 < toIndex; ++i_0) {
        a[i_0] = -1;
    }
}
function $mergeHeaps(this$static, node) {
    let heapSize, smallestChild, value, leftChild, rightChild, smallestChild_0;
    heapSize = this$static.heap.size;
    value = $get_4(this$static.heap, node);
    while (node * 2 + 1 < heapSize) {
        smallestChild =
            ((leftChild = 2 * node + 1),
                (rightChild = leftChild + 1),
                (smallestChild_0 = leftChild),
                rightChild < heapSize &&
                    $compare_0($get_4(this$static.heap, rightChild), $get_4(this$static.heap, leftChild)) < 0 &&
                    (smallestChild_0 = rightChild),
                smallestChild_0);
        if ($compare_0(value, $get_4(this$static.heap, smallestChild)) < 0) {
            break;
        }
        $set_7(this$static.heap, node, $get_4(this$static.heap, smallestChild));
        node = smallestChild;
    }
    $set_7(this$static.heap, node, value);
}
function $offer(this$static, e) {
    let childNode, node;
    node = this$static.heap.size;
    $add_0(this$static.heap, e);
    while (node > 0) {
        childNode = node;
        node = ~~((node - 1) / 2);
        if ($compare_0($get_4(this$static.heap, node), e) <= 0) {
            $set_7(this$static.heap, childNode, e);
            return true;
        }
        $set_7(this$static.heap, childNode, $get_4(this$static.heap, node));
    }
    $set_7(this$static.heap, node, e);
    return true;
}
function $poll(this$static) {
    let value;
    if (this$static.heap.size == 0) {
        return null;
    }
    value = $get_4(this$static.heap, 0);
    $removeAtIndex(this$static);
    return value;
}
function $removeAtIndex(this$static) {
    let lastValue;
    lastValue = $remove_0(this$static.heap, this$static.heap.size - 1);
    if (0 < this$static.heap.size) {
        $set_7(this$static.heap, 0, lastValue);
        $mergeHeaps(this$static, 0);
    }
}
function $toArray_1(this$static, a) {
    return $toArray_0(this$static.heap, a);
}
function PriorityQueue_0(cmp) {
    this.heap = new ArrayList_1();
    this.cmp = cmp;
}
defineSeed(239, 1, {}, PriorityQueue_0);
_$1.cmp = null;
_$1.heap = null;
const Ljava_lang_Object_2_classLit = createForClass("java.lang.", "Object", 1, null), _3Ljava_lang_Object_2_classLit = createForArray("[Ljava.lang.", "Object;", 356, Ljava_lang_Object_2_classLit), Lcs_threephase_FullCube_2_classLit = createForClass("cs.threephase.", "FullCube", 160, Ljava_lang_Object_2_classLit), _3Lcs_threephase_FullCube_2_classLit = createForArray("[Lcs.threephase.", "FullCube;", 381, Lcs_threephase_FullCube_2_classLit);
$clinit_Moves();
$clinit_Center1();
$clinit_Center2();
$clinit_Center3();
$clinit_Edge3();
$clinit_CornerCube();
$clinit_FullCube_0();
let searcher = new Search_4();
function getRandomScramble() {
    return (getRandomScramble$1() + $randomState(searcher)).replace(/\s+/g, " ");
}
regScrambler("444wca", getRandomScramble);

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
function FullCube_copy(obj, c) {
    obj.ul = c.ul;
    obj.ur = c.ur;
    obj.dl = c.dl;
    obj.dr = c.dr;
    obj.ml = c.ml;
}
function FullCube_doMove(obj, move) {
    let temp;
    move <<= 2;
    if (move > 24) {
        move = 48 - move;
        temp = obj.ul;
        obj.ul = ((obj.ul >> move) | (obj.ur << (24 - move))) & 16777215;
        obj.ur = ((obj.ur >> move) | (temp << (24 - move))) & 16777215;
    }
    else if (move > 0) {
        temp = obj.ul;
        obj.ul = ((obj.ul << move) | (obj.ur >> (24 - move))) & 16777215;
        obj.ur = ((obj.ur << move) | (temp >> (24 - move))) & 16777215;
    }
    else if (move == 0) {
        temp = obj.ur;
        obj.ur = obj.dl;
        obj.dl = temp;
        obj.ml = 1 - obj.ml;
    }
    else if (move >= -24) {
        move = -move;
        temp = obj.dl;
        obj.dl = ((obj.dl << move) | (obj.dr >> (24 - move))) & 16777215;
        obj.dr = ((obj.dr << move) | (temp >> (24 - move))) & 16777215;
    }
    else if (move < -24) {
        move = 48 + move;
        temp = obj.dl;
        obj.dl = ((obj.dl >> move) | (obj.dr << (24 - move))) & 16777215;
        obj.dr = ((obj.dr >> move) | (temp << (24 - move))) & 16777215;
    }
}
function FullCube_getParity(obj) {
    let a, b, cnt, i, p;
    cnt = 0;
    obj.arr[0] = FullCube_pieceAt(obj, 0);
    for (i = 1; i < 24; ++i) {
        FullCube_pieceAt(obj, i) != obj.arr[cnt] && (obj.arr[++cnt] = FullCube_pieceAt(obj, i));
    }
    p = 0;
    for (a = 0; a < 16; ++a) {
        for (b = a + 1; b < 16; ++b) {
            obj.arr[a] > obj.arr[b] && (p ^= 1);
        }
    }
    return p;
}
function FullCube_getShapeIdx(obj) {
    let dlx, drx, ulx, urx;
    urx = obj.ur & 1118481;
    urx |= urx >> 3;
    urx |= urx >> 6;
    urx = (urx & 15) | ((urx >> 12) & 48);
    ulx = obj.ul & 1118481;
    ulx |= ulx >> 3;
    ulx |= ulx >> 6;
    ulx = (ulx & 15) | ((ulx >> 12) & 48);
    drx = obj.dr & 1118481;
    drx |= drx >> 3;
    drx |= drx >> 6;
    drx = (drx & 15) | ((drx >> 12) & 48);
    dlx = obj.dl & 1118481;
    dlx |= dlx >> 3;
    dlx |= dlx >> 6;
    dlx = (dlx & 15) | ((dlx >> 12) & 48);
    return Shape_getShape2Idx((FullCube_getParity(obj) << 24) | (ulx << 18) | (urx << 12) | (dlx << 6) | drx);
}
function FullCube_getSquare(obj, sq) {
    let a, b;
    for (a = 0; a < 8; ++a) {
        obj.prm[a] = FullCube_pieceAt(obj, a * 3 + 1) >> 1;
    }
    sq.cornperm = get8Perm(obj.prm);
    sq.topEdgeFirst = FullCube_pieceAt(obj, 0) == FullCube_pieceAt(obj, 1);
    a = sq.topEdgeFirst ? 2 : 0;
    for (b = 0; b < 4; a += 3, ++b)
        obj.prm[b] = FullCube_pieceAt(obj, a) >> 1;
    sq.botEdgeFirst = FullCube_pieceAt(obj, 12) == FullCube_pieceAt(obj, 13);
    a = sq.botEdgeFirst ? 14 : 12;
    for (; b < 8; a += 3, ++b)
        obj.prm[b] = FullCube_pieceAt(obj, a) >> 1;
    sq.edgeperm = get8Perm(obj.prm);
    sq.ml = obj.ml;
}
function FullCube_pieceAt(obj, idx) {
    let ret;
    idx < 6
        ? (ret = obj.ul >> ((5 - idx) << 2))
        : idx < 12
            ? (ret = obj.ur >> ((11 - idx) << 2))
            : idx < 18
                ? (ret = obj.dl >> ((17 - idx) << 2))
                : (ret = obj.dr >> ((23 - idx) << 2));
    return ret & 15;
}
function FullCube_setPiece(obj, idx, value) {
    if (idx < 6) {
        obj.ul &= ~(0xf << ((5 - idx) << 2));
        obj.ul |= value << ((5 - idx) << 2);
    }
    else if (idx < 12) {
        obj.ur &= ~(0xf << ((11 - idx) << 2));
        obj.ur |= value << ((11 - idx) << 2);
    }
    else if (idx < 18) {
        obj.dl &= ~(0xf << ((17 - idx) << 2));
        obj.dl |= value << ((17 - idx) << 2);
    }
    else {
        obj.dr &= ~(0xf << ((23 - idx) << 2));
        obj.dr |= value << ((23 - idx) << 2);
    }
}
function FullCube_FullCube__Ljava_lang_String_2V() {
    this.arr = [];
    this.prm = [];
}
function FullCube_randomCube(indice) {
    let f, i, shape, edge, corner, n_edge, n_corner, rnd, m;
    if (indice === undefined) {
        indice = rn(3678);
    }
    f = new FullCube_FullCube__Ljava_lang_String_2V();
    shape = Shape_ShapeIdx[indice];
    corner = (0x01234567 << 1) | 0x11111111;
    edge = 0x01234567 << 1;
    n_corner = n_edge = 8;
    for (i = 0; i < 24; i++) {
        if (((shape >> i) & 1) == 0) {
            //edge
            rnd = rn(n_edge) << 2;
            FullCube_setPiece(f, 23 - i, (edge >> rnd) & 0xf);
            m = (1 << rnd) - 1;
            edge = (edge & m) + ((edge >> 4) & ~m);
            --n_edge;
        }
        else {
            //corner
            rnd = rn(n_corner) << 2;
            FullCube_setPiece(f, 23 - i, (corner >> rnd) & 0xf);
            FullCube_setPiece(f, 22 - i, (corner >> rnd) & 0xf);
            m = (1 << rnd) - 1;
            corner = (corner & m) + ((corner >> 4) & ~m);
            --n_corner;
            ++i;
        }
    }
    f.ml = rn(2);
    return f;
}
function FullCube() { }
let _ = (FullCube_FullCube__Ljava_lang_String_2V.prototype = FullCube.prototype);
_.dl = 10062778;
_.dr = 14536702;
_.ml = 0;
_.ul = 70195;
_.ur = 4544119;
function Search_init2(obj) {
    let corner, edge, i, j, ml, prun;
    FullCube_copy(obj.Search_d, obj.Search_c);
    for (i = 0; i < obj.Search_length1; ++i) {
        FullCube_doMove(obj.Search_d, obj.Search_move[i]);
    }
    FullCube_getSquare(obj.Search_d, obj.Search_sq);
    edge = obj.Search_sq.edgeperm;
    corner = obj.Search_sq.cornperm;
    ml = obj.Search_sq.ml;
    prun = Math.max(SquarePrun[(obj.Search_sq.edgeperm << 1) | ml], SquarePrun[(obj.Search_sq.cornperm << 1) | ml]);
    for (i = prun; i < obj.Search_maxlen2; ++i) {
        if (Search_phase2(obj, edge, corner, obj.Search_sq.topEdgeFirst, obj.Search_sq.botEdgeFirst, ml, i, obj.Search_length1, 0)) {
            for (j = 0; j < i; ++j) {
                FullCube_doMove(obj.Search_d, obj.Search_move[obj.Search_length1 + j]);
            }
            obj.Search_sol_string = Search_move2string(obj, i + obj.Search_length1);
            return true;
        }
    }
    return false;
}
function Search_move2string(obj, len) {
    let s = "";
    let top = 0, bottom = 0;
    for (let i = len - 1; i >= 0; i--) {
        let val = obj.Search_move[i];
        if (val > 0) {
            val = 12 - val;
            top = val > 6 ? val - 12 : val;
        }
        else if (val < 0) {
            val = 12 + val;
            bottom = val > 6 ? val - 12 : val;
        }
        else {
            const twst = " /";
            // if (i == obj.Search_length1 - 1) {
            //   twst = "`/`";
            // }
            if (top == 0 && bottom == 0) {
                s += twst;
            }
            else {
                s += " (" + top + "," + bottom + ")" + twst;
            }
            top = bottom = 0;
        }
    }
    if (top == 0 && bottom == 0) ;
    else {
        s += " (" + top + "," + bottom + ") ";
    }
    return s; // + " (" + len + "t)";
}
function Search_phase1(obj, shape, prunvalue, maxl, depth, lm) {
    let m, prunx, shapex;
    if (prunvalue == 0 && maxl < 4) {
        return maxl == 0 && Search_init2(obj);
    }
    if (lm != 0) {
        shapex = Shape_TwistMove[shape];
        prunx = ShapePrun[shapex];
        if (prunx < maxl) {
            obj.Search_move[depth] = 0;
            if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 0)) {
                return true;
            }
        }
    }
    shapex = shape;
    if (lm <= 0) {
        m = 0;
        while (true) {
            m += Shape_TopMove[shapex];
            shapex = m >> 4;
            m &= 15;
            if (m >= 12) {
                break;
            }
            prunx = ShapePrun[shapex];
            if (prunx > maxl) {
                break;
            }
            else if (prunx < maxl) {
                obj.Search_move[depth] = m;
                if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 1)) {
                    return true;
                }
            }
        }
    }
    shapex = shape;
    if (lm <= 1) {
        m = 0;
        while (true) {
            m += Shape_BottomMove[shapex];
            shapex = m >> 4;
            m &= 15;
            if (m >= 6) {
                break;
            }
            prunx = ShapePrun[shapex];
            if (prunx > maxl) {
                break;
            }
            else if (prunx < maxl) {
                obj.Search_move[depth] = -m;
                if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 2)) {
                    return true;
                }
            }
        }
    }
    return false;
}
function Search_phase2(obj, edge, corner, topEdgeFirst, botEdgeFirst, ml, maxl, depth, lm) {
    let botEdgeFirstx, cornerx, edgex, m, prun1, prun2, topEdgeFirstx;
    if (maxl == 0 && !topEdgeFirst && botEdgeFirst) {
        return true;
    }
    if (lm != 0 && topEdgeFirst == botEdgeFirst) {
        edgex = Square_TwistMove[edge];
        cornerx = Square_TwistMove[corner];
        if (SquarePrun[(edgex << 1) | (1 - ml)] < maxl &&
            SquarePrun[(cornerx << 1) | (1 - ml)] < maxl) {
            obj.Search_move[depth] = 0;
            if (Search_phase2(obj, edgex, cornerx, topEdgeFirst, botEdgeFirst, 1 - ml, maxl - 1, depth + 1, 0)) {
                return true;
            }
        }
    }
    if (lm <= 0) {
        topEdgeFirstx = !topEdgeFirst;
        edgex = topEdgeFirstx ? Square_TopMove[edge] : edge;
        cornerx = topEdgeFirstx ? corner : Square_TopMove[corner];
        m = topEdgeFirstx ? 1 : 2;
        prun1 = SquarePrun[(edgex << 1) | ml];
        prun2 = SquarePrun[(cornerx << 1) | ml];
        while (m < 12 && prun1 <= maxl && prun1 <= maxl) {
            if (prun1 < maxl && prun2 < maxl) {
                obj.Search_move[depth] = m;
                if (Search_phase2(obj, edgex, cornerx, topEdgeFirstx, botEdgeFirst, ml, maxl - 1, depth + 1, 1)) {
                    return true;
                }
            }
            topEdgeFirstx = !topEdgeFirstx;
            if (topEdgeFirstx) {
                edgex = Square_TopMove[edgex];
                prun1 = SquarePrun[(edgex << 1) | ml];
                m += 1;
            }
            else {
                cornerx = Square_TopMove[cornerx];
                prun2 = SquarePrun[(cornerx << 1) | ml];
                m += 2;
            }
        }
    }
    if (lm <= 1) {
        botEdgeFirstx = !botEdgeFirst;
        edgex = botEdgeFirstx ? Square_BottomMove[edge] : edge;
        cornerx = botEdgeFirstx ? corner : Square_BottomMove[corner];
        m = botEdgeFirstx ? 1 : 2;
        prun1 = SquarePrun[(edgex << 1) | ml];
        prun2 = SquarePrun[(cornerx << 1) | ml];
        while (m < (maxl > 6 ? 6 : 12) && prun1 <= maxl && prun1 <= maxl) {
            if (prun1 < maxl && prun2 < maxl) {
                obj.Search_move[depth] = -m;
                if (Search_phase2(obj, edgex, cornerx, topEdgeFirst, botEdgeFirstx, ml, maxl - 1, depth + 1, 2)) {
                    return true;
                }
            }
            botEdgeFirstx = !botEdgeFirstx;
            if (botEdgeFirstx) {
                edgex = Square_BottomMove[edgex];
                prun1 = SquarePrun[(edgex << 1) | ml];
                m += 1;
            }
            else {
                cornerx = Square_BottomMove[cornerx];
                prun2 = SquarePrun[(cornerx << 1) | ml];
                m += 2;
            }
        }
    }
    return false;
}
function Search_solution(obj, c) {
    let shape;
    obj.Search_c = c;
    shape = FullCube_getShapeIdx(c);
    for (obj.Search_length1 = ShapePrun[shape]; obj.Search_length1 < 100; ++obj.Search_length1) {
        obj.Search_maxlen2 = Math.min(32 - obj.Search_length1, 17);
        if (Search_phase1(obj, shape, ShapePrun[shape], obj.Search_length1, 0, -1)) {
            break;
        }
    }
    return obj.Search_sol_string;
}
function Search_Search() {
    this.Search_move = [];
    this.Search_d = new FullCube_FullCube__Ljava_lang_String_2V();
    this.Search_sq = new Square_Square();
}
function Search() { }
_ = Search_Search.prototype = Search.prototype;
_.Search_c = null;
_.Search_length1 = 0;
_.Search_maxlen2 = 0;
_.Search_sol_string = null;
let Shape_$clinitRet = false;
function Shape_$clinit() {
    if (Shape_$clinitRet) {
        return;
    }
    Shape_$clinitRet = true;
    Shape_halflayer = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63];
    Shape_ShapeIdx = [];
    ShapePrun = [];
    Shape_TopMove = [];
    Shape_BottomMove = [];
    Shape_TwistMove = [];
    Shape_init();
}
function Shape_bottomMove(obj) {
    let move, moveParity;
    move = 0;
    moveParity = 0;
    do {
        if ((obj.bottom & 2048) == 0) {
            move += 1;
            obj.bottom = obj.bottom << 1;
        }
        else {
            move += 2;
            obj.bottom = (obj.bottom << 2) ^ 12291;
        }
        moveParity = 1 - moveParity;
    } while ((bitCount(obj.bottom & 63) & 1) != 0);
    (bitCount(obj.bottom) & 2) == 0 && (obj.Shape_parity ^= moveParity);
    return move;
}
function Shape_getIdx(obj) {
    let ret;
    ret = (binarySearch(Shape_ShapeIdx, (obj.top << 12) | obj.bottom) << 1) | obj.Shape_parity;
    return ret;
}
function Shape_setIdx(obj, idx) {
    obj.Shape_parity = idx & 1;
    obj.top = Shape_ShapeIdx[idx >> 1];
    obj.bottom = obj.top & 4095;
    obj.top >>= 12;
}
function Shape_topMove(obj) {
    let move, moveParity;
    move = 0;
    moveParity = 0;
    do {
        if ((obj.top & 2048) == 0) {
            move += 1;
            obj.top = obj.top << 1;
        }
        else {
            move += 2;
            obj.top = (obj.top << 2) ^ 12291;
        }
        moveParity = 1 - moveParity;
    } while ((bitCount(obj.top & 63) & 1) != 0);
    (bitCount(obj.top) & 2) == 0 && (obj.Shape_parity ^= moveParity);
    return move;
}
function Shape_Shape() { }
function Shape_getShape2Idx(shp) {
    let ret;
    ret = (binarySearch(Shape_ShapeIdx, shp & 16777215) << 1) | (shp >> 24);
    return ret;
}
function Shape_init() {
    let count, depth, dl, done, done0, dr, i, idx, m, s, ul, ur, value, p1, p3, temp;
    count = 0;
    for (i = 0; i < 28561; ++i) {
        dr = Shape_halflayer[i % 13];
        dl = Shape_halflayer[~~(i / 13) % 13];
        ur = Shape_halflayer[~~(~~(i / 13) / 13) % 13];
        ul = Shape_halflayer[~~(~~(~~(i / 13) / 13) / 13)];
        value = (ul << 18) | (ur << 12) | (dl << 6) | dr;
        bitCount(value) == 16 && (Shape_ShapeIdx[count++] = value);
    }
    s = new Shape_Shape();
    for (i = 0; i < 7356; ++i) {
        Shape_setIdx(s, i);
        Shape_TopMove[i] = Shape_topMove(s);
        Shape_TopMove[i] |= Shape_getIdx(s) << 4;
        Shape_setIdx(s, i);
        Shape_BottomMove[i] = Shape_bottomMove(s);
        Shape_BottomMove[i] |= Shape_getIdx(s) << 4;
        Shape_setIdx(s, i);
        temp = s.top & 63;
        p1 = bitCount(temp);
        p3 = bitCount(s.bottom & 4032);
        s.Shape_parity ^= 1 & ((p1 & p3) >> 1);
        s.top = (s.top & 4032) | ((s.bottom >> 6) & 63);
        s.bottom = (s.bottom & 63) | (temp << 6);
        Shape_TwistMove[i] = Shape_getIdx(s);
    }
    for (i = 0; i < 7536; ++i) {
        ShapePrun[i] = -1;
    }
    ShapePrun[Shape_getShape2Idx(14378715)] = 0;
    ShapePrun[Shape_getShape2Idx(31157686)] = 0;
    ShapePrun[Shape_getShape2Idx(23967451)] = 0;
    ShapePrun[Shape_getShape2Idx(7191990)] = 0;
    done = 4;
    done0 = 0;
    depth = -1;
    while (done != done0) {
        done0 = done;
        ++depth;
        for (i = 0; i < 7536; ++i) {
            if (ShapePrun[i] == depth) {
                m = 0;
                idx = i;
                do {
                    idx = Shape_TopMove[idx];
                    m += idx & 15;
                    idx >>= 4;
                    if (ShapePrun[idx] == -1) {
                        ++done;
                        ShapePrun[idx] = depth + 1;
                    }
                } while (m != 12);
                m = 0;
                idx = i;
                do {
                    idx = Shape_BottomMove[idx];
                    m += idx & 15;
                    idx >>= 4;
                    if (ShapePrun[idx] == -1) {
                        ++done;
                        ShapePrun[idx] = depth + 1;
                    }
                } while (m != 12);
                idx = Shape_TwistMove[i];
                if (ShapePrun[idx] == -1) {
                    ++done;
                    ShapePrun[idx] = depth + 1;
                }
            }
        }
    }
}
function Shape() { }
_ = Shape_Shape.prototype = Shape.prototype;
_.bottom = 0;
_.Shape_parity = 0;
_.top = 0;
let Shape_BottomMove, Shape_ShapeIdx, ShapePrun, Shape_TopMove, Shape_TwistMove, Shape_halflayer;
let Square_$clinitRet = false;
function Square_$clinit() {
    if (Square_$clinitRet) {
        return;
    }
    Square_$clinitRet = true;
    SquarePrun = [];
    Square_TwistMove = [];
    Square_TopMove = [];
    Square_BottomMove = [];
    Square_init();
}
function Square_Square() { }
function Square_init() {
    let check, depth, done, find, i, idx, idxx, inv, m, ml, pos;
    pos = [];
    for (i = 0; i < 40320; ++i) {
        set8Perm(pos, i);
        circle$1(pos, 2, 4)(pos, 3, 5);
        Square_TwistMove[i] = get8Perm(pos);
        set8Perm(pos, i);
        circle$1(pos, 0, 3, 2, 1);
        Square_TopMove[i] = get8Perm(pos);
        set8Perm(pos, i);
        circle$1(pos, 4, 7, 6, 5);
        Square_BottomMove[i] = get8Perm(pos);
    }
    for (i = 0; i < 80640; ++i) {
        SquarePrun[i] = -1;
    }
    SquarePrun[0] = 0;
    depth = 0;
    done = 1;
    while (done < 80640) {
        inv = depth >= 11;
        find = inv ? -1 : depth;
        check = inv ? depth : -1;
        ++depth;
        OUT: for (i = 0; i < 80640; ++i) {
            if (SquarePrun[i] == find) {
                idx = i >> 1;
                ml = i & 1;
                idxx = (Square_TwistMove[idx] << 1) | (1 - ml);
                if (SquarePrun[idxx] == check) {
                    ++done;
                    SquarePrun[inv ? i : idxx] = depth;
                    if (inv)
                        continue OUT;
                }
                idxx = idx;
                for (m = 0; m < 4; ++m) {
                    idxx = Square_TopMove[idxx];
                    if (SquarePrun[(idxx << 1) | ml] == check) {
                        ++done;
                        SquarePrun[inv ? i : (idxx << 1) | ml] = depth;
                        if (inv)
                            continue OUT;
                    }
                }
                for (m = 0; m < 4; ++m) {
                    idxx = Square_BottomMove[idxx];
                    if (SquarePrun[(idxx << 1) | ml] == check) {
                        ++done;
                        SquarePrun[inv ? i : (idxx << 1) | ml] = depth;
                        if (inv)
                            continue OUT;
                    }
                }
            }
        }
    }
}
function Square() { }
_ = Square_Square.prototype = Square.prototype;
_.botEdgeFirst = false;
_.cornperm = 0;
_.edgeperm = 0;
_.ml = 0;
_.topEdgeFirst = false;
let Square_BottomMove, SquarePrun, Square_TopMove, Square_TwistMove;
function bitCount(x) {
    x -= (x >> 1) & 1431655765;
    x = ((x >> 2) & 858993459) + (x & 858993459);
    x = ((x >> 4) + x) & 252645135;
    x += x >> 8;
    x += x >> 16;
    return x & 63;
}
function binarySearch(sortedArray, key) {
    let high, low, mid, midVal;
    low = 0;
    high = sortedArray.length - 1;
    while (low <= high) {
        mid = low + ((high - low) >> 1);
        midVal = sortedArray[mid];
        if (midVal < key) {
            low = mid + 1;
        }
        else if (midVal > key) {
            high = mid - 1;
        }
        else {
            return mid;
        }
    }
    return -low - 1;
}
const cspcases = [
    0, 1, 3, 18, 19, 1004, 1005, 1006, 1007, 1008, 1009, 1011, 1015, 1016, 1018, 1154, 1155, 1156,
    1157, 1158, 1159, 1161, 1166, 1168, 424, 425, 426, 427, 428, 429, 431, 436, 95, 218, 341, 482,
    528, 632, 1050, 342, 343, 345, 346, 348, 353, 223, 487, 533, 535, 1055, 219, 225, 483, 489, 639,
    1051, 1057, 486, 1054, 1062, 6, 21, 34, 46, 59, 71, 144, 157, 182, 305, 7, 22, 35, 47, 60, 72,
    145, 158, 183, 306, 8, 23, 36, 48, 61, 73, 146, 159, 184, 307,
];
let CSPInitRet = false;
function CSPInit() {
    if (CSPInitRet) {
        return;
    }
    CSPInitRet = true;
    const s = new Shape_Shape();
    for (let csp = 0; csp < cspcases.length; csp++) {
        const curCases = [cspcases[csp]];
        for (let i = 0; i < curCases.length; i++) {
            let shape = curCases[i];
            do {
                shape = Shape_TopMove[shape << 1] >> 5;
                if (curCases.indexOf(shape) == -1) {
                    curCases.push(shape);
                }
            } while (shape != curCases[i]);
            do {
                shape = Shape_BottomMove[shape << 1] >> 5;
                if (curCases.indexOf(shape) == -1) {
                    curCases.push(shape);
                }
            } while (shape != curCases[i]);
            Shape_setIdx(s, shape << 1);
            const tmp = s.top;
            s.top = s.bottom;
            s.bottom = tmp;
            shape = Shape_getIdx(s) >> 1;
            if (curCases.indexOf(shape) == -1) {
                curCases.push(shape);
            }
        }
        cspcases[csp] = curCases;
    }
}
const cspfilter = [
    "Star-x8",
    "Star-x71",
    "Star-x62",
    "Star-x44",
    "Star-x53",
    "Square-Scallop",
    "Square-rPawn",
    "Square-Shield",
    "Square-Barrel",
    "Square-rFist",
    "Square-Mushroom",
    "Square-lPawn",
    "Square-Square",
    "Square-lFist",
    "Square-Kite",
    "Kite-Scallop",
    "Kite-rPawn",
    "Kite-Shield",
    "Kite-Barrel",
    "Kite-rFist",
    "Kite-Mushroom",
    "Kite-lPawn",
    "Kite-lFist",
    "Kite-Kite",
    "Barrel-Scallop",
    "Barrel-rPawn",
    "Barrel-Shield",
    "Barrel-Barrel",
    "Barrel-rFist",
    "Barrel-Mushroom",
    "Barrel-lPawn",
    "Barrel-lFist",
    "Scallop-Scallop",
    "Scallop-rPawn",
    "Scallop-Shield",
    "Scallop-rFist",
    "Scallop-Mushroom",
    "Scallop-lPawn",
    "Scallop-lFist",
    "Shield-rPawn",
    "Shield-Shield",
    "Shield-rFist",
    "Shield-Mushroom",
    "Shield-lPawn",
    "Shield-lFist",
    "Mushroom-rPawn",
    "Mushroom-rFist",
    "Mushroom-Mushroom",
    "Mushroom-lPawn",
    "Mushroom-lFist",
    "Pawn-rPawn-rPawn",
    "Pawn-rPawn-lPawn",
    "Pawn-rPawn-rFist",
    "Pawn-lPawn-rFist",
    "Pawn-lPawn-lPawn",
    "Pawn-rPawn-lFist",
    "Pawn-lPawn-lFist",
    "Fist-rFist-rFist",
    "Fist-lFist-rFist",
    "Fist-lFist-lFist",
    "Pair-x6",
    "Pair-r42",
    "Pair-x411",
    "Pair-r51",
    "Pair-l42",
    "Pair-l51",
    "Pair-x33",
    "Pair-x312",
    "Pair-x321",
    "Pair-x222",
    "L-x6",
    "L-r42",
    "L-x411",
    "L-r51",
    "L-l42",
    "L-l51",
    "L-x33",
    "L-x312",
    "L-x321",
    "L-x222",
    "Line-x6",
    "Line-r42",
    "Line-x411",
    "Line-r51",
    "Line-l42",
    "Line-l51",
    "Line-x33",
    "Line-x312",
    "Line-x321",
    "Line-x222",
];
const cspprobs = [
    16, 16, 16, 10, 16, 24, 16, 24, 16, 24, 16, 16, 4, 24, 16, 48, 32, 48, 32, 48, 32, 32, 48, 16, 48,
    32, 48, 16, 48, 32, 32, 48, 36, 48, 72, 72, 48, 48, 72, 48, 36, 72, 48, 48, 72, 32, 48, 16, 32,
    48, 16, 32, 48, 48, 16, 48, 48, 36, 72, 36, 72, 96, 96, 72, 96, 72, 72, 72, 72, 24, 48, 64, 64,
    48, 64, 48, 48, 48, 48, 16, 24, 32, 32, 24, 32, 24, 24, 24, 24, 8,
];
const search = new Search_Search();
function square1SolverGetRandomScramble() {
    Shape_$clinit();
    Square_$clinit();
    const scrambleString = Search_solution(search, FullCube_randomCube());
    return scrambleString;
}
function square1CubeShapeParityScramble(type, length, cases) {
    console.log("SQ1 CSP: ", type, length, cases, arguments);
    Shape_$clinit();
    Square_$clinit();
    CSPInit();
    const idx = rndEl(cspcases[fixCase(cases, cspprobs)]);
    const scrambleString = Search_solution(search, FullCube_randomCube(idx));
    return scrambleString;
}
regScrambler("sqrs", square1SolverGetRandomScramble);
regScrambler("sqrcsp", square1CubeShapeParityScramble, [cspfilter, cspprobs]);

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
/**	1 2   U
     0  LFRB
    3 4   D  */
//centers: U R F B L D
//twstcor: URF ULB DRB DLF
//fixedco: UBR UFL DFR DBL
const fixedCorn = [
    [4, 16, 7], // U4 B1 R2
    [1, 11, 22], // U1 F1 L2
    [26, 14, 8], // D1 F4 R3
    [29, 19, 23], // D4 B4 L3
];
const twstCorn = [
    [3, 6, 12], // U3 R1 F2
    [2, 21, 17], // U2 L1 B2
    [27, 9, 18], // D2 R4 B3
    [28, 24, 13], // D3 L4 F3
];
function checkNoBar(perm, _twst) {
    const corner = cpcord.set([], perm % 12);
    const center = ctcord.set([], ~~(perm / 12));
    const fixedtwst = ftcord.set([], _twst % 81);
    const twst = twcord.set([], ~~(_twst / 81));
    const f = [];
    for (let i = 0; i < 6; i++) {
        f[i * 5] = center[i];
    }
    fillFacelet(fixedCorn, f, [0, 1, 2, 3], fixedtwst, 5);
    fillFacelet(twstCorn, f, corner, twst, 5);
    for (let i = 0; i < 30; i += 5) {
        for (let j = 1; j < 5; j++) {
            if (f[i] == f[i + j]) {
                return false;
            }
        }
    }
    return true;
}
const moveCenters = [
    [0, 3, 1],
    [0, 2, 4],
    [1, 5, 2],
    [3, 4, 5],
];
const moveCorners = [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2],
];
const ctcord = new coord("p", 6, -1);
const cpcord = new coord("p", 4, -1);
const ftcord = new coord("o", 4, 3);
const twcord = new coord("o", 4, -3);
function ctcpMove(idx, m) {
    const corner = cpcord.set([], idx % 12);
    const center = ctcord.set([], ~~(idx / 12));
    acycle(center, moveCenters[m]);
    acycle(corner, moveCorners[m]);
    return ctcord.get(center) * 12 + cpcord.get(corner);
}
function twstMove(idx, move) {
    const fixedtwst = ftcord.set([], idx % 81);
    const twst = twcord.set([], ~~(idx / 81));
    fixedtwst[move]++;
    acycle(twst, moveCorners[move], 1, [0, 2, 1, 3]);
    return twcord.get(twst) * 81 + ftcord.get(fixedtwst);
}
const solv = new Solver$1(4, 2, [
    [0, ctcpMove, 4320],
    [0, twstMove, 2187],
]);
const solvivy = new Solver$1(4, 2, [
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
    const ret = [];
    const move2str = ["L", "R", "B", "U"]; //RLDB (in jaap's notation) rotated by z2
    for (let i = 0; i < sol.length; i++) {
        const axis = sol[i][0];
        const pow = 1 - sol[i][1];
        if (axis == 2) {
            //step two.
            acycle(move2str, [0, 3, 1], pow + 1);
        }
        ret.push(move2str[axis] + (pow == 1 ? "'" : ""));
    }
    return ret.join(" ");
}
const ori = [0, 1, 2, 0, 2, 1, 1, 2, 0, 2, 1, 0];
function getScramble$3(type) {
    let perm, twst;
    const lim = type == "skbso" ? 6 : 2;
    const minl = type == "skbo" ? 0 : 8;
    do {
        perm = rn(4320);
        twst = rn(2187);
    } while ((perm == 0 && twst == 0) ||
        ori[perm % 12] != (twst + ~~(twst / 3) + ~~(twst / 9) + ~~(twst / 27)) % 3 ||
        solv.search([perm, twst], 0, lim) != null ||
        (type == "skbnb" && !checkNoBar(perm, twst)));
    return sol2str(solv.search([perm, twst], minl).reverse());
}
function getScrambleIvy(type) {
    let perm, twst, lim = 1, maxl = type == "ivyso" ? 6 : 0;
    do {
        perm = rn(360);
        twst = rn(81);
    } while ((perm == 0 && twst == 0) || solvivy.search([perm, twst], 0, lim) != null);
    return solvivy.toStr(solvivy.search([perm, twst], maxl).reverse(), "RLDB", "' ");
}
regScrambler(["skbo", "skbso", "skbnb"], getScramble$3)(["ivyo", "ivyso"], getScrambleIvy);

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
const cubesuff = ["", "2", "'"];
const minxsuff = ["", "2", "'", "2'"];
let seq = [];
let p = [];
function adjScramble(faces, adj, len, suffixes) {
    if (suffixes == undefined) {
        suffixes = [""];
    }
    let used = 0;
    let face;
    const ret = [];
    for (let j = 0; j < len; j++) {
        do {
            face = rn(faces.length);
        } while ((used >> face) & 1);
        ret.push(faces[face] + rndEl(suffixes));
        used &= ~adj[face];
        used |= 1 << face;
    }
    return ret.join(" ");
}
function yj4x4(type, len) {
    // the idea is to keep the fixed center on U and do Rw or Lw, Fw or Bw, to not disturb it
    const turns = [
        ["U", "D"],
        ["R", "L", "r"],
        ["F", "B", "f"],
    ];
    const donemoves = [];
    let lastaxis;
    let fpos = 0; // 0 = Ufr, 1 = Ufl, 2 = Ubl, 3 = Ubr
    let j, k;
    let s = "";
    lastaxis = -1;
    for (j = 0; j < len; j++) {
        let done = 0;
        do {
            const first = rn(turns.length);
            const second = rn(turns[first].length);
            if (first != lastaxis || donemoves[second] == 0) {
                if (first == lastaxis) {
                    donemoves[second] = 1;
                    const rs = rn(cubesuff.length);
                    if (first == 0 && second == 0) {
                        fpos = (fpos + 4 + rs) % 4;
                    }
                    if (first == 1 && second == 2) {
                        // r or l
                        if (fpos == 0 || fpos == 3)
                            s += "l" + cubesuff[rs] + " ";
                        else
                            s += "r" + cubesuff[rs] + " ";
                    }
                    else if (first == 2 && second == 2) {
                        // f or b
                        if (fpos == 0 || fpos == 1)
                            s += "b" + cubesuff[rs] + " ";
                        else
                            s += "f" + cubesuff[rs] + " ";
                    }
                    else {
                        s += turns[first][second] + cubesuff[rs] + " ";
                    }
                }
                else {
                    for (k = 0; k < turns[first].length; k++) {
                        donemoves[k] = 0;
                    }
                    lastaxis = first;
                    donemoves[second] = 1;
                    const rs = rn(cubesuff.length);
                    if (first == 0 && second == 0) {
                        fpos = (fpos + 4 + rs) % 4;
                    }
                    if (first == 1 && second == 2) {
                        // r or l
                        if (fpos == 0 || fpos == 3)
                            s += "l" + cubesuff[rs] + " ";
                        else
                            s += "r" + cubesuff[rs] + " ";
                    }
                    else if (first == 2 && second == 2) {
                        // f or b
                        if (fpos == 0 || fpos == 1)
                            s += "b" + cubesuff[rs] + " ";
                        else
                            s += "f" + cubesuff[rs] + " ";
                    }
                    else {
                        s += turns[first][second] + cubesuff[rs] + " ";
                    }
                }
                done = 1;
            }
        } while (done == 0);
    }
    return s;
}
regScrambler("444yj", yj4x4);
function bicube(type, len) {
    function canMove(face) {
        let u = [], i, j, done, z = 0;
        for (i = 0; i < 9; i++) {
            done = 0;
            for (j = 0; j < u.length; j++) {
                if (u[j] == start[d[face][i]])
                    done = 1;
            }
            if (done == 0) {
                u[u.length] = start[d[face][i]];
                if (start[d[face][i]] == 0)
                    z = 1;
            }
        }
        return u.length == 5 && z == 1;
    }
    function doMove(face, amount) {
        for (let i = 0; i < amount; i++) {
            let t = start[d[face][0]];
            start[d[face][0]] = start[d[face][6]];
            start[d[face][6]] = start[d[face][4]];
            start[d[face][4]] = start[d[face][2]];
            start[d[face][2]] = t;
            t = start[d[face][7]];
            start[d[face][7]] = start[d[face][5]];
            start[d[face][5]] = start[d[face][3]];
            start[d[face][3]] = start[d[face][1]];
            start[d[face][1]] = t;
        }
    }
    const d = [
        [0, 1, 2, 5, 8, 7, 6, 3, 4],
        [6, 7, 8, 13, 20, 19, 18, 11, 12],
        [0, 3, 6, 11, 18, 17, 16, 9, 10],
        [8, 5, 2, 15, 22, 21, 20, 13, 14],
    ];
    let start = [1, 1, 2, 3, 3, 2, 4, 4, 0, 5, 6, 7, 8, 9, 10, 10, 5, 6, 7, 8, 9, 11, 11], move = "UFLR", s = "", arr = [], poss, done, i, j, x, y;
    while (arr.length < len) {
        poss = [1, 1, 1, 1];
        for (j = 0; j < 4; j++) {
            if (poss[j] == 1 && !canMove(j))
                poss[j] = 0;
        }
        done = 0;
        while (done == 0) {
            x = rn(4);
            if (poss[x] == 1) {
                y = rn(3) + 1;
                doMove(x, y);
                done = 1;
            }
        }
        arr[arr.length] = [x, y];
        if (arr.length >= 2) {
            if (arr[arr.length - 1][0] == arr[arr.length - 2][0]) {
                arr[arr.length - 2][1] = (arr[arr.length - 2][1] + arr[arr.length - 1][1]) % 4;
                arr = arr.slice(0, arr.length - 1);
            }
        }
        if (arr.length >= 1) {
            if (arr[arr.length - 1][1] == 0) {
                arr = arr.slice(0, arr.length - 1);
            }
        }
    }
    for (i = 0; i < len; i++) {
        s += move[arr[i][0]] + cubesuff[arr[i][1] - 1] + " ";
    }
    return s;
}
regScrambler("bic", bicube);
// Clock functions.
function c(s) {
    const array = [
        s + "=0",
        s + "+1",
        s + "+2",
        s + "+3",
        s + "+4",
        s + "+5",
        s + "+6",
        s + "-5",
        s + "-4",
        s + "-3",
        s + "-2",
        s + "-1",
    ];
    return " " + rndEl(array) + " ";
}
function c2() {
    return rndEl(["U", "d"]) + rndEl(["U", "d"]);
}
function c3() {
    return "     ";
}
function do15puzzle(mirrored, len, arrow, tiny) {
    const effect = [
        [0, -1],
        [1, 0],
        [-1, 0],
        [0, 1],
    ];
    let x = 0, y = 3, r, lastr = 5, ret = [];
    for (let i = 0; i < len; i++) {
        do {
            r = rn(4);
        } while (x + effect[r][0] < 0 ||
            x + effect[r][0] > 3 ||
            y + effect[r][1] < 0 ||
            y + effect[r][1] > 3 ||
            r + lastr == 3);
        x += effect[r][0];
        y += effect[r][1];
        if (ret.length > 0 && ret[ret.length - 1][0] == r) {
            ret[ret.length - 1][1]++;
        }
        else {
            ret.push([r, 1]);
        }
        lastr = r;
    }
    let retstr = "";
    for (let i = 0; i < ret.length; i++) {
        let m = mirrored ? ret[i][0] : 3 - ret[i][0];
        m = (arrow ? "\uFFEA\uFFE9\uFFEB\uFFEC" : "ULRD").charAt(m);
        if (tiny) {
            retstr += m + (ret[i][1] == 1 ? "" : ret[i][1]) + " ";
        }
        else {
            for (let j = 0; j < ret[i][1]; j++) {
                retstr += m + " ";
            }
        }
    }
    return retstr;
}
function pochscramble(x, y) {
    let ret = "";
    let i, j;
    for (i = 0; i < y; i++) {
        ret += "  ";
        for (j = 0; j < x; j++) {
            ret += (j % 2 == 0 ? "R" : "D") + rndEl(["++", "--"]) + " ";
        }
        ret += "U" + (ret.endsWith("-- ") ? "'\\n" : "\\n");
    }
    return ret;
}
function carrotscramble(x, y) {
    let ret = "";
    let i, j;
    for (i = 0; i < y; i++) {
        ret += " ";
        for (j = 0; j < x / 2; j++) {
            ret += rndEl(["+", "-"]) + rndEl(["+", "-"]) + " ";
        }
        ret += "U" + rndEl(["'\\n", "\\n"]);
    }
    return ret;
}
function gigascramble(len) {
    let ret = "";
    let i, j;
    for (i = 0; i < Math.ceil(len / 10); i++) {
        ret += "  ";
        for (j = 0; j < 10; j++) {
            ret +=
                (j % 2 == 0 ? "Rr".charAt(rn(2)) : "Dd".charAt(rn(2))) +
                    rndEl(["+ ", "++", "- ", "--"]) +
                    " ";
        }
        ret += "y" + rndEl(minxsuff) + "\n";
    }
    return ret;
}
function sq1_scramble(type, len) {
    seq = [];
    let i, k;
    sq1_getseq(1, type, len);
    let s = "";
    for (i = 0; i < seq[0].length; i++) {
        k = seq[0][i];
        if (k[0] == 7) {
            s += "/";
        }
        else {
            s += " (" + k[0] + "," + k[1] + ") ";
        }
    }
    return s;
}
function ssq1t_scramble(len) {
    seq = [];
    let i;
    sq1_getseq(2, 0, len);
    let s = seq[0], t = seq[1], u = "";
    if (s[0][0] == 7)
        s = [[0, 0]].concat(s);
    if (t[0][0] == 7)
        t = [[0, 0]].concat(t);
    for (i = 0; i < len; i++) {
        u += "(" + s[2 * i][0] + "," + t[2 * i][0] + "," + t[2 * i][1] + "," + s[2 * i][1] + ") / ";
    }
    return u;
}
function sq1_getseq(num, type, len) {
    for (let n = 0; n < num; n++) {
        p = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
        seq[n] = [];
        let cnt = 0;
        while (cnt < len) {
            const x = rn(12) - 5;
            const y = type == 2 ? 0 : rn(12) - 5;
            const size = (x == 0 ? 0 : 1) + (y == 0 ? 0 : 1);
            if ((cnt + size <= len || type != 1) && (size > 0 || cnt == 0)) {
                if (sq1_domove(x, y)) {
                    if (type == 1)
                        cnt += size;
                    if (size > 0)
                        seq[n][seq[n].length] = [x, y];
                    if (cnt < len || type != 1) {
                        cnt++;
                        seq[n][seq[n].length] = [7, 0];
                        sq1_domove(7, 0);
                    }
                }
            }
        }
    }
}
function sq1_domove(x, y) {
    let i, px, py;
    if (x == 7) {
        for (i = 0; i < 6; i++) {
            circle$1(p, i + 6, i + 12);
        }
        return true;
    }
    else {
        if (p[(17 - x) % 12] ||
            p[(11 - x) % 12] ||
            p[12 + ((17 - y) % 12)] ||
            p[12 + ((11 - y) % 12)]) {
            return false;
        }
        else {
            // do the move itself
            px = p.slice(0, 12);
            py = p.slice(12, 24);
            for (i = 0; i < 12; i++) {
                p[i] = px[(12 + i - x) % 12];
                p[i + 12] = py[(12 + i - y) % 12];
            }
            return true;
        }
    }
}
function moyuRedi(length) {
    const ret = [];
    for (let i = 0; i < length; i++) {
        ret.push(mega([["R"], ["L"]], ["", "'"], 3 + rn(3)));
    }
    return ret.join(" x ");
}
function addPyrTips(scramble, moveLen) {
    let cnt = 0;
    const rnd = [];
    for (let i = 0; i < 4; i++) {
        rnd[i] = rn(3);
        if (rnd[i] > 0) {
            rnd[i] = "ulrb".charAt(i) + ["! ", "' "][rnd[i] - 1];
            cnt++;
        }
        else {
            rnd[i] = "";
        }
    }
    return scramble.substr(0, scramble.length - moveLen * cnt) + " " + rnd.join("");
}
function utilscramble(type, len) {
    let ret = "";
    switch (type) {
        case "15p": // 15 puzzle
            return do15puzzle(false, len);
        case "15pm": // 15 puzzle, mirrored
            return do15puzzle(true, len);
        case "15pat": // 15 puzzle
            return do15puzzle(false, len, true, true);
        case "clkwca": // Clock (WCA Notation)
            const clkapp = ["0+", "1+", "2+", "3+", "4+", "5+", "6+", "1-", "2-", "3-", "4-", "5-"];
            ret = "UR? DR? DL? UL? U? R? D? L? ALL? y2 U? R? D? L? ALL?????";
            for (let i = 0; i < 14; i++) {
                ret = ret.replace("?", rndEl(clkapp));
            }
            return ret
                .replace("?", rndEl(["", " UR"]))
                .replace("?", rndEl(["", " DR"]))
                .replace("?", rndEl(["", " DL"]))
                .replace("?", rndEl(["", " UL"]));
        case "clk": // Clock (Jaap order)
            return ("UU" +
                c("u") +
                "dU" +
                c("u") +
                "dd" +
                c("u") +
                "Ud" +
                c("u") +
                "dU" +
                c("u") +
                "Ud" +
                c("u") +
                "UU" +
                c("u") +
                "UU" +
                c("u") +
                "UU" +
                c("u") +
                "dd" +
                c3() +
                c2() +
                "\\ndd" +
                c("d") +
                "dU" +
                c("d") +
                "UU" +
                c("d") +
                "Ud" +
                c("d") +
                "UU" +
                c3() +
                "UU" +
                c3() +
                "Ud" +
                c3() +
                "dU" +
                c3() +
                "UU" +
                c3() +
                "dd" +
                c("d") +
                c2());
        case "clkc": // Clock (concise)
            ret = "";
            for (let i = 0; i < 4; i++)
                ret += "(" + (rn(12) - 5) + ", " + (rn(12) - 5) + ") / ";
            for (let i = 0; i < 6; i++)
                ret += "(" + (rn(12) - 5) + ") / ";
            for (let i = 0; i < 4; i++)
                ret += rndEl(["d", "U"]);
            return ret;
        case "clke": // Clock (efficient order)
            return ("UU" +
                c("u") +
                "dU" +
                c("u") +
                "dU" +
                c("u") +
                "UU" +
                c("u") +
                "UU" +
                c("u") +
                "UU" +
                c("u") +
                "Ud" +
                c("u") +
                "Ud" +
                c("u") +
                "dd" +
                c("u") +
                "dd" +
                c3() +
                c2() +
                "\\nUU" +
                c3() +
                "UU" +
                c3() +
                "dU" +
                c("d") +
                "dU" +
                c3() +
                "dd" +
                c("d") +
                "Ud" +
                c3() +
                "Ud" +
                c("d") +
                "UU" +
                c3() +
                "UU" +
                c("d") +
                "dd" +
                c("d") +
                c2());
        case "giga": // Gigaminx
            return gigascramble(len);
        case "mgmo": // Megaminx (old style)
            return adjScramble(["F", "B", "U", "D", "L", "DBR", "DL", "BR", "DR", "BL", "R", "DBL"], [0x554, 0xaa8, 0x691, 0x962, 0xa45, 0x58a, 0x919, 0x626, 0x469, 0x896, 0x1a5, 0x25a], len);
        case "klmp": // Kilominx (Pochmann)
        case "mgmp": // Megaminx (Pochmann)
            return pochscramble(10, Math.ceil(len / 10));
        case "mgmc": // Megaminx (Carrot)
            return carrotscramble(10, Math.ceil(len / 10));
        case "kilo": // Kilominx (Pochmann)
            return pochscramble(5, Math.ceil(len / 5));
        case "heli":
            return adjScramble(["UF", "UR", "UB", "UL", "FR", "BR", "BL", "FL", "DF", "DR", "DB", "DL"], [0x09a, 0x035, 0x06a, 0x0c5, 0x303, 0x606, 0xc0c, 0x909, 0xa90, 0x530, 0xa60, 0x5c0], len);
        case "redi":
            return adjScramble(["L", "R", "F", "B", "l", "r", "f", "b"], [0x1c, 0x2c, 0x43, 0x83, 0xc1, 0xc2, 0x34, 0x38], len, ["", "'"]);
        case "redim":
            return moyuRedi(len);
        case "pyrm": // Pyraminx (random moves)
            ret = mega([["U"], ["L"], ["R"], ["B"]], ["!", "'"], len);
            return addPyrTips(ret, 3).replace(/!/g, "");
        case "prcp": // Pyraminx Crystal (Pochmann)
            return pochscramble(10, Math.ceil(len / 10));
        case "mpyr": // Master Pyraminx
            ret = adjScramble(["U!", "L!", "R!", "B!", "Uw", "Lw", "Rw", "Bw"], [0xe0, 0xd0, 0xb0, 0x70, 0xee, 0xdd, 0xbb, 0x77], len, ["!", "'"]);
            return addPyrTips(ret, 4).replace(/!/g, "");
        case "r3": // multiple 3x3x3 relay
            for (let i = 0; i < len; i++) {
                ret += (i == 0 ? "" : "\\n") + (i + 1) + ") ${333}";
            }
            return formatScramble$1(ret);
        case "r3ni": // multiple 3x3x3 bld
            for (let i = 0; i < len; i++) {
                ret += (i == 0 ? "" : "\\n") + (i + 1) + ") ${333ni}";
            }
            return formatScramble$1(ret);
        case "sq1h": // Square-1 (turn metric)
            return sq1_scramble(1, len);
        case "sq1t": // Square-1 (twist metric)
            return sq1_scramble(0, len);
        case "sq2": // Square-2
            let i = 0;
            while (i < len) {
                const rndu = rn(12) - 5;
                const rndd = rn(12) - 5;
                if (rndu != 0 || rndd != 0) {
                    i++;
                    ret += "(" + rndu + "," + rndd + ") / ";
                }
            }
            return ret;
        case "ssq1t": // Super Square-1 (twist metric)
            return ssq1t_scramble(len);
        case "bsq": // Bandaged Square-1 </,(1,0)>
            return sq1_scramble(2, len);
        case "-1": // -1x-1x-1 (micro style)
            for (let i = 0; i < len; i++) {
                ret += String.fromCharCode(32 + rn(224));
            }
            ret += "Error: subscript out of range";
            return ret;
        case "333noob": // 3x3x3 for noobs
            ret = mega([
                ["turn the top face", "turn the bottom face"],
                ["turn the right face", "turn the left face"],
                ["turn the front face", "turn the back face"],
            ], " clockwise by 90 degrees,| counterclockwise by 90 degrees,| by 180 degrees,".split("|"), len).replace(/t/, "T");
            return ret.substr(0, ret.length - 2) + ".";
        case "lol": // LOL
            ret = mega([["L"], ["O"]], 0, len);
            return ret.replace(/ /g, "");
    }
}
regScrambler([
    "15p",
    "15pm",
    "15pat",
    "clkwca",
    "clk",
    "clkc",
    "clke",
    "giga",
    "mgmo",
    "mgmp",
    "mgmc",
    "kilo",
    "klmp",
    "heli",
    "redi",
    "redim",
    "pyrm",
    "prcp",
    "mpyr",
    "r3",
    "r3ni",
    "sq1h",
    "sq1t",
    "sq2",
    "ssq1t",
    "bsq",
    "-1",
    "333noob",
    "lol",
], utilscramble);

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
const U = 0, R = 5, F = 10, L = 15, BL = 20, BR = 25, DR = 30, DL = 35, DBL = 40, B = 45, DBR = 50, D = 55;
const kiloFacelet = [
    [U + 2, R + 3, F + 4],
    [U + 3, F + 3, L + 4],
    [U + 4, L + 3, BL + 4],
    [U + 0, BL + 3, BR + 4],
    [U + 1, BR + 3, R + 4],
    [D + 3, B + 0, DBL + 1],
    [D + 2, DBR + 0, B + 1],
    [D + 1, DR + 0, DBR + 1],
    [D + 0, DL + 0, DR + 1],
    [D + 4, DBL + 0, DL + 1],
    [F + 0, R + 2, DR + 3],
    [L + 0, F + 2, DL + 3],
    [BL + 0, L + 2, DBL + 3],
    [BR + 0, BL + 2, B + 3],
    [R + 0, BR + 2, DBR + 3],
    [B + 4, BL + 1, DBL + 2],
    [DBR + 4, BR + 1, B + 2],
    [DR + 4, R + 1, DBR + 2],
    [DL + 4, F + 1, DR + 2],
    [DBL + 4, L + 1, DL + 2],
];
class KiloCubie {
    constructor() {
        this.perm = [];
        this.twst = [];
        for (let i = 0; i < 20; i++) {
            this.perm[i] = i;
            this.twst[i] = 0;
        }
    }
    toFaceCube(kFacelet) {
        kFacelet = kFacelet || kiloFacelet;
        const f = [];
        for (let c = 0; c < 20; c++) {
            const j = this.perm[c];
            const ori = this.twst[c];
            for (let n = 0; n < 3; n++) {
                f[kFacelet[c][(n + ori) % 3]] = ~~(kFacelet[j][n] / 5);
            }
        }
        return f;
    }
    fromFacelet(facelet, kFacelet) {
        kFacelet = kFacelet || kiloFacelet;
        let count = 0;
        const f = [];
        for (let i = 0; i < 60; ++i) {
            f[i] = facelet[i];
            count += Math.pow(16, f[i]);
        }
        if (count != 0x555555555555) {
            return -1;
        }
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                let twst = -1;
                for (let t = 0; t < 3; t++) {
                    if (~~(kFacelet[j][0] / 5) == f[kFacelet[i][t]] &&
                        ~~(kFacelet[j][1] / 5) == f[kFacelet[i][(t + 1) % 3]] &&
                        ~~(kFacelet[j][2] / 5) == f[kFacelet[i][(t + 2) % 3]]) {
                        twst = t;
                        break;
                    }
                }
                if (twst != -1) {
                    this.perm[i] = j;
                    this.twst[i] = twst;
                }
            }
        }
        return this;
    }
    hashCode() {
        let ret = 0;
        for (let i = 0; i < 20; i++) {
            ret = 0 | (ret * 31 + this.perm[i] * 3 + this.twst[i]);
        }
        return ret;
    }
    static KiloMult(a, b, prod) {
        for (let i = 0; i < 20; i++) {
            prod.perm[i] = a.perm[b.perm[i]];
            prod.twst[i] = (a.twst[b.perm[i]] + b.twst[i]) % 3;
        }
    }
    static KiloMult3(a, b, c, prod) {
        for (let i = 0; i < 20; i++) {
            prod.perm[i] = a.perm[b.perm[c.perm[i]]];
            prod.twst[i] =
                (a.twst[b.perm[c.perm[i]]] + b.twst[c.perm[i]] + c.twst[i]) % 3;
        }
    }
    invFrom(cc) {
        for (let i = 0; i < 20; i++) {
            this.perm[cc.perm[i]] = i;
            this.twst[cc.perm[i]] = (3 - cc.twst[i]) % 3;
        }
        return this;
    }
    init(perm, twst) {
        this.perm = perm.slice();
        this.twst = twst.slice();
        return this;
    }
    isEqual(c) {
        for (let i = 0; i < 20; i++) {
            if (this.perm[i] != c.perm[i] || this.twst[i] != c.twst[i]) {
                return false;
            }
        }
        return true;
    }
    setComb(idx, r) {
        r = r || 4;
        let fill = 19;
        for (let i = 19; i >= 0; i--) {
            if (idx >= Cnk[i][r]) {
                idx -= Cnk[i][r--];
                this.perm[i] = r;
            }
            else {
                this.perm[i] = fill--;
            }
            this.twst[i] = 0;
        }
    }
    getComb(r) {
        r = r || 4;
        const thres = r;
        let idxComb = 0;
        let idxOri = 0;
        const permR = [];
        for (let i = 19; i >= 0; i--) {
            if (this.perm[i] < thres) {
                idxComb += Cnk[i][r--];
                idxOri = idxOri * 3 + this.twst[i];
                permR[r] = this.perm[i];
            }
        }
        return [idxComb, getNPerm$1(permR, thres), idxOri];
    }
    faceletMove(face, pow, wide) {
        const facelet = this.toFaceCube();
        const state = [];
        for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 5; j++) {
                state[i * 11 + j] = facelet[i * 5 + j];
                state[i * 11 + j + 5] = 0;
            }
            state[i * 11 + 10] = 0;
        }
        minx.doMove(state, face, pow, wide);
        for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 5; j++) {
                facelet[i * 5 + j] = state[i * 11 + j];
            }
        }
        this.fromFacelet(facelet);
    }
}
KiloCubie.SOLVED = new KiloCubie();
KiloCubie.moveCube = [];
KiloCubie.symCube = [];
KiloCubie.symMult = [];
KiloCubie.symMulI = [];
KiloCubie.symMulM = [];
function createMoveCube() {
    //init move
    const moveCube = [];
    const moveHash = [];
    for (let i = 0; i < 12 * 4; i++) {
        moveCube[i] = new KiloCubie();
    }
    for (let a = 0; a < 48; a += 4) {
        moveCube[a].faceletMove(a >> 2, 1, 0);
        moveHash[a] = moveCube[a].hashCode();
        for (let p = 0; p < 3; p++) {
            KiloCubie.KiloMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
            moveHash[a + p + 1] = moveCube[a + p + 1].hashCode();
        }
    }
    KiloCubie.moveCube = moveCube;
    //init sym
    const symCube = [];
    const symMult = [];
    const symMulI = [];
    const symMulM = [];
    const symHash = [];
    const tmp = new KiloCubie();
    for (let s = 0; s < 60; s++) {
        symCube[s] = new KiloCubie().init(tmp.perm, tmp.twst);
        symHash[s] = symCube[s].hashCode();
        symMult[s] = [];
        symMulI[s] = [];
        tmp.faceletMove(0, 1, 1); // [U]
        if (s % 5 == 4) {
            // [F] or [R]
            tmp.faceletMove(s % 10 == 4 ? 1 : 2, 1, 1);
        }
        if (s % 30 == 29) {
            tmp.faceletMove(1, 2, 1);
            tmp.faceletMove(2, 1, 1);
            tmp.faceletMove(0, 3, 1);
        }
    }
    for (let i = 0; i < 60; i++) {
        for (let j = 0; j < 60; j++) {
            KiloCubie.KiloMult(symCube[i], symCube[j], tmp);
            const k = symHash.indexOf(tmp.hashCode());
            symMult[i][j] = k;
            symMulI[k][j] = i;
        }
    }
    for (let s = 0; s < 60; s++) {
        symMulM[s] = [];
        for (let j = 0; j < 12; j++) {
            KiloCubie.KiloMult3(symCube[symMulI[0][s]], moveCube[j * 4], symCube[s], tmp);
            const k = moveHash.indexOf(tmp.hashCode());
            symMulM[s][j] = k >> 2;
        }
    }
    KiloCubie.symCube = symCube;
    KiloCubie.symMult = symMult;
    KiloCubie.symMulI = symMulI;
    KiloCubie.symMulM = symMulM;
}
class CombCoord {
    constructor(cubieMap) {
        this.map = new KiloCubie();
        this.imap = new KiloCubie();
        this.map.perm = cubieMap.slice();
        for (let i = 0; i < 20; i++) {
            if (cubieMap.indexOf(i) == -1) {
                this.map.perm.push(i);
            }
        }
        this.imap.invFrom(this.map);
        this.tmp = new KiloCubie();
    }
    get(cc, r) {
        KiloCubie.KiloMult3(this.imap, cc, this.map, this.tmp);
        return this.tmp.getComb(r);
    }
    set(cc, idx, r) {
        this.tmp.setComb(idx, r);
        KiloCubie.KiloMult3(this.map, this.tmp, this.imap, cc);
    }
}
KiloCubie.CombCoord = CombCoord;
const perm4Mult = [];
const perm4MulT = [];
const perm4TT = [];
const ckmv = [];
const y2Move = [0, 3, 4, 5, 1, 2, 8, 9, 10, 6, 7, 11];
const yMove = [0, 2, 3, 4, 5, 1, 7, 8, 9, 10, 6, 11];
function comb4FullMove(moveTable, idx, move) {
    let slice = ~~(idx / 81 / 24);
    let perm = ~~(idx / 81) % 24;
    let twst = idx % 81;
    const val = moveTable[move][slice];
    slice = val[0];
    perm = perm4Mult[perm][val[1]];
    twst = perm4TT[perm4MulT[val[1]][twst]][val[2]];
    return slice * 81 * 24 + perm * 81 + twst;
}
function comb3FullMove(moveTable, idx, move) {
    let slice = ~~(idx / 27 / 6);
    let perm = ~~(idx / 27) % 6;
    let twst = idx % 27;
    const val = moveTable[move][slice];
    slice = val[0];
    perm = perm4Mult[perm][val[1]];
    twst = perm4TT[perm4MulT[val[1]][twst * 3] / 3][val[2]];
    return slice * 27 * 6 + perm * 27 + twst;
}
let isInit = false;
function init() {
    if (isInit)
        return;
    isInit = true;
    performance.now();
    createMoveCube();
    function setTwst4(arr, idx) {
        for (let k = 0; k < 4; k++) {
            arr[k] = idx % 3;
            idx = ~~(idx / 3);
        }
    }
    function getTwst4(arr) {
        let idx = 0;
        for (let k = 3; k >= 0; k--) {
            idx = idx * 3 + arr[k];
        }
        return idx;
    }
    const perm1 = [];
    const perm2 = [];
    const perm3 = [];
    for (let i = 0; i < 24; i++) {
        perm4Mult[i] = [];
        setNPerm$1(perm1, i, 4);
        for (let j = 0; j < 24; j++) {
            setNPerm$1(perm2, j, 4);
            for (let k = 0; k < 4; k++) {
                perm3[k] = perm1[perm2[k]];
            }
            perm4Mult[i][j] = getNPerm$1(perm3, 4);
        }
    }
    for (let j = 0; j < 24; j++) {
        perm4MulT[j] = [];
        setNPerm$1(perm2, j, 4);
        for (let i = 0; i < 81; i++) {
            setTwst4(perm1, i);
            for (let k = 0; k < 4; k++) {
                perm3[k] = perm1[perm2[k]];
            }
            perm4MulT[j][i] = getTwst4(perm3);
        }
    }
    for (let j = 0; j < 81; j++) {
        perm4TT[j] = [];
        setTwst4(perm2, j);
        for (let i = 0; i < 81; i++) {
            setTwst4(perm1, i);
            for (let k = 0; k < 4; k++) {
                perm3[k] = (perm1[k] + perm2[k]) % 3;
            }
            perm4TT[j][i] = getTwst4(perm3);
        }
    }
    const tmp1 = new KiloCubie();
    const tmp2 = new KiloCubie();
    for (let m1 = 0; m1 < 12; m1++) {
        ckmv[m1] = 1 << m1;
        for (let m2 = 0; m2 < m1; m2++) {
            KiloCubie.KiloMult(KiloCubie.moveCube[m1 * 4], KiloCubie.moveCube[m2 * 4], tmp1);
            KiloCubie.KiloMult(KiloCubie.moveCube[m2 * 4], KiloCubie.moveCube[m1 * 4], tmp2);
            if (tmp1.isEqual(tmp2)) {
                ckmv[m1] |= 1 << m2;
            }
        }
    }
    initPhase1();
    initPhase2();
    initPhase3();
}
const Phase1Move = [];
const Phase2Move = [];
const Phase3Move = [];
const Phase1Prun = [];
const Phase2Prun = [];
const Phase3Prun = [];
let phase1Coord;
let phase2Coord;
let phase3Coord;
function initPhase1() {
    phase1Coord = new CombCoord([5, 6, 7, 8, 9]);
    const tmp1 = new KiloCubie();
    const tmp2 = new KiloCubie();
    createMove(Phase1Move, 1140, function (idx, move) {
        phase1Coord.set(tmp1, idx, 3);
        KiloCubie.KiloMult(tmp1, KiloCubie.moveCube[move * 4], tmp2);
        return phase1Coord.get(tmp2, 3);
    }, 12);
    createPrun$1(Phase1Prun, 0, 1140 * 27 * 6, 8, comb3FullMove.bind(null, Phase1Move), 12, 4, 5);
}
function initPhase2() {
    phase2Coord = new CombCoord([
        13, 15, 16, 0, 1, 2, 3, 4, 10, 11, 12, 14, 17, 18, 19,
    ]);
    const tmp1 = new KiloCubie();
    const tmp2 = new KiloCubie();
    createMove(Phase2Move, 455, function (idx, move) {
        phase2Coord.set(tmp1, idx, 3);
        KiloCubie.KiloMult(tmp1, KiloCubie.moveCube[move * 4], tmp2);
        return phase2Coord.get(tmp2, 3);
    }, 6);
    createPrun$1(Phase2Prun, 0, 455 * 27 * 6, 8, comb3FullMove.bind(null, Phase2Move), 6, 4, 4);
}
function initPhase3() {
    phase3Coord = new CombCoord([0, 1, 2, 3, 4, 10, 11, 14, 17, 18]);
    const tmp1 = new KiloCubie();
    const tmp2 = new KiloCubie();
    createMove(Phase3Move, 210, function (idx, move) {
        phase3Coord.set(tmp1, idx);
        KiloCubie.KiloMult(tmp1, KiloCubie.moveCube[move * 4], tmp2);
        return phase3Coord.get(tmp2);
    }, 3);
    createPrun$1(Phase3Prun, 0, 210 * 81 * 24, 14, comb4FullMove.bind(null, Phase3Move), 3, 4, 6);
}
function idaSearch(idx, isSolved, getPrun, doMove, N_AXIS, maxl, lm, sol) {
    if (maxl == 0) {
        return isSolved(idx);
    }
    else if (getPrun(idx) > maxl) {
        return false;
    }
    for (let axis = 0; axis < N_AXIS; axis++) {
        if ((ckmv[lm] >> axis) & 1) {
            continue;
        }
        let idx1 = idx;
        for (let pow = 0; pow < 4; pow++) {
            idx1 = doMove(idx1, axis);
            if (idx1 == null) {
                break;
            }
            if (idaSearch(idx1, isSolved, getPrun, doMove, N_AXIS, maxl - 1, axis, sol)) {
                sol.push([axis, pow]);
                // sol.push(["U", "R", "F", "L", "BL", "BR", "DR", "DL", "DBL", "B", "DBR", "D"][axis] + ["", "2", "2'", "'"][pow]);
                return true;
            }
        }
    }
    return false;
}
function solve(idx, isSolved, getPrun, doMove, N_AXIS, maxl) {
    const sol = [];
    for (let l = 0; l <= maxl; l++) {
        if (idaSearch(idx, isSolved, getPrun, doMove, N_AXIS, l, -1, sol)) {
            break;
        }
    }
    sol.reverse();
    return sol;
}
// function solveMulti(idxs, isSolved, getPrun, doMove, N_AXIS, maxl) {
// 	let sol = [];
// 	let s = 0;
// 	out: for (let l = 0; l <= maxl; l++) {
// 		for (s = 0; s < idxs.length; s++) {
// 			if (idaSearch(idxs[s], isSolved, getPrun, doMove, N_AXIS, l, -1, sol)) {
// 				break out;
// 			}
// 		}
// 	}
// 	sol.reverse();
// 	return [s, sol];
// }
function move2str(moves) {
    const ret = [];
    for (let i = 0; i < moves.length; i++) {
        ret.push(["U", "R", "F", "L", "BL", "BR", "DR", "DL", "DBL", "B", "DBR", "D"][moves[i][0]] + ["", "2", "2'", "'"][moves[i][1]]);
    }
    return ret.join(" ");
}
function solveKiloCubie(cc) {
    init();
    const kc0 = new KiloCubie();
    const kc1 = new KiloCubie();
    kc0.init(cc.perm, cc.twst);
    let idx;
    //phase1
    const doPhase1Move = comb3FullMove.bind(null, Phase1Move);
    let val0 = phase1Coord.get(kc0, 3);
    KiloCubie.KiloMult3(KiloCubie.symCube[KiloCubie.symMulI[0][2]], kc0, KiloCubie.symCube[2], kc1);
    let val1 = phase1Coord.get(kc1, 3);
    idx = [
        val0[0] * 27 * 6 + val0[1] * 27 + val0[2],
        val1[0] * 27 * 6 + val1[1] * 27 + val1[2],
    ];
    const sol1 = solve(idx, function (idx) {
        return idx[0] == 0 && idx[1] == 0;
    }, function (idx) {
        return Math.max(getPruning$1(Phase1Prun, idx[0]), getPruning$1(Phase1Prun, idx[1]));
    }, function (idx, move) {
        const idx1 = [
            doPhase1Move(idx[0], move),
            doPhase1Move(idx[1], y2Move[move]),
        ];
        if (idx1[0] == idx[0] && idx1[1] == idx[1]) {
            return null;
        }
        return idx1;
    }, 12, 9);
    for (let i = 0; i < sol1.length; i++) {
        const move = sol1[i];
        KiloCubie.KiloMult(kc0, KiloCubie.moveCube[move[0] * 4 + move[1]], kc1);
        kc0.init(kc1.perm, kc1.twst);
    }
    //phase2
    const doPhase2Move = comb3FullMove.bind(null, Phase2Move);
    val0 = phase2Coord.get(kc0, 3);
    KiloCubie.KiloMult3(KiloCubie.symCube[KiloCubie.symMulI[0][1]], kc0, KiloCubie.symCube[1], kc1);
    val1 = phase2Coord.get(kc1, 3);
    idx = [
        val0[0] * 27 * 6 + val0[1] * 27 + val0[2],
        val1[0] * 27 * 6 + val1[1] * 27 + val1[2],
    ];
    const sol2 = solve(idx, function (idx) {
        return idx[0] == 0 && idx[1] == 0;
    }, function (idx) {
        return Math.max(getPruning$1(Phase2Prun, idx[0]), getPruning$1(Phase2Prun, idx[1]));
    }, function (idx, move) {
        const idx1 = [
            doPhase2Move(idx[0], move),
            doPhase2Move(idx[1], yMove[move]),
        ];
        if (idx1[0] == idx[0] && idx1[1] == idx[1]) {
            return null;
        }
        return idx1;
    }, 6, 14);
    for (let i = 0; i < sol2.length; i++) {
        const move = sol2[i];
        KiloCubie.KiloMult(kc0, KiloCubie.moveCube[move[0] * 4 + move[1]], kc1);
        kc0.init(kc1.perm, kc1.twst);
    }
    //phase3
    const doPhase3Move = comb4FullMove.bind(null, Phase3Move);
    val0 = phase3Coord.get(kc0);
    KiloCubie.KiloMult3(KiloCubie.symCube[KiloCubie.symMulI[0][6]], kc0, KiloCubie.symCube[6], kc1);
    val1 = phase3Coord.get(kc1);
    KiloCubie.KiloMult3(KiloCubie.symCube[KiloCubie.symMulI[0][29]], kc0, KiloCubie.symCube[29], kc1);
    const val2 = phase3Coord.get(kc1);
    idx = [
        val0[0] * 81 * 24 + val0[1] * 81 + val0[2],
        val1[0] * 81 * 24 + val1[1] * 81 + val1[2],
        val2[0] * 81 * 24 + val2[1] * 81 + val2[2],
    ];
    const sol3 = solve(idx, function (idx) {
        return idx[0] == 0 && idx[1] == 0 && idx[2] == 0;
    }, function (idx) {
        return Math.max(getPruning$1(Phase3Prun, idx[0]), getPruning$1(Phase3Prun, idx[1]), getPruning$1(Phase3Prun, idx[2]));
    }, function (idx, move) {
        return [
            doPhase3Move(idx[0], move),
            doPhase3Move(idx[1], (move + 1) % 3),
            doPhase3Move(idx[2], (move + 2) % 3),
        ];
    }, 3, 14);
    return move2str(Array.prototype.concat(sol1, sol2, sol3));
}
function getScramble$2() {
    init();
    const cc = new KiloCubie();
    cc.perm = rndPerm(20, true);
    let chksum = 60;
    for (let i = 0; i < 19; i++) {
        const t = rn(3);
        cc.twst[i] = t;
        chksum -= t;
    }
    cc.twst[19] = chksum % 3;
    return solveKiloCubie(cc);
}
regScrambler("klmso", getScramble$2);

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
function getScramble$1(mode, len, pb) {
    return (scramblers.get(mode) || (() => ""))
        .apply(null, [mode, Math.abs(len), pb < 0 ? undefined : pb])
        .replace(/\\n/g, "<br>")
        .trim();
}

const ScramblerList = [
    "222so",
    "333",
    "333fm",
    "333ni",
    "333mbf",
    "333oh",
    "444bld",
    "444wca",
    "555wca",
    "555bld",
    "666wca",
    "777wca",
    "clkwca",
    "mgmp",
    "pyrso",
    "skbso",
    "sqrs",
];
const COLORS = {
    green: "rgb(0,157,84)",
    red: "rgb(220,66,47)",
    blue: "rgb(61,129,246)",
    orange: "rgb(232,112,0)",
    yellow: "rgb(255,235,59)",
    white: "rgb(230,230,230)",
    black: "rgb(0,0,0)",
    gray: "rgb(75,81,90)",
    darkGray: "rgb(50,50,50)",
    lightGray: "rgb(211,211,211)",
    violet: "rgb(138,27,255)",
    pink: "rgb(237,150,161)",
    lgreen: "rgb(74,217,49)",
    lyellow: "rgb(220,211,165)",
    lblue: "rgb(83,177,243)",
    /// Printable
    pgreen: "rgb(16,162,4)",
    pred: "rgb(213,0,0)",
    pblue: "rgb(43,43,255)",
    porange: "rgb(255,108,11)",
    pyellow: "rgb(255,242,0)",
    pwhite: "rgb(255,255,255)",
    pblack: "rgb(0,0,0)",
    pgray: "rgb(200,200,200)",
    pviolet: "rgb(185,104,251)",
    ppink: "rgb(249,187,204)",
    plgreen: "rgb(74,217,49)",
    plyellow: "rgb(255,255,183)",
    plblue: "rgb(83,177,243)",
};
function getColorByName(colorName) {
    return COLORS[colorName] || colorName;
}
const STANDARD_PALETTE = {
    y: getColorByName("yellow"),
    r: getColorByName("red"),
    o: getColorByName("orange"),
    b: getColorByName("blue"),
    g: getColorByName("green"),
    w: getColorByName("white"),
    x: getColorByName("gray"),
    d: getColorByName("black"),
    v: getColorByName("violet"),
    k: getColorByName("yellow"),
    yellow: getColorByName("yellow"),
    red: getColorByName("red"),
    orange: getColorByName("orange"),
    blue: getColorByName("blue"),
    green: getColorByName("green"),
    white: getColorByName("white"),
    gray: getColorByName("gray"),
    darkGray: getColorByName("darkGray"),
    lightGray: getColorByName("lightGray"),
    black: getColorByName("black"),
    violet: getColorByName("violet"),
    pink: getColorByName("pink"),
    lblue: getColorByName("lblue"),
    lyellow: getColorByName("lyellow"),
    lgreen: getColorByName("lgreen"),
};
function strToHex(color) {
    const nums = color.split("(")[1].split(")")[0].split(",").map(Number);
    return (nums[0] << 16) | (nums[1] << 8) | nums[2];
}
// SCRAMBLER OPTIONS
const R222 = [
    "222so",
    "222o",
    "2223",
    "2226",
    "222eg",
    "222eg0",
    "222eg1",
    "222eg2",
    "222nb",
    "222tcp",
    "222tcn",
    "222lsall",
];
const R333 = [
    "333",
    "333ni",
    "333fm",
    "333oh",
    "333o",
    "edges",
    "corners",
    "ll",
    "zbll",
    "cll",
    "ell",
    "lse",
    "lsemu",
    "cmll",
    "f2l",
    "lsll2",
    "2gll",
    "zbls",
    "zzll",
    "oll",
    "pll",
    "eoline",
    "easyc",
    "333ft",
    "333custom",
    "2gen",
    "2genl",
    "roux",
    "3gen_F",
    "3gen_L",
    "RrU",
    "half",
    "lsll",
    "coll",
    "eols",
    "wvls",
    "vls",
    "easyxc",
    "sbrx",
    "mt3qb",
    "mteole",
    "mttdr",
    "mt6cp",
    "mtcdrll",
    "mtl5ep",
    "ttll",
];
const R444 = [
    "444wca",
    "444bld",
    "444m",
    "444",
    "444yj",
    "4edge",
    "RrUu",
];
const R555 = ["555wca", "555bld", "555", "5edge"];
const R666 = ["666wca", "666si", "666p", "666s", "6edge"];
const R777 = ["777wca", "777si", "777p", "777s", "7edge"];
const PYRA = [
    "pyrso",
    "pyro",
    "pyrm",
    "pyrl4e",
    "pyr4c",
    "pyrnb",
];
const SKWB = ["skbso", "skbo", "skb", "skbnb"];
const SQR1 = ["sqrs", "sqrcsp", "sq1h", "sq1t"];
const CLCK = [
    "clkwca",
    "clk",
    "clkwca",
    "clko",
    "clkc",
    "clke",
];
const MEGA = [
    "mgmp",
    "mgmc",
    "mgmo",
    "minx2g",
    "mlsll",
    "mgmll",
    "mgmpll",
];
const KILO = ["klmso", "klmp"];
const GIGA = ["giga"];
const MISC = [
    ["r3", "r3ni"],
    "r234w",
    "r2345w",
    "r23456w",
    "r234567w",
    "r234",
    "r2345",
    "r23456",
    "r234567",
    "sq2",
    "bic",
    ["gearso", "gearo", "gear"],
    ["redim", "redi"],
    ["ivy", "ivyo", "ivyso"],
    ["prcp", "prco"],
    ["heli"],
    ["888"],
    ["999"],
    ["101010"],
    ["111111"],
    ["mpyr"],
    ["223"],
    ["233"],
    ["334"],
    ["336"],
    ["ssq1t"],
    ["fto"],
    ["133"],
    ["sfl"],
];
const OPTS = [
    { type: "rubik", order: [2] },
    { type: "rubik", order: [3] },
    { type: "rubik", order: [4] },
    { type: "rubik", order: [5] },
    { type: "rubik", order: [6] },
    { type: "rubik", order: [7] },
    { type: "pyraminx", order: [3] },
    { type: "skewb" },
    { type: "square1" },
    { type: "clock" },
    { type: "megaminx", order: [3] },
    { type: "megaminx", order: [2] },
    { type: "megaminx", order: [5] },
];
const OPTS_MISC = [
    [{ type: "rubik", order: [3] }],
    [2, 3, 4].map((n) => ({ type: "rubik", order: [n] })),
    [2, 3, 4, 5].map((n) => ({ type: "rubik", order: [n] })),
    [2, 3, 4, 5, 6].map((n) => ({ type: "rubik", order: [n] })),
    [2, 3, 4, 5, 6, 7].map((n) => ({ type: "rubik", order: [n] })),
    [2, 3, 4].map((n) => ({ type: "rubik", order: [n] })),
    [2, 3, 4, 5].map((n) => ({ type: "rubik", order: [n] })),
    [2, 3, 4, 5, 6].map((n) => ({ type: "rubik", order: [n] })),
    [2, 3, 4, 5, 6, 7].map((n) => ({ type: "rubik", order: [n] })),
    [{ type: "square2" }],
    [{ type: "bicube" }],
    [{ type: "gear" }],
    [{ type: "redi" }],
    [{ type: "ivy" }],
    [{ type: "pyraminxCrystal" }],
    [{ type: "helicopter" }],
    [{ type: "rubik", order: [8] }],
    [{ type: "rubik", order: [9] }],
    [{ type: "rubik", order: [10] }],
    [{ type: "rubik", order: [11] }],
    [{ type: "pyraminx", order: [4] }],
    [{ type: "rubik", order: [2, 2, 3] }],
    [{ type: "rubik", order: [3, 3, 2] }],
    [{ type: "rubik", order: [3, 3, 4] }],
    [{ type: "rubik", order: [3, 3, 6] }],
    [{ type: "supersquare1" }],
    [{ type: "fto" }],
    [{ type: "rubik", order: [3, 3, 1] }],
    [{ type: "rubik", order: [3, 1, 3] }],
];
const MODES = [
    R222,
    R333,
    R444,
    R555,
    R666,
    R777,
    PYRA,
    SKWB,
    SQR1,
    CLCK,
    MEGA,
    KILO,
    GIGA,
];
const options = new Map();
for (let i = 0, maxi = MODES.length; i < maxi; i += 1) {
    for (let j = 0, maxj = MODES[i].length; j < maxj; j += 1) {
        options.set(MODES[i][j], OPTS[i]);
    }
}
for (let i = 0, maxi = MISC.length; i < maxi; i += 1) {
    let m = MISC[i];
    if (Array.isArray(m)) {
        m.forEach((m) => options.set(m, OPTS_MISC[i]));
    }
    else {
        options.set(m, OPTS_MISC[i]);
    }
}

const EPS = 1e-6;
const PI = Math.PI;
const TAU = PI * 2;
function getCanonical(v) {
    const dirs = [UP, RIGHT, FRONT, DOWN, LEFT, BACK];
    for (let i = 0, maxi = dirs.length; i < maxi; i += 1) {
        if (dirs[i].equals(v)) {
            return dirs[i].clone();
        }
    }
    let cmps = [v.x, v.y, v.z];
    cmps = cmps.map(n => (Math.abs(n - Math.round(n)) < EPS ? Math.round(n) : n));
    return new Vector3D(cmps[0], cmps[1], cmps[2]);
}
class Vector3D {
    constructor(x, y, z, isConstant = false) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.isConstant = isConstant;
    }
    static cross(a, b, c) {
        const v1 = b.sub(a);
        const v2 = c.sub(b);
        return v1.cross(v2);
    }
    static crossValue(a, b, c) {
        return (a.x * (b.y * c.z - c.y * b.z) - a.y * (b.x * c.z - c.x * b.z) + a.z * (b.x * c.y - c.x * b.y));
    }
    static direction(p1, p2, p3, vec) {
        return Vector3D.direction1(p1, Vector3D.cross(p1, p2, p3), vec);
    }
    static direction1(anchor, u, pt) {
        const dot = u.dot(pt.sub(anchor));
        if (Math.abs(dot) < EPS) {
            return 0;
        }
        return Math.sign(dot);
    }
    static project(pt, a, b, c) {
        return Vector3D.project1(pt, a, Vector3D.cross(a, b, c).unit());
    }
    static project1(pt, a, u) {
        const v = pt.sub(a);
        const dist = u.dot(v);
        return pt.add(u.mul(-dist));
    }
    setConstant(cnt) {
        this.isConstant = cnt;
    }
    project(a, b, c) {
        return this.project1(a, Vector3D.cross(a, b, c).unit());
    }
    project1(a, u) {
        return Vector3D.project1(this, a, u);
    }
    reflect(a, b, c, self) {
        if (self && this.isConstant) {
            console.log("Trying to modify a constant vector");
            return this;
        }
        return this.reflect1(a, Vector3D.cross(a, b, c).unit(), self);
    }
    reflect1(a, u, self) {
        if (self && this.isConstant) {
            console.log("Trying to modify a constant vector");
            return this;
        }
        return this.add(u.mul(-2 * this.sub(a).dot(u)), self);
    }
    cross(v) {
        return getCanonical(new Vector3D(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x));
    }
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    add(v, self) {
        if (self && this.isConstant) {
            console.log("Trying to modify a constant vector");
            return this;
        }
        if (self) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }
        return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    sub(v, self) {
        if (self && this.isConstant) {
            console.log("Trying to modify a constant vector");
            return this;
        }
        if (self) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        }
        return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    mul(f, self) {
        if (self && this.isConstant) {
            console.log("Trying to modify a constant vector");
            return this;
        }
        if (self) {
            this.x *= f;
            this.y *= f;
            this.z *= f;
            return this;
        }
        return new Vector3D(this.x * f, this.y * f, this.z * f);
    }
    div(f, self) {
        if (self && this.isConstant) {
            console.log("Trying to modify a constant vector");
            return this;
        }
        if (self) {
            this.x /= f;
            this.y /= f;
            this.z /= f;
            return this;
        }
        return new Vector3D(this.x / f, this.y / f, this.z / f);
    }
    rotate(O, u, ang, self) {
        if (self && this.isConstant) {
            console.log("Trying to modify a constant vector");
            return this;
        }
        const vecs = [0, 1, 2].map(n => [[RIGHT, UP, FRONT][n], n]);
        const fAngs = [0, 1, 2, 3].map(n => [(n * PI) / 2, n]);
        const rAng = ((ang % TAU) + TAU) % TAU;
        if (O.abs() < EPS &&
            vecs.some(v => v[0].cross(u).abs() < EPS) &&
            fAngs.some(a => Math.abs(a[0] - rAng) < EPS)) {
            const idx = [
                (vt) => new Vector3D(vt.x, -vt.z, vt.y), // RIGHT => (x, y, z) => (x, -z, y)
                (vt) => new Vector3D(vt.z, vt.y, -vt.x), // UP    => (x, y, z) => (z, y, -x)
                (vt) => new Vector3D(-vt.y, vt.x, vt.z), // FRONT => (x, y, z) => (-y, x, z)
            ];
            const aIndex = fAngs.filter(a => Math.abs(a[0] - rAng) < EPS)[0][1];
            const vIndex = vecs.filter(v => v[0].cross(u).abs() < EPS)[0][1];
            const cant = vecs[vIndex][0].dot(u) > 0 ? aIndex : (4 - aIndex) % 4;
            let vt = this.clone();
            for (let i = 1; i <= cant; i += 1) {
                vt = idx[vIndex](vt);
            }
            if (self) {
                this.x = vt.x;
                this.y = vt.y;
                this.z = vt.z;
                return this;
            }
            return vt;
        }
        // let nu = new Vector3(u.x, u.y, u.z).setLength(1);
        // let v3 = new Vector3(this.x - O.x, this.y - O.y, this.z - O.z);
        // v3.applyAxisAngle(nu, ang).add(new Vector3(O.x, O.y, O.z));
        const k = u.unit();
        const v = this.sub(O);
        const p1 = v.mul(Math.cos(ang));
        const p2 = k.cross(v).mul(Math.sin(ang));
        const p3 = k.mul(k.dot(v) * (1 - Math.cos(ang)));
        const v3 = p1.add(p2, true).add(p3, true).add(O, true);
        if (self) {
            this.x = v3.x;
            this.y = v3.y;
            this.z = v3.z;
            return this;
        }
        return new Vector3D(v3.x, v3.y, v3.z);
    }
    clone() {
        return new Vector3D(this.x, this.y, this.z);
    }
    abs() {
        return this.abs2() ** 0.5;
    }
    abs2() {
        return this.x ** 2 + this.y ** 2 + this.z ** 2;
    }
    unit() {
        const len = this.abs();
        if (len != 0) {
            return getCanonical(this.div(len));
        }
        return new Vector3D(0, 0, 0);
    }
    proj(a) {
        return a.setLength(this.dot(a) / a.abs());
    }
    setLength(n) {
        return this.unit().mul(n);
    }
    toString() {
        return `<${this.x}; ${this.y}; ${this.z}>`;
    }
    toNormal() {
        const coords = [this.x, this.y, this.z].map(e => (Math.abs(e) < EPS ? 0 : Math.sign(e)));
        this.x = coords[0];
        this.y = coords[1];
        this.z = coords[2];
        return this;
    }
    setCoords(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    equals(v) {
        return this.sub(v).abs() < EPS;
    }
}
const CENTER = new Vector3D(0, 0, 0, true);
const RIGHT = new Vector3D(1, 0, 0, true);
const LEFT = new Vector3D(-1, 0, 0, true);
const FRONT = new Vector3D(0, 0, 1, true);
const BACK = new Vector3D(0, 0, -1, true);
const UP = new Vector3D(0, 1, 0, true);
const DOWN = new Vector3D(0, -1, 0, true);

let lineWidth = 0.4;
function circle(parts, x, y, rad, col, omitStroke = false) {
    parts.push(`<circle cx="${x}" cy="${y}" r="${rad * 0.95}" fill="${col}" stroke-width="${lineWidth}"
      ${!omitStroke ? `stroke="${col}"` : ""} />`);
}
function drawSingleClock(parts, RAD, X, Y, MAT, PINS, BLACK, WHITE, GRAY) {
    const W = RAD * 0.582491582491582;
    const RAD_CLOCK = RAD * 0.2020202020202;
    const BORDER = RAD * 0.0909090909090909;
    const BORDER1 = RAD * 0.02;
    const PI = Math.PI;
    const TAU = PI * 2;
    const arrow = [
        new Vector3D(0.0, 1.0),
        new Vector3D(0.1491, 0.4056),
        new Vector3D(0.0599, 0.2551),
        new Vector3D(0.0, 0.0),
        new Vector3D(-0.0599, 0.2551),
        new Vector3D(-0.1491, 0.4056),
    ].map(v => v.mul(RAD_CLOCK));
    const circles = [new Vector3D(0.1672), new Vector3D(0.1254)].map(v => v.mul(RAD_CLOCK));
    const R_PIN = circles[0].x * 2.3;
    lineWidth = 0.4;
    circle(parts, X, Y, RAD, WHITE);
    for (let i = -1; i < 2; i += 2) {
        for (let j = -1; j < 2; j += 2) {
            circle(parts, X + W * i, Y + W * j, RAD_CLOCK + BORDER + BORDER1, WHITE);
            circle(parts, X + W * i, Y + W * j, RAD_CLOCK + BORDER, BLACK);
        }
    }
    circle(parts, X, Y, RAD - BORDER1, BLACK);
    for (let i = -1; i < 2; i += 1) {
        for (let j = -1; j < 2; j += 1) {
            circle(parts, X + W * i, Y + W * j, RAD_CLOCK, WHITE);
            const ANCHOR = new Vector3D(X + W * i, Y + W * j);
            const angId = MAT[j + 1][i + 1];
            const ang = (angId * TAU) / 12;
            const pts = arrow.map(v => v.rotate(CENTER, FRONT, PI + ang).add(ANCHOR));
            const pathParts = [];
            lineWidth = 0.2;
            for (let p = 0, maxp = pts.length; p < maxp; p += 1) {
                if (p === 0)
                    pathParts.push(`M ${pts[p].x} ${pts[p].y}`);
                else
                    pathParts.push(`L ${pts[p].x} ${pts[p].y}`);
            }
            pathParts.push("Z");
            parts.push(`<path d="${pathParts.join(" ")}" stroke="${BLACK}" stroke-width="${0.2}" fill="${BLACK}" />`);
            lineWidth = 0.4;
            circle(parts, ANCHOR.x, ANCHOR.y, circles[0].x, BLACK);
            circle(parts, ANCHOR.x, ANCHOR.y, circles[1].x, WHITE);
            for (let a = 0; a < 12; a += 1) {
                const pt = ANCHOR.add(DOWN.mul(RAD_CLOCK + BORDER / 2).rotate(CENTER, FRONT, (a * TAU) / 12));
                const r = (circles[0].x / 4) * (a ? 1 : 1.6);
                const c = a ? WHITE : "#ff0000";
                circle(parts, pt.x, pt.y, r, c);
            }
            if (i <= 0 && j <= 0) {
                const val = PINS[(j + 1) * 2 + i + 1];
                circle(parts, ANCHOR.x + W / 2, ANCHOR.y + W / 2, R_PIN, GRAY);
                circle(parts, ANCHOR.x + W / 2, ANCHOR.y + W / 2, R_PIN * 0.7, val ? "#181818" : GRAY);
            }
        }
    }
}
function clockImage(cube, DIM) {
    const W = DIM * 2.2;
    const PINS1 = cube.raw[0];
    const PINS2 = cube.raw[0].map((e, p) => !PINS1[((p >> 1) << 1) + 1 - (p & 1)]);
    const MAT = cube.raw[1];
    const RAD = DIM / 2;
    const BLACK = cube.palette.black;
    const WHITE = cube.palette.white;
    const GRAY = cube.palette.gray;
    const parts = [];
    drawSingleClock(parts, RAD, RAD, RAD, MAT[0], PINS2, BLACK, WHITE, GRAY);
    drawSingleClock(parts, RAD, W - RAD, RAD, MAT[1], PINS1, WHITE, BLACK, GRAY);
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 ${W} ${DIM}">
  ${parts.join("")}
</svg>`;
}
function CLOCK() {
    const clock = {
        move: () => true,
        palette: {
            black: "#181818",
            white: "#aaa",
            gray: "#7f7f7f",
        },
    };
    const pins = [false, false, false, false];
    const clocks = [
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
    const add = function (i, j, k, val) {
        clocks[i][j][k] = (((clocks[i][j][k] + val) % 12) + 12) % 12;
    };
    const mat = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    clock.move = function (moves) {
        let first = true;
        let upFace = 0;
        for (let i = 0, maxi = moves.length; i < maxi; i += 1) {
            const mv = moves[i];
            const pinCode = mv[0];
            const up = mv[1];
            const down = mv[2];
            if (mv[0] === -1) {
                upFace ^= 1;
                continue;
            }
            for (let x = 0; x < 3; x += 1) {
                for (let y = 0; y < 3; y += 1) {
                    mat[x][y] = 0;
                }
            }
            for (let j = 0, mask = 8; j < 4; j += 1, mask >>= 1) {
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
                    const x = j >> 1;
                    const y = j & 1;
                    mat[x][y] = mat[x + 1][y] = mat[x][y + 1] = mat[x + 1][y + 1] = 1;
                }
            }
            if (!isNaN(up) && !isNaN(down)) {
                for (let x = 0; x < 3; x += 1) {
                    for (let y = 0; y < 3; y += 1) {
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
    clock.getImage = () => clockImage(clock, 100);
    clock.raw = [pins, clocks];
    return clock;
}

function MEGAMINX() {
    const mega = {
        palette: STANDARD_PALETTE,
        move: () => false,
    };
    const faces = {
        U: ["U", "U", "U", "U", "U", "U", "U", "U", "U", "U", "U"],
        R: ["R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R"],
        F: ["F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F"],
        L: ["L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L"],
        BL: ["BL", "BL", "BL", "BL", "BL", "BL", "BL", "BL", "BL", "BL", "BL"],
        BR: ["BR", "BR", "BR", "BR", "BR", "BR", "BR", "BR", "BR", "BR", "BR"],
        DR: ["DR", "DR", "DR", "DR", "DR", "DR", "DR", "DR", "DR", "DR", "DR"],
        DL: ["DL", "DL", "DL", "DL", "DL", "DL", "DL", "DL", "DL", "DL", "DL"],
        DBL: ["DBL", "DBL", "DBL", "DBL", "DBL", "DBL", "DBL", "DBL", "DBL", "DBL", "DBL"],
        B: ["B", "B", "B", "B", "B", "B", "B", "B", "B", "B", "B"],
        DBR: ["DBR", "DBR", "DBR", "DBR", "DBR", "DBR", "DBR", "DBR", "DBR", "DBR", "DBR"],
        D: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D"],
    };
    function update(NU, NR, NF, NL, NBL, NBR, NDR, NDL, NDBL, NB, NDBR, ND) {
        faces.U = NU;
        faces.R = NR;
        faces.F = NF;
        faces.L = NL;
        faces.BL = NBL;
        faces.BR = NBR;
        faces.DR = NDR;
        faces.DL = NDL;
        faces.DBL = NDBL;
        faces.B = NB;
        faces.DBR = NDBR;
        faces.D = ND;
    }
    const cycles = {
        R: (count) => {
            const times = ((count % 5) + 5) % 5;
            for (let i = 0; i < times; i += 1) {
                const NU = faces.F.map((v, p) => ([1, 2, 6].some(e => e === p) ? faces.U[p] : v));
                const NR = [3, 4, 0, 1, 2, 8, 9, 5, 6, 7, 10].map(n => faces.DR[n]);
                const NF = [2, -1, -1, 0, 1, 7, -1, 9, 5, 6, 10].map((n, p) => n < 0 ? faces.F[p] : faces.DL[n]);
                const NL = [...faces.L];
                const NBL = [-1, 3, 4, 0, -1, 7, 8, 9, 5, -1, 10].map((n, p) => n < 0 ? faces.BL[p] : faces.U[n]);
                const NBR = [1, 2, 3, 4, 0, 6, 7, 8, 9, 5, 10].map(n => faces.R[n]);
                const NDR = [2, 3, 4, 0, 1, 7, 8, 9, 5, 6, 10].map(n => faces.D[n]);
                const NDL = [4, 0, 1, -1, -1, 9, 5, 6, -1, 8, 10].map((n, p) => n < 0 ? faces.DL[p] : faces.DBL[n]);
                const NDBL = [2, 3, -1, -1, 1, 7, 8, -1, 5, 6, 10].map((n, p) => n < 0 ? faces.DBL[p] : faces.BL[n]);
                const NB = [3, 4, 0, 1, 2, 8, 9, 5, 6, 7, 10].map(n => faces.BR[n]);
                const NDBR = [1, 2, 3, 4, 0, 6, 7, 8, 9, 5, 10].map(n => faces.DBR[n]);
                const ND = [1, 2, 3, 4, 0, 6, 7, 8, 9, 5, 10].map(n => faces.B[n]);
                update(NU, NR, NF, NL, NBL, NBR, NDR, NDL, NDBL, NB, NDBR, ND);
            }
        },
        D: (count) => {
            const times = ((count % 5) + 5) % 5;
            for (let i = 0; i < times; i += 1) {
                const NU = [...faces.U];
                const NR = [-1, -1, 2, 3, 4, -1, 6, 7, 8, 9, 10].map((n, p) => n < 0 ? faces.R[p] : faces.F[n]);
                const NF = [-1, -1, 2, 3, 4, -1, 6, 7, 8, 9, 10].map((n, p) => n < 0 ? faces.F[p] : faces.L[n]);
                const NL = [-1, -1, 2, 3, 4, -1, 6, 7, 8, 9, 10].map((n, p) => n < 0 ? faces.L[p] : faces.BL[n]);
                const NBL = [-1, -1, 2, 3, 4, -1, 6, 7, 8, 9, 10].map((n, p) => n < 0 ? faces.BL[p] : faces.BR[n]);
                const NBR = [-1, -1, 2, 3, 4, -1, 6, 7, 8, 9, 10].map((n, p) => n < 0 ? faces.BR[p] : faces.R[n]);
                const NDR = [...faces.DL];
                const NDL = [...faces.DBL];
                const NDBL = [...faces.B];
                const NB = [...faces.DBR];
                const NDBR = [...faces.DR];
                const ND = [1, 2, 3, 4, 0, 6, 7, 8, 9, 5, 10].map(n => faces.D[n]);
                update(NU, NR, NF, NL, NBL, NBR, NDR, NDL, NDBL, NB, NDBR, ND);
            }
        },
        U: (count) => {
            const times = ((count % 5) + 5) % 5;
            for (let i = 0; i < times; i += 1) {
                const NU = [1, 2, 3, 4, 0, 6, 7, 8, 9, 5, 10].map(n => faces.U[n]);
                const NR = faces.R.map((n, p) => ([0, 1, 5].some(p1 => p1 === p) ? faces.BR[p] : n));
                const NF = faces.F.map((n, p) => ([0, 1, 5].some(p1 => p1 === p) ? faces.R[p] : n));
                const NL = faces.L.map((n, p) => ([0, 1, 5].some(p1 => p1 === p) ? faces.F[p] : n));
                const NBL = faces.BL.map((n, p) => ([0, 1, 5].some(p1 => p1 === p) ? faces.L[p] : n));
                const NBR = faces.BR.map((n, p) => ([0, 1, 5].some(p1 => p1 === p) ? faces.BL[p] : n));
                const NDR = [...faces.DR];
                const NDL = [...faces.DL];
                const NDBL = [...faces.DBL];
                const NB = [...faces.B];
                const NDBR = [...faces.DBR];
                const ND = [...faces.D];
                update(NU, NR, NF, NL, NBL, NBR, NDR, NDL, NDBL, NB, NDBR, ND);
            }
        },
    };
    const lookup = {
        U: 0,
        R: 1,
        F: 2,
        L: 3,
        BL: 4,
        BR: 5,
        D: 6,
        DL: 7,
        DR: 8,
        DBR: 9,
        B: 10,
        DBL: 11,
    };
    function getClass(fc) {
        return "c" + lookup[fc];
    }
    mega.move = function (moves) {
        moves.forEach(mv => {
            if (mv[0] === 0) {
                if (mv[2] < 0)
                    cycles.D(mv[1]);
                else
                    cycles.U(-mv[1]);
            }
            else if (mv[0] === 1)
                cycles.R(mv[1]);
        });
    };
    mega.getImage = () => {
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 1500 750" class="NTY2YjNhZDItMjZl">
    <style>.NTY2YjNhZDItMjZl .c0{fill:#e6e6e6;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c1{fill:#dc422f;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c2{fill:#009d54;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c3{fill:#8a1bff;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c4{fill:#ffeb3b;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c5{fill:#3d81f6;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c6{fill:#707070;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c7{fill:#53b1f3;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c8{fill:#dcd3a5;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c9{fill:#ed96a1;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c10{fill:#4ad931;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c11{fill:#e87000;stroke:black;stroke-width:3;stroke-linecap:square;}.NTY2YjNhZDItMjZl .c12{alignment-baseline:middle;fill:rgb(25, 25, 25);text-anchor:middle;}.NTY2YjNhZDItMjZl .c13{alignment-baseline:middle;fill:rgb(25, 25, 25);text-anchor:middle;}</style>
    <path class="${getClass(faces.U[0])}" d="M398.21,190.26Q387.14 182.22,376.08 190.26L342.9,214.37Q331.84 222.4,342.9 230.44L376.08,254.55Q387.14 262.58,398.21 254.55L431.39,230.44Q442.45 222.4,431.39 214.37Z" />
    <path class="${getClass(faces.U[1])}" d="M251.84,280.53Q240.77 288.57,245 301.57L257.67,340.58Q261.9 353.58,272.96 345.54L306.14,321.43Q317.2 313.4,312.98 300.4L300.3,261.39Q296.08 248.39,285.02 256.42Z" />
    <path class="${getClass(faces.U[2])}" d="M292.46,447.63Q296.68 460.63,310.35 460.63L351.37,460.63Q365.04 460.63,360.82 447.63L348.14,408.62Q343.92 395.62,330.25 395.62L289.23,395.62Q275.56 395.62,279.78 408.62Z" />
    <path class="${getClass(faces.U[3])}" d="M463.93,460.63Q477.61 460.63,481.83 447.63L494.51,408.62Q498.73 395.62,485.06 395.62L444.04,395.62Q430.37 395.62,426.15 408.62L413.47,447.63Q409.25 460.63,422.92 460.63Z" />
    <path class="${getClass(faces.U[4])}" d="M529.29,301.57Q533.51 288.57,522.45 280.53L489.27,256.42Q478.21 248.39,473.99 261.39L461.31,300.4Q457.09 313.4,468.15 321.43L501.33,345.54Q512.39 353.58,516.62 340.58Z" />
    <path class="${getClass(faces.U[5])}" d="M338.85,233.38Q327.79 225.35,322.25 229.37L305.66,241.42Q300.13 245.44,304.36 258.44L317.03,297.45Q321.26 310.45,333.62 301.47L370.72,274.51Q383.09 265.53,372.03 257.49Z" />
    <path class="${getClass(faces.U[6])}" d="M274.51,350.31Q263.45 358.35,265.56 364.85L271.9,384.35Q274.01 390.85,287.68 390.85L328.7,390.85Q342.37 390.85,337.64 376.32L323.47,332.7Q318.75 318.17,307.69 326.2Z" />
    <path class="${getClass(faces.U[7])}" d="M365.83,447.63Q370.05 460.63,376.89 460.63L397.4,460.63Q404.23 460.63,408.46 447.63L421.13,408.62Q425.36 395.62,410.07 395.62L364.22,395.62Q348.93 395.62,353.16 408.62Z" />
    <path class="${getClass(faces.U[8])}" d="M486.61,390.85Q500.28 390.85,502.39 384.35L508.73,364.85Q510.84 358.35,499.78 350.31L466.6,326.2Q455.54 318.17,450.81 332.7L436.64,376.32Q431.92 390.85,445.59 390.85Z" />
    <path class="${getClass(faces.U[9])}" d="M469.93,258.44Q474.16 245.44,468.63 241.42L452.03,229.37Q446.5 225.35,435.44 233.38L402.26,257.49Q391.2 265.53,403.57 274.51L440.67,301.47Q453.03 310.45,457.26 297.45Z" />
    <path class="${getClass(faces.U[10])}" d="M399.51,280.1Q387.14 271.11,374.78 280.1L337.68,307.05Q325.31 316.03,330.04 330.57L344.21,374.18Q348.93 388.72,364.22 388.72L410.07,388.72Q425.36 388.72,430.08 374.18L444.25,330.57Q448.98 316.03,436.61 307.05Z" />
    
    <path class="${getClass(faces.R[0])}" d="M552.2,290.19Q538.53 290.19,534.3 303.2L521.63,342.21Q517.4 355.21,531.08 355.21L572.09,355.21Q585.76 355.21,589.99 342.21L602.66,303.2Q606.89 290.19,593.21 290.19Z" />
    <path class="${getClass(faces.R[1])}" d="M486.84,449.26Q482.62 462.26,493.68 470.3L526.86,494.41Q537.92 502.44,542.15 489.44L554.82,450.43Q559.05 437.43,547.99 429.39L514.8,405.29Q503.74 397.25,499.52 410.25Z" />
    <path class="${getClass(faces.R[2])}" d="M617.93,560.57Q628.99 568.61,640.05 560.57L673.23,536.46Q684.29 528.43,673.23 520.39L640.05,496.28Q628.99 488.25,617.93 496.28L584.75,520.39Q573.69 528.43,584.75 536.46Z" />
    <path class="${getClass(faces.R[3])}" d="M764.3,470.3Q775.36 462.26,771.13 449.26L758.46,410.25Q754.24 397.25,743.17 405.29L709.99,429.39Q698.93 437.43,703.16 450.43L715.83,489.44Q720.06 502.44,731.12 494.41Z" />
    <path class="${getClass(faces.R[4])}" d="M723.68,303.2Q719.45 290.19,705.78 290.19L664.76,290.19Q651.09 290.19,655.32 303.2L667.99,342.21Q672.22 355.21,685.89 355.21L726.9,355.21Q740.58 355.21,736.35 342.21Z" />
    <path class="${getClass(faces.R[5])}" d="M529.53,359.98Q515.85 359.98,513.74 366.48L507.41,385.98Q505.29 392.48,516.35 400.52L549.54,424.63Q560.6 432.66,565.32 418.13L579.49,374.51Q584.21 359.98,570.54 359.98Z" />
    <path class="${getClass(faces.R[6])}" d="M546.2,492.39Q541.98 505.39,547.51 509.41L564.1,521.46Q569.63 525.48,580.69 517.44L613.87,493.34Q624.93 485.3,612.57 476.32L575.47,449.36Q563.1 440.38,558.88 453.38Z" />
    <path class="${getClass(faces.R[7])}" d="M677.29,517.44Q688.35 525.48,693.88 521.46L710.47,509.41Q716 505.39,711.78 492.39L699.1,453.38Q694.88 440.38,682.51 449.36L645.41,476.32Q633.05 485.3,644.11 493.34Z" />
    <path class="${getClass(faces.R[8])}" d="M741.63,400.52Q752.69 392.48,750.57 385.98L744.24,366.48Q742.12 359.98,728.45 359.98L687.44,359.98Q673.77 359.98,678.49 374.51L692.66,418.13Q697.38 432.66,708.44 424.63Z" />
    <path class="${getClass(faces.R[9])}" d="M650.3,303.2Q646.08 290.19,639.24 290.19L618.74,290.19Q611.9 290.19,607.68 303.2L595,342.21Q590.78 355.21,606.06 355.21L651.92,355.21Q667.2 355.21,662.98 342.21Z" />
    <path class="${getClass(faces.R[10])}" d="M571.88,420.26Q567.16 434.79,579.52 443.78L616.62,470.73Q628.99 479.72,641.36 470.73L678.45,443.78Q690.82 434.79,686.1 420.26L671.93,376.65Q667.2 362.11,651.92 362.11L606.06,362.11Q590.78 362.11,586.05 376.65Z" />

    <path class="${getClass(faces.F[0])}" d="M481.83,478.91Q477.61 465.91,463.93 465.91L422.92,465.91Q409.25 465.91,413.47 478.91L426.15,517.92Q430.37 530.92,444.04 530.92L485.06,530.92Q498.73 530.92,494.51 517.92Z" />
    <path class="${getClass(faces.F[1])}" d="M310.35,465.91Q296.68 465.91,292.46 478.91L279.78,517.92Q275.56 530.92,289.23 530.92L330.25,530.92Q343.92 530.92,348.14 517.92L360.82,478.91Q365.04 465.91,351.37 465.91Z" />
    <path class="${getClass(faces.F[2])}" d="M245,624.97Q240.77 637.97,251.84 646.01L285.02,670.12Q296.08 678.15,300.3 665.15L312.98,626.14Q317.2 613.14,306.14 605.1L272.96,581Q261.9 572.96,257.67 585.96Z" />
    <path class="${getClass(faces.F[3])}" d="M376.08,736.28Q387.14 744.32,398.21 736.28L431.39,712.17Q442.45 704.14,431.39 696.1L398.21,671.99Q387.14 663.96,376.08 671.99L342.9,696.1Q331.84 704.14,342.9 712.17Z" />
    <path class="${getClass(faces.F[4])}" d="M522.45,646.01Q533.51 637.97,529.29 624.97L516.62,585.96Q512.39 572.96,501.33 581L468.15,605.1Q457.09 613.14,461.31 626.14L473.99,665.15Q478.21 678.15,489.27 670.12Z" />
    <path class="${getClass(faces.F[5])}" d="M408.46,478.91Q404.23 465.91,397.4 465.91L376.89,465.91Q370.05 465.91,365.83 478.91L353.16,517.92Q348.93 530.92,364.22 530.92L410.07,530.92Q425.36 530.92,421.13 517.92Z" />
    <path class="${getClass(faces.F[6])}" d="M287.68,535.69Q274.01 535.69,271.9 542.19L265.56,561.69Q263.45 568.19,274.51 576.23L307.69,600.34Q318.75 608.37,323.47 593.84L337.64,550.22Q342.37 535.69,328.7 535.69Z" />
    <path class="${getClass(faces.F[7])}" d="M304.36,668.1Q300.13 681.1,305.66 685.12L322.25,697.17Q327.79 701.19,338.85 693.15L372.03,669.05Q383.09 661.01,370.72 652.03L333.62,625.07Q321.26 616.09,317.03 629.09Z" />
    <path class="${getClass(faces.F[8])}" d="M435.44,693.15Q446.5 701.19,452.03 697.17L468.63,685.12Q474.16 681.1,469.93 668.1L457.26,629.09Q453.03 616.09,440.67 625.07L403.57,652.03Q391.2 661.01,402.26 669.05Z" />
    <path class="${getClass(faces.F[9])}" d="M499.78,576.23Q510.84 568.19,508.73 561.69L502.39,542.19Q500.28 535.69,486.61 535.69L445.59,535.69Q431.92 535.69,436.64 550.22L450.81,593.84Q455.54 608.37,466.6 600.34Z" />
    <path class="${getClass(faces.F[10])}" d="M330.04,595.97Q325.31 610.51,337.68 619.49L374.78,646.44Q387.14 655.43,399.51 646.44L436.61,619.49Q448.98 610.51,444.25 595.97L430.08,552.36Q425.36 537.82,410.07 537.82L364.22,537.82Q348.93 537.82,344.21 552.36Z" />
    
    <path class="${getClass(faces.L[0])}" d="M280.61,470.3Q291.67 462.26,287.44 449.26L274.77,410.25Q270.55 397.25,259.48 405.29L226.3,429.39Q215.24 437.43,219.47 450.43L232.14,489.44Q236.37 502.44,247.43 494.41Z" />
    <path class="${getClass(faces.L[1])}" d="M239.99,303.2Q235.76 290.19,222.09 290.19L181.07,290.19Q167.4 290.19,171.63 303.2L184.3,342.21Q188.53 355.21,202.2 355.21L243.21,355.21Q256.89 355.21,252.66 342.21Z" />
    <path class="${getClass(faces.L[2])}" d="M68.51,290.19Q54.84 290.19,50.61 303.2L37.94,342.21Q33.71 355.21,47.39 355.21L88.4,355.21Q102.07 355.21,106.3 342.21L118.97,303.2Q123.2 290.19,109.52 290.19Z" />
    <path class="${getClass(faces.L[3])}" d="M3.15,449.26Q-1.07 462.26,9.99 470.3L43.17,494.41Q54.23 502.44,58.46 489.44L71.13,450.43Q75.36 437.43,64.3 429.39L31.11,405.29Q20.05 397.25,15.83 410.25Z" />
    <path class="${getClass(faces.L[4])}" d="M134.24,560.57Q145.3 568.61,156.36 560.57L189.54,536.46Q200.6 528.43,189.54 520.39L156.36,496.28Q145.3 488.25,134.24 496.28L101.06,520.39Q90 528.43,101.06 536.46Z" />
    <path class="${getClass(faces.L[5])}" d="M257.94,400.52Q269 392.48,266.88 385.98L260.55,366.48Q258.43 359.98,244.76 359.98L203.75,359.98Q190.08 359.98,194.8 374.51L208.97,418.13Q213.69 432.66,224.75 424.63Z" />
    <path class="${getClass(faces.L[6])}" d="M166.61,303.2Q162.39 290.19,155.55 290.19L135.05,290.19Q128.21 290.19,123.98 303.2L111.31,342.21Q107.09 355.21,122.37 355.21L168.23,355.21Q183.51 355.21,179.29 342.21Z" />
    <path class="${getClass(faces.L[7])}" d="M45.84,359.98Q32.16 359.98,30.05 366.48L23.71,385.98Q21.6 392.48,32.66 400.52L65.85,424.63Q76.91 432.66,81.63 418.13L95.8,374.51Q100.52 359.98,86.85 359.98Z" />
    <path class="${getClass(faces.L[8])}" d="M62.51,492.39Q58.29 505.39,63.82 509.41L80.41,521.46Q85.94 525.48,97 517.44L130.18,493.34Q141.24 485.3,128.88 476.32L91.78,449.36Q79.41 440.38,75.19 453.38Z" />
    <path class="${getClass(faces.L[9])}" d="M193.6,517.44Q204.66 525.48,210.19 521.46L226.78,509.41Q232.31 505.39,228.09 492.39L215.41,453.38Q211.19 440.38,198.82 449.36L161.72,476.32Q149.36 485.3,160.42 493.34Z" />
    <path class="${getClass(faces.L[10])}" d="M88.19,420.26Q83.47 434.79,95.83 443.78L132.93,470.73Q145.3 479.72,157.67 470.73L194.76,443.78Q207.13 434.79,202.41 420.26L188.24,376.65Q183.51 362.11,168.23 362.11L122.37,362.11Q107.09 362.11,102.36 376.65Z" />

    <path class="${getClass(faces.BL[0])}" d="M226.62,276.27Q237.68 284.3,248.74 276.27L281.92,252.16Q292.98 244.12,281.92 236.08L248.74,211.98Q237.68 203.94,226.62 211.98L193.43,236.08Q182.37 244.12,193.43 252.16Z" />
    <path class="${getClass(faces.BL[1])}" d="M372.99,185.99Q384.05 177.96,379.82 164.95L367.15,125.95Q362.92 112.94,351.86 120.98L318.68,145.09Q307.62 153.12,311.84 166.13L324.52,205.13Q328.74 218.14,339.8 210.1Z" />
    <path class="${getClass(faces.BL[2])}" d="M332.36,18.89Q328.14 5.89,314.47 5.89L273.45,5.89Q259.78 5.89,264 18.89L276.68,57.9Q280.9 70.9,294.57 70.9L335.59,70.9Q349.26 70.9,345.04 57.9Z" />
    <path class="${getClass(faces.BL[3])}" d="M160.89,5.89Q147.21 5.89,142.99 18.89L130.32,57.9Q126.09 70.9,139.76 70.9L180.78,70.9Q194.45 70.9,198.67 57.9L211.35,18.89Q215.57 5.89,201.9 5.89Z" />
    <path class="${getClass(faces.BL[4])}" d="M95.53,164.95Q91.31 177.96,102.37 185.99L135.55,210.1Q146.61 218.14,150.83 205.13L163.51,166.13Q167.73 153.12,156.67 145.09L123.49,120.98Q112.43 112.94,108.21 125.95Z" />
    <path class="${getClass(faces.BL[5])}" d="M285.97,233.14Q297.04 241.17,302.57 237.16L319.16,225.1Q324.69 221.08,320.46 208.08L307.79,169.07Q303.56 156.07,291.2 165.06L254.1,192.01Q241.73 200.99,252.79 209.03Z" />
    <path class="${getClass(faces.BL[6])}" d="M350.31,116.21Q361.37 108.18,359.26 101.67L352.92,82.17Q350.81 75.67,337.14 75.67L296.12,75.67Q282.45 75.67,287.18 90.21L301.35,133.82Q306.07 148.36,317.13 140.32Z" />
    <path class="${getClass(faces.BL[7])}" d="M258.99,18.89Q254.77 5.89,247.93 5.89L227.42,5.89Q220.59 5.89,216.36 18.89L203.69,57.9Q199.46 70.9,214.75 70.9L260.6,70.9Q275.89 70.9,271.66 57.9Z" />
    <path class="${getClass(faces.BL[8])}" d="M138.21,75.67Q124.54 75.67,122.43 82.17L116.09,101.67Q113.98 108.18,125.04 116.21L158.22,140.32Q169.28 148.36,174.01 133.82L188.18,90.21Q192.9 75.67,179.23 75.67Z" />
    <path class="${getClass(faces.BL[9])}" d="M154.89,208.08Q150.67 221.08,156.2 225.1L172.79,237.16Q178.32 241.17,189.38 233.14L222.56,209.03Q233.62 200.99,221.25 192.01L184.16,165.06Q171.79 156.07,167.56 169.07Z" />
    <path class="${getClass(faces.BL[10])}" d="M180.57,135.95Q175.85 150.49,188.21 159.47L225.31,186.43Q237.68 195.41,250.04 186.43L287.14,159.47Q299.51 150.49,294.78 135.95L280.61,92.34Q275.89 77.8,260.6 77.8L214.75,77.8Q199.46 77.8,194.74 92.34Z" />
    
    <path class="${getClass(faces.BR[0])}" d="M394.47,164.95Q390.24 177.96,401.3 185.99L434.49,210.1Q445.55 218.14,449.77 205.13L462.45,166.13Q466.67 153.12,455.61 145.09L422.43,120.98Q411.37 112.94,407.14 125.95Z" />
    <path class="${getClass(faces.BR[1])}" d="M525.55,276.27Q536.61 284.3,547.67 276.27L580.86,252.16Q591.92 244.12,580.86 236.08L547.67,211.98Q536.61 203.94,525.55 211.98L492.37,236.08Q481.31 244.12,492.37 252.16Z" />
    <path class="${getClass(faces.BR[2])}" d="M671.92,185.99Q682.98 177.96,678.76 164.95L666.08,125.95Q661.86 112.94,650.8 120.98L617.62,145.09Q606.56 153.12,610.78 166.13L623.45,205.13Q627.68 218.14,638.74 210.1Z" />
    <path class="${getClass(faces.BR[3])}" d="M631.3,18.89Q627.07 5.89,613.4 5.89L572.39,5.89Q558.72 5.89,562.94 18.89L575.62,57.9Q579.84 70.9,593.51 70.9L634.53,70.9Q648.2 70.9,643.97 57.9Z" />
    <path class="${getClass(faces.BR[4])}" d="M459.82,5.89Q446.15 5.89,441.93 18.89L429.25,57.9Q425.03 70.9,438.7 70.9L479.71,70.9Q493.39 70.9,497.61 57.9L510.29,18.89Q514.51 5.89,500.84 5.89Z" />
    <path class="${getClass(faces.BR[5])}" d="M453.83,208.08Q449.6 221.08,455.13 225.1L471.72,237.16Q477.25 241.17,488.31 233.14L521.5,209.03Q532.56 200.99,520.19 192.01L483.09,165.06Q470.73 156.07,466.5 169.07Z" />
    <path class="${getClass(faces.BR[6])}" d="M584.91,233.14Q595.97 241.17,601.5 237.16L618.09,225.1Q623.62 221.08,619.4 208.08L606.72,169.07Q602.5 156.07,590.13 165.06L553.04,192.01Q540.67 200.99,551.73 209.03Z" />
    <path class="${getClass(faces.BR[7])}" d="M649.25,116.21Q660.31 108.18,658.2 101.67L651.86,82.17Q649.75 75.67,636.08 75.67L595.06,75.67Q581.39 75.67,586.11 90.21L600.28,133.82Q605.01 148.36,616.07 140.32Z" />
    <path class="${getClass(faces.BR[8])}" d="M557.93,18.89Q553.7 5.89,546.87 5.89L526.36,5.89Q519.52 5.89,515.3 18.89L502.62,57.9Q498.4 70.9,513.68 70.9L559.54,70.9Q574.83 70.9,570.6 57.9Z" />
    <path class="${getClass(faces.BR[9])}" d="M437.15,75.67Q423.48 75.67,421.37 82.17L415.03,101.67Q412.92 108.18,423.98 116.21L457.16,140.32Q468.22 148.36,472.94 133.82L487.11,90.21Q491.84 75.67,478.17 75.67Z" />
    <path class="${getClass(faces.BR[10])}" d="M479.51,135.95Q474.78 150.49,487.15 159.47L524.25,186.43Q536.61 195.41,548.98 186.43L586.08,159.47Q598.44 150.49,593.72 135.95L579.55,92.34Q574.83 77.8,559.54 77.8L513.68,77.8Q498.4 77.8,493.68 92.34Z" />
    
    <path class="${getClass(faces.D[0])}" d="M1102.3,560.17Q1113.36 568.2,1124.42 560.17L1157.6,536.06Q1168.66 528.02,1157.6 519.99L1124.42,495.88Q1113.36 487.84,1102.3 495.88L1069.11,519.99Q1058.05 528.02,1069.11 536.06Z" />
    <path class="${getClass(faces.D[1])}" d="M1248.67,469.89Q1259.73 461.86,1255.5 448.86L1242.83,409.85Q1238.6 396.85,1227.54 404.88L1194.36,428.99Q1183.3 437.03,1187.52 450.03L1200.2,489.04Q1204.42 502.04,1215.48 494Z" />
    <path class="${getClass(faces.D[2])}" d="M1208.04,302.79Q1203.82 289.79,1190.15 289.79L1149.13,289.79Q1135.46 289.79,1139.68 302.79L1152.36,341.8Q1156.58 354.8,1170.25 354.8L1211.27,354.8Q1224.94 354.8,1220.72 341.8Z" />
    <path class="${getClass(faces.D[3])}" d="M1036.57,289.79Q1022.89 289.79,1018.67 302.79L1006,341.8Q1001.77 354.8,1015.44 354.8L1056.46,354.8Q1070.13 354.8,1074.35 341.8L1087.03,302.79Q1091.25 289.79,1077.58 289.79Z" />
    <path class="${getClass(faces.D[4])}" d="M971.21,448.86Q966.99 461.86,978.05 469.89L1011.23,494Q1022.29 502.04,1026.51 489.04L1039.19,450.03Q1043.41 437.03,1032.35 428.99L999.17,404.88Q988.11 396.85,983.89 409.85Z" />
    <path class="${getClass(faces.D[5])}" d="M1194.84,509Q1200.37 504.99,1196.14 491.98L1183.47,452.98Q1179.24 439.97,1166.88 448.96L1129.78,475.91Q1117.41 484.9,1128.47 492.93L1161.65,517.04Q1172.72 525.08,1178.25 521.06Z" />
    <path class="${getClass(faces.D[6])}" d="M1228.6,366.07Q1226.49 359.57,1212.82 359.57L1171.8,359.57Q1158.13 359.57,1162.86 374.11L1177.03,417.72Q1181.75 432.26,1192.81 424.22L1225.99,400.11Q1237.05 392.08,1234.94 385.58Z" />
    <path class="${getClass(faces.D[7])}" d="M1103.1,289.79Q1096.27 289.79,1092.04 302.79L1079.37,341.8Q1075.14 354.8,1090.43 354.8L1136.28,354.8Q1151.57 354.8,1147.35 341.8L1134.67,302.79Q1130.45 289.79,1123.61 289.79Z" />
    <path class="${getClass(faces.D[8])}" d="M991.77,385.58Q989.66 392.08,1000.72 400.11L1033.9,424.22Q1044.96 432.26,1049.69 417.72L1063.86,374.11Q1068.58 359.57,1054.91 359.57L1013.89,359.57Q1000.22 359.57,998.11 366.07Z" />
    <path class="${getClass(faces.D[9])}" d="M1048.47,521.06Q1054 525.08,1065.06 517.04L1098.24,492.93Q1109.3 484.9,1096.93 475.91L1059.84,448.96Q1047.47 439.97,1043.24 452.98L1030.57,491.98Q1026.35 504.99,1031.88 509Z" />
    <path class="${getClass(faces.D[10])}" d="M1156.29,376.24Q1151.57 361.7,1136.28 361.7L1090.43,361.7Q1075.14 361.7,1070.42 376.24L1056.25,419.85Q1051.53 434.39,1063.89 443.37L1100.99,470.33Q1113.36 479.31,1125.72 470.33L1162.82,443.37Q1175.19 434.39,1170.46 419.85Z" />
  
    <path class="${getClass(faces.DL[0])}" d="M1273.57,473.72Q1262.51 465.69,1251.45 473.72L1218.27,497.83Q1207.21 505.87,1218.27 513.91L1251.45,538.01Q1262.51 546.05,1273.57 538.01L1306.75,513.91Q1317.81 505.87,1306.75 497.83Z" />
    <path class="${getClass(faces.DL[1])}" d="M1127.2,564Q1116.14 572.03,1120.36 585.04L1133.04,624.04Q1137.26 637.05,1148.32 629.01L1181.51,604.9Q1192.57 596.87,1188.34 583.86L1175.67,544.86Q1171.44 531.85,1160.38 539.89Z" />
    <path class="${getClass(faces.DL[2])}" d="M1167.82,731.1Q1172.05 744.1,1185.72 744.1L1226.73,744.1Q1240.41 744.1,1236.18 731.1L1223.51,692.09Q1219.28 679.09,1205.61 679.09L1164.6,679.09Q1150.92 679.09,1155.15 692.09Z" />
    <path class="${getClass(faces.DL[3])}" d="M1339.3,744.1Q1352.97 744.1,1357.2 731.1L1369.87,692.09Q1374.09 679.09,1360.42 679.09L1319.41,679.09Q1305.74 679.09,1301.51 692.09L1288.84,731.1Q1284.61 744.1,1298.28 744.1Z" />
    <path class="${getClass(faces.DL[4])}" d="M1404.65,585.04Q1408.88 572.03,1397.82 564L1364.64,539.89Q1353.58 531.85,1349.35 544.86L1336.68,583.86Q1332.45 596.87,1343.51 604.9L1376.69,629.01Q1387.76 637.05,1391.98 624.04Z" />
    <path class="${getClass(faces.DL[5])}" d="M1181.03,524.89Q1175.5 528.91,1179.72 541.91L1192.4,580.92Q1196.62 593.92,1208.99 584.93L1246.09,557.98Q1258.45 549,1247.39 540.96L1214.21,516.85Q1203.15 508.82,1197.62 512.83Z" />
    <path class="${getClass(faces.DL[6])}" d="M1147.26,667.82Q1149.37 674.32,1163.05 674.32L1204.06,674.32Q1217.73 674.32,1213.01 659.78L1198.84,616.17Q1194.12 601.63,1183.05 609.67L1149.87,633.78Q1138.81 641.81,1140.92 648.32Z" />
    <path class="${getClass(faces.DL[7])}" d="M1272.76,744.1Q1279.6 744.1,1283.82 731.1L1296.5,692.09Q1300.72 679.09,1285.44 679.09L1239.58,679.09Q1224.3 679.09,1228.52 692.09L1241.19,731.1Q1245.42 744.1,1252.26 744.1Z" />
    <path class="${getClass(faces.DL[8])}" d="M1384.09,648.32Q1386.21 641.81,1375.15 633.78L1341.96,609.67Q1330.9 601.63,1326.18 616.17L1312.01,659.78Q1307.29 674.32,1320.96 674.32L1361.97,674.32Q1375.64 674.32,1377.76 667.82Z" />
    <path class="${getClass(faces.DL[9])}" d="M1327.4,512.83Q1321.87 508.82,1310.81 516.85L1277.63,540.96Q1266.56 549,1278.93 557.98L1316.03,584.93Q1328.4 593.92,1332.62 580.92L1345.3,541.91Q1349.52 528.91,1343.99 524.89Z" />
    <path class="${getClass(faces.DL[10])}" d="M1285.44,672.19Q1300.72 672.19,1305.45 657.65L1319.62,614.04Q1324.34 599.5,1311.97 590.52L1274.88,563.56Q1262.51 554.58,1250.14 563.56L1213.04,590.52Q1200.68 599.5,1205.4 614.04L1219.57,657.65Q1224.3 672.19,1239.58 672.19Z" />
    
    <path class="${getClass(faces.DR[0])}" d="M1106.35,585.04Q1110.57 572.03,1099.51 564L1066.33,539.89Q1055.27 531.85,1051.05 544.86L1038.37,583.86Q1034.15 596.87,1045.21 604.9L1078.39,629.01Q1089.45 637.05,1093.67 624.04Z" />
    <path class="${getClass(faces.DR[1])}" d="M975.26,473.72Q964.2 465.69,953.14 473.72L919.96,497.83Q908.9 505.87,919.96 513.91L953.14,538.01Q964.2 546.05,975.26 538.01L1008.45,513.91Q1019.51 505.87,1008.45 497.83Z" />
    <path class="${getClass(faces.DR[2])}" d="M828.89,564Q817.83 572.03,822.06 585.04L834.73,624.04Q838.96 637.05,850.02 629.01L883.2,604.9Q894.26 596.87,890.04 583.86L877.36,544.86Q873.14 531.85,862.08 539.89Z" />
    <path class="${getClass(faces.DR[3])}" d="M869.52,731.1Q873.74 744.1,887.41 744.1L928.43,744.1Q942.1 744.1,937.88 731.1L925.2,692.09Q920.98 679.09,907.3 679.09L866.29,679.09Q852.62 679.09,856.84 692.09Z" />
    <path class="${getClass(faces.DR[4])}" d="M1040.99,744.1Q1054.66 744.1,1058.89 731.1L1071.56,692.09Q1075.79 679.09,1062.12 679.09L1021.1,679.09Q1007.43 679.09,1003.21 692.09L990.53,731.1Q986.31 744.1,999.98 744.1Z" />
    <path class="${getClass(faces.DR[5])}" d="M1029.09,512.83Q1023.56 508.82,1012.5 516.85L979.32,540.96Q968.26 549,980.63 557.98L1017.72,584.93Q1030.09 593.92,1034.31 580.92L1046.99,541.91Q1051.21 528.91,1045.68 524.89Z" />
    <path class="${getClass(faces.DR[6])}" d="M882.72,524.89Q877.19 528.91,881.42 541.91L894.09,580.92Q898.32 593.92,910.68 584.93L947.78,557.98Q960.15 549,949.09 540.96L915.9,516.85Q904.84 508.82,899.31 512.83Z" />
    <path class="${getClass(faces.DR[7])}" d="M848.96,667.82Q851.07 674.32,864.74 674.32L905.76,674.32Q919.43 674.32,914.7 659.78L900.53,616.17Q895.81 601.63,884.75 609.67L851.57,633.78Q840.51 641.81,842.62 648.32Z" />
    <path class="${getClass(faces.DR[8])}" d="M974.46,744.1Q981.29 744.1,985.52 731.1L998.19,692.09Q1002.42 679.09,987.13 679.09L941.28,679.09Q925.99 679.09,930.21 692.09L942.89,731.1Q947.11 744.1,953.95 744.1Z" />
    <path class="${getClass(faces.DR[9])}" d="M1085.79,648.32Q1087.9 641.81,1076.84 633.78L1043.66,609.67Q1032.6 601.63,1027.87 616.17L1013.7,659.78Q1008.98 674.32,1022.65 674.32L1063.67,674.32Q1077.34 674.32,1079.45 667.82Z" />
    <path class="${getClass(faces.DR[10])}" d="M987.13,672.19Q1002.42 672.19,1007.14 657.65L1021.31,614.04Q1026.03 599.5,1013.67 590.52L976.57,563.56Q964.2 554.58,951.84 563.56L914.74,590.52Q902.37 599.5,907.1 614.04L921.27,657.65Q925.99 672.19,941.28 672.19Z" />
    
    <path class="${getClass(faces.DBR[0])}" d="M948.81,460.4Q962.48 460.4,966.71 447.39L979.38,408.39Q983.61 395.38,969.94 395.38L928.92,395.38Q915.25 395.38,911.02 408.39L898.35,447.39Q894.12 460.4,907.8 460.4Z" />
    <path class="${getClass(faces.DBR[1])}" d="M1014.17,301.33Q1018.39 288.33,1007.33 280.29L974.15,256.18Q963.09 248.15,958.86 261.15L946.19,300.16Q941.96 313.16,953.03 321.2L986.21,345.3Q997.27 353.34,1001.49 340.34Z" />
    <path class="${getClass(faces.DBR[2])}" d="M883.08,190.02Q872.02 181.98,860.96 190.02L827.78,214.13Q816.72 222.16,827.78 230.2L860.96,254.31Q872.02 262.34,883.08 254.31L916.26,230.2Q927.33 222.16,916.26 214.13Z" />
    <path class="${getClass(faces.DBR[3])}" d="M736.71,280.29Q725.65 288.33,729.88 301.33L742.55,340.34Q746.78 353.34,757.84 345.3L791.02,321.2Q802.08 313.16,797.85 300.16L785.18,261.15Q780.96 248.15,769.89 256.18Z" />
    <path class="${getClass(faces.DBR[4])}" d="M777.34,447.39Q781.56 460.4,795.23 460.4L836.25,460.4Q849.92 460.4,845.69 447.39L833.02,408.39Q828.79 395.38,815.12 395.38L774.11,395.38Q760.44 395.38,764.66 408.39Z" />
    <path class="${getClass(faces.DBR[5])}" d="M993.61,364.61Q995.72 358.11,984.66 350.07L951.48,325.96Q940.42 317.93,935.69 332.47L921.52,376.08Q916.8 390.61,930.47 390.61L971.48,390.61Q985.16 390.61,987.27 384.11Z" />
    <path class="${getClass(faces.DBR[6])}" d="M936.91,229.13Q931.38 225.11,920.32 233.15L887.14,257.25Q876.08 265.29,888.44 274.27L925.54,301.23Q937.91 310.21,942.13 297.21L954.81,258.2Q959.03 245.2,953.5 241.18Z" />
    <path class="${getClass(faces.DBR[7])}" d="M790.54,241.18Q785.01 245.2,789.24 258.2L801.91,297.21Q806.13 310.21,818.5 301.23L855.6,274.27Q867.97 265.29,856.91 257.25L823.72,233.15Q812.66 225.11,807.13 229.13Z" />
    <path class="${getClass(faces.DBR[8])}" d="M756.77,384.11Q758.89 390.61,772.56 390.61L813.57,390.61Q827.25 390.61,822.52 376.08L808.35,332.47Q803.63 317.93,792.57 325.96L759.39,350.07Q748.32 358.11,750.44 364.61Z" />
    <path class="${getClass(faces.DBR[9])}" d="M882.28,460.4Q889.11 460.4,893.34 447.39L906.01,408.39Q910.24 395.38,894.95 395.38L849.09,395.38Q833.81 395.38,838.03 408.39L850.71,447.39Q854.93 460.4,861.77 460.4Z" />
    <path class="${getClass(faces.DBR[10])}" d="M894.95,388.48Q910.24 388.48,914.96 373.95L929.13,330.33Q933.85 315.8,921.49 306.81L884.39,279.86Q872.02 270.87,859.66 279.86L822.56,306.81Q810.19 315.8,814.91 330.33L829.08,373.95Q833.81 388.48,849.09 388.48Z" />

    <path class="${getClass(faces.B[0])}" d="M1018.67,272.05Q1022.89 285.06,1036.57 285.06L1077.58,285.06Q1091.25 285.06,1087.03 272.05L1074.35,233.05Q1070.13 220.04,1056.46 220.04L1015.44,220.04Q1001.77 220.04,1006 233.05Z" />
    <path class="${getClass(faces.B[1])}" d="M1190.15,285.06Q1203.82 285.06,1208.04 272.05L1220.72,233.05Q1224.94 220.04,1211.27 220.04L1170.25,220.04Q1156.58 220.04,1152.36 233.05L1139.68,272.05Q1135.46 285.06,1149.13 285.06Z" />
    <path class="${getClass(faces.B[2])}" d="M1255.5,125.99Q1259.73 112.99,1248.67 104.95L1215.48,80.84Q1204.42 72.81,1200.2 85.81L1187.52,124.82Q1183.3 137.82,1194.36 145.86L1227.54,169.96Q1238.6 178,1242.83 165Z" />
    <path class="${getClass(faces.B[3])}" d="M1124.42,14.68Q1113.36 6.64,1102.3 14.68L1069.11,38.79Q1058.05 46.82,1069.11 54.86L1102.3,78.97Q1113.36 87,1124.42 78.97L1157.6,54.86Q1168.66 46.82,1157.6 38.79Z" />
    <path class="${getClass(faces.B[4])}" d="M978.05,104.95Q966.99 112.99,971.21 125.99L983.89,165Q988.11 178,999.17 169.96L1032.35,145.86Q1043.41 137.82,1039.19 124.82L1026.51,85.81Q1022.29 72.81,1011.23 80.84Z" />
    <path class="${getClass(faces.B[5])}" d="M1123.61,285.06Q1130.45 285.06,1134.67 272.05L1147.35,233.05Q1151.57 220.04,1136.28 220.04L1090.43,220.04Q1075.14 220.04,1079.37 233.05L1092.04,272.05Q1096.27 285.06,1103.1 285.06Z" />
    <path class="${getClass(faces.B[6])}" d="M1234.94,189.27Q1237.05 182.77,1225.99 174.73L1192.81,150.62Q1181.75 142.59,1177.03 157.13L1162.86,200.74Q1158.13 215.27,1171.8 215.27L1212.82,215.27Q1226.49 215.27,1228.6 208.77Z" />
    <path class="${getClass(faces.B[7])}" d="M1178.25,53.79Q1172.72 49.77,1161.65 57.81L1128.47,81.91Q1117.41 89.95,1129.78 98.94L1166.88,125.89Q1179.24 134.87,1183.47 121.87L1196.14,82.86Q1200.37 69.86,1194.84 65.84Z" />
    <path class="${getClass(faces.B[8])}" d="M1031.88,65.84Q1026.35 69.86,1030.57 82.86L1043.24,121.87Q1047.47 134.87,1059.84 125.89L1096.93,98.94Q1109.3 89.95,1098.24 81.91L1065.06,57.81Q1054 49.77,1048.47 53.79Z" />
    <path class="${getClass(faces.B[9])}" d="M998.11,208.77Q1000.22 215.27,1013.89 215.27L1054.91,215.27Q1068.58 215.27,1063.86 200.74L1049.69,157.13Q1044.96 142.59,1033.9 150.62L1000.72,174.73Q989.66 182.77,991.77 189.27Z" />
    <path class="${getClass(faces.B[10])}" d="M1136.28,213.14Q1151.57 213.14,1156.29 198.61L1170.46,154.99Q1175.19 140.46,1162.82 131.47L1125.72,104.52Q1113.36 95.53,1100.99 104.52L1063.89,131.47Q1051.53 140.46,1056.25 154.99L1070.42,198.61Q1075.14 213.14,1090.43 213.14Z" />
        
    <path class="${getClass(faces.DBL[0])}" d="M1219.38,280.29Q1208.32 288.33,1212.55 301.33L1225.22,340.34Q1229.44 353.34,1240.51 345.3L1273.69,321.2Q1284.75 313.16,1280.52 300.16L1267.85,261.15Q1263.62 248.15,1252.56 256.18Z" />
    <path class="${getClass(faces.DBL[1])}" d="M1260,447.39Q1264.23 460.4,1277.9 460.4L1318.92,460.4Q1332.59 460.4,1328.36 447.39L1315.69,408.39Q1311.46 395.38,1297.79 395.38L1256.78,395.38Q1243.1 395.38,1247.33 408.39Z" />
    <path class="${getClass(faces.DBL[2])}" d="M1431.48,460.4Q1445.15 460.4,1449.38 447.39L1462.05,408.39Q1466.28 395.38,1452.6 395.38L1411.59,395.38Q1397.92 395.38,1393.69 408.39L1381.02,447.39Q1376.79 460.4,1390.47 460.4Z" />
    <path class="${getClass(faces.DBL[3])}" d="M1496.84,301.33Q1501.06 288.33,1490 280.29L1456.82,256.18Q1445.76 248.15,1441.53 261.15L1428.86,300.16Q1424.63 313.16,1435.69 321.2L1468.88,345.3Q1479.94 353.34,1484.16 340.34Z" />
    <path class="${getClass(faces.DBL[4])}" d="M1365.75,190.02Q1354.69 181.98,1343.63 190.02L1310.45,214.13Q1299.39 222.16,1310.45 230.2L1343.63,254.31Q1354.69 262.34,1365.75 254.31L1398.93,230.2Q1409.99 222.16,1398.93 214.13Z" />
    <path class="${getClass(faces.DBL[5])}" d="M1239.44,384.11Q1241.56 390.61,1255.23 390.61L1296.24,390.61Q1309.91 390.61,1305.19 376.08L1291.02,332.47Q1286.3 317.93,1275.24 325.96L1242.05,350.07Q1230.99 358.11,1233.11 364.61Z" />
    <path class="${getClass(faces.DBL[6])}" d="M1364.94,460.4Q1371.78 460.4,1376.01 447.39L1388.68,408.39Q1392.9 395.38,1377.62 395.38L1331.76,395.38Q1316.48 395.38,1320.7 408.39L1333.38,447.39Q1337.6 460.4,1344.44 460.4Z" />
    <path class="${getClass(faces.DBL[7])}" d="M1476.28,364.61Q1478.39 358.11,1467.33 350.07L1434.14,325.96Q1423.08 317.93,1418.36 332.47L1404.19,376.08Q1399.47 390.61,1413.14 390.61L1454.15,390.61Q1467.83 390.61,1469.94 384.11Z" />
    <path class="${getClass(faces.DBL[8])}" d="M1419.58,229.13Q1414.05 225.11,1402.99 233.15L1369.81,257.25Q1358.75 265.29,1371.11 274.27L1408.21,301.23Q1420.58 310.21,1424.8 297.21L1437.48,258.2Q1441.7 245.2,1436.17 241.18Z" />
    <path class="${getClass(faces.DBL[9])}" d="M1273.21,241.18Q1267.68 245.2,1271.9 258.2L1284.58,297.21Q1288.8 310.21,1301.17 301.23L1338.27,274.27Q1350.63 265.29,1339.57 257.25L1306.39,233.15Q1295.33 225.11,1289.8 229.13Z" />
    <path class="${getClass(faces.DBL[10])}" d="M1377.62,388.48Q1392.9 388.48,1397.63 373.95L1411.8,330.33Q1416.52 315.8,1404.16 306.81L1367.06,279.86Q1354.69 270.87,1342.32 279.86L1305.23,306.81Q1292.86 315.8,1297.58 330.33L1311.75,373.95Q1316.48 388.48,1331.76 388.48Z" />
    
    <text x="387" y="342.75" font-size="75" class="c12">U</text>
    <text x="387" y="599.8" font-size="75" class="c13">F</text>
  </svg>`;
    };
    return mega;
}

function RUBIK(n) {
    const rubik = {
        palette: STANDARD_PALETTE,
        move: () => false
    };
    const FACE_COLOR = {
        U: "white",
        R: "red",
        F: "green",
        D: "yellow",
        L: "orange",
        B: "blue",
    };
    const faces = {
        U: [],
        R: [],
        F: [],
        D: [],
        L: [],
        B: [],
    };
    Object.entries(faces).forEach(([e]) => {
        const fn = e;
        faces[e] = Array.from({ length: n })
            .fill("")
            .map(() => Array.from({ length: n }).fill(fn));
    });
    const cycles = {
        U: [
            (f, k) => ({
                get: () => f.F[k],
                set: vals => {
                    f.F[k] = vals;
                },
            }),
            (f, k) => ({
                get: () => f.L[k],
                set: vals => {
                    f.L[k] = vals;
                },
            }),
            (f, k) => ({
                get: () => f.B[k],
                set: vals => {
                    f.B[k] = vals;
                },
            }),
            (f, k) => ({
                get: () => f.R[k],
                set: vals => {
                    f.R[k] = vals;
                },
            }),
        ],
        D: [
            (f, k) => ({
                get: () => f.F[f.F.length - 1 - k],
                set: vals => {
                    f.F[f.F.length - 1 - k] = vals;
                },
            }),
            (f, k) => ({
                get: () => f.R[f.R.length - 1 - k],
                set: vals => {
                    f.R[f.R.length - 1 - k] = vals;
                },
            }),
            (f, k) => ({
                get: () => f.B[f.B.length - 1 - k],
                set: vals => {
                    f.B[f.B.length - 1 - k] = vals;
                },
            }),
            (f, k) => ({
                get: () => f.L[f.L.length - 1 - k],
                set: vals => {
                    f.L[f.L.length - 1 - k] = vals;
                },
            }),
        ],
        R: [
            (f, k) => ({
                get: () => f.F.map(row => row[f.F.length - 1 - k]),
                set: vals => f.F.forEach((row, i) => (row[f.F.length - 1 - k] = vals[i])),
            }),
            (f, k) => ({
                get: () => f.U.map(row => row[f.U.length - 1 - k]),
                set: vals => f.U.forEach((row, i) => (row[f.U.length - 1 - k] = vals[i])),
            }),
            (f, k) => ({
                get: () => f.B.map(row => row[k]).reverse(),
                set: vals => f.B.forEach((row, i) => (row[k] = vals[f.B.length - 1 - i])),
            }),
            (f, k) => ({
                get: () => f.D.map(row => row[f.D.length - 1 - k]),
                set: vals => f.D.forEach((row, i) => (row[f.D.length - 1 - k] = vals[i])),
            }),
        ],
        L: [
            (f, k) => ({
                get: () => f.F.map(row => row[k]),
                set: vals => f.F.forEach((row, i) => (row[k] = vals[i])),
            }),
            (f, k) => ({
                get: () => f.D.map(row => row[k]),
                set: vals => f.D.forEach((row, i) => (row[k] = vals[i])),
            }),
            (f, k) => ({
                get: () => f.B.map(row => row[f.B.length - 1 - k]).reverse(),
                set: vals => f.B.forEach((row, i) => (row[f.B.length - 1 - k] = vals[f.B.length - 1 - i])),
            }),
            (f, k) => ({
                get: () => f.U.map(row => row[k]),
                set: vals => f.U.forEach((row, i) => (row[k] = vals[i])),
            }),
        ],
        F: [
            (f, k) => ({
                get: () => f.U[f.U.length - 1 - k],
                set: vals => {
                    f.U[f.U.length - 1 - k] = vals;
                },
            }),
            (f, k) => ({
                get: () => f.R.map(row => row[k]),
                set: vals => f.R.forEach((row, i) => (row[k] = vals[i])),
            }),
            (f, k) => ({
                get: () => f.D[k].slice().reverse(),
                set: vals => {
                    f.D[k] = vals.slice().reverse();
                },
            }),
            (f, k) => ({
                get: () => f.L.map(row => row[f.L.length - 1 - k]).reverse(),
                set: vals => f.L.forEach((row, i) => (row[f.L.length - 1 - k] = vals[f.L.length - 1 - i])),
            }),
        ],
        B: [
            (f, k) => ({
                get: () => f.U[k].slice().reverse(),
                set: vals => {
                    f.U[k] = vals.slice().reverse();
                },
            }),
            (f, k) => ({
                get: () => f.L.map(row => row[k]),
                set: vals => f.L.forEach((row, i) => (row[k] = vals[i])),
            }),
            (f, k) => ({
                get: () => f.D[f.D.length - 1 - k],
                set: vals => {
                    f.D[f.D.length - 1 - k] = vals;
                },
            }),
            (f, k) => ({
                get: () => f.R.map(row => row[f.R.length - 1 - k]).reverse(),
                set: vals => f.R.forEach((row, i) => (row[f.R.length - 1 - k] = vals[f.R.length - 1 - i])),
            }),
        ],
    };
    function rotateFace(face, count) {
        const n = face.length;
        const times = ((count % 4) + 4) % 4;
        const result = Array.from({ length: n }, () => Array(n).fill(""));
        const mapIndex = [
            (i, j) => [i, j],
            (i, j) => [j, n - 1 - i],
            (i, j) => [n - 1 - i, n - 1 - j],
            (i, j) => [n - 1 - j, i],
        ];
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const [ni, nj] = mapIndex[times](i, j);
                result[ni][nj] = face[i][j];
            }
        }
        return result;
    }
    function doMove(f, move) {
        const [layers, base, dir, span] = move;
        let sp = span || layers;
        if (sp === layers) {
            f[base] = rotateFace(f[base], dir);
        }
        if (sp === n) {
            const e = Object.entries(faces);
            const opBase = e[(e.reduce((acc, e, p) => (e[0] === base ? p : acc), -1) + 3) % 6][0];
            f[opBase] = rotateFace(f[opBase], -dir);
        }
        const cycle = cycles[base];
        if (!cycle)
            return;
        for (let k = layers - sp; k < layers; k += 1) {
            const strips = cycle.map(fn => fn(f, k).get());
            const shift = ((dir % cycle.length) + cycle.length) % cycle.length;
            const rotated = strips.map((_, i) => strips[(i - shift + cycle.length) % cycle.length]);
            rotated.forEach((strip, i) => {
                cycle[i](f, k).set(strip);
            });
        }
    }
    rubik.move = function (moves) {
        moves.forEach(mv => doMove(faces, mv));
    };
    rubik.getImage = () => {
        const BOX = 100;
        const W = BOX * 4;
        const H = BOX * 3;
        const CW = BOX / n;
        const PIECE_FACTOR = 0.9;
        const BOX_FACTOR = 0.9;
        const OFFSET = (CW * (1 - PIECE_FACTOR)) / 2;
        const BOX_OFFSET = (BOX * (1 - BOX_FACTOR)) / 2;
        const RX = 3 / n + 0.4;
        const getRect = (x, y, bx, by, fc) => {
            return `<rect
  x="${bx * BOX + BOX_OFFSET + x * CW * BOX_FACTOR + OFFSET}"
  y="${by * BOX + BOX_OFFSET + y * CW * BOX_FACTOR + OFFSET}"
  width="${CW * PIECE_FACTOR * BOX_FACTOR}"
  height="${CW * PIECE_FACTOR * BOX_FACTOR}"
  fill="${STANDARD_PALETTE[FACE_COLOR[fc]]}"
  rx="${RX}"
/>`;
        };
        const allPieces = [
            ["U", 1, 0],
            ["L", 0, 1],
            ["F", 1, 1],
            ["R", 2, 1],
            ["B", 3, 1],
            ["D", 1, 2],
        ]
            .map(e => faces[e[0]]
            .map((v, y) => v.map((fc, x) => getRect(x, y, e[1], e[2], fc)).join(""))
            .join(""))
            .join("");
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin">
      ${allPieces}
    </svg>`;
    };
    return rubik;
}

const puzzleReg = new Map();
function registerPuzzle(code, name, constr, order) {
    puzzleReg.set(code, { code, name, constr, order });
}

function PYRAMINX() {
    const pyra = {
        palette: STANDARD_PALETTE,
        move: () => true,
    };
    const faces = {
        F: ["F", "F", "F", "F", "F", "F", "F", "F", "F"],
        R: ["R", "R", "R", "R", "R", "R", "R", "R", "R"],
        L: ["L", "L", "L", "L", "L", "L", "L", "L", "L"],
        D: ["D", "D", "D", "D", "D", "D", "D", "D", "D"],
    };
    function update(NF, NR, NL, ND) {
        faces.F = NF;
        faces.R = NR;
        faces.L = NL;
        faces.D = ND;
    }
    // URLB
    const cycles = {
        U: (count) => {
            const times = ((count % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NF = [0, -1, -1, 3, -1, 5, 6, -1, -1].map((v, p) => (v < 0 ? faces.F[p] : faces.R[v]));
                const NR = [1, -1, -1, 4, -1, 3, 7, -1, -1].map((v, p) => (v < 0 ? faces.R[p] : faces.L[v]));
                const NL = [-1, 0, -1, 5, 3, -1, -1, 6, -1].map((v, p) => (v < 0 ? faces.L[p] : faces.F[v]));
                const ND = [...faces.D];
                update(NF, NR, NL, ND);
            }
        },
        R: (count) => {
            const times = ((count % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NF = [-1, -1, 0, -1, 5, 3, -1, -1, 6].map((v, p) => (v < 0 ? faces.F[p] : faces.D[v]));
                const NR = [-1, 2, -1, 4, 5, -1, -1, 8, -1].map((v, p) => (v < 0 ? faces.R[p] : faces.F[v]));
                const NL = [...faces.L];
                const ND = [1, -1, -1, 4, -1, 3, 7, -1, -1].map((v, p) => (v < 0 ? faces.D[p] : faces.R[v]));
                update(NF, NR, NL, ND);
            }
        },
        L: (count) => {
            const times = ((count % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NF = [-1, 0, -1, 5, 3, -1, -1, 6, -1].map((v, p) => (v < 0 ? faces.F[p] : faces.L[v]));
                const NR = [...faces.R];
                const NL = [1, -1, -1, 4, -1, 3, 7, -1, -1].map((v, p) => (v < 0 ? faces.L[p] : faces.D[v]));
                const ND = [-1, 1, -1, 3, 4, -1, -1, 7, -1].map((v, p) => (v < 0 ? faces.D[p] : faces.F[v]));
                update(NF, NR, NL, ND);
            }
        },
        B: (count) => {
            const times = ((count % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NF = [...faces.F];
                const NR = [-1, -1, 2, -1, 4, 5, -1, -1, 8].map((v, p) => (v < 0 ? faces.R[p] : faces.D[v]));
                const NL = [-1, -1, 2, -1, 4, 5, -1, -1, 8].map((v, p) => (v < 0 ? faces.L[p] : faces.R[v]));
                const ND = [-1, -1, 2, -1, 4, 5, -1, -1, 8].map((v, p) => (v < 0 ? faces.D[p] : faces.L[v]));
                update(NF, NR, NL, ND);
            }
        },
        u: (count) => {
            const times = ((count % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NF = faces.F.map((v, p) => (p === 0 ? faces.R[0] : v));
                const NR = faces.R.map((v, p) => (p === 0 ? faces.L[1] : v));
                const NL = faces.L.map((v, p) => (p === 1 ? faces.F[0] : v));
                const ND = [...faces.D];
                update(NF, NR, NL, ND);
            }
        },
        r: (count) => {
            const times = ((count % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NF = faces.F.map((v, p) => (p === 2 ? faces.D[0] : v));
                const NR = faces.R.map((v, p) => (p === 1 ? faces.F[2] : v));
                const NL = [...faces.L];
                const ND = faces.D.map((v, p) => (p === 0 ? faces.R[1] : v));
                update(NF, NR, NL, ND);
            }
        },
        l: (count) => {
            const times = ((count % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NF = faces.F.map((v, p) => (p === 1 ? faces.L[0] : v));
                const NR = [...faces.R];
                const NL = faces.L.map((v, p) => (p === 0 ? faces.D[1] : v));
                const ND = faces.D.map((v, p) => (p === 1 ? faces.F[1] : v));
                update(NF, NR, NL, ND);
            }
        },
        b: (count) => {
            const times = ((count % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NF = [...faces.F];
                const NR = faces.R.map((v, p) => (p === 2 ? faces.D[2] : v));
                const NL = faces.L.map((v, p) => (p === 2 ? faces.R[2] : v));
                const ND = faces.D.map((v, p) => (p === 2 ? faces.L[2] : v));
                update(NF, NR, NL, ND);
            }
        },
    };
    pyra.move = (moves) => {
        moves.forEach(mv => {
            if (mv[0] === 0) {
                (mv[2] === 2 ? cycles.U : cycles.u)(-mv[1]);
            }
            else if (mv[0] === 1) {
                (mv[2] === 2 ? cycles.R : cycles.r)(-mv[1]);
            }
            else if (mv[0] === 2) {
                (mv[2] === 2 ? cycles.L : cycles.l)(-mv[1]);
            }
            else if (mv[0] === 3) {
                (mv[2] === 2 ? cycles.B : cycles.b)(-mv[1]);
            }
        });
    };
    const lookup = {
        F: 0,
        D: 1,
        L: 2,
        R: 3,
    };
    function getClass(fc) {
        return "c" + lookup[fc];
    }
    pyra.getImage = () => {
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 1000 879.9999999999999" class="NzJiZmJlZDYtZjgx">
  <style>.NzJiZmJlZDYtZjgx .c0{fill:#009d54ff;stroke:black;stroke-width:5;stroke-linecap:square;}.NzJiZmJlZDYtZjgx .c1{fill:#ffeb3bff;stroke:black;stroke-width:5;stroke-linecap:square;}.NzJiZmJlZDYtZjgx .c2{fill:#dc422fff;stroke:black;stroke-width:5;stroke-linecap:square;}.NzJiZmJlZDYtZjgx .c3{fill:#3d81f6ff;stroke:black;stroke-width:5;stroke-linecap:square;}</style>
  <path class="${getClass(faces.F[0])}" d="M508.32,37.49Q500 23.11,491.67 37.49L432.67,139.47Q424.35 153.85,440.99 153.85L559,153.85Q575.64 153.85,567.32 139.47Z" />
  <path class="${getClass(faces.F[1])}" d="M344.76,320.17Q336.44 305.79,328.12 320.17L269.12,422.15Q260.8 436.53,277.44 436.53L395.44,436.53Q412.09 436.53,403.77 422.15Z" />
  <path class="${getClass(faces.F[2])}" d="M671.87,320.17Q663.55 305.79,655.23 320.17L596.22,422.15Q587.9 436.53,604.55 436.53L722.55,436.53Q739.19 436.53,730.87 422.15Z" />
  <path class="${getClass(faces.F[3])}" d="M426.54,178.83Q418.22 164.45,409.9 178.83L350.9,280.81Q342.58 295.19,359.22 295.19L477.22,295.19Q493.86 295.19,485.54 280.81Z" />
  <path class="${getClass(faces.F[4])}" d="M508.32,320.17Q500 305.79,491.67 320.17L432.67,422.15Q424.35 436.53,440.99 436.53L559,436.53Q575.64 436.53,567.32 422.15Z" />
  <path class="${getClass(faces.F[5])}" d="M590.09,178.83Q581.77 164.45,573.45 178.83L514.45,280.81Q506.13 295.19,522.77 295.19L640.77,295.19Q657.41 295.19,649.09 280.81Z" />
  <path class="${getClass(faces.F[6])}" d="M440.99,160.92Q424.35 160.92,432.67 175.3L491.67,277.27Q500 291.66,508.32 277.27L567.32,175.3Q575.64 160.92,559 160.92Z" />
  <path class="${getClass(faces.F[7])}" d="M359.22,302.26Q342.58 302.26,350.9 316.64L409.9,418.61Q418.22 433,426.54 418.61L485.54,316.64Q493.86 302.26,477.22 302.26Z" />
  <path class="${getClass(faces.F[8])}" d="M522.77,302.26Q506.13 302.26,514.45 316.64L573.45,418.61Q581.77 433,590.09 418.61L649.09,316.64Q657.41 302.26,640.77 302.26Z" />

  <path class="${getClass(faces.D[0])}" d="M655.23,584.53Q663.55 598.94,671.87 584.53L730.87,482.34Q739.19 467.92,722.55 467.92L604.55,467.92Q587.9 467.92,596.22 482.34Z" />
  <path class="${getClass(faces.D[1])}" d="M328.12,584.53Q336.44 598.94,344.76 584.53L403.77,482.34Q412.09 467.92,395.44 467.92L277.44,467.92Q260.8 467.92,269.12 482.34Z" />
  <path class="${getClass(faces.D[2])}" d="M491.67,867.81Q500 882.22,508.32 867.81L567.32,765.61Q575.64 751.2,559 751.2L440.99,751.2Q424.35 751.2,432.67 765.61Z" />
  <path class="${getClass(faces.D[3])}" d="M491.67,584.53Q500 598.94,508.32 584.53L567.32,482.34Q575.64 467.92,559 467.92L440.99,467.92Q424.35 467.92,432.67 482.34Z" />
  <path class="${getClass(faces.D[4])}" d="M409.9,726.17Q418.22 740.58,426.54 726.17L485.54,623.97Q493.86 609.56,477.22 609.56L359.22,609.56Q342.58 609.56,350.9 623.97Z" />
  <path class="${getClass(faces.D[5])}" d="M573.45,726.17Q581.77 740.58,590.09 726.17L649.09,623.97Q657.41 609.56,640.77 609.56L522.77,609.56Q506.13 609.56,514.45 623.97Z" />
  <path class="${getClass(faces.D[6])}" d="M640.77,602.48Q657.41 602.48,649.09 588.07L590.09,485.88Q581.77 471.46,573.45 485.88L514.45,588.07Q506.13 602.48,522.77 602.48Z" />
  <path class="${getClass(faces.D[7])}" d="M477.22,602.48Q493.86 602.48,485.54 588.07L426.54,485.88Q418.22 471.46,409.9 485.88L350.9,588.07Q342.58 602.48,359.22 602.48Z" />
  <path class="${getClass(faces.D[8])}" d="M559,744.12Q575.64 744.12,567.32 729.71L508.32,627.52Q500 613.1,491.67 627.52L432.67,729.71Q424.35 744.12,440.99 744.12Z" />
  
  <path class="${getClass(faces.L[0])}" d="M226.58,404.02Q234.87 418.32,243.19 403.94L302.19,301.96Q310.51 287.58,293.9 287.66L176.08,288.2Q159.47 288.27,167.76 302.58Z" />
  <path class="${getClass(faces.L[1])}" d="M390.13,121.34Q398.42 135.64,406.74 121.26L465.74,19.28Q474.06 4.9,457.45 4.98L339.63,5.52Q323.02 5.59,331.31 19.9Z" />
  <path class="${getClass(faces.L[2])}" d="M63.54,122.83Q71.84 137.14,80.16 122.76L139.16,20.78Q147.48 6.4,130.87 6.47L13.05,7.01Q-3.56 7.09,4.73 21.4Z" />
  <path class="${getClass(faces.L[3])}" d="M308.35,262.68Q316.65 276.98,324.97 262.6L383.97,160.62Q392.29 146.24,375.67 146.32L257.86,146.86Q241.24 146.93,249.54 161.24Z" />
  <path class="${getClass(faces.L[4])}" d="M226.84,122.08Q235.13 136.39,243.45 122.01L302.45,20.03Q310.77 5.65,294.16 5.73L176.34,6.27Q159.73 6.34,168.02 20.65Z" />
  <path class="${getClass(faces.L[5])}" d="M145.06,263.42Q153.36 277.73,161.68 263.35L220.68,161.37Q229 146.99,212.38 147.07L94.57,147.61Q77.95 147.68,86.25 161.99Z" />
  <path class="${getClass(faces.L[6])}" d="M293.91,280.61Q310.52 280.53,302.23 266.23L243.41,164.79Q235.12 150.49,226.8 164.87L167.8,266.84Q159.48 281.23,176.09 281.15Z" />
  <path class="${getClass(faces.L[7])}" d="M375.68,139.27Q392.3 139.19,384 124.89L325.19,23.45Q316.89 9.15,308.57 23.53L249.57,125.5Q241.25 139.89,257.87 139.81Z" />
  <path class="${getClass(faces.L[8])}" d="M212.39,140.02Q229 139.94,220.71 125.64L161.9,24.2Q153.6 9.89,145.28 24.28L86.28,126.25Q77.96 140.63,94.57 140.56Z" />
  
  <path class="${getClass(faces.R[0])}" d="M593.25,121.26Q601.57 135.64,609.86 121.34L668.68,19.9Q676.97 5.59,660.36 5.52L542.54,4.98Q525.93 4.9,534.25 19.28Z" />
  <path class="${getClass(faces.R[1])}" d="M756.8,403.94Q765.12 418.32,773.41 404.02L832.23,302.58Q840.52 288.27,823.91 288.2L706.09,287.66Q689.48 287.58,697.8 301.96Z" />
  <path class="${getClass(faces.R[2])}" d="M919.83,122.76Q928.15 137.14,936.45 122.83L995.26,21.4Q1003.55 7.09,986.94 7.01L869.12,6.47Q852.51 6.4,860.83 20.78Z" />
  <path class="${getClass(faces.R[3])}" d="M675.02,262.6Q683.34 276.98,691.64 262.68L750.45,161.24Q758.75 146.93,742.13 146.86L624.32,146.32Q607.7 146.24,616.02 160.62Z" />
  <path class="${getClass(faces.R[4])}" d="M838.31,263.35Q846.63 277.73,854.93 263.42L913.74,161.99Q922.04 147.68,905.42 147.61L787.61,147.07Q770.99 146.99,779.31 161.37Z" />
  <path class="${getClass(faces.R[5])}" d="M756.54,122.01Q764.86 136.39,773.15 122.08L831.97,20.65Q840.26 6.34,823.65 6.27L705.83,5.73Q689.22 5.65,697.54 20.03Z" />
  <path class="${getClass(faces.R[6])}" d="M742.12,139.81Q758.74 139.89,750.42 125.5L691.42,23.53Q683.1 9.15,674.8 23.45L615.99,124.89Q607.69 139.19,624.31 139.27Z" />
  <path class="${getClass(faces.R[7])}" d="M823.9,281.15Q840.51 281.23,832.19 266.84L773.19,164.87Q764.87 150.49,756.58 164.79L697.76,266.23Q689.47 280.53,706.08 280.61Z" />
  <path class="${getClass(faces.R[8])}" d="M905.42,140.56Q922.03 140.63,913.71 126.25L854.71,24.28Q846.39 9.89,838.09 24.2L779.28,125.64Q770.99 139.94,787.6 140.02Z" />
</svg>`;
    };
    return pyra;
}

function SKEWB() {
    const skewb = {
        palette: STANDARD_PALETTE,
        move: () => true,
    };
    const FACE_COLOR = {
        U: "white",
        R: "red",
        F: "green",
        D: "yellow",
        L: "orange",
        B: "blue",
    };
    const faces = {
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
        return indexes.map(n => arr[n]);
    }
    const cycles = {
        R: (dir) => {
            const times = ((dir % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NU = [faces.U[0], faces.F[2], ...pick(faces.U, [2, 3, 4])];
                const NR = [faces.R[0], ...faces.D.slice(1)];
                const NF = faces.F.map((v, p) => (p === 2 ? faces.L[3] : v));
                const ND = [faces.D[0], ...pick(faces.B, [2, 3, 0, 4])];
                const NL = faces.L.map((v, p) => (p === 3 ? faces.U[1] : v));
                const NB = pick(faces.R, [3, 0, 1, 2, 4]).map((v, p) => (p === 1 ? faces.B[1] : v));
                update(NU, NR, NF, ND, NL, NB);
            }
        },
        L: (dir) => {
            const times = ((dir % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NU = faces.U.map((v, p) => (p === 3 ? faces.B[2] : v));
                const NR = faces.R.map((v, p) => (p === 3 ? faces.U[3] : v));
                const NF = pick(faces.L, [3, 1, 1, 2, 4]).map((v, p) => (p === 1 ? faces.F[1] : v));
                const ND = pick(faces.F, [3, 0, 1, 2, 4]).map((v, p) => (p === 2 ? faces.D[2] : v));
                const NL = pick(faces.D, [0, 3, 0, 1, 4]).map((v, p) => (p === 0 ? faces.L[0] : v));
                const NB = faces.B.map((v, p) => (p === 2 ? faces.R[3] : v));
                update(NU, NR, NF, ND, NL, NB);
            }
        },
        U: (dir) => {
            const times = ((dir % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NU = pick(faces.B, [1, 2, 0, 0, 4]).map((v, p) => (p === 2 ? faces.U[2] : v));
                const NR = faces.R.map((v, p) => (p === 1 ? faces.D[3] : v));
                const NF = faces.F.map((v, p) => (p === 0 ? faces.R[1] : v));
                const ND = faces.D.map((v, p) => (p === 3 ? faces.F[0] : v));
                const NL = faces.U.map((v, p) => (p === 2 ? faces.L[2] : v));
                const NB = pick(faces.L, [3, 0, 1, 0, 4]).map((v, p) => (p === 3 ? faces.B[3] : v));
                update(NU, NR, NF, ND, NL, NB);
            }
        },
        B: (dir) => {
            const times = ((dir % 3) + 3) % 3;
            for (let i = 0; i < times; i += 1) {
                const NU = faces.U.map((v, p) => (p === 0 ? faces.R[2] : v));
                const NR = faces.R.map((v, p) => (p === 2 ? faces.F[3] : v));
                const NF = faces.F.map((v, p) => (p === 3 ? faces.U[0] : v));
                const ND = faces.L.map((v, p) => (p === 1 ? faces.D[1] : v));
                const NL = pick(faces.B, [3, 0, 1, 2, 4]).map((v, p) => (p === 1 ? faces.L[1] : v));
                const NB = pick(faces.D, [0, 2, 3, 0, 4]).map((v, p) => (p === 0 ? faces.B[0] : v));
                update(NU, NR, NF, ND, NL, NB);
            }
        },
    };
    const moveMap = "FURLBfrlbxyz";
    skewb.move = function (moves) {
        moves.forEach(mv => {
            cycles[moveMap[mv[0]]](mv[1]);
        });
    };
    skewb.getImage = () => {
        const BOX = 100;
        const W = BOX * 4;
        const H = BOX * 3;
        const BOX_FACTOR = 0.9;
        const BOX_OFFSET = (BOX * (1 - BOX_FACTOR)) / 2;
        const drawFace = (bx, by, fn) => {
            const rx = bx * BOX + BOX_OFFSET;
            const ry = by * BOX + BOX_OFFSET;
            const BX = BOX * BOX_FACTOR;
            const BX2 = BX / 2;
            const cols = fn.map(c => STANDARD_PALETTE[FACE_COLOR[c]]);
            return `
      <path stroke="black" stroke-width="2" fill="${cols[0]}" d="${getRoundedPath([
                [rx, ry],
                [rx, ry + BX2],
                [rx + BX2, ry],
            ])}" />
      <path stroke="black" stroke-width="2" fill="${cols[1]}" d="${getRoundedPath([
                [rx + BX2, ry],
                [rx + BX, ry + BX2],
                [rx + BX, ry],
            ])}" />
      <path stroke="black" stroke-width="2" fill="${cols[2]}" d="${getRoundedPath([
                [rx + BX, ry + BX2],
                [rx + BX2, ry + BX],
                [rx + BX, ry + BX],
            ])}" />
      <path stroke="black" stroke-width="2" fill="${cols[3]}" d="${getRoundedPath([
                [rx + BX2, ry + BX],
                [rx, ry + BX2],
                [rx, ry + BX],
            ])}" />
      <path stroke="black" stroke-width="2" fill="${cols[4]}" d="${getRoundedPath([
                [rx + BX2, ry],
                [rx + BX, ry + BX2],
                [rx + BX2, ry + BX],
                [rx, ry + BX2],
            ])}" />
      `;
        };
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin">
      ${drawFace(1, 0, faces.U)}
      ${drawFace(0, 1, faces.L)}
      ${drawFace(1, 1, faces.F)}
      ${drawFace(2, 1, faces.R)}
      ${drawFace(3, 1, faces.B)}
      ${drawFace(1, 2, faces.D)}
    </svg>`;
    };
    return skewb;
}

class Vector2D {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    static cross(a, b) {
        return a.x * b.y - b.x * a.y;
    }
    add(v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }
    mul(f) {
        return new Vector2D(this.x * f, this.y * f);
    }
    multiply(v) {
        return new Vector2D(this.x * v.x - this.y * v.y, this.x * v.y + this.y * v.x);
    }
    div(f) {
        return new Vector2D(this.x / f, this.y / f);
    }
    rot(ang) {
        return new Vector2D(this.x * Math.cos(ang) - this.y * Math.sin(ang), this.x * Math.sin(ang) + this.y * Math.cos(ang));
    }
    abs() {
        return (this.x ** 2 + this.y ** 2) ** 0.5;
    }
    unit() {
        const len = this.abs();
        return new Vector2D(this.x / len, this.y / len);
    }
    toArr() {
        return [this.x, this.y];
    }
}

function SQUARE1() {
    const sq1 = {
        palette: STANDARD_PALETTE,
        move: () => true,
    };
    const faces = {
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
    const cycles = {
        slash: () => {
            let pos1 = 0;
            let pos2 = 0;
            const UF = faces.U;
            const DF = faces.D;
            for (let i = 0, acc = 0, maxi = UF.length; i < maxi; i += 1) {
                acc += UF[i].l;
                if (acc === 6) {
                    pos1 = i;
                    break;
                }
            }
            for (let i = 0, acc = 0, maxi = DF.length; i < maxi; i += 1) {
                acc += DF[i].l;
                if (acc === 6) {
                    pos2 = i;
                    break;
                }
            }
            faces.E[0].l = faces.E[0].l === 1 ? 2 : 1;
            const topSlice = UF.slice(pos1 + 1).reverse();
            const bottomSlice = DF.slice(pos2 + 1).reverse();
            faces.U = [...UF.slice(0, pos1 + 1), ...bottomSlice];
            faces.D = [...DF.slice(0, pos2 + 1), ...topSlice];
        },
        U: (count) => {
            const rcount = 12 - (((count % 12) + 12) % 12);
            const fc = faces.U;
            for (let i = 0, s = 0, maxi = fc.length; i < maxi; i += 1) {
                s += fc[i].l;
                if (s === rcount) {
                    faces.U = [...faces.U.slice(i + 1), ...faces.U.slice(0, i + 1)];
                    break;
                }
            }
        },
        D: (count) => {
            const rcount = ((count % 12) + 12) % 12;
            const fc = faces.D;
            for (let i = 0, s = 0, maxi = fc.length; i < maxi; i += 1) {
                s += fc[i].l;
                if (s === rcount) {
                    faces.D = [...faces.D.slice(i + 1), ...faces.D.slice(0, i + 1)];
                    break;
                }
            }
        },
    };
    sq1.move = function (moves) {
        moves.forEach(mv => {
            if (mv[0] === 0)
                cycles.slash();
            else if (mv[0] === 1)
                cycles.U(mv[1]);
            else if (mv[0] === 2)
                cycles.D(mv[1]);
        });
    };
    const colors = {
        U: "white",
        R: "blue",
        F: "red",
        D: "yellow",
        L: "green",
        B: "orange",
    };
    function getColor(fc) {
        return STANDARD_PALETTE[colors[fc]];
    }
    sq1.getImage = () => {
        const W = 200;
        const W_2 = W / 2;
        const FACTOR = 0.5;
        const LFactor = 1.3;
        const L = W_2 * FACTOR;
        const R = L * Math.tan(Math.PI / 12);
        const EPath = (my) => [
            [W_2, W_2],
            [W_2 - R, W_2 + my * L],
            [W_2 + R, W_2 + my * L],
        ];
        const CPath = (my) => [
            [W_2, W_2],
            [W_2 - L, W_2 + my * R],
            [W_2 - L, W_2 + my * L],
            [W_2 - R, W_2 + my * L],
        ];
        const convertPath = (path, REF, OFF, OX, OY, my) => {
            return path.map(c => new Vector2D(c[0], c[1])
                .sub(REF)
                .rot(my * OFF)
                .add(new Vector2D(REF.x + OX, REF.y + OY))
                .toArr());
        };
        const getFace = (fc, OX, OY, my = 1) => {
            const REF = new Vector2D(W_2, W_2);
            const ANG = Math.PI / 6;
            const res = [];
            let acc = 0;
            for (let i = 0, maxi = fc.length; i < maxi; i += 1) {
                const pc = fc[i];
                const OFF = acc * ANG + (pc.l === 1 ? ANG : 0);
                const paths = [convertPath(pc.l === 1 ? EPath(my) : CPath(my), REF, OFF, OX, OY, my)];
                if (pc.l === 1) {
                    const EP1 = EPath(my)
                        .slice(1)
                        .reverse()
                        .map(c => new Vector2D(c[0], c[1]).sub(REF).mul(LFactor).add(REF).toArr());
                    paths.push(convertPath([...EPath(my).slice(1), ...EP1], REF, OFF, OX, OY, my));
                }
                else {
                    const pos = [
                        [1, 3],
                        [2, 4],
                    ];
                    if (my < 0)
                        pos.reverse();
                    pos.forEach(p => {
                        const EP1 = CPath(my)
                            .slice(p[0], p[1])
                            .reverse()
                            .map(c => new Vector2D(c[0], c[1]).sub(REF).mul(LFactor).add(REF).toArr());
                        paths.push(convertPath([...CPath(my).slice(p[0], p[1]), ...EP1], REF, OFF, OX, OY, my));
                    });
                }
                acc += pc.l;
                res.push(paths
                    .map((path, p) => `<path d="${getRoundedPath(path, 0.15)}" fill="${getColor(fc[i].c[p])}" stroke="black" stroke-width="2" />`)
                    .join(""));
            }
            return res.join("");
        };
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 200 400" class="NzJiZmJlZDYtZjgx">
  ${getFace(faces.U, 0, 0)}
  ${getFace(faces.D, 0, W, -1)}
  <rect x="${W * 0.175}" y="${W * 0.95}" width="${W * 0.239}" height="${W * 0.09}"
    rx="${W * 0.02}" ry="${W * 0.02}" stroke="black" stroke-width="2" fill=${getColor("F")} />
  <rect x="${W * 0.414}" y="${W * 0.95}" width="${W * (faces.E[0].l & 1 ? 0.412 : 0.239)}" height="${W * 0.09}"
    rx="${W * 0.02}" ry="${W * 0.02}" stroke="black" stroke-width="2" fill=${faces.E[0].l & 1 ? getColor("F") : getColor("B")} />
</svg>`;
    };
    return sq1;
}

// import { AXIS } from "./axis";
// import { WINDMILL } from "./windmill";
// import { FISHER } from "./fisher";
// import { IVY } from "./ivy";
// import { MIRROR } from "./mirror";
// import { DINO } from "./dino";
// import { REX } from "./rex";
// import { REDI } from "./redi";
// import { MIXUP } from "./mixup";
// import { PYRAMORPHIX } from "./pyramorphix";
// import { GEAR } from "./gear";
// import { DREIDEL } from "./dreidel";
// import { BDG } from "./bandaged222";
// import { BICUBE } from "./bicube";
// import { SQUARE2 } from "./square2";
// import { PANDORA } from "./pandora";
// import { ULTIMATE_SKEWB } from "./ultimateSkewb";
// import { PYRAMINX_CRYSTAL } from "./pyraminxCrystal";
// import { TETRAMINX } from "./tetraminx";
// import { MEIER_HALPERN_PYRAMIND } from "./meierHalpernPyramind";
// import { SQUARE1_STAR } from "./square1Star";
// import { HELICOPTER } from "./helicopter";
// import { SUPER_SQUARE1 } from "./superSquare1";
// import { FTO } from "./fto";
// import { TIME_MACHINE } from "./timeMachine";
// import { MASTER_SKEWB } from "./masterSkewb";
// import { VOID } from "./void333";
// import { FISHER44 } from "./fisher44";
// import { GHOST } from "./ghost";
// import { BARREL33 } from "./barrel33";
// NxN, Pyraminx, Megaminx, Skewb, Square-1, Clock
registerPuzzle("rubik", "Rubik", RUBIK, true);
registerPuzzle("pyraminx", "Pyraminx", PYRAMINX, true);
registerPuzzle("megaminx", "Megaminx", MEGAMINX, true);
registerPuzzle("skewb", "Skewb", SKEWB, false);
registerPuzzle("square1", "Square One", SQUARE1, false);
registerPuzzle("clock", "Rubik's clock", CLOCK, false);
// NxN Mods
// registerPuzzle("mirror", "Mirror", MIRROR, true);
// registerPuzzle("void", "Void Cube", VOID, false);
// registerPuzzle("windmill", "Windmill", WINDMILL, false);
// registerPuzzle("fisher", "Fisher", FISHER, false);
// registerPuzzle("fisher44", "Fisher 4x4", FISHER44, false);
// registerPuzzle("axis", "Axis", AXIS, false);
// registerPuzzle("pandora", "Pandora", PANDORA, false);
// registerPuzzle("mixup", "Mixup", MIXUP, false);
// registerPuzzle("barrel33", "Barrel 3x3", BARREL33, false);
// registerPuzzle("gear", "Gear", GEAR, false);
// registerPuzzle("dreidel", "Dreidel", DREIDEL, false);
// registerPuzzle("ghost", "Ghost", GHOST, false);
// registerPuzzle("timemachine", "Time Machine", TIME_MACHINE, false);
// registerPuzzle("bandaged222", "Bandaged 2x2x2", BDG, false);
// registerPuzzle("bicube", "Bicube", BICUBE, false);
// Pyraminx Mods
// registerPuzzle("pyramorphix", "Pyramorphix", PYRAMORPHIX, false);
// registerPuzzle("tetraminx", "Tetraminx", TETRAMINX, false);
// registerPuzzle("meierHalpernPyramid", "Meier-Halpern Pyramid", MEIER_HALPERN_PYRAMIND, false);
// Megaminx Mods
// registerPuzzle("pyraminxCrystal", "Pyraminx Crystal", PYRAMINX_CRYSTAL, false);
// Skewb Mods
// registerPuzzle("ultimateSkewb", "Ultimate Skewb", ULTIMATE_SKEWB, false);
// registerPuzzle("masterskewb", "Master Skewb", MASTER_SKEWB, false);
// Square-1 Mods
// registerPuzzle("square2", "Square Two", SQUARE2, false);
// registerPuzzle("supersquare1", "Super Square-1", SUPER_SQUARE1, false);
// registerPuzzle("sq1Star", "Square-1 Star", SQUARE1_STAR, false);
// Clock Mods
// Others
// registerPuzzle("ivy", "Ivy", IVY, false);
// registerPuzzle("dino", "Dino", DINO, false);
// registerPuzzle("rex", "Rex", REX, false);
// registerPuzzle("redi", "Redi", REDI, false);
// registerPuzzle("helicopter", "Helicopter", HELICOPTER, false);
// registerPuzzle("fto", "FTO", FTO, false);

function types(arr) {
    const res = [];
    for (let i = 0, maxi = arr.length; i < maxi; i += 1) {
        if (Array.isArray(arr[i])) {
            res.push("a");
        }
        else
            switch (typeof arr[i]) {
                case "number":
                case "string":
                case "object":
                case "undefined":
                case "function": {
                    res.push((typeof arr[i])[0]);
                    break;
                }
                default: {
                    res.push("?");
                    break;
                }
            }
    }
    return res.join("");
}
function adjust(val, a, b) {
    let ini = a || 0;
    let fin = b || 255;
    if (ini > fin) {
        ini += fin;
        fin = ini - fin;
        ini = ini - fin;
    }
    return Math.min(Math.max(ini, val), fin);
}
class Color {
    constructor(a, b, c, d, e) {
        const tp = types([a, b, c, d, e]);
        this.color = [0, 1, 2].map(() => Math.round(Math.random() * 255));
        this.color[0] = adjust(this.color[0]);
        this.color[1] = adjust(this.color[1]);
        this.color[2] = adjust(this.color[2]);
        this.color[3] = 1;
        switch (tp) {
            case "nnnns": {
                /*if (e.match(/cmyk/i)) {
                  this.fromCMYK(a, b, c, d);
                } else*/
                if (e.match(/rgba/i)) {
                    this.fromRGBA(a, b, c, d);
                }
                else {
                    throw new TypeError(`Unknown format color ${e}`);
                }
                break;
            }
            case "nnnnu": {
                this.fromRGBA(a, b, c, d);
                break;
            }
            case "nnnsu": {
                // if (d.match(/cmy/i)) {
                //   this.fromCMY(a, b, c);
                // } else if (d.match(/ryb/i)) {
                //   this.fromRYB(a, b, c);
                // } else if (d.match(/hsv/i)) {
                //   this.fromHSV(a, b, c);
                // } else {
                throw new TypeError(`Unknown format color ${e}`);
            }
            case "nnnuu": {
                this.fromRGB(a, b, c);
                break;
            }
            case "suuuu": {
                this.fromString(a);
                break;
            }
        }
    }
    set(k, v) {
        this.color[k] = v;
    }
    // fromCMY(C: number, M: number, Y: number) {
    //   throw new ReferenceError("CMY not supported yet");
    // }
    // fromCMYK(C: number, M: number, Y: number, K: number) {
    //   throw new ReferenceError("CMYK not supported yet");
    // }
    // fromRYB(R: number, Y: number, B: number) {
    //   throw new ReferenceError("RYB not supported yet");
    // }
    // fromHSV(HL: number, S: number, V: number) {
    //   throw new ReferenceError("HSV not supported yet");
    // }
    fromRGB(r, g, b) {
        this.color[0] = adjust(r);
        this.color[1] = adjust(g);
        this.color[2] = adjust(b);
    }
    fromRGBA(r, g, b, a) {
        this.fromRGB(r, g, b);
        this.color[3] = adjust(a, 0, 1);
    }
    fromString(s) {
        const rgbaReg = /$rgba\(([0-9]*),([0-9]*),([0-9]*),([0-9]*)\)$/;
        const rgbReg = /^rgb\(([0-9]*),([0-9]*),([0-9]*)\)$/;
        const hexReg = /^#(\w{2})(\w{2})(\w{2})$/;
        const hex1Reg = /^#(\w{1})(\w{1})(\w{1})$/;
        const hexaReg = /^#(\w{2})(\w{2})(\w{2})(\w{2})$/;
        const hexa1Reg = /^#(\w{1})(\w{1})(\w{1})(\w{1})$/;
        const str = s.replace(/\s/g, "");
        if (rgbaReg.test(str)) {
            const [r, g, b, a] = str.replace(rgbaReg, "$1 $2 $3 $4").split(" ").map(Number);
            this.fromRGBA(r, g, b, a);
        }
        else if (rgbReg.test(str)) {
            const [r, g, b] = str.replace(rgbReg, "$1 $2 $3").split(" ").map(Number);
            this.fromRGB(r, g, b);
        }
        else if (hexaReg.test(str)) {
            const [r, g, b, a] = str
                .replace(hexaReg, "$1 $2 $3 $4")
                .split(" ")
                .map(e => parseInt(e, 16));
            this.fromRGBA(r, g, b, a);
        }
        else if (hexReg.test(str)) {
            const [r, g, b] = str
                .replace(hexReg, "$1 $2 $3")
                .split(" ")
                .map(e => parseInt(e, 16));
            this.fromRGB(r, g, b);
        }
        else if (hexa1Reg.test(str)) {
            const [r, g, b, a] = str
                .replace(hexa1Reg, "$1$1 $2$2 $3$3 $4$4")
                .split(" ")
                .map(e => parseInt(e, 16));
            this.fromRGBA(r, g, b, a);
        }
        else if (hex1Reg.test(str)) {
            const [r, g, b] = str
                .replace(hex1Reg, "$1$1 $2$2 $3$3")
                .split(" ")
                .map(e => parseInt(e, 16));
            this.fromRGB(r, g, b);
        }
        else {
            console.log("S: ", s);
            throw new TypeError("String format other than rgb() or rgba() not supported yet");
        }
    }
    interpolate(col, a) {
        const c = new Color();
        c.color = this.color.map((e, p) => e * (1 - a) + col.color[p] * a);
        return c;
    }
    clone() {
        const res = new Color(0, 0, 0);
        res.color = this.color.map(e => e);
        return res;
    }
    toHex(alpha = true) {
        const t = this.color.map(e => e);
        t[3] = ~~adjust(t[3] * 255);
        if (!alpha)
            t.pop();
        return "#" + t.map(e => ("00" + e.toString(16)).substr(-2, 2)).join("");
    }
    toNumber() {
        let res = 0;
        for (let i = 0; i < 3; i += 1) {
            res *= 256;
            res += this.color[i];
        }
        return res;
    }
    toRGBStr() {
        return `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
    }
    toRGBAStr() {
        return `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${~~(this.color[3] * 255)})`;
    }
    rgbToHSL() {
        this.color[0] /= 255;
        this.color[1] /= 255;
        this.color[2] /= 255;
        const r = this.color[0];
        const g = this.color[1];
        const b = this.color[2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s;
        const l = (max + min) / 2;
        if (max === min) {
            h = s = 0; // Color neutro
        }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h *= 60;
        }
        return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    }
    toArray() {
        return this.color.map(e => e);
    }
}

function arrayToOrder(arr) {
    if (!arr)
        return null;
    switch (arr.length) {
        case 0: {
            return null;
        }
        case 1: {
            return [arr[0], arr[0], arr[0]];
        }
        case 2: {
            return [arr[0], arr[1], arr[0]];
        }
        default: {
            return arr.slice(0, 3);
        }
    }
}
class Puzzle {
    constructor(options) {
        this.options = options;
        this.type = options.type || "rubik";
        // this.mode = options.mode || CubeMode.NORMAL;
        // this.view = options.view || "2d";
        // this.headless = !!options.headless;
        // this.img = "";
        // this.arrows = [];
        // this.options.sequence = this.options.sequence || "";
        // if (this.view === "plan") {
        //   switch (this.type) {
        //     case "skewb":
        //     case "square1":
        //       this.view = "2d";
        //       break;
        //   }
        // } else if (this.view === "bird") {
        //   const allowedTypes: PuzzleType[] = ["skewb", "rubik", "icarry"];
        //   if (allowedTypes.indexOf(this.type) < 0) {
        //     this.view = "2d";
        //   }
        // }
        // if (this.type === "mirror") {
        //   this.view = "2d";
        //   this.mode = CubeMode.NORMAL;
        // }
        // this.setTips(options.tips || []);
        let a;
        if (Array.isArray(options.order)) {
            a = arrayToOrder(options.order) || [3, 3, 3];
        }
        else if (typeof options.order === "number") {
            a = [options.order, options.order, options.order];
        }
        else {
            a = [3, 3, 3];
        }
        if (["megaminx", "pyraminx"].indexOf(this.type) > -1) {
            a.length = 1;
        }
        // a.push(this.headless);
        this.p = puzzleReg.get(this.type)?.constr.apply(null, a);
        this.order = {
            a: a[0],
            b: a[1],
            c: a[2],
        };
    }
    static fromSequence(scramble, options, inv = false, move = true) {
        const p = new Puzzle(options);
        const s = inv ? ScrambleParser.inverse(options.type, scramble) : scramble;
        try {
            if (move)
                p.move(s);
        }
        catch (err) {
        }
        return p;
    }
    // setTips(tips: number[]) {
    //   this.arrows = tips.map(e => e);
    // }
    move(seq) {
        let moves;
        if (["rubik", "icarry", "axis", "fisher", "void"].indexOf(this.type) > -1) {
            moves = ScrambleParser.parseNNN(seq, this.order);
        }
        else if (this.type === "pyraminx") {
            moves = ScrambleParser.parsePyraminx(seq);
        }
        else if (this.type === "skewb" || this.type === "masterskewb") {
            moves = ScrambleParser.parseSkewb(seq);
        }
        else if (this.type === "square1" || this.type === "square2") {
            moves = ScrambleParser.parseSquare1(seq);
        }
        else if (this.type === "clock") {
            moves = ScrambleParser.parseClock(seq);
        }
        else if (this.type === "megaminx" || this.type === "pyraminxCrystal") {
            moves = ScrambleParser.parseMegaminx(seq);
        }
        else if (this.type === "bicube" ||
            this.type === "gear" ||
            this.type === "redi" ||
            this.type === "ivy" ||
            this.type === "helicopter") {
            moves = [seq];
        }
        else if (this.type === "supersquare1") {
            moves = ScrambleParser.parseSuperSquare1(seq);
        }
        else if (this.type === "fto") {
            moves = ScrambleParser.parseFTO(seq);
        }
        else {
            return this;
        }
        this.p.move(moves);
        return this;
    }
    getColor(face) {
        return this.p.palette[face];
    }
    getHexColor(face) {
        const col = new Color(this.p.palette[face]);
        return strToHex(col.toRGBStr());
    }
    getHexStrColor(face) {
        return new Color(this.p.palette[face]).toHex();
    }
}

function genImages(opts) {
    const res = [];
    for (let i = 0, maxi = opts.length; i < maxi; i += 1) {
        const op = options.get(opts[i].type || "333") || { type: "rubik" };
        const scr = opts[i].scramble || "";
        if (!Array.isArray(op)) {
            res.push((Puzzle.fromSequence(scr, op).p.getImage || (() => ""))());
        }
    }
    return res;
}
function getScramble(opts) {
    return opts.map((op) => {
        let scr = getScramble$1(op.scrambler, op.length || 0, op.prob || -1);
        if (op.image && ScramblerList.includes(op.scrambler)) {
            return {
                scramble: scr,
                image: genImages([
                    { scramble: scr, type: op.scrambler },
                ])[0],
            };
        }
        return scr;
    });
}
function setSeed(count, seed) {
    setSeed$1(Math.abs(count), seed);
}
function getSeed() {
    return getSeed$1();
}

exports.genImages = genImages;
exports.getScramble = getScramble;
exports.getSeed = getSeed;
exports.setSeed = setSeed;
