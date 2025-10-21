"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOWN = exports.UP = exports.BACK = exports.FRONT = exports.LEFT = exports.RIGHT = exports.CENTER = exports.Vector3D = void 0;
var EPS = 1e-6;
var PI = Math.PI;
var TAU = PI * 2;
function getCanonical(v) {
    var dirs = [exports.UP, exports.RIGHT, exports.FRONT, exports.DOWN, exports.LEFT, exports.BACK];
    for (var i = 0, maxi = dirs.length; i < maxi; i += 1) {
        if (dirs[i].equals(v)) {
            return dirs[i].clone();
        }
    }
    var cmps = [v.x, v.y, v.z];
    cmps = cmps.map(function (n) {
        return Math.abs(n - Math.round(n)) < EPS ? Math.round(n) : n;
    });
    return new Vector3D(cmps[0], cmps[1], cmps[2]);
}
var Vector3D = /** @class */ (function () {
    function Vector3D(x, y, z, isConstant) {
        if (isConstant === void 0) { isConstant = false; }
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.isConstant = isConstant;
    }
    Vector3D.cross = function (a, b, c) {
        var v1 = b.sub(a);
        var v2 = c.sub(b);
        return v1.cross(v2);
    };
    Vector3D.crossValue = function (a, b, c) {
        return (a.x * (b.y * c.z - c.y * b.z) -
            a.y * (b.x * c.z - c.x * b.z) +
            a.z * (b.x * c.y - c.x * b.y));
    };
    Vector3D.direction = function (p1, p2, p3, vec) {
        return Vector3D.direction1(p1, Vector3D.cross(p1, p2, p3), vec);
    };
    Vector3D.direction1 = function (anchor, u, pt) {
        var dot = u.dot(pt.sub(anchor));
        if (Math.abs(dot) < EPS) {
            return 0;
        }
        return Math.sign(dot);
    };
    Vector3D.project = function (pt, a, b, c) {
        return Vector3D.project1(pt, a, Vector3D.cross(a, b, c).unit());
    };
    Vector3D.project1 = function (pt, a, u) {
        var v = pt.sub(a);
        var dist = u.dot(v);
        return pt.add(u.mul(-dist));
    };
    Vector3D.prototype.setConstant = function (cnt) {
        this.isConstant = cnt;
    };
    Vector3D.prototype.project = function (a, b, c) {
        return this.project1(a, Vector3D.cross(a, b, c).unit());
    };
    Vector3D.prototype.project1 = function (a, u) {
        return Vector3D.project1(this, a, u);
    };
    Vector3D.prototype.reflect = function (a, b, c, self) {
        if (self && this.isConstant) {
            return this;
        }
        return this.reflect1(a, Vector3D.cross(a, b, c).unit(), self);
    };
    Vector3D.prototype.reflect1 = function (a, u, self) {
        if (self && this.isConstant) {
            return this;
        }
        return this.add(u.mul(-2 * this.sub(a).dot(u)), self);
    };
    Vector3D.prototype.cross = function (v) {
        return getCanonical(new Vector3D(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x));
    };
    Vector3D.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    Vector3D.prototype.add = function (v, self) {
        if (self && this.isConstant) {
            return this;
        }
        if (self) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }
        return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z);
    };
    Vector3D.prototype.sub = function (v, self) {
        if (self && this.isConstant) {
            return this;
        }
        if (self) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        }
        return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z);
    };
    Vector3D.prototype.mul = function (f, self) {
        if (self && this.isConstant) {
            return this;
        }
        if (self) {
            this.x *= f;
            this.y *= f;
            this.z *= f;
            return this;
        }
        return new Vector3D(this.x * f, this.y * f, this.z * f);
    };
    Vector3D.prototype.div = function (f, self) {
        if (self && this.isConstant) {
            return this;
        }
        if (self) {
            this.x /= f;
            this.y /= f;
            this.z /= f;
            return this;
        }
        return new Vector3D(this.x / f, this.y / f, this.z / f);
    };
    Vector3D.prototype.rotate = function (O, u, ang, self) {
        if (self && this.isConstant) {
            return this;
        }
        var vecs = [0, 1, 2].map(function (n) { return [[exports.RIGHT, exports.UP, exports.FRONT][n], n]; });
        var fAngs = [0, 1, 2, 3].map(function (n) { return [(n * PI) / 2, n]; });
        var rAng = ((ang % TAU) + TAU) % TAU;
        if (O.abs() < EPS &&
            vecs.some(function (v) { return v[0].cross(u).abs() < EPS; }) &&
            fAngs.some(function (a) { return Math.abs(a[0] - rAng) < EPS; })) {
            var idx = [
                function (vt) { return new Vector3D(vt.x, -vt.z, vt.y); }, // RIGHT => (x, y, z) => (x, -z, y)
                function (vt) { return new Vector3D(vt.z, vt.y, -vt.x); }, // UP    => (x, y, z) => (z, y, -x)
                function (vt) { return new Vector3D(-vt.y, vt.x, vt.z); },
            ];
            var aIndex = fAngs.filter(function (a) { return Math.abs(a[0] - rAng) < EPS; })[0][1];
            var vIndex = vecs.filter(function (v) { return v[0].cross(u).abs() < EPS; })[0][1];
            var cant = vecs[vIndex][0].dot(u) > 0 ? aIndex : (4 - aIndex) % 4;
            var vt = this.clone();
            for (var i = 1; i <= cant; i += 1) {
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
        var k = u.unit();
        var v = this.sub(O);
        var p1 = v.mul(Math.cos(ang));
        var p2 = k.cross(v).mul(Math.sin(ang));
        var p3 = k.mul(k.dot(v) * (1 - Math.cos(ang)));
        var v3 = p1.add(p2, true).add(p3, true).add(O, true);
        if (self) {
            this.x = v3.x;
            this.y = v3.y;
            this.z = v3.z;
            return this;
        }
        return new Vector3D(v3.x, v3.y, v3.z);
    };
    Vector3D.prototype.clone = function () {
        return new Vector3D(this.x, this.y, this.z);
    };
    Vector3D.prototype.abs = function () {
        return Math.pow(this.abs2(), 0.5);
    };
    Vector3D.prototype.abs2 = function () {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2);
    };
    Vector3D.prototype.unit = function () {
        var len = this.abs();
        if (len != 0) {
            return getCanonical(this.div(len));
        }
        return new Vector3D(0, 0, 0);
    };
    Vector3D.prototype.proj = function (a) {
        return a.setLength(this.dot(a) / a.abs());
    };
    Vector3D.prototype.setLength = function (n) {
        return this.unit().mul(n);
    };
    Vector3D.prototype.toString = function () {
        return "<".concat(this.x, "; ").concat(this.y, "; ").concat(this.z, ">");
    };
    Vector3D.prototype.toNormal = function () {
        var coords = [this.x, this.y, this.z].map(function (e) {
            return Math.abs(e) < EPS ? 0 : Math.sign(e);
        });
        this.x = coords[0];
        this.y = coords[1];
        this.z = coords[2];
        return this;
    };
    Vector3D.prototype.setCoords = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
    Vector3D.prototype.equals = function (v) {
        return this.sub(v).abs() < EPS;
    };
    return Vector3D;
}());
exports.Vector3D = Vector3D;
exports.CENTER = new Vector3D(0, 0, 0, true);
exports.RIGHT = new Vector3D(1, 0, 0, true);
exports.LEFT = new Vector3D(-1, 0, 0, true);
exports.FRONT = new Vector3D(0, 0, 1, true);
exports.BACK = new Vector3D(0, 0, -1, true);
exports.UP = new Vector3D(0, 1, 0, true);
exports.DOWN = new Vector3D(0, -1, 0, true);
