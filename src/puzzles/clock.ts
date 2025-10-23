import { PuzzleInterface } from "./constants";
import { randomCSSId } from "./strings";
import { svgnum } from "./utils";
import { CENTER, DOWN, FRONT, Vector3D } from "./vector3d";

const F = 0.1;

function circle(
  parts: string[][],
  x: number,
  y: number,
  rad: number,
  col: string,
  omitStroke = false,
) {
  parts.push([
    col,
    !omitStroke ? col : "",
    `<circle cx="${svgnum(x * F)}" cy="${svgnum(y * F)}" r="${svgnum(rad * F * 0.95)}"/>`,
  ]);
}

function drawSingleClock(
  parts: string[][],
  RAD: number,
  X: number,
  Y: number,
  MAT: any,
  PINS: any,
  {
    BLACK,
    WHITE,
    GRAY,
    RED,
  }: {
    BLACK: string;
    WHITE: string;
    GRAY: string;
    RED: string;
  },
) {
  const W = RAD * 0.582491582491582;
  const RAD_CLOCK = RAD * 0.2020202020202;
  const BORDER = RAD * 0.0909090909090909;
  const BORDER1 = RAD * 0.02;

  const PI = Math.PI;
  const TAU = PI * 2;

  const arrow = [
    new Vector3D(0.0, 1.0),
    new Vector3D(0.1491, 0.4056),
    new Vector3D(0.0599, 0.2551),
    new Vector3D(0.0, 0.0),
    new Vector3D(-0.0599, 0.2551),
    new Vector3D(-0.1491, 0.4056),
  ].map((v) => v.mul(RAD_CLOCK));

  const circles = [new Vector3D(0.1672), new Vector3D(0.1254)].map((v) =>
    v.mul(RAD_CLOCK),
  );

  const R_PIN = circles[0].x * 2.3;

  circle(parts, X, Y, RAD, WHITE);

  for (let p = 0; p <= 1; p++) {
    const rads = [RAD_CLOCK + BORDER + BORDER1, RAD_CLOCK + BORDER];
    const cols = [WHITE, BLACK];
    for (let i = -1; i < 2; i += 2) {
      for (let j = -1; j < 2; j += 2) {
        circle(parts, X + W * i, Y + W * j, rads[p], cols[p]);
      }
    }
  }

  circle(parts, X, Y, RAD - BORDER1, BLACK);

  for (let i = -1; i < 2; i += 1) {
    for (let j = -1; j < 2; j += 1) {
      circle(parts, X + W * i, Y + W * j, RAD_CLOCK, WHITE);

      const ANCHOR = new Vector3D(X + W * i, Y + W * j);
      const angId = MAT[j + 1][i + 1];
      const ang = (angId * TAU) / 12;
      const pts = arrow.map((v) =>
        v.rotate(CENTER, FRONT, PI + ang).add(ANCHOR),
      );
      const pathParts: string[] = [];

      for (let p = 0, maxp = pts.length; p < maxp; p += 1) {
        if (p === 0)
          pathParts.push(`M ${svgnum(pts[p].x * F)} ${svgnum(pts[p].y * F)}`);
        else
          pathParts.push(`L ${svgnum(pts[p].x * F)} ${svgnum(pts[p].y * F)}`);
      }
      pathParts.push("Z");
      parts.push([
        BLACK,
        BLACK,
        `<path d="${pathParts.join(" ")}" stroke-width="${0.02}" />`,
      ]);

      circle(parts, ANCHOR.x, ANCHOR.y, circles[0].x, BLACK);
      circle(parts, ANCHOR.x, ANCHOR.y, circles[1].x, WHITE);

      for (let a = 1; a <= 12; a += 1) {
        const na = a % 12;
        const pt = ANCHOR.add(
          DOWN.mul(RAD_CLOCK + BORDER / 2).rotate(
            CENTER,
            FRONT,
            (na * TAU) / 12,
          ),
        );
        const r = (circles[0].x / 4) * (na ? 1 : 1.6);
        const c = na ? WHITE : RED;
        circle(parts, pt.x, pt.y, r, c);
      }

      if (i <= 0 && j <= 0) {
        const val = PINS[(j + 1) * 2 + i + 1];
        circle(parts, ANCHOR.x + W / 2, ANCHOR.y + W / 2, R_PIN, GRAY);
        circle(
          parts,
          ANCHOR.x + W / 2,
          ANCHOR.y + W / 2,
          R_PIN * 0.7,
          val ? "#181818" : GRAY,
        );
      }
    }
  }
}

function clockImage(cube: PuzzleInterface, DIM: number, ID: string) {
  const W = svgnum(DIM * 2.2);
  const PINS1 = cube.raw[0];
  const PINS2 = cube.raw[0].map(
    (e: any, p: number) => !PINS1[((p >> 1) << 1) + 1 - (p & 1)],
  );
  const MAT = cube.raw[1];
  const RAD = DIM / 2;

  const BLACK = cube.palette.black;
  const WHITE = cube.palette.white;
  const GRAY = cube.palette.gray;
  const RED = "red";

  const parts: string[][] = [];

  drawSingleClock(parts, RAD, RAD, RAD, MAT[0], PINS2, {
    BLACK,
    WHITE,
    GRAY,
    RED,
  });
  drawSingleClock(parts, RAD, W - RAD, RAD, MAT[1], PINS1, {
    BLACK: WHITE,
    WHITE: BLACK,
    GRAY,
    RED,
  });

  const fillClass: any = {
    [BLACK]: "f0",
    [WHITE]: "f1",
    [GRAY]: "f2",
    [RED]: "f3",
    "": "",
  };
  const strokeClass: any = {
    [BLACK]: "s0",
    [WHITE]: "s1",
    [GRAY]: "s2",
    [RED]: "s3",
    "": "",
  };

  const cls = parts.map((p) => {
    // let pos = p[2].indexOf(" ");
    // let tagName = p[2].slice(0, pos);

    let classes: string[] = [];

    if (p[0]) classes.push(fillClass[p[0]]);
    if (p[1]) classes.push(strokeClass[p[1]]);

    return classes
      .map((c) => c.trim())
      .filter((c) => c)
      .join(" ");

    // return tagName + `${cl ? ` class="${cl}"` : ""}` + p[2].slice(pos);
  });

  let groups: string[][] = parts.reduce((acc, e, p) => {
    if (p == 0) return [[cls[p], e[2]]];
    if (cls[p] === acc[acc.length - 1][0]) {
      acc[acc.length - 1].push(e[2]);
    } else {
      acc.push([cls[p], e[2]]);
    }
    return acc;
  }, [] as string[][]);

  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 ${W * F} ${DIM * F}" class="${ID}">`,
    `<style>.${ID} circle{stroke-width:0.1;}${
      [BLACK, WHITE, GRAY, RED]
        .map((c, p) => `.${ID} .f${p}{fill:${c};}`)
        .join("") +
      [BLACK, WHITE, GRAY, RED]
        .map((c, p) => `.${ID} .s${p}{stroke:${c};}`)
        .join("")
    }</style>`,
    groups
      .map((g) => {
        if (g.length === 2) {
          let pos = g[1].indexOf(" ");
          return g[1].slice(0, pos) + ` class="${g[0]}"` + g[1].slice(pos);
        }
        return `<g class="${g[0]}">${g.slice(1).join("")}</g>`;
      })
      .join(""),
    `</svg>`,
  ].join("");
}

export function CLOCK(): PuzzleInterface {
  const clock: PuzzleInterface = {
    move: () => true,
    palette: {
      black: "#181818",
      white: "#aaa",
      gray: "#7f7f7f",
    },
  };

  const ID = randomCSSId();

  const pins: boolean[] = [false, false, false, false];
  const clocks = [
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
  ];

  const add = function (i: number, j: number, k: number, val: number) {
    clocks[i][j][k] = (((clocks[i][j][k] + val) % 12) + 12) % 12;
  };

  const mat = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  clock.move = function (moves: any[]) {
    let first = true;
    let upFace = 0;
    for (let i = 0, maxi = moves.length; i < maxi; i += 1) {
      const mv = moves[i];
      const pinCode = mv[0];
      const up = mv[1];
      const down = mv[2];

      if (mv[0] === -1) {
        upFace ^= 1;
        continue;
      }

      for (let x = 0; x < 3; x += 1) {
        for (let y = 0; y < 3; y += 1) {
          mat[x][y] = 0;
        }
      }

      for (let j = 0, mask = 8; j < 4; j += 1, mask >>= 1) {
        if (isNaN(up) || isNaN(down)) {
          if (first) {
            pins.length = 0;
            pins.push(false, false, false, false);
            first = false;
          }
          pins[j] = pinCode & mask ? true : pins[j];
        } else {
          pins[j] = !!(pinCode & mask);
        }
        if (pins[j]) {
          const x = j >> 1;
          const y = j & 1;
          mat[x][y] = mat[x + 1][y] = mat[x][y + 1] = mat[x + 1][y + 1] = 1;
        }
      }

      if (!isNaN(up) && !isNaN(down)) {
        for (let x = 0; x < 3; x += 1) {
          for (let y = 0; y < 3; y += 1) {
            if (mat[x][y]) {
              add(upFace, x, y, up);
              if ((x & 1) == 0 && (y & 1) == 0) {
                add(1 - upFace, x, 2 - y, -up);
              }
            }
          }
        }
      }
    }
  };

  clock.getImage = () => clockImage(clock, 100, ID);

  clock.raw = [pins, clocks];

  return clock;
}
