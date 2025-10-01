import * as puzzles from "./index";
import { Color } from "./color";
import { IPuzzleOrder, PuzzleInterface, PuzzleOptions, PuzzleType, strToHex } from "./constants";
import { puzzleReg } from "./puzzleRegister";
import { ScrambleParser } from "./scramble-parser";

void puzzles;

export function arrayToOrder(arr: number[] | undefined): number[] | null {
  if (!arr) return null;

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

export class Puzzle {
  rotation: any;
  p: PuzzleInterface;
  // order: number[];
  order: IPuzzleOrder;
  // arrows: number[];

  type: PuzzleType;
  // mode: CubeMode;
  // view: CubeView;
  // headless: boolean;
  // img: string;
  options: PuzzleOptions;

  constructor(options: PuzzleOptions) {
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

    let a: any[];

    if (Array.isArray(options.order)) {
      a = arrayToOrder(options.order) || [3, 3, 3];
    } else if (typeof options.order === "number") {
      a = [options.order, options.order, options.order];
    } else {
      a = [3, 3, 3];
    }

    if (["megaminx", "pyraminx"].indexOf(this.type) > -1) {
      a.length = 1;
    }

    // a.push(this.headless);

    this.p = puzzleReg.get(this.type)?.constr.apply(null, a);

    this.order = {
      a: a[0],
      b: a[1],
      c: a[2],
    };

  }

  static fromSequence(scramble: string, options: PuzzleOptions, inv = false, move = true): Puzzle {
    const p = new Puzzle(options);
    const s = inv ? ScrambleParser.inverse(options.type, scramble) : scramble;

    try {
      if (move) p.move(s);
    } catch (err) {
      void err;
    }
    return p;
  }

  // setTips(tips: number[]) {
  //   this.arrows = tips.map(e => e);
  // }

  move(seq: string) {
    let moves: any[];

    if (["rubik", "icarry", "axis", "fisher", "void"].indexOf(this.type) > -1) {
      moves = ScrambleParser.parseNNN(seq, this.order);
    } else if (this.type === "pyraminx") {
      moves = ScrambleParser.parsePyraminx(seq);
    } else if (this.type === "skewb" || this.type === "masterskewb") {
      moves = ScrambleParser.parseSkewb(seq);
    } else if (this.type === "square1" || this.type === "square2") {
      moves = ScrambleParser.parseSquare1(seq);
    } else if (this.type === "clock") {
      moves = ScrambleParser.parseClock(seq);
    } else if (this.type === "megaminx" || this.type === "pyraminxCrystal") {
      moves = ScrambleParser.parseMegaminx(seq);
    } else if (
      this.type === "bicube" ||
      this.type === "gear" ||
      this.type === "redi" ||
      this.type === "ivy" ||
      this.type === "helicopter"
    ) {
      moves = [seq];
    } else if (this.type === "supersquare1") {
      moves = ScrambleParser.parseSuperSquare1(seq);
    } else if (this.type === "fto") {
      moves = ScrambleParser.parseFTO(seq);
    } else {
      return this;
    }

    this.p.move(moves);
    return this;
  }

  getColor(face: string): string {
    return this.p.palette[face];
  }

  getHexColor(face: string): number {
    const col = new Color(this.p.palette[face]);
    return strToHex(col.toRGBStr());
  }

  getHexStrColor(face: string): string {
    return new Color(this.p.palette[face]).toHex();
  }
}
