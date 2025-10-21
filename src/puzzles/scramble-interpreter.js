"use strict";
/**
 * Isaac Vega Rodriguez (isaacvega1996@gmail.com)
 * Advanced scramble parser for NxNxN cubes
 *
 * NOTE: Recursive approach can be dangerous.
 * Consider to use stacks or another non-recursive approach.
 */
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
exports.Interpreter = void 0;
var scramble_parser_1 = require("./scramble-parser");
var utils_1 = require("./utils");
/**
 * Tokenizer specs.
 */
var RubikSpec = [
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
    [
        /^([\d]+)?([FRUBLDfrubldzxySME])(?:([w])|&sup([\d]);)?('|2'|2|3'|3)?/,
        "MOVE",
    ],
];
var SquareOneSpec = [
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
var MegaminxSpec = [
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
var PyraminxSpec = [
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
var HelicopterSpec = [
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
var ClockSpec = [
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
var SpecMap = {
    rubik: RubikSpec,
    square1: SquareOneSpec,
    megaminx: MegaminxSpec,
    pyraminx: PyraminxSpec,
    helicopter: HelicopterSpec,
    clock: ClockSpec,
};
var BaseTokenizer = /** @class */ (function () {
    function BaseTokenizer(throwErrors, puzzle) {
        if (throwErrors === void 0) { throwErrors = true; }
        this._string = "";
        this._cursor = 0;
        this.throwErrors = throwErrors;
        this.spec = puzzle in SpecMap ? SpecMap[puzzle] : RubikSpec;
    }
    BaseTokenizer.prototype._throwCursor = function () {
        if (!this.throwErrors) {
            throw this.getCursor();
        }
    };
    BaseTokenizer.prototype.getCursor = function () {
        return this._cursor;
    };
    BaseTokenizer.prototype.init = function (string) {
        this._string = string;
        this._cursor = 0;
    };
    BaseTokenizer.prototype.hasMoreTokens = function () {
        return this._cursor < this._string.length;
    };
    BaseTokenizer.prototype.isEOF = function () {
        return this._cursor === this._string.length;
    };
    BaseTokenizer.prototype.getNextToken = function () {
        if (!this.hasMoreTokens()) {
            return null;
        }
        var string = this._string.slice(this._cursor);
        for (var _i = 0, _a = this.spec; _i < _a.length; _i++) {
            var _b = _a[_i], regexp = _b[0], tokenType = _b[1];
            var tokenValue = this._match(regexp, string);
            if (tokenValue == null)
                continue;
            if (tokenType == null)
                return this.getNextToken();
            return { type: tokenType, value: tokenValue };
        }
        this._throwCursor();
        throw new SyntaxError("Unexpected token: ".concat(string[0]));
    };
    BaseTokenizer.prototype._match = function (regexp, string) {
        var matched = regexp.exec(string);
        if (matched == null) {
            return null;
        }
        this._cursor += matched[0].length;
        return matched[0];
    };
    return BaseTokenizer;
}());
var Solver = /** @class */ (function () {
    function Solver(tokenizerType) {
        this.tokenizerType = tokenizerType;
    }
    Solver.prototype.invert = function (seq) {
        var _this = this;
        return seq.map(function (s) { return scramble_parser_1.ScrambleParser.inverse(_this.tokenizerType, s); });
    };
    Solver.prototype.invertFlat = function (seq) {
        var res = [];
        for (var i = seq.length - 1; i >= 0; i -= 1) {
            if (seq[i].type === "Move") {
                var cp = (0, utils_1.clone)(seq[i]);
                cp.value = scramble_parser_1.ScrambleParser.inverse(this.tokenizerType, cp.value);
                res.push(cp);
            }
            else {
                res.push(seq[i]);
            }
        }
        return res;
    };
    Solver.prototype.simplify = function (seq) {
        var mp = new Map();
        var mp1 = new Map();
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
        var s1 = seq.map(function (s) {
            var p = s
                .replace(/^(\d*)([a-zA-Z]+)('|2'|2|3'|3)?$/, "$1$2 $3")
                .split(" ");
            return [p[0], mp1.get(p[1])];
        });
        for (var i = 1, maxi = s1.length; i < maxi; i += 1) {
            if (s1[i][0] === s1[i - 1][0]) {
                s1[i - 1][1] = (s1[i - 1][1] + s1[i][1]) % 4;
                s1.splice(i, 1);
                i--;
                maxi--;
            }
        }
        return s1.filter(function (p) { return p[1]; }).map(function (p) { return p[0] + mp.get(p[1]); });
    };
    Solver.prototype.solve = function (ast, simplify) {
        var _this = this;
        if (simplify === void 0) { simplify = true; }
        switch (ast.type) {
            case "Program":
                return (simplify ? this.simplify : function (e) { return e; })(this.solve(ast.value, simplify)).join(" ");
            case "Expression":
                return ast.value
                    .map(function (e) { return _this.solve(e, simplify); })
                    .reduce(function (acc, e) { return __spreadArray(__spreadArray([], acc, true), e, true); }, []);
            case "Space":
            case "Comment":
                return [];
            case "Move":
                return [ast.value];
            case "ParentesizedExpression": {
                var seq = this.solve(ast.value.expr, simplify);
                var res = [];
                for (var i = 1, maxi = ast.value.cant; i <= maxi; i += 1) {
                    res = __spreadArray(__spreadArray([], res, true), seq, true);
                }
                return res;
            }
            case "ConmutatorExpression": {
                var seq = void 0;
                if (ast.value.setup) {
                    var setup = this.solve(ast.value.setup, simplify);
                    var conmutator = this.solve(ast.value.conmutator, simplify);
                    var setupInv = this.invert(setup);
                    seq = __spreadArray(__spreadArray(__spreadArray([], setup, true), conmutator, true), setupInv, true);
                }
                else {
                    var s1 = this.solve(ast.value.expr1, simplify);
                    var s2 = this.solve(ast.value.expr2, simplify);
                    var s1i = this.invert(s1);
                    var s2i = this.invert(s2);
                    seq = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], s1, true), s2, true), s1i, true), s2i, true);
                }
                var res = [];
                for (var i = 1, maxi = ast.value.cant; i <= maxi; i += 1) {
                    res = __spreadArray(__spreadArray([], res, true), seq, true);
                }
                return res;
            }
            default: {
                throw new SyntaxError("Unexpected type: \"".concat(ast.type, "\""));
            }
        }
    };
    Solver.prototype.flat = function (ast) {
        var _this = this;
        switch (ast.type) {
            case "Program":
                return this.flat(ast.value);
            case "Expression":
                return ast.value
                    .map(function (e) { return _this.flat(e); })
                    .reduce(function (acc, e) { return __spreadArray(__spreadArray([], acc, true), e, true); }, []);
            case "Space":
            case "Comment":
                return [ast];
            case "Move":
                return [ast];
            case "ParentesizedExpression": {
                var seq = this.flat(ast.value.expr);
                var res = [];
                for (var i = 1, maxi = ast.value.cant; i <= maxi; i += 1) {
                    res = __spreadArray(__spreadArray([], res, true), seq, true);
                }
                return res;
            }
            case "ConmutatorExpression": {
                var seq = void 0;
                if (ast.value.setup) {
                    var setup = this.flat(ast.value.setup);
                    var conmutator = this.flat(ast.value.conmutator);
                    var setupInv = this.invertFlat(setup);
                    seq = __spreadArray(__spreadArray(__spreadArray([], setup, true), conmutator, true), setupInv, true);
                }
                else {
                    var s1 = this.flat(ast.value.expr1);
                    var s2 = this.flat(ast.value.expr2);
                    var s1i = this.invertFlat(s1);
                    var s2i = this.invertFlat(s2);
                    seq = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], s1, true), s2, true), s1i, true), s2i, true);
                }
                var res = [];
                for (var i = 1, maxi = ast.value.cant; i <= maxi; i += 1) {
                    res = __spreadArray(__spreadArray([], res, true), seq, true);
                }
                return res;
            }
            default: {
                throw new SyntaxError("Unexpected type: \"".concat(ast.type, "\""));
            }
        }
    };
    return Solver;
}());
var Interpreter = /** @class */ (function () {
    function Interpreter(throwErrors, tokenizerType) {
        if (throwErrors === void 0) { throwErrors = true; }
        if (tokenizerType === void 0) { tokenizerType = "rubik"; }
        this.moveCursor = 0;
        this._tokenizer = new BaseTokenizer(throwErrors, tokenizerType);
        this._solver = new Solver(tokenizerType);
        this._lookahead = null;
        this.throwErrors = throwErrors;
    }
    Interpreter.prototype.input = function (string, simplify) {
        if (simplify === void 0) { simplify = true; }
        this._tokenizer.init(string.replace(/’/g, "'"));
        this._lookahead = this._tokenizer.getNextToken();
        var pr = this.Program();
        if (this._lookahead) {
            throw new SyntaxError("Missing operators");
        }
        return this._solver.solve(pr, simplify);
    };
    Interpreter.prototype.getTree = function (string) {
        var pr;
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
    };
    Interpreter.prototype.getFlat = function (program) {
        return this._solver.flat(program);
    };
    /**
     * Program
     * ; Expression
     *
     * This is util only for converting the last sequence to string
     */
    Interpreter.prototype.Program = function () {
        return { type: "Program", value: this.Expression(), cursor: -1 };
    };
    /**
     * Expression
     *  ; Move
     *  ; Space
     *  ; Comment
     *  ; ParentesizedExpression
     *  ; CommutatorExpression
     *  ;
     */
    Interpreter.prototype.Expression = function () {
        if (!this._lookahead)
            return { type: "Expression", value: [], cursor: -1 };
        var moves = [];
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
                    return moves.length === 1
                        ? moves[0]
                        : { type: "Expression", value: moves, cursor: -1 };
            }
        }
        return moves.length === 1
            ? moves[0]
            : { type: "Expression", value: moves, cursor: -1 };
    };
    /**
     * Space
     *  ; " "
     */
    Interpreter.prototype.Space = function () {
        return { type: "Space", value: this._eat("SPACE").value, cursor: -1 };
    };
    /**
     * Comment
     *  ; " "
     */
    Interpreter.prototype.Comment = function () {
        return { type: "Comment", value: this._eat("COMMENT").value, cursor: -1 };
    };
    /**
     * ParentesizedExpression
     *  ; '(' Expression ')'
     */
    Interpreter.prototype.ParentesizedExpression = function () {
        this._eat("(");
        var expr = this.Expression();
        var n = +this._eat(")").value.slice(1);
        var cant = n || 1;
        return {
            type: "ParentesizedExpression",
            value: { expr: expr, cant: cant, explicit: !!n },
            cursor: -1,
        };
    };
    /**
     * ConmutatorExpression
     *  ; '[' Expression ',' Expression ']'
     */
    Interpreter.prototype.ConmutatorExpression = function () {
        var _a;
        this._eat("[");
        var expr1 = this.Expression();
        if (((_a = this._lookahead) === null || _a === void 0 ? void 0 : _a.type) === ":") {
            this._eat(":");
            var conmutator = this.Expression();
            var n_1 = +this._eat("]").value.slice(1);
            var cant_1 = n_1 || 1;
            return {
                type: "ConmutatorExpression",
                value: { setup: expr1, conmutator: conmutator, cant: cant_1, explicit: !!n_1 },
                cursor: -1,
            };
        }
        this._eat(",");
        var expr2 = this.Expression();
        var n = +this._eat("]").value.slice(1);
        var cant = n || 1;
        return {
            type: "ConmutatorExpression",
            value: { expr1: expr1, expr2: expr2, cant: cant, explicit: !!n },
            cursor: -1,
        };
    };
    /**
     * Move
     *  ; MOVE
     */
    Interpreter.prototype.Move = function () {
        var token = this._eat("MOVE");
        return { type: "Move", value: token.value, cursor: this.moveCursor++ };
    };
    Interpreter.prototype._throwCursor = function () {
        if (!this.throwErrors) {
            throw this._tokenizer.getCursor();
        }
    };
    Interpreter.prototype._eat = function (tokenType, tokenValue) {
        var token = this._lookahead;
        if (token == null) {
            this._throwCursor();
            throw new SyntaxError("Unexpected end of input, expected: ".concat(tokenType));
        }
        if (token.type != tokenType) {
            this._throwCursor();
            throw new SyntaxError("Unexpected token: ".concat(token.type, ", expected: ").concat(tokenType));
        }
        if (tokenValue && token.value != tokenValue) {
            this._throwCursor();
            throw new SyntaxError("Error, expected \"".concat(tokenValue, "\" but got \"").concat(token.value, "\""));
        }
        this._lookahead = this._tokenizer.getNextToken();
        return token;
    };
    return Interpreter;
}());
exports.Interpreter = Interpreter;
