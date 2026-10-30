// Tiny arithmetic evaluator for numeric inputs ("20*8", "7,5 + 4", "(8+6)/2").
// Hand-written parser instead of eval(): + - * / ×, parentheses, comma or dot decimals.

export function evaluate(input: string): number | null {
  const src = input.replace(/\s+/g, "").replace(/,/g, ".").replace(/[×xX]/g, "*");
  if (!src) return null;
  let i = 0;

  function number(): number {
    const m = /^\d*\.?\d+|^\d+\./.exec(src.slice(i));
    if (!m) throw new Error();
    i += m[0].length;
    return Number(m[0]);
  }

  function factor(): number {
    if (src[i] === "-") return i++, -factor();
    if (src[i] === "+") return i++, factor();
    if (src[i] === "(") {
      i++;
      const v = sum();
      if (src[i++] !== ")") throw new Error();
      return v;
    }
    return number();
  }

  function product(): number {
    let v = factor();
    while (src[i] === "*" || src[i] === "/") v = src[i++] === "*" ? v * factor() : v / factor();
    return v;
  }

  function sum(): number {
    let v = product();
    while (src[i] === "+" || src[i] === "-") v = src[i++] === "+" ? v + product() : v - product();
    return v;
  }

  try {
    const v = sum();
    return i === src.length && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** True when the input is more than a plain number, i.e. worth showing its result. */
export function isExpression(input: string) {
  return /\d\s*[-+*/×xX(]|[)]/.test(input.trim().replace(/^[-+]/, ""));
}
