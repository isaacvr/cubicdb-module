export function getRoundedPath(path: number[][], _rd = 0.2) {
  const res = [];
  const rd = _rd || 0.11;

  for (let i = 0, maxi = path.length; i < maxi; i += 1) {
    let p1 = path[(i - 1 + maxi) % maxi];
    let p2 = path[i];
    let p3 = path[(i + 1) % maxi];
    let pt1 = [p2[0] + (p1[0] - p2[0]) * rd, p2[1] + (p1[1] - p2[1]) * rd];
    let pt2 = [p2[0] + (p3[0] - p2[0]) * rd, p2[1] + (p3[1] - p2[1]) * rd];

    if (i === 0) {
      res.push(`M ${pt1[0]} ${pt1[1]}`);
    } else {
      res.push(`L ${pt1[0]} ${pt1[1]}`);
    }

    res.push(`Q ${p2[0]} ${p2[1]} ${pt2[0]} ${pt2[1]}`);
  }

  res.push("Z");
  return res.join(" ");
}

export function clone(obj: any): any {
  switch (typeof obj) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
    case "function":
      return obj;
  }

  if (obj === null) return obj;

  if (typeof obj === "bigint") {
    return BigInt(obj);
  }

  if (Array.isArray(obj)) return obj.map(clone);

  return Object.entries(obj).reduce((acc: any, e) => {
    acc[e[0]] = clone(e[1]);
    return acc;
  }, {});
}

export function newArr(length: number) {
  return Array.from({ length });
}

export function svgnum(n: number) {
  return Math.floor(n * 100) / 100;
}