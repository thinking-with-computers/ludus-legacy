//////////////////// Lazy sequences, or fun with generators
// These conceptually belong with seqs, and some must be in `prelude`
// as they use generator functions to produce their possibly infinite laziness.
// In prinicple, `lazy` can be used to create arbitrarily complex generators.
// In practice, we'll use generators and `while` for the core lazy sequences as
// they are faster.
// TODO: reconsider the n-ary overloads on these, as it becomes pretty easy to
//        accidentally create infinite lists. Given the importance of the
//        the function called `repeatedly` below in early stages of learning,
//        that's dangerous.

import Seq from './seqs.js';
import P from './preds.js';
import Fn from './fns.js';
import Spec from './spec.js';
import NS from './ns.js';
import Num from './nums.js';

let {defn} = Fn;
let {args, or} = Spec;
let {is_any, is_fn, is_int, is_coll} = P;
let {seq, is_empty, count, first, rest}= Seq;
let {is_infinity} = Num;
let {ns} = NS;

let gen = defn({
  name: 'gen',
  doc: 'Creates a generator. It takes an `init`ial value, two or three unary functions: `step`, `done`, and, optionally, `map`. `step` should return the series of values, first by taking the `init` value, and then, the previous value. `done` should return `true` once the generator should terminate. `map` is optionally applied to the value before it is yielded into the generator. It is useful if your generator needs to keep track of state that is more complex than the values you wish to appear in the generator.',
  pre: args([is_any, is_fn, is_fn], [is_any, is_fn, is_fn, is_fn]),
  body: [
    (init, step, done) => gen(init, step, done, (x) => x),
    (init, step, done, map) => (function*() {
      let value = init;
      while(!done(value)) {
        yield map(value);
        value = step(value);
      }
    })
  ]
});

let lazy = defn({
  name: 'lazy',
  doc: 'Creates a lazy, possibly infinite, sequence. It takes an `init`ial value, two or three unary functions: `step`, `done`, and, optionally, `map`. `step` should return the series of values, first by taking the `init` value, and then, the previous value. `done` should return `true` once the sequence should terminate. `map` is optionally applied to the value before it is yielded into the sequence. It is useful if your lazy sequence needs to keep track of state that is more complex than the values you wish to appear in the sequence.',
  pre: args([is_any, is_fn, is_fn], [is_any, is_fn, is_fn, is_fn]),
  body: [
    (init, step, done) => lazy(init, step, done, (x) => x),
    (init, step, done, map) => seq(gen(init, step, done, map)())
  ]
});

let range = defn({
  name: 'range',
  doc: 'Creates a sequence of numbers, in order. With one argument, it counts up from 0 to the maximum (exclusive) in steps of +1. With two arguments, it counts up from the start to the max in steps of +1. With three, it counts up to max from start, in steps of whatever you give it.',
  pre: args([is_int], [is_int, is_int], [is_int, is_int, is_int]),
  body: [
    (max) => range(0, max, 1),
    (start, max) => range(start, max, 1),
    (start, max, step) => {
      let span = max - start;
      let seq_size = Math.ceil(span / step);
      let sequence = lazy(start, x => x + step, x => x >= max);
      sequence.size = Math.max(0, seq_size);
      return sequence;
    }
  ]
});

let cycle = defn({
  name: 'cycle',
  doc: 'Creates a lazy, possibly infinite, sequence of values created by cycling through the members of a sequence. E.g., `cycle([1, 2, 3]); //=> 1, 2, 3, 1, 2, 3, 1, 2, ...`. With two arguments, the first argument specifies how many times to execute the cycle.',
  pre: args([is_coll], [or(is_int, is_infinity), is_coll]),
  body: [
    (seqable) => cycle(Infinity, seqable),
    (size, seqable) => {
      let seq_size = count(seqable);
      let cycle_size = P.is_some(seq_size) ? size * seq_size : undefined;
      let sequence = seq((function*() {
        let iter = 0;
        while(size > iter) {
          yield* seq(seqable);
          iter += 1;
        }
      })());
      sequence.size = cycle_size;
      return sequence;
    }
  ]
});

// TODO: Should this be a transducer? Probably.
let interleave = defn({
  name: 'interleave',
  doc: 'Given a list of seqables, produce a `seq` that is generated by taking the first element of each, then the second, until one of them is empty. E.g., `inteleave([1, 2], \'ab\'); //=> Seq( 1, a, 2, b )`.',
  pre: args([is_coll]),
  body: (...seqables) => {
    count(seqables[0]) //?
    let seq_size = Math.min(...seqables.map((s) => count(s))) * count(seqables);
    let seqs = seqables.map((s) => seq(s));
    let sequence = seq((function*() {
      while(true) {
        if (seqs.some((s) => is_empty(s))) return;
        let firsts = seqs.map((s) => first(s));
        yield* firsts;
        seqs = seqs.map((s) => rest(s));
      }
    })());
    sequence.size = isNaN(seq_size) ? undefined : seq_size;
    return sequence;
  }
});

let repeat = defn({
  name: 'repeat',
  doc: 'Produces a possibly infinite `seq` that is just the same value, repeated over and over again. With two arguments, the first is the number of times to repeate `value`. E.g., `repeat(4, \'foo\'); //=> Seq( \'foo\', \'foo\', \'foo\', \'foo\' )`.',
  pre: args([is_any], [or(is_int, is_infinity), is_any]),
  body: [
    (value) => repeat(Infinity, value),
    (count, value) => {
      let sequence = seq((function*() {
        let iter = 0;
        while(count > iter) {
          yield value;
          iter += 1;
        }
      })());
      sequence.size = count;
      return sequence;
    }
  ]
});

let repeatedly = defn({
  name: 'repeatedly',
  doc: 'Takes a nullary function, presumably with side effects, and calls that function over and over again. With one argument, it will call the fucntion infinitely. With two, it will call the function `count` times.',
  pre: args([is_fn], [or(is_int, is_infinity), is_fn]),
  body: [
    (fn) => repeatedly(Infinity, fn),
    (count, fn) => {
      let sequence = seq((function*() {
        let iter = 0;
        while(count > iter) {
          yield fn();
          iter += 1;
        }
      })());
      sequence.size = count;
      return sequence;
    }
  ]
});

export default ns({name: 'Lazy',
  members: {cycle, gen, interleave, lazy, range, repeat, repeatedly}});