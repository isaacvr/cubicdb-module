"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genImages = genImages;
exports.getScrambles = getScrambles;
exports.setSeed = setSeed;
exports.getSeed = getSeed;
var mathlib_1 = require("./cstimer/lib/mathlib");
var index_1 = require("./cstimer/scramble/index");
var constants_1 = require("./puzzles/constants");
var puzzle_1 = require("./puzzles/puzzle");
function genImages(opts) {
    if (!Array.isArray(opts))
        return [];
    var res = [];
    for (var i = 0, maxi = opts.length; i < maxi; i += 1) {
        var op = constants_1.options.get(opts[i].type || "333") || { type: "rubik" };
        var scr = opts[i].scramble || "";
        if (!Array.isArray(op)) {
            res.push((puzzle_1.Puzzle.fromSequence(scr, op).p.getImage || (function () { return ""; }))());
        }
    }
    return res;
}
function getScrambles(opts) {
    if (!Array.isArray(opts))
        return [];
    return opts.map(function (op) {
        var scr = (0, index_1.getScramble)(op.scrambler, op.length || 0, op.prob || -1);
        if (op.image && constants_1.ScramblerList.includes(op.scrambler)) {
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
    (0, mathlib_1.setSeed)(Math.abs(count), seed);
}
function getSeed() {
    return (0, mathlib_1.getSeed)();
}
