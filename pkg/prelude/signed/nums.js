//////////////////// Numbers
// All the mathematical functions
// TODO: verify that NaN never shows up
// TODO: add "nil punning" for undefined? [Why did I want to do this?]
//        [ ] Change is_number to maybe(is_number) everywhere
//        [ ] Figure out how to coerce undefined to 0 gracefully
// TODO: add additional numeric functions
//        [ ] ping_pong

import L from './deps.js';
import F from './fns.js';
import P from './preds.js';
import S from './spec.js';
import NS from './ns.js';

let {args} = S;
let {is_num, is_int} = P;
let {defn, partial, fn} = F;
let {ns} = NS;

let inc = defn({
  name: 'inc',
  doc: 'Increments a number by 1.',
  pre: args([is_num]),
  body: (x) => x + 1
});

let dec = defn({
  name: 'dec',
  doc: 'Decrements a number by 1.',
  pre: args([is_num]),
  body: (x) => x - 1
});

let add = defn({
  name: 'add',
  doc: 'Adds numbers. With two or more arguments, sums all the arguments together. With one argument, partially applies `add`, returning a function that will add that will sum all its arguments, and then add the first. E.g., `add(1, 2, 3); //=> 6`, and `add(1)(2); //=> 3`.',
  pre: args([is_num]),
  body: [
    (x) => partial(add, x),
    (x, y, ...more) => {
      let xs = [x, y, ...more];
      let sum = 0;
      for (let x of xs) {
        sum += x;
      }
      return sum;
    }
  ]
});

let mult = defn({
  name: 'mult',
  doc: 'Multiplies numbers. With two or more arguments, multiplies all the arguments together. With one argument, partially applies `mult`, returning a function that will multiply all its arguments, and then multiply that product by the first. E.g., `mult(2, 3, 4); //=> 24` and `mult(2)(4); //=> 8`.',
  pre: args([is_num]),
  body: [
    (x) => partial(mult, x),
    (x, y, ...more) => {
      let xs = [x, y, ...more];
      let product = 1;
      for (let x of xs) {
        product *= x;
      }
      return product;
    }
  ]
});

let sub = defn({
  name: 'sub',
  doc: 'Subtracts numbers. With two arguments, subtracts the second from the first. E.g. `sub(10, 4); //=> 6`. With three or more arguments, subtracts from the first argument the sum of the remaining arguments. E.g., `sub(10, 2,3); //=> 5`. With a single argument, returns `sub` partially applied, which will subtract the sum of any arguments from the original first argument. E.g. `sub(10)(1, 2, 3); //=> 4`. Note that this is perhaps unintuitive behavior. If you want a function that will subtract a given amount from its argument, see `sub_by`.',
  pre: args([is_num]),
  body: [
    (x) => partial(sub, x),
    (x, y) => x - y,
    (x, y, z, ...more) => {
      let ys = [y, z, ...more];
      return sub(x, add(...ys));
    }
  ]
});

let sub_by = defn({
  name: 'sub_by',
  doc: 'Takes a number and returns a unary function that subtracts that first number from its argument, e.g. `sub_by(3)(10); //=> 7`.',
  pre: args([is_num]),
  body: (x) => defn({
    name: `sub(${x})`,
    pre: args([is_num]),
    body: (y) => y - x
  })
});

let is_nonzero = defn({
  name: 'is_nonzero',
  doc: 'Tells if a number is not zero. Returns false given non-numbers.',
  body: (x) => P.is_num(x) && x !== 0
});

let div = defn({
  name: 'div',
  doc: 'Divides numbers. Given two arguments, divides the first by the second. Given three or more arguments, divides the first by the product of the remaining. Given a single argument, returns `div` partially applied, dividing that first argument by the product of any additional arguments. E.g. `div(1, 2); //=> 0.5`, `div(12, 2, 3); //=> 2`, `div(24)(2, 4); //=> 3`. Raises an error on attempts to divide by zero (i.e. if any arguments but the first are `0`). If you want a function to divide by a particular number, see `div_by`.',
  pre: args([is_num], [is_num, is_nonzero]),
  body: [
    (x) => partial(div, x),
    (x, y) => x / y,
    (x, y, z, ...more) => {
      let ys = [y, z, ...more];
      return div(x, mult(...ys));
    }
  ]
});

let div_by = defn({
  name: 'div_by',
  doc: 'Given a number, returns a unary function that divides its argument by the original number. E.g. `div_by(2)(10); //=> 5`. Throws an error on attempts to divide by zero (the argument to `div_by` cannot be `0`).',
  pre: args([is_nonzero]),
  body: (x) => defn({
    name: `div_by(${x})`,
    pre: args([is_num]),
    body: (y) => y / x
  })
});

let random = defn({
  name: 'random',
  doc: 'Returns a (pseudo)random number. With zero arguments, returns a random number between 0 (inclusive) and 1 (exclusive). Given one argument, returns a random number between 0 (inclusive) and its argument (exclusive). Given two arguments, returns a random number between them (inclusive of the first, exclusive of the second).',
  pre: args([], [is_num], [is_num, is_num]),
  body: [
    () => Math.random(),
    (x) => Math.random() * x,
    (x, y) => (Math.random() * (y - x)) + x
  ]
});

let ceil = defn({
  name: 'ceil',
  doc: 'Ceiling function: rounds up to the next integer, returning integers unchanged. E.g. `ceil(3.1); //=> 4`. The ceiling of negative numbers still rounds "up," i.e. towards zero: `ceil(-2.3); //=> -2`.',
  pre: args([is_num]),
  body: (x) => Math.ceil(x)
});

let floor = defn({
  name: 'floor',
  doc: 'Floor function: rounds down to the next integer, returning integers unchanged. E.g. `floor(3.1); //=> 3`. The `floor` of negative numbers still rounds "down," i.e. away from zero: `floor(-2.3); //=> -3`. Compare to `trunc`.',
  pre: args([is_num]),
  body: (x) => Math.floor(x)
});

let trunc = defn({
  name: 'trunc',
  doc: 'Truncates the decimal portions of a number, returning integers unchanged. E.g. `trunc(3.1); //=> 3`. The `trunc` of negative numbers rounds "up," towards `0`: `trunc(-3.1); //=> -3`. Compare to `floor`.',
  pre: args([is_num]),
  body: (x) => x | 0
});

let round = defn({
  name: 'round',
  doc: 'Rounds numbers to the nearest integer. It returns integers unchanged. In most cases, it rounds positive and negative numbers as you would expect, i.e. `round(3.3); //=> 3` and `round(-3.3); //=> -3`. However, arguments with a fractional portion of `0.5` are always rounded "up," in the direction of positive infinity: `round(3.5); //=> 4` but `round(-3.5); //=> -3`.',
  pre: args([is_num]),
  body: (x) => Math.round(x)
});

let precise = defn({
  name: 'precise',
  doc: 'Rounds a number to the precision specified--to the number of digits to the right of the decimal point. `0` will round to integers. Negative entries will round to the left of the decimal point. One argument gives you a partially applied function.',
  pre: args([is_num], [is_num, is_num]),
  body: [
    (precision) => partial(precise, precision),
    (precision, n) => {
      let factor = 10 ** precision;
      return ((n * factor) | 0) / factor
    }
  ]
});

let abs = defn({
  name: 'abs',
  doc: 'Absolute value of a number: how far away from `0` it is on the number line.',
  pre: args([is_num]),
  body: (x) => Math.abs(x)
});

let random_int = defn({
  name: 'random_int',
  doc: 'Returns a random integer. Given one argument, returns a random integer between `0` (inclusive) and that value (exclusive). Given two arguments, returns a random integer between them (inclusive of the first argument, exclusive of the second argument). Arguments must be integers. E.g. `random_int(3); //=> 0, 1, or 2` and `random_int(1, 4); //=> 1, 2, or 3`.',
  pre: args([is_int]),
  body: [
    (x) => (Math.random() * x) | 0,
    (x, y) => ((Math.random() * (y - x)) | 0) + x 
  ]
});

let mod = defn({
  name: 'mod',
  doc: 'Modulus operation, or the remainder. Returns the remainder when the first argument is divided by the second. Second argument must not be `0`.',
  pre: args([is_num, is_nonzero]),
  body: (x, y) => x % y
});

let pow = defn({
  name: 'pow',
  doc: 'Exponentiation operation. When given two numbers, raises the first argument to the second. When given three or more numbers, raises the first to the second, and then raises the result of that to the third, and so on. When given one number, returns `pow` partially applied: a function that raises that first number to the power of the argument, e.g. `pow(3)(4); //=> 81` (and not 64). If you want a function that raises its argument to the power of a particular number, see `pow_by`.',
  pre: args([is_num]),
  body: [
    (x) => partial(pow, x),
    (x, y, ...more) => {
      let ys = [y, ...more];
      for (let y of ys) {
        x = x ** y;
      }
      return x;
    },
  ]
});

let pow_by = defn({
  name: 'pow_by',
  doc: 'Takes a number argument `x`, and returns a function that raises its argument to the power of `x`, e.g. `pow_by(2)` squares numbers, `pow_by(3)` cubes them, and so on.',
  pre: args([is_num]),
  body: (x) => defn({
    name: `pow_by(${x})`,
    pre: args([is_num]),
    body: (y) => y ** x
  })
});

let gt = defn({
  name: 'gt',
  doc: 'Greater than comparator, `>`. When given two numbers, returns `true` if the first is greater than the second. When given three or more numbers, returns `true` if the numbers are in decreasing order. When given one number, `gt` returns itself partially applied. Note that partial application is meant to be intuitive rather than rigorous: `gt(4)` returns a function that tests if its argument is greater than 4: `gte(4, 3); //=> true`, but `gte(4)(3); //=> false`.',
  pre: args([is_num]),
  body: [
    (x) => fn(`gt<partial (${x})>`, (y) => gt(y, x)),
    (x, y, ...more) => {
      let ys = [y, ...more];
      let prev = x;
      for (let y of ys) {
        if (!(prev > y)) return false;
        prev = y;
      }
      return true;
    }
  ]
});

let gte = defn({
  name: 'gte',
  doc: 'Greater than or equal comparator, `>=`. With one argument, partially applies itself. With two, returns `true` if the first is greater than or equal to the second. With three or more, returns `true` if the numbers are in decreasing or flat order, e.g. `gte(3, 2, 1, 1, 1); //=> true`. Note that partial application is meant to be intuitive rather than rigorous: `gte(4)` returns a function that tests if its argument is greater than or equal to 4: `gte(4, 3); //=> true`, but `lte(4)(3); //=> false`.',
  pre: args([is_num]),
  body: [
    (x) => fn(`gte<partial (${x})>`, (y) => gte(y, x)),
    (x, y, ...more) => {
      let ys = [y, ...more];
      let prev = x;
      for (let y of ys) {
        if (!(prev >= y)) return false;
        prev = y;
      }
      return true;
    }
  ]
});

let lt = defn({
  name: 'lt',
  doc: 'Less than comparator, `<`. With one argument, partially applies itself. With two, returns `true` if the first is less than the second. With three or more, returns `true` if the numbers are in increasing order. Note that partial application is meant to be intuitive rather than rigorous: `lt(3)` returns a function that tests if its argument is less than 3: `lt(3, 4); //=> true`, but `lt(3)(4); //=> false`.',
  pre: args([is_num]),
  body: [
    (x) => fn(`lt<partial (${x})>`, (y) => lt(y, x)),
    (x, y, ...more) => {
      let ys = [y, ...more];
      let prev = x;
      for (let y of ys) {
        if (!(prev < y)) return false;
        prev = y;
      }
      return true;
    }
  ]
});

let lte = defn({
  name: 'lte',
  doc: 'Less than or equal to comparator, `<=`. With one argument, partially applies itself. With two, returns `true` if the first is less than or equal to the second. With three or more, returns `true` if the numbers are in increasing or flat order, e.g. `lte(1, 2, 3, 3); //=> true`. Note that partial application is meant to be intuitive rather than rigorous: `lte(3)` returns a function that tests if its argument is less than or equal to 3: `lte(3, 4); //=> true`, but `lte(3)(4); //=> false`.',
  pre: args([is_num]),
  body: [
    (x) => fn(`lte<partial (${x})>`, (y) => lte(y, x)),
    (x, y, ...more) => {
      let ys = [y, ...more];
      let prev = x;
      for (let y of ys) {
        if (!(prev <= y)) return false;
        prev = y;
      }
      return true;
    }
  ]
});

let max = defn({
  name: 'max',
  doc: 'Returns the largest of the one or more numbers passed as arguments.',
  pre: args([is_num]),
  body: (...args) => Math.max(...args)
});

let min = defn({
  name: 'min',
  doc: 'Returns the smallest of the one or more numbers passed as arguments.',
  pre: args([is_num]),
  body: (...args) => Math.min(...args)
});

let is_positive = defn({
  name: 'is_positive',
  doc: 'Tells if a number is positive, i.e. greater than `0`. Note that `0` is not itself positive. Returns `false` for non-numbers.',
  body: (x) => typeof x === 'number' && x > 0
});

let is_positive_int = defn({
  name: 'is_positive_int',
  doc: 'Tells if a number is a positive integer, i.e. an integer greater than `0`. Returns `false` for non-numbers.',
  body: (x) => typeof x === 'number' && x > 0 && (x | 0) === x
});

let is_not_negative = defn({
  name: 'is_not_negative',
  doc: 'Tells if a number is greater than or equal to `0`. Returns `false` for non-numbers.',
  body: (x) => typeof x === 'number' && x >= 0
});

let is_natural = defn({
  name: 'is_natural',
  doc: 'Tells if a number is a "natural number": integers greater than or equal to `0`. Returns `false` for non-numbers.',
  body: (x) => typeof x === 'number' && x >= 0 && (x | 0) === x
});

let is_negative = defn({
  name: 'is_negative',
  doc: 'Tells if a number is less than zero. Returns `false` for non-numbers.',
  body: (x) => typeof x === 'number' && x < 0
});

let is_even = defn({
  name: 'is_even',
  doc: 'Tells if a number is even. Returns `false` for non-numbers.',
  body: (x) => typeof x === 'number' && (x | 0) === x && x % 2 === 0
});

let is_odd = defn({
  name: 'is_odd',
  doc: 'Tells if a number is odd. Returns `false` for non-numbers.',
  body: (x) => typeof x === 'number' && (x | 0) === x && x % 2 !== 0
});

let is_between = defn({
  name: 'is_between',
  doc: 'Tells if a number lies between two numbers, exclusive of the two numbers, with the first number being the lesser of the two. If the first argument is not less than the second, will always return false.',
  pre: args([is_num, is_num]),
  body: (x, y) => defn({
    name: `is_between<${x}, ${y}>`,
    pre: args([is_num]),
    body: (z) => z > x && z < y
  })
});

let is_in_range = defn({
  name: 'is_in_range',
  doc: 'Tells if a number is in the range described by the two numbers, inclusive of the two numbers, with the first number being the lesser of the two. If the first argument is not lte than the second, will always return false.',
  pre: args([is_num, is_num]),
  body: (x, y) => defn({
    name: `is_in_range<${x}, ${y}>`,
    pre: args([is_num]),
    body: (z) => z >= x && z <= y
  })
});

let is_infinity = defn({
  name: 'is_infinity',
  doc: 'Tests if something is Infinity.',
  body: (x) => x === Infinity
});

let sqrt = defn({
  name: 'sqrt',
  doc: 'Takes the square root of a non-negative number.',
  pre: args([is_not_negative]),
  body: (x) => Math.sqrt(x)
});

let cbrt = defn({
  name: 'cbrt',
  doc: 'Takes the cube root of a number.',
  pre: args([is_num]),
  body: (x) => Math.cbrt(x)
});

let num_ = defn({
  name: 'num',
  doc: 'Attempts to produce a number from another type. Numbers pass through unharmed. `false` is `0`, `true` is `1`; strings are parsed, and, if they look enough like a number that JS thinks it knows what to do with them, you get a number back. Anything else returns `undefined`.',
  body: (x) => {
    if (x === '') return undefined;
    let number = Number(x);
    if (isNaN(number)) return undefined;
    return number;
  }
});

let sum_of_squares = defn({
  name: 'sum_of_squares',
  doc: 'Returns the sum of the squares of the numbers passed in. To compare the magnitude of vectors quickly, use `sum_of_squares`: it avoids the costly `sqrt` step in `hypot`.',
  pre: args([is_num]),
  body: (...xs) => add(...xs.map((x) => x ** 2))
});

let hypot = defn({
  name: 'hypot',
  doc: 'Returns the "hypoteneuse" of a list of numbers: the square root of the sum of their squares. This will calculate the distance between the origin and a point in n-dimensional space (where n is the number of arguments passed in). Note that this can be slow, and to compare, e.g. the magnitude of vectors, you should probably use `sum_of_squares`.',
  pre: args([is_num]),
  body: (...xs) => Math.hypot(...xs)
});

///// Trigonometry
// TODO: consider shifting acos and asin to two-argument functions
let acos = defn({
  name: 'acos',
  doc: 'The inverse of `cos`; takes a number between -1 and 1, inclusive.',
  pre: args([is_in_range(-1, 1)]),
  body: (x) => Math.acos(x)
});

let asin = defn({
  name: 'asin',
  doc: 'The inverse of `sin`; takes a number between -1 and 1, inclusive.',
  pre: args([is_in_range(-1, 1)]),
  body: (x) => Math.asin(x)
});

let atan = defn({
  name: 'atan',
  doc: 'The arctangent of a slope, returning the angle in radians. With one argument, returns the arctangent of the slope expressed in a ratio. To avoid division by zero at vertical lines, the two-argument versiion takes the numerator and denominator. The two-argument version is much more common in typical use.',
  pre: args([is_num], [is_num, is_num]),
  body: [
    (x) => Math.atan(x),
    (x, y) => Math.atan2(x, y)
  ]
});

let cos = defn({
  name: 'cos',
  doc: 'The cosine of an angle (in radians).',
  pre: args([is_num]),
  body: (x) => Math.cos(x)
});

let sin = defn({
  name: 'sin',
  doc: 'The sine of angle (in radians).',
  pre: args([is_num]),
  body: (x) => Math.sin(x)
});

let tan = defn({
  name: 'tan',
  doc: 'The tangent of an angle (in radians): returns the slope of the line with that angle.',
  pre: args([is_num]),
  body: (x) => Math.tan(x)
});

///// Logarithms
let ln = defn({
  name: 'ln',
  doc: 'Natural log, `ln`. Arguments to logarithmic functions must be positive.',
  pre: args([is_positive]),
  body: (x) => Math.log(x)
});

let log2 = defn({
  name: 'log2',
  doc: 'Log base 2. Arguments to logarithmic functions must be positive.',
  pre: args([is_positive]),
  body: (x) => Math.log2(x)
});

let log10 = defn({
  name: 'log10',
  doc: 'Log base 10. Arguments to logarithmic functions must be positive.',
  pre: args([is_positive]),
  body: (x) => Math.log10(x)
});

///// Constants
let pi = Math.PI;
let sqrt2 = Math.SQRT2;
let sqrt1_2 = Math.SQRT1_2;
let e = Math.E;
let ln2 = Math.LN2;
let ln10 = Math.LN10;
let log2e = Math.LOG2E;
let log10e = Math.LOG10E;

// Other useful functions for graphics (cribbed from p5)
let clamp = defn({
  name: 'clamp',
  doc: '`clamp` constrains the range of a number. With one argument, `max`, it returns a function that clamps its argument between `0` and `max`. With two arguments, `min` and `max`, it returns a function that clamps its argument between `min` and `max`. Given three arguments, `min`, `max`, and `x`, it returns the value of `x` clamped between `min` and `max`.',
  pre: args([is_num]), //TODO: add additional predicate so min < max?
  body: [
    (max) => clamp(0, max),
    (min, max) => partial(clamp, min, max),
    (min, max, x) => x < min ? min 
      : x > max ? max : x
  ]
});

let lerp = defn({
  name: 'lerp',
  doc: 'Linear interpolatiion between two values. Given a `start` value, a `stop` value, and a `ratio`, calculates the number that is the ratio of the difference between them. E.g., `lerp(0, 4, 0.75); //=> 3`.',
  pre: args([is_num]),
  body: [
    (stop) => lerp(0, stop),
    (start, stop) => partial(lerp, start, stop),
    (start, stop, ratio) => start + ((stop - start) * ratio)
  ]
});

let norm = defn({
  name: 'norm',
  doc: `Normalizes a number, by mapping one range onto another. Takes a number in a range, determines where it is in that range, and then places it in the proportional place in the second range. With one, two, and four arguments, returns partially applied functions. 
  
  With one argument, \`source_end\`, \`norm\` returns a function mapping its input from the range \`(0, source_end)\` to the range \`(0, 1)\`. With two arguments, \`norm\` returns a function mapping its input from \`(source_start, source_end)\` to \`(0, 1)\`. With four arguments, \`norm\` returns a function that maps its input from \`(source_start, source_end)\` to \`(target_start, target_end)\`.
  
  With three and five arguments, \`norm\` returns the mapped value immediately. With three arguments, it returns the number mapped from \`(source_start, source_end)\` to \`(0, 1)\`. With five, it returns the number mapped from \`(source_start, source_end)\` to \`(target_start, target_end)\`
  
  E.g.s:
  \`norm(100)(33); //=> 0.33\` (This maps percentages to decimals.)
  \`norm(10, 20)(12.5); //=> 0.25\`
  \`norm(0, 10, 50, 100, 5); //=> 75\``,
  pre: args([is_num]),
  body: [
    (source_end) => norm(0, source_end, 0, 1),
    (source_start, source_end) => norm(source_start, source_end, 0, 1),
    (source_start, source_end, n) => norm(source_start, source_end, 0, 1, n),
    (source_start, source_end, target_start, target_end) => 
      partial(norm, source_start, source_end, target_start, target_end),
    (source_start, source_end, target_start, target_end, n) => 
      (((n - source_start) / (source_end - source_start)) * (target_end - target_start)) + target_start
  ]
});

// from mattdesl's canvas-utils
let wrap = defn({
  name: 'wrap',
  doc: 'Wraps a value around a range described by `from` (inclusive) and `to` (exclusive). Particularly useful for wrapping angles around a circle.',
  pre: args([is_num], [is_num, is_num], [is_num, is_num, is_num]),
  body: [
    (to) => partial(wrap, 0, to),
    (from, to) => partial(wrap, from, to),
    (from, to, x) => {
      let range = to - from;
      while (x >= to) {
        x = x - range;
      }
      while (x < from) {
        x = x + range;
      }
      return x;
    }
  ]
});

let deg_to_rad = defn({
  name: 'deg_to_rad',
  doc: 'Given an angle measurement in degrees, converts it to radians.',
  pre: args([is_num]),
  body: norm(0, 360, 0, 2 * pi)
});

let rad_to_deg = defn({
  name: 'rad_to_deg',
  doc: 'Given an angle measurement in radians, converts it to degrees.',
  pre: args([is_num]),
  body: norm(0, 2 * pi, 0, 360)
});

export default ns(L.Num, {
  abs, add, ceil, dec, div, div_by, floor, gt, gte, hypot, inc, is_between,
  is_infinity, is_in_range,
  is_natural, is_negative, is_nonzero, is_positive, is_positive_int, 
  is_even, is_odd, lt, lte, max, min, mod, mult, num: num_, pow, pow_by, precise, random, 
  random_int, round, sqrt, cbrt, sub, sub_by, sum_of_squares, trunc,
  clamp, lerp, norm, wrap, rad_to_deg, deg_to_rad,
  cos, sin, tan, acos, asin, atan, ln, log2, log10,
  pi, e, sqrt2, sqrt1_2, ln2, ln10, log2e, log10e
});

