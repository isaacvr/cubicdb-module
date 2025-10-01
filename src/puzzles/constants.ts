export interface IReconstruction {
  sequence: string[];
  sequenceIndex: number[];
  finalAlpha: number;
  result: string;
  hasError: boolean;
}

export interface PuzzleOptions {
  type: PuzzleType;
  order?: number[];
  // mode?: CubeMode;
  // view?: CubeView;
  // tips?: number[];
  // headless?: boolean;
  // sequence?: string; // This field has no effects in the constructor
  // rounded?: boolean;
  // facelet?: string;
}

export interface PuzzleInterface {
  palette: any;
  move: (m: any) => any;
  getImage?: () => string;
  // roundParams: Omit<RoundCornersParams, "p">;
  // isRounded?: boolean;
  // faceVectors?: Vector3D[];
  // pieces?: Piece[];
  raw?: any;
}

export interface IPuzzleOrder {
  a: number;
  b: number;
  c: number;
}

export const PuzzleTypeName = [
  "rubik",
  "icarry",
  "skewb",
  "square1",
  "pyraminx",
  "axis",
  "fisher",
  "ivy",
  "clock",
  "megaminx",
  "mirror",
  "dino",
  "rex",
  "redi",
  "mixup",
  "pyramorphix",
  "gear",
  "dreidel",
  "bandaged222",
  "bicube",
  "square2",
  "pandora",
  "ultimateSkewb",
  "pyraminxCrystal",
  "tetraminx",
  "meierHalpernPyramid",
  "sq1Star",
  "windmill",
  "helicopter",
  "supersquare1",
  "fto",
  "timemachine",
  "masterskewb",
  "void",
  "diamondcube",
  "axis44",
  "fisher44",
  "redibarrel",
  "twisty33",
  "ghost",
  "barrel33",
] as const;

export declare type PuzzleType = (typeof PuzzleTypeName)[number];

export const ScramblerList = [
  "222so",
  "333",
  "333fm",
  "333ni",
  "333mbf",
  "333oh",
  "444bld",
  "444wca",
  "555wca",
  "555bld",
  "666wca",
  "777wca",
  "clkwca",
  "mgmp",
  "pyrso",
  "skbso",
  "sqrs",
] as const;

export type Scrambler = (typeof ScramblerList)[number];

const COLORS: Record<string, string> = {
  green: "rgb(0,157,84)",
  red: "rgb(220,66,47)",
  blue: "rgb(61,129,246)",
  orange: "rgb(232,112,0)",
  yellow: "rgb(255,235,59)",
  white: "rgb(230,230,230)",
  black: "rgb(0,0,0)",
  gray: "rgb(75,81,90)",
  darkGray: "rgb(50,50,50)",
  lightGray: "rgb(211,211,211)",
  violet: "rgb(138,27,255)",
  pink: "rgb(237,150,161)",
  lgreen: "rgb(74,217,49)",
  lyellow: "rgb(220,211,165)",
  lblue: "rgb(83,177,243)",

  /// Printable
  pgreen: "rgb(16,162,4)",
  pred: "rgb(213,0,0)",
  pblue: "rgb(43,43,255)",
  porange: "rgb(255,108,11)",
  pyellow: "rgb(255,242,0)",
  pwhite: "rgb(255,255,255)",
  pblack: "rgb(0,0,0)",
  pgray: "rgb(200,200,200)",
  pviolet: "rgb(185,104,251)",
  ppink: "rgb(249,187,204)",
  plgreen: "rgb(74,217,49)",
  plyellow: "rgb(255,255,183)",
  plblue: "rgb(83,177,243)",
};

export declare type ColorName = keyof typeof COLORS;

function getColorByName(colorName: ColorName | (string & {})) {
  return COLORS[colorName] || colorName;
}

export const STANDARD_PALETTE = {
  y: getColorByName("yellow"),
  r: getColorByName("red"),
  o: getColorByName("orange"),
  b: getColorByName("blue"),
  g: getColorByName("green"),
  w: getColorByName("white"),
  x: getColorByName("gray"),
  d: getColorByName("black"),
  v: getColorByName("violet"),
  k: getColorByName("yellow"),

  yellow: getColorByName("yellow"),
  red: getColorByName("red"),
  orange: getColorByName("orange"),
  blue: getColorByName("blue"),
  green: getColorByName("green"),
  white: getColorByName("white"),
  gray: getColorByName("gray"),
  darkGray: getColorByName("darkGray"),
  lightGray: getColorByName("lightGray"),
  black: getColorByName("black"),
  violet: getColorByName("violet"),
  pink: getColorByName("pink"),
  lblue: getColorByName("lblue"),
  lyellow: getColorByName("lyellow"),
  lgreen: getColorByName("lgreen"),
};

export function strToHex(color: string) {
  const nums = color.split("(")[1].split(")")[0].split(",").map(Number);
  return (nums[0] << 16) | (nums[1] << 8) | nums[2];
}

// SCRAMBLER OPTIONS
export const R222 = [
  "222so",
  "222o",
  "2223",
  "2226",
  "222eg",
  "222eg0",
  "222eg1",
  "222eg2",
  "222nb",
  "222tcp",
  "222tcn",
  "222lsall",
] as const;

export const R333 = [
  "333",
  "333ni",
  "333fm",
  "333oh",
  "333o",
  "edges",
  "corners",
  "ll",
  "zbll",
  "cll",
  "ell",
  "lse",
  "lsemu",
  "cmll",
  "f2l",
  "lsll2",
  "2gll",
  "zbls",
  "zzll",
  "oll",
  "pll",
  "eoline",
  "easyc",
  "333ft",
  "333custom",
  "2gen",
  "2genl",
  "roux",
  "3gen_F",
  "3gen_L",
  "RrU",
  "half",
  "lsll",
  "coll",
  "eols",
  "wvls",
  "vls",
  "easyxc",
  "sbrx",
  "mt3qb",
  "mteole",
  "mttdr",
  "mt6cp",
  "mtcdrll",
  "mtl5ep",
  "ttll",
] as const;
export const R444 = [
  "444wca",
  "444bld",
  "444m",
  "444",
  "444yj",
  "4edge",
  "RrUu",
] as const;
export const R555 = ["555wca", "555bld", "555", "5edge"] as const;
export const R666 = ["666wca", "666si", "666p", "666s", "6edge"] as const;
export const R777 = ["777wca", "777si", "777p", "777s", "7edge"] as const;
export const PYRA = [
  "pyrso",
  "pyro",
  "pyrm",
  "pyrl4e",
  "pyr4c",
  "pyrnb",
] as const;
export const SKWB = ["skbso", "skbo", "skb", "skbnb"] as const;
export const SQR1 = ["sqrs", "sqrcsp", "sq1h", "sq1t"] as const;
export const CLCK = [
  "clkwca",
  "clk",
  "clkwca",
  "clko",
  "clkc",
  "clke",
] as const;
export const MEGA = [
  "mgmp",
  "mgmc",
  "mgmo",
  "minx2g",
  "mlsll",
  "mgmll",
  "mgmpll",
] as const;
export const KILO = ["klmso", "klmp"] as const;
export const GIGA = ["giga"] as const;
export const MISC = [
  ["r3", "r3ni"],
  "r234w",
  "r2345w",
  "r23456w",
  "r234567w",
  "r234",
  "r2345",
  "r23456",
  "r234567",
  "sq2",
  "bic",
  ["gearso", "gearo", "gear"],
  ["redim", "redi"],
  ["ivy", "ivyo", "ivyso"],
  ["prcp", "prco"],
  ["heli"],
  ["888"],
  ["999"],
  ["101010"],
  ["111111"],
  ["mpyr"],
  ["223"],
  ["233"],
  ["334"],
  ["336"],
  ["ssq1t"],
  ["fto"],
  ["133"],
  ["sfl"],
];

export type AScramblers =
  | (typeof R222)[number]
  | (typeof R333)[number]
  | (typeof R444)[number]
  | (typeof R555)[number]
  | (typeof R666)[number]
  | (typeof R777)[number]
  | (typeof PYRA)[number]
  | (typeof SKWB)[number]
  | (typeof SQR1)[number]
  | (typeof CLCK)[number]
  | (typeof MEGA)[number]
  | (typeof KILO)[number]
  | (typeof GIGA)[number];

const OPTS: PuzzleOptions[] = [
  { type: "rubik", order: [2] },
  { type: "rubik", order: [3] },
  { type: "rubik", order: [4] },
  { type: "rubik", order: [5] },
  { type: "rubik", order: [6] },
  { type: "rubik", order: [7] },
  { type: "pyraminx", order: [3] },
  { type: "skewb" },
  { type: "square1" },
  { type: "clock" },
  { type: "megaminx", order: [3] },
  { type: "megaminx", order: [2] },
  { type: "megaminx", order: [5] },
];

const OPTS_MISC: PuzzleOptions[][] = [
  [{ type: "rubik", order: [3] }],
  [2, 3, 4].map((n) => ({ type: "rubik", order: [n] })),
  [2, 3, 4, 5].map((n) => ({ type: "rubik", order: [n] })),
  [2, 3, 4, 5, 6].map((n) => ({ type: "rubik", order: [n] })),
  [2, 3, 4, 5, 6, 7].map((n) => ({ type: "rubik", order: [n] })),
  [2, 3, 4].map((n) => ({ type: "rubik", order: [n] })),
  [2, 3, 4, 5].map((n) => ({ type: "rubik", order: [n] })),
  [2, 3, 4, 5, 6].map((n) => ({ type: "rubik", order: [n] })),
  [2, 3, 4, 5, 6, 7].map((n) => ({ type: "rubik", order: [n] })),
  [{ type: "square2" }],
  [{ type: "bicube" }],
  [{ type: "gear" }],
  [{ type: "redi" }],
  [{ type: "ivy" }],
  [{ type: "pyraminxCrystal" }],
  [{ type: "helicopter" }],
  [{ type: "rubik", order: [8] }],
  [{ type: "rubik", order: [9] }],
  [{ type: "rubik", order: [10] }],
  [{ type: "rubik", order: [11] }],
  [{ type: "pyraminx", order: [4] }],
  [{ type: "rubik", order: [2, 2, 3] }],
  [{ type: "rubik", order: [3, 3, 2] }],
  [{ type: "rubik", order: [3, 3, 4] }],
  [{ type: "rubik", order: [3, 3, 6] }],
  [{ type: "supersquare1" }],
  [{ type: "fto" }],
  [{ type: "rubik", order: [3, 3, 1] }],
  [{ type: "rubik", order: [3, 1, 3] }],
];

const MODES = [
  R222,
  R333,
  R444,
  R555,
  R666,
  R777,
  PYRA,
  SKWB,
  SQR1,
  CLCK,
  MEGA,
  KILO,
  GIGA,
];

export const options: Map<string, PuzzleOptions | PuzzleOptions[]> = new Map<
  string,
  PuzzleOptions | PuzzleOptions[]
>();

for (let i = 0, maxi = MODES.length; i < maxi; i += 1) {
  for (let j = 0, maxj = MODES[i].length; j < maxj; j += 1) {
    options.set(MODES[i][j], OPTS[i]);
  }
}

for (let i = 0, maxi = MISC.length; i < maxi; i += 1) {
  let m = MISC[i];
  if (Array.isArray(m)) {
    m.forEach((m) => options.set(m, OPTS_MISC[i]));
  } else {
    options.set(m, OPTS_MISC[i]);
  }
}
