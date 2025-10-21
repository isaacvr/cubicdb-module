"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultInner = defaultInner;
exports.getTreeString = getTreeString;
exports.parseReconstruction = parseReconstruction;
exports.prettyScramble = prettyScramble;
var scramble_interpreter_1 = require("./scramble-interpreter");
var scramble_parser_1 = require("./scramble-parser");
var utils_1 = require("./utils");
function defaultInner(s, withSuffix) {
    if (withSuffix === void 0) { withSuffix = true; }
    return s.replace(/\n/g, "<br>") + (withSuffix ? "<br>" : "");
}
function getTreeString(token, puzzle) {
    var value = token.value;
    switch (token.type) {
        case "Move": {
            if (puzzle === "square1" && token.value != "/") {
                var regs = [
                    /^(\()(\s*)(-?\d)(,)(\s*)(-?\d)(\s*)(\))/,
                    /^(-?\d)(,)(\s*)(-?\d)/,
                    /^(-?\d)(-?\d)/,
                    /^(-?\d)/,
                ];
                var operators_1 = /^[(,)]$/;
                for (var i = 0, maxi = regs.length; i < maxi; i += 1) {
                    var m = regs[i].exec(value);
                    if (m) {
                        return m
                            .slice(1)
                            .map(function (s) {
                            return operators_1.test(s)
                                ? "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">").concat(s, "</span>")
                                : /\d$/.test(s)
                                    ? s === "0"
                                        ? "<span class=\"move silent\">".concat(s, "</span>")
                                        : "<span class=\"move\" data-cursor=\"".concat(token.cursor, "\">").concat(s, "</span>")
                                    : defaultInner(s, false);
                        })
                            .join("");
                    }
                }
            }
            return "<span class=\"move\" data-cursor=\"".concat(token.cursor, "\">").concat(defaultInner(value, false), "</span>");
        }
        case "Comment": {
            return "<span class=\"comment\" data-cursor=\"".concat(token.cursor, "\">").concat(defaultInner(value, false), "</span>");
        }
        case "Space": {
            return defaultInner(value, false);
        }
        case "Expression": {
            return value.map(function (t) { return getTreeString(t, puzzle); }).join("");
        }
        case "ParentesizedExpression": {
            return ("<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">(</span>") +
                getTreeString(value.expr, puzzle) +
                "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">)</span>") +
                (value.cant != 1 || value.explicit
                    ? "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">").concat(value.cant, "</span>")
                    : ""));
        }
        case "ConmutatorExpression": {
            if (value.setup) {
                return ("<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">[</span>") +
                    getTreeString(value.setup, puzzle) +
                    "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">:</span>") +
                    getTreeString(value.conmutator, puzzle) +
                    "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">]</span>") +
                    (value.cant != 1 || value.explicit
                        ? "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">").concat(value.cant, "</span>")
                        : ""));
            }
            return ("<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">[</span>") +
                getTreeString(value.expr1, puzzle) +
                "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">,</span>") +
                getTreeString(value.expr2, puzzle) +
                "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">]</span>") +
                (value.cant != 1 || value.explicit
                    ? "<span class=\"operator\" data-cursor=\"".concat(token.cursor, "\">").concat(value.cant, "</span>")
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
                return sequence.reduce(function (acc, e) { return __spreadArray(__spreadArray([], acc, true), scramble_parser_1.ScrambleParser.parseNNN(e, { a: order, b: order, c: order }), true); }, []).length;
            }
            case "skewb": {
                return sequence.reduce(function (acc, e) { return __spreadArray(__spreadArray([], acc, true), scramble_parser_1.ScrambleParser.parseSkewb(e), true); }, [])
                    .length;
            }
            case "square1": {
                return sequence.reduce(function (acc, e) { return __spreadArray(__spreadArray([], acc, true), scramble_parser_1.ScrambleParser.parseSquare1(e), true); }, [])
                    .length;
            }
            case "megaminx": {
                return sequence.reduce(function (acc, e) { return __spreadArray(__spreadArray([], acc, true), scramble_parser_1.ScrambleParser.parseMegaminx(e), true); }, [])
                    .length;
            }
            case "pyraminx": {
                return sequence.reduce(function (acc, e) { return __spreadArray(__spreadArray([], acc, true), scramble_parser_1.ScrambleParser.parsePyraminx(e), true); }, [])
                    .length;
            }
            case "clock": {
                return scramble_parser_1.ScrambleParser.parseClock(sequence.join(" ")).length;
            }
            case "masterskewb": {
                return scramble_parser_1.ScrambleParser.parseSkewb(sequence.join(" ")).length;
            }
            case "helicopter": {
                return sequence.reduce(function (acc, e) { return __spreadArray(__spreadArray([], acc, true), e.split(/\s+/), true); }, []).length;
            }
        }
    }
    catch (_a) {
        void 0;
    }
    return 0;
}
function parseReconstruction(s, puzzle, order) {
    var itp = new scramble_interpreter_1.Interpreter(false, puzzle);
    var errorCursor = -1;
    try {
        var tree = itp.getTree(s);
        if (tree.error) {
            errorCursor = typeof tree.cursor === "number" ? tree.cursor : 0;
        }
        else {
            var program = itp.getFlat(tree.program);
            var flat = program.filter(function (token) { return token.cursor >= 0; });
            var sequence = flat.map(function (token) { return token.value; });
            var sequenceIndex = [];
            var finalAlpha = getMoveLength(sequence, puzzle, order);
            switch (puzzle) {
                case "square1": {
                    sequenceIndex = (0, utils_1.newArr)(finalAlpha)
                        .fill(0)
                        .map(function (_, i) { return i; });
                    break;
                }
                default: {
                    sequenceIndex = flat.map(function (token) { return token.cursor; });
                }
            }
            return {
                result: getTreeString(tree.program.value, puzzle) + "<br>",
                finalAlpha: finalAlpha,
                sequence: sequence,
                sequenceIndex: sequenceIndex,
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
        var pref = defaultInner(s.slice(0, errorCursor), false);
        var middle = "";
        var match = /^([^\s\n]+)/.exec(s.slice(errorCursor));
        if (match) {
            middle = "<span class=\"error\">".concat(match[0], "</span>");
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
