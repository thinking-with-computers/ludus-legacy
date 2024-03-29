//////////////////// Predicates (signed)
// Signed predicates: new predicates, as well as signed versions of unsigned
// predicates.

import L from './deps.js';
import S from './spec.js';
import Fn from './fns.js';
import NS from './ns.js';
import Type from './type.js';

let {partial, fn} = Fn;
let P = L.Pred;
let {args} = S;
let {ns} = NS;

///// Signed versions of old functions

let bool = fn({
  name: 'bool',
  doc: 'Coerces a value to boolean `true` or `false`: returns false if a value is `false` or `undefined`. Otherwise returns true.',
  body: P.bool
});

let is_any = fn({
  name: 'is_any',
  doc: 'Always returns true: could be anything. Otherwise returns false.',
  body: P.is_any
});

let is_undef = fn({
  name: 'is_undef',
  doc: 'Returns true if the passed value is undefined. Otherwise returns false.',
  body: P.is_undef
});

let is_some = fn({
  name: 'is_some',
  doc: 'Returns true if the passed value is *not* undefined. Otherwise returns false.',
  body: P.is_some
});

let is_str = fn({
  name: 'is_str',
  doc: 'Returns true if the passed value is a string. Otherwise returns false.',
  body: P.is_str
});

let is_num = fn({
  name: 'is_num',
  doc: 'Returns true if the passed value is a number. Otherwise returns false.',
  body: P.is_num
});

let is_int = fn({
  name: 'is_int',
  doc: 'Returns true if the value passed is an integer. Otherwise returns false.',
  body: P.is_int
});

let is_bool = fn({
  name: 'is_bool',
  doc: 'Returns true if the value passed is a boolean. Otherwise returns false.',
  body: P.is_bool
});

let is_fn = fn({
  name: 'is_fn',
  doc: 'Returns true if the value passed is a function. Otherwise returns false.',
  body: P.is_fn
});

let is_js_obj = fn({
  name: 'is_js_obj',
  doc: 'Returns true if the value passed is an object, according to JavaScript. Otherwise returns false. NB: All collections are objects: object literals, but also arrays, vectors, lists, etc.',
  body: P.is_js_obj
});

let is_obj = fn({
  name: 'is_obj',
  doc: 'Tells if a value is an object in Ludus. For the most part, this means object literals: it excludes any JS objects that are constructed using `new`. Typed Ludus constructs (e.g., specs, types, lists, and so on) are not objects.',
  body: P.is_obj
});

let is_iter = fn({
  name: 'is_iter',
  doc: 'Returns true if the value passed in conforms to the JS iterable protocoP. Otherwise returns false. It does not do this check relentlessly: it returns true if the value has a `function` at `[Symbol.iterator]`.',
  body: P.is_iter
});

let is_sequence = fn({
  name: 'is_sequence',
  doc: 'Returns true if the value passed in is a sequence: an iterable collection. (Strings are iterable, but they are not sequences.) Otherwise returns false.',
  body: P.is_sequence
});

let is_sequence_of = fn({
  name: 'is_sequence_of',
  doc: 'Takes a predicate and a value and returns true if the value is a sequence and each member of the sequence passes the preidcate. (Strings are iterable but not sequences.) Otherwise returns false.',
  pre: args([is_fn], [is_fn, is_any]),
  body: [
    (pred) => partial(is_sequence_of, pred),
    (pred, xs) => {
      if (!is_sequence(seq)) return false;
      for (let x of xs) {
        if (!bool(pred(x))) return false;
      }
      return true;
    }
  ]
});

let is_arr = fn({
  name: 'is_arr',
  doc: 'Tells if something is an array.',
  body: P.is_arr
});

let is_coll = fn({
  name: 'is_coll',
  doc: 'Tells if something is a collection: an object or anything iterable that is not a string.',
  body: P.is_coll
});

let not = fn({
  name: 'not',
  doc: 'Takes a function, and returns a function that is the negation of its boolean value.',
  pre: args([is_fn]),
  body: P.not
});

let and = fn({
  name: 'and',
  doc: 'Takes a single function, or a list of two or more functions. With a list of functions, it returns a function that passes its args to each of the list of functions, and returns `true` only if every result is truthy. With a single function, it returns a function that takes a list of functions, and is the `and` of that function and the passed list.',
  pre: args([is_fn]),
  body: [
    (x) => partial(and, x),
    (x, y, ...z) => P.and(x, y, ...z) 
  ]
});

let or = fn({
  name: 'or',
  doc: 'Takes one or more functions. Returns a function that passes its args to each of the list of functions, and returns `true` if any result is truthy.',
  pre: args([is_fn]),
  body: [
    (x) => partial(or, x),
    (x, y, ...z) => P.or(x, y, ...z)
  ]
});

let maybe = fn({
  name: 'maybe',
  doc: 'Takes a predicate function and returns a predicate function that returns true if the value passed passes the predicate function, or if the value is undefined.',
  pre: args([is_fn]),
  body: (pred) => fn(`maybe<${pred.name || 'anon.'}>`, or(is_undef, pred))
});

let is_key = fn({
  name: 'is_key',
  doc: 'Tells if a value is a valid key for a property on an object.',
  body: P.is_key
});

let is = fn({
  name: 'is',
  doc: 'Tells if a value is of a particular type. Partially applied, it returns a unary function that tests if its argument conforms to type.',
  pre: args([P.is(Type.t)], [P.is(Type.t), is_any]),
  body: [
    (type) => partial(is, type),
    (type, value) => P.is(type)(value)
  ]
});

let has = fn({
  name: 'has',
  doc: 'Tells if an object has some value set at a particular key. Note that it will return `true` if a particular object has had a key explicitly set to `undefined`. Only tests own properties.',
  pre: args([is_key], [is_key, is_any]),
  body: [
    (key) => fn(`has<${key}>`, (obj) => has(key, obj)),
    (key, obj) => 
      obj != undefined 
      && obj.hasOwnProperty(key) 
      && obj[key] != undefined
  ]
});

/*
Make these specs, not predicates.
Note the presence of "explain"; these really do have to be specs.
let at = defn({
  name: 'at',
  doc: 'Returns a predicate function that tests if particular property of an object passes a predicate. Takes a key and a predicate, and returns a predicate function that will return true if the value passed in has a value that passes the predicate at the specified key. `at` tests properties on anything that may hold properties, including `string`s and `sequence`s.',
  pre: args([is_key, is_fn]),
  body: (key, pred) => {
    let name = `at<${key}: ${pred.name}>`;
    let body = (obj) => obj != undefined && bool(pred(obj[key]));
    return defn({name, body, explain: at});
  }
});

let dict = defn({
  name: 'dict',
  doc: 'Returns a predicate function that tests if all properties of an object pass a particular predicate. This type of data structure is often called a "dictionary." `dict`s must be associate objects.',
  pre: args([is_fn]),
  body: (pred) => defn({
    name: `dict<${pred.name || 'anon.'}>`,
    explain: dict,
    body: (obj) => {
      if (!is_assoc(obj)) return false;
      for (let key of Object.keys(obj)) {
        if (!bool(pred(obj[key]))) return false;
      }
      return true;
    }
  })
});
*/

NS.defmembers(Fn, {and, or, not});

export default ns({
  name: 'Pred',
  members: {
    bool, is_any, is_undef, is_some, 
    is_str, is_num, is_int, is_bool,
    is_fn, is_js_obj, is_obj, is_iter, is_sequence, is_coll,
    is_sequence_of, is_arr,
    not, and, or, maybe, is_key, has, is
  }
});
