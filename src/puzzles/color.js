"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = void 0;
function types(arr) {
    var res = [];
    for (var i = 0, maxi = arr.length; i < maxi; i += 1) {
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
    var ini = a || 0;
    var fin = b || 255;
    if (ini > fin) {
        ini += fin;
        fin = ini - fin;
        ini = ini - fin;
    }
    return Math.min(Math.max(ini, val), fin);
}
var Color = /** @class */ (function () {
    function Color(a, b, c, d, e) {
        var tp = types([a, b, c, d, e]);
        this.color = [0, 1, 2].map(function () { return Math.round(Math.random() * 255); });
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
                    throw new TypeError("Unknown format color ".concat(e));
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
                throw new TypeError("Unknown format color ".concat(e));
                // }
                break;
            }
            case "nnnuu": {
                this.fromRGB(a, b, c);
                break;
            }
            case "suuuu": {
                this.fromString(a);
                break;
            }
            case "uuuuu": {
                /// Allow for random generation
                break;
            }
            default: {
                // throw new TypeError(`Invalid parameters`);
            }
        }
    }
    Color.prototype.set = function (k, v) {
        this.color[k] = v;
    };
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
    Color.prototype.fromRGB = function (r, g, b) {
        this.color[0] = adjust(r);
        this.color[1] = adjust(g);
        this.color[2] = adjust(b);
    };
    Color.prototype.fromRGBA = function (r, g, b, a) {
        this.fromRGB(r, g, b);
        this.color[3] = adjust(a, 0, 1);
    };
    Color.prototype.fromString = function (s) {
        var rgbaReg = /$rgba\(([0-9]*),([0-9]*),([0-9]*),([0-9]*)\)$/;
        var rgbReg = /^rgb\(([0-9]*),([0-9]*),([0-9]*)\)$/;
        var hexReg = /^#(\w{2})(\w{2})(\w{2})$/;
        var hex1Reg = /^#(\w{1})(\w{1})(\w{1})$/;
        var hexaReg = /^#(\w{2})(\w{2})(\w{2})(\w{2})$/;
        var hexa1Reg = /^#(\w{1})(\w{1})(\w{1})(\w{1})$/;
        var str = s.replace(/\s/g, "");
        if (rgbaReg.test(str)) {
            var _a = str
                .replace(rgbaReg, "$1 $2 $3 $4")
                .split(" ")
                .map(Number), r = _a[0], g = _a[1], b = _a[2], a = _a[3];
            this.fromRGBA(r, g, b, a);
        }
        else if (rgbReg.test(str)) {
            var _b = str.replace(rgbReg, "$1 $2 $3").split(" ").map(Number), r = _b[0], g = _b[1], b = _b[2];
            this.fromRGB(r, g, b);
        }
        else if (hexaReg.test(str)) {
            var _c = str
                .replace(hexaReg, "$1 $2 $3 $4")
                .split(" ")
                .map(function (e) { return parseInt(e, 16); }), r = _c[0], g = _c[1], b = _c[2], a = _c[3];
            this.fromRGBA(r, g, b, a);
        }
        else if (hexReg.test(str)) {
            var _d = str
                .replace(hexReg, "$1 $2 $3")
                .split(" ")
                .map(function (e) { return parseInt(e, 16); }), r = _d[0], g = _d[1], b = _d[2];
            this.fromRGB(r, g, b);
        }
        else if (hexa1Reg.test(str)) {
            var _e = str
                .replace(hexa1Reg, "$1$1 $2$2 $3$3 $4$4")
                .split(" ")
                .map(function (e) { return parseInt(e, 16); }), r = _e[0], g = _e[1], b = _e[2], a = _e[3];
            this.fromRGBA(r, g, b, a);
        }
        else if (hex1Reg.test(str)) {
            var _f = str
                .replace(hex1Reg, "$1$1 $2$2 $3$3")
                .split(" ")
                .map(function (e) { return parseInt(e, 16); }), r = _f[0], g = _f[1], b = _f[2];
            this.fromRGB(r, g, b);
        }
        else {
            throw new TypeError("String format other than rgb() or rgba() not supported yet");
        }
    };
    Color.prototype.interpolate = function (col, a) {
        var c = new Color();
        c.color = this.color.map(function (e, p) { return e * (1 - a) + col.color[p] * a; });
        return c;
    };
    Color.prototype.clone = function () {
        var res = new Color(0, 0, 0);
        res.color = this.color.map(function (e) { return e; });
        return res;
    };
    Color.prototype.toHex = function (alpha) {
        if (alpha === void 0) { alpha = true; }
        var t = this.color.map(function (e) { return e; });
        t[3] = ~~adjust(t[3] * 255);
        if (!alpha)
            t.pop();
        return "#" + t.map(function (e) { return ("00" + e.toString(16)).substr(-2, 2); }).join("");
    };
    Color.prototype.toNumber = function () {
        var res = 0;
        for (var i = 0; i < 3; i += 1) {
            res *= 256;
            res += this.color[i];
        }
        return res;
    };
    Color.prototype.toRGBStr = function () {
        return "rgb(".concat(this.color[0], ", ").concat(this.color[1], ", ").concat(this.color[2], ")");
    };
    Color.prototype.toRGBAStr = function () {
        return "rgba(".concat(this.color[0], ", ").concat(this.color[1], ", ").concat(this.color[2], ", ").concat(~~(this.color[3] * 255), ")");
    };
    Color.prototype.rgbToHSL = function () {
        this.color[0] /= 255;
        this.color[1] /= 255;
        this.color[2] /= 255;
        var r = this.color[0];
        var g = this.color[1];
        var b = this.color[2];
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = 0, s;
        var l = (max + min) / 2;
        if (max === min) {
            h = s = 0; // Color neutro
        }
        else {
            var d = max - min;
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
    };
    Color.prototype.toArray = function () {
        return this.color.map(function (e) { return e; });
    };
    return Color;
}());
exports.Color = Color;
