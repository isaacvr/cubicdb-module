"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Puzzle = void 0;
exports.arrayToOrder = arrayToOrder;
var puzzles = require("./index");
var color_1 = require("./color");
var constants_1 = require("./constants");
var puzzleRegister_1 = require("./puzzleRegister");
var scramble_parser_1 = require("./scramble-parser");
void puzzles;
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
var Puzzle = /** @class */ (function () {
    function Puzzle(options) {
        var _a;
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
        var a;
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
        this.p = (_a = puzzleRegister_1.puzzleReg.get(this.type)) === null || _a === void 0 ? void 0 : _a.constr.apply(null, a);
        this.order = {
            a: a[0],
            b: a[1],
            c: a[2],
        };
    }
    Puzzle.fromSequence = function (scramble, options, inv, move) {
        if (inv === void 0) { inv = false; }
        if (move === void 0) { move = true; }
        var p = new Puzzle(options);
        var s = inv ? scramble_parser_1.ScrambleParser.inverse(options.type, scramble) : scramble;
        try {
            if (move)
                p.move(s);
        }
        catch (err) {
            void err;
        }
        return p;
    };
    // setTips(tips: number[]) {
    //   this.arrows = tips.map(e => e);
    // }
    Puzzle.prototype.move = function (seq) {
        var moves;
        if (["rubik", "icarry", "axis", "fisher", "void"].indexOf(this.type) > -1) {
            moves = scramble_parser_1.ScrambleParser.parseNNN(seq, this.order);
        }
        else if (this.type === "pyraminx") {
            moves = scramble_parser_1.ScrambleParser.parsePyraminx(seq);
        }
        else if (this.type === "skewb" || this.type === "masterskewb") {
            moves = scramble_parser_1.ScrambleParser.parseSkewb(seq);
        }
        else if (this.type === "square1" || this.type === "square2") {
            moves = scramble_parser_1.ScrambleParser.parseSquare1(seq);
        }
        else if (this.type === "clock") {
            moves = scramble_parser_1.ScrambleParser.parseClock(seq);
        }
        else if (this.type === "megaminx" || this.type === "pyraminxCrystal") {
            moves = scramble_parser_1.ScrambleParser.parseMegaminx(seq);
        }
        else if (this.type === "bicube" ||
            this.type === "gear" ||
            this.type === "redi" ||
            this.type === "ivy" ||
            this.type === "helicopter") {
            moves = [seq];
        }
        else if (this.type === "supersquare1") {
            moves = scramble_parser_1.ScrambleParser.parseSuperSquare1(seq);
        }
        else if (this.type === "fto") {
            moves = scramble_parser_1.ScrambleParser.parseFTO(seq);
        }
        else {
            return this;
        }
        this.p.move(moves);
        return this;
    };
    Puzzle.prototype.getColor = function (face) {
        return this.p.palette[face];
    };
    Puzzle.prototype.getHexColor = function (face) {
        var col = new color_1.Color(this.p.palette[face]);
        return (0, constants_1.strToHex)(col.toRGBStr());
    };
    Puzzle.prototype.getHexStrColor = function (face) {
        return new color_1.Color(this.p.palette[face]).toHex();
    };
    return Puzzle;
}());
exports.Puzzle = Puzzle;
