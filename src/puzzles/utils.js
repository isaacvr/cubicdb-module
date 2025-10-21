"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoundedPath = getRoundedPath;
exports.clone = clone;
exports.newArr = newArr;
exports.svgnum = svgnum;
function getRoundedPath(path, _rd) {
    if (_rd === void 0) { _rd = 0.2; }
    var res = [];
    var rd = _rd || 0.11;
    for (var i = 0, maxi = path.length; i < maxi; i += 1) {
        var p1 = path[(i - 1 + maxi) % maxi];
        var p2 = path[i];
        var p3 = path[(i + 1) % maxi];
        var pt1 = [p2[0] + (p1[0] - p2[0]) * rd, p2[1] + (p1[1] - p2[1]) * rd];
        var pt2 = [p2[0] + (p3[0] - p2[0]) * rd, p2[1] + (p3[1] - p2[1]) * rd];
        if (i === 0) {
            res.push("M ".concat(svgnum(pt1[0]), " ").concat(svgnum(pt1[1])));
        }
        else {
            res.push("L ".concat(svgnum(pt1[0]), " ").concat(svgnum(pt1[1])));
        }
        res.push("Q ".concat(svgnum(p2[0]), " ").concat(svgnum(p2[1]), " ").concat(svgnum(pt2[0]), " ").concat(svgnum(pt2[1])));
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
    return Object.entries(obj).reduce(function (acc, e) {
        acc[e[0]] = clone(e[1]);
        return acc;
    }, {});
}
function newArr(length) {
    return Array.from({ length: length });
}
function svgnum(n) {
    return Math.floor(n * 100) / 100;
}
