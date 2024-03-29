//////////////////// Control flow: conditionals, iterations, etc.
// This namespace, `Flow`, contains functions that provide for
// more ergonomic functional control flow. Many of these will have
// an additional layer of parsing magic applied to them:
// - `when`

import P from './preds.js';
import S from './spec.js';
import NS from './ns.js';
import Fn from './fns.js';

let {defn} = Fn;
let {bool, is_fn, is_any, is_int} = P;
let {rename, tup, args} = S;
let {ns} = NS;

let when = defn({
  name: 'when',
  doc: '`when` is the core conditional form of Ludus. It is like a normal function (and the function part behaves exactly as `bool`), but it must be followed by two conditional expressions: `when({condition}) ? {if_true} : {if_false}`. Unlike other Ludus conditional forms, the `{if_true}` and `{if_false}` expressions are only executed when the condition passed to `when` is, respectively, `truthy` and `falsy`.',
  body: x => x == undefined || x === false ? false : true
});

let clause = rename('clause', tup(is_fn, is_fn));

let cond = defn({
  name: 'cond',
  doc: '`cond` takes value and a series of clauses (at least one). Each clause is an array of two items, a predicate function and an executive function. If the predicate returns a truthy value when passed to the predicate, the executive function is called with the predicate. Note that both predicate and executive functions must be unary. E.g. `cond(1, [eq(0), inc(1)], [eq(1), inc(2)]); //=> 3`.',
  pre: args([is_any, clause]), 
  body: (value, ...clauses) => {
    for (let [pred, exec] of clauses) {
      if (bool(pred(value))) return exec(value);
    }
    return undefined;
  }
});

let fcond = defn({
  name: 'fcond',
  doc: '`fcond` takes a series of clauses, and returns a unary function that passes its value to the clauses, as `cond`.',
  pre: args([clause]),
  body: (...clauses) => Fn.fn('fcond<...>', (x) => cond(x, ...clauses))
});

let always = defn({
  name: 'always',
  doc: '`always` always returns true.',
  body: () => true
});

/* Drop this for now; we actually don't allow default values in Ludus
Leave this in for posterity, though?
let make = defn({
  name: 'make',
  doc: 'The Ludus equivalent of a `let` expression in Lisp. (`make` is the Logo name for this operation.) Allows for fully functional programming. In place of `let` and `return` statements, takes a function literal with default paramters as the bindings, and returns the value of the expression after the arrow. Commas may be used put expressions together, returning the value of the last one. E.g. `make((x = 2, y = 3) => mult(x, y)) //=> 6.`',
  pre: args([is_fn]),
  body: (fn) => fn()
});
*/

let just = defn({
  name: 'just',
  doc: 'Takes a value and returns a function that returns that value when called. (Also known as a `thunk`.)',
  body: (x) => Fn.fn(`just<${x}>`, () => x)
});

let repeat = defn({
  name: 'repeat',
  doc: 'Takes a number, `count`, and a function with side effects. Calls that function `count` times, passing the `count` into the function as an argument. Returns the result of the last call. Note that this is eager; for lazy evaluation, use `Lazy.repeatedly`.',
  pre: args([is_int, is_fn]),
  body: (count, fn) => {
    let result = undefined;
    for (let i = 0; i < count; i++) {
      result = fn(i);
    }
    return result;
  }
});

export default ns({
  name: 'Flow', 
  members: {when, clause, cond, fcond, just, repeat, always}
});
