"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.puzzleReg = void 0;
exports.registerPuzzle = registerPuzzle;
exports.puzzleReg = new Map();
function registerPuzzle(code, name, constr, order) {
    exports.puzzleReg.set(code, { code: code, name: name, constr: constr, order: order });
}
