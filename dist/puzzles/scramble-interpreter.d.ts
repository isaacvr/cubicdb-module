/**
 * Isaac Vega Rodriguez (isaacvega1996@gmail.com)
 * Advanced scramble parser for NxNxN cubes
 *
 * NOTE: Recursive approach can be dangerous.
 * Consider to use stacks or another non-recursive approach.
 */
import { PuzzleType } from "./constants";
/**
 * Tokenizer specs.
 */
declare const RubikSpec: readonly [readonly [RegExp, "SPACE"], readonly [RegExp, null], readonly [RegExp, "COMMENT"], readonly [RegExp, ","], readonly [RegExp, ":"], readonly [RegExp, "("], readonly [RegExp, ")"], readonly [RegExp, "["], readonly [RegExp, "]"], readonly [RegExp, "MOVE"]];
type InterpreterNode = "Program" | "Expression" | "Space" | "Comment" | "ParentesizedExpression" | "ConmutatorExpression" | "Move";
interface TToken {
    type: (typeof RubikSpec)[number][1];
    value: any;
}
interface IToken {
    type: InterpreterNode | RegExp;
    value: any;
    cursor: number;
}
export declare class Interpreter {
    private _tokenizer;
    private _solver;
    private _lookahead;
    private throwErrors;
    private moveCursor;
    constructor(throwErrors?: boolean, tokenizerType?: PuzzleType);
    input(string: string, simplify?: boolean): string | string[];
    getTree(string: string): {
        error: boolean | null;
        cursor: any;
        program: IToken;
    };
    getFlat(program: IToken): IToken[];
    /**
     * Program
     * ; Expression
     *
     * This is util only for converting the last sequence to string
     */
    Program(): IToken;
    /**
     * Expression
     *  ; Move
     *  ; Space
     *  ; Comment
     *  ; ParentesizedExpression
     *  ; CommutatorExpression
     *  ;
     */
    Expression(): IToken;
    /**
     * Space
     *  ; " "
     */
    Space(): IToken;
    /**
     * Comment
     *  ; " "
     */
    Comment(): IToken;
    /**
     * ParentesizedExpression
     *  ; '(' Expression ')'
     */
    ParentesizedExpression(): IToken;
    /**
     * ConmutatorExpression
     *  ; '[' Expression ',' Expression ']'
     */
    ConmutatorExpression(): IToken;
    /**
     * Move
     *  ; MOVE
     */
    Move(): IToken;
    private _throwCursor;
    _eat(tokenType: any, tokenValue?: any): TToken;
}
export {};
