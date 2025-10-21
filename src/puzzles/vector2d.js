"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vector2D = void 0;
var Vector2D = /** @class */ (function () {
    function Vector2D(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    Vector2D.cross = function (a, b) {
        return a.x * b.y - b.x * a.y;
    };
    Vector2D.prototype.add = function (v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    };
    Vector2D.prototype.sub = function (v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    };
    Vector2D.prototype.mul = function (f) {
        return new Vector2D(this.x * f, this.y * f);
    };
    Vector2D.prototype.multiply = function (v) {
        return new Vector2D(this.x * v.x - this.y * v.y, this.x * v.y + this.y * v.x);
    };
    Vector2D.prototype.div = function (f) {
        return new Vector2D(this.x / f, this.y / f);
    };
    Vector2D.prototype.rot = function (ang) {
        return new Vector2D(this.x * Math.cos(ang) - this.y * Math.sin(ang), this.x * Math.sin(ang) + this.y * Math.cos(ang));
    };
    Vector2D.prototype.abs = function () {
        return Math.pow((Math.pow(this.x, 2) + Math.pow(this.y, 2)), 0.5);
    };
    Vector2D.prototype.unit = function () {
        var len = this.abs();
        return new Vector2D(this.x / len, this.y / len);
    };
    Vector2D.prototype.toArr = function () {
        return [this.x, this.y];
    };
    return Vector2D;
}());
exports.Vector2D = Vector2D;
