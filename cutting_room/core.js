// our library dependencies
// record and tuple for value-equal compound data structures
import {Record} from './record-tuple/record.js';
import {Tuple} from './record-tuple/tuple.js';

export let imports = {Record, Tuple};

/////////////////// Errors & handling
// throws an error as a function rather than a statement
// TODO: get these working more robustly
let raise = (error, message) => { throw new error(message) };

// sends its messages to the error console
let report = (...msgs) => {
  msgs.forEach(msg => console.error(msg));
};

// converts a function that throws to one that returns its error
let bound = fn => (...args) => {
  try {
    return fn(...args);
  } catch (e) {
    return e;
  }
};

export let errors = {raise, report, bound};

/////////////////// Absolute core value functions
///// booleans
// better boolean: returns false only when an object is nullish or false
// js coerces many values (0, '', etc.) to false
// NB: this is a foundational function
let boolean = x => x == undefined || x === false ? false : true;

/////////////////// Functions
///// Utils
// renames a function
// NB: this is a foundational function
let rename = (name, fn) => Object.defineProperty(fn, 'name', {value: name});

///// Function application
// calls a function with the arguments passed in
// NB: this is a foundational function
let call = (fn, ...args) => fn(...args);

// calls a function with the arguments expressed as an iterable
let apply = (fn, args) => fn(...args);

// lisp-like, takes an interable with a function in the first
// position and uses the remainder as arguments
let ap = ([fn, ...args]) => fn(...args);

// TODO: research behavior where `partial` + `n_ary` where calling
//    a partial function with no args returns the partial function
//    e.g., get('foo')() ~= get('foo')()()() ~= get('foo')
//    this is because of how `partial`'s handle nullary calls
//    with no new args, it calls with the original args, which dispatches
//    to the same arity as the first call
// partial: apply a function partially
// NB: this is a foundational function
let partial = (fn, ...args1) => {
  let partial_name = 
    `${fn.name}<partial (${args1.map(x => x.toString()).join(', ')})>`;
  return rename(partial_name, 
    (...args2) => args2.length 
      ? call(fn, ...args1, ...args2) 
      : raise(Error, `Partially applied functions must be called with at least 1 argument. You called ${partial_name} with 0 args.`));
  };

///// Function dispatch

// n_ary creates a function that dispatches on the number of arguments
// note that this throws if the arity does not match any of those passed in
// n_ary cannot be used to create indefinitely variadic functions:
// no args, no rest values
// TODO: consider if this should change, passing extra args to the clause with
//       the highest arity
// TODO: throw an error if the function has multiple overloads on the same arity
// NB: this is a foundational function
let n_ary = (name, ...fns) => {
  let arity_map = fns.reduce((map, fn) => Object.assign(map, {[fn.length]: fn}), {});

  let match_arity = (...args) => {
    let arity = args.length;
    let match = arity_map[arity];

    return match 
      ? match(...args) 
      : raise(Error, `Wrong number of arguments to ${name}. It takes ${Object.keys(arity_map).join(' or ')} argument(s), but received ${args.length}.`) 
  };

  return rename(name, match_arity);

};

///// Multimethods
// multimethods allow for the calling of different functions based on
// the return value of a dispatching function

// a default method for multimethods
// just raises an error
// not exported
let method_not_found = (name) => (...args) =>
  raise(Error, 
    `No method found in multimethod ${name} with arguments (${args.map(a => a.toString()).join(', ')}).`)

// make a multimethod
// a multimethod dispatches on the value returned from the function `on`
// the optional third argument is the default function
// if no function is supplied, the default is to raise an error
// TODO: consider if multimethods should automagically convert objects
//    to records and arrays to tuples for value equality
// TODO: this would require developing recursive conversion, and also
//    reworking the conversion algorithms
let multi_tag = Symbol('ludus/multimethod');
let multi = (name, on, not_found = method_not_found(name)) => {
  let map = new Map();

  let dispatch = (...args) => {
    let fn = map.get(on(...args));
    return boolean(fn)
      ? fn(...args)
      : not_found(...args);
  };

  let set = (value, fn) => { map.set(value, fn); };
  let has = (value) => map.has(value);
  let methods = () => map.entries();
  let del = (value) => map.delete(value);

  return rename(name, 
    Object.defineProperty(dispatch, multi_tag, 
      {value: {set, has, methods, delete: del}}));
};

// adds a method (function) to a multimethod
// TODO: consider raising an error if the value already corresponds to a method
let method = (multimethod, value, fn) => {
  multimethod[multi_tag].set(value, fn);
  return multimethod;
};

// lists the methods of a multimethod
let methods = (multimethod) => multimethod[multi_tag].methods();

// tells if a multimethod has a method defined for a particular value
let has_method = (multimethod, value) => multimethod[multi_tag].has(value);

// deletes a method from a multimethod
let delete_method = (multimethod, value) => 
  multimethod[multi_tag].delete(value);

///// Function combinators

// compose composes two functions
let compose = (f1, f2) => (...args) => f1(f2(...args));

// forward forwards the result of one function to the next
// reverses the argument order of compose
let forward = (f1, f2) => compose(f2, f1);

// comp composes all functions passed as arguments
let comp = (...fns) => rename('composed', pipe(fns.reverse()));

// creates a pipeline of functions
// the returned pipeline function takes a single argument
// if an error is thrown, it catches the error, reports it, and re-throws it
// function pipelines are unary: even the first function must be unary
let pipe = (first, ...fns) => rename('pipeline', (...args) => {
  let result;
  try {
    result = first(...args);
  } catch (e) {
    report(`Error in function pipeline while calling ${fn.name} with (${args.map(arg => arg.toString()).join(', ')}).`);
    throw e;
  }

  for (let fn of fns) {
    try {
      result = fn(result);
    } catch (e) {
      report(`Error in function pipeline while calling ${fn.name} with ${result}.`);
      throw e;
    }
  }
  return result;
});

// pipe_some builds a function pipeline that short-circuits 
// it short circuits on its first undefined result and returns undefined
// it has the same error handling as pipe
let pipe_some = (...fns) => rename('pipeline', x => {
  for (let f of fns) {
    try {
      x = f(x);
      if (x == undefined) return undefined;
    } catch (e) {
      report(`Error thrown in function while calling ${f.name} with ${x}.`);
      throw e;
    }
  }
  return x;
});

///// loop & recur
// loop & recur allow for tail-call-optimized single-recursion
// no mutual recursion, which frankly Ludus users are unlikely to need
// NB: Clj's loop & recur don't allow for mutual recursion

// recur is a proxy for a tail-recursive call inside a `loop`ed function
// it returns a special object that encapsulates arguments
// it has two symbol-keyed properties
// it also has a proxy that throws errors when anything else is accessed
// this allows for errors to be thrown when `recur` is used not in tail position
// in a function wrapped by `loop`
// TODO: investigate if this is fast enough?--the proxy slows things down
//   and `recur` is going to be used in tight loops
let recur_tag = Symbol('ludus/recur');
let recur_args = Symbol('ludus/recur/args');
let recur_handler = {
  get (target, prop) {
    if (prop === recur_tag || prop === recur_args) return target[prop];
    throw Error('recur must only be used in the tail position inside of loop.');
  },
  apply() {
    throw Error('recur must only be used in the tail position inside of loop.');
  }
};

let recur = (...args) => new Proxy({
  [recur_tag]: true, [recur_args]: args,
  [Symbol.toPrimitive] () {
    throw Error('recur must only be used in the tail position inside of loop.');
  },
  [Symbol.toString] () {
    throw Error('recur must only be used in the tail position inside of loop.');
  }
}, recur_handler);

// loop wraps a function that knows what to do with
// the optional second argument is the max number of recursive loops
// default value: 1,000,000
let loop = (fn, max_iter = 1000000) => {
  let looped = (...args) => {
    let result = fn(...args);
    let iter = 0;

    while (result[recur_tag] && iter < max_iter) {
      result = fn(...result[recur_args]);
      iter += 1;
    }

    if (iter >= max_iter) 
      throw Error(`Too much recursion in ${fn.name || 'anonymous function'}.`)
    
      return result;
  };

  return Object.defineProperties(looped, {
    name: {value: `${fn.name || 'anonymous'}<looped>`},
    length: {value: fn.length}
  })
};

///// error handling: handle
// handle wraps a function with try/catch to make error handling
// more graceful and informative
// TODO: improve this
let handle = (name, body) => rename(name,
  (...args) => {
    try {
      return body(...args);
    } catch (e) {
      let msg = `${e.name} thrown in ${name} called with (${args.map(x => x.toString()).join(', ')})`;
      let msgs = e.msgs || [];
      
      msgs.push(msg);
      console.error(msg);
      throw e;
    }
  });

///// function definition
// fn wraps a function in bare ludus bells & whistles:
// handle, n_ary, and loop
// TODO: consider skipping "handle" in production
// TODO: consider making the user explicitly add `loop`/`recur` handling 
//   (i.e, `defrec`)
// TODO: consider changing the order of `loop`/`handle`/`n_ary` for better
//   performance?
let fn = n_ary('fn',
  (body) => fn(body.name || 'anonymous', body),
  (name, body) => {
    switch (type(body)) {
      case types.Function:
        return rename(name,
          loop(handle(name, body)));
      case types.Array:
        return rename(name, 
          loop(handle(name, n_ary(name, ...body))));
    }
  }
);

// pre_post wraps a function with predicates that evaluate
// the arguments and return values
// evaluation of predicates is ludus-truthy and -falsy
// predicates are n-ary
// short circuits on first error
// dispatches error message to `explain`
// TODO: reconsider short-circuiting: accumulate all failures?
let pre_post = (pre, post, body) => rename(body.name, (...args) => {
    let pass_pre = true;
    for (let pred of pre) {
      pass_pre = pass_pre && boolean(pred(...args));
      if (!pass_pre) throw Error(`Arguments to ${body.name} did not conform to spec.\n${explain(pred, args)}`);
    }

    let result = body(...args);

    let pass_post = true;
    for (let pred of post) {
      pass_post = pass_post && boolean(pred(result));
      if (!pass_post) throw Error(`Returns from ${body.name} did not conform to spec.\n${explain(pred, result)}`);
    }

    return result;
  });

// and, finally,

///// defn
// defn integrates all the handy ludus function definition schemes
// to fn, it adds pre_post, as well as arbitrary metadata
// to work, it requires:
// - a name :: string
// - a body :: function | array<function>
// - if pre or post are present, they be iterable<function>
// questions:
// - how to handle the multiple options of args to defn? (probably this needs to be a multimethod; alternately, be less permissive than clj)
// - alternately, don't use positional arguents?
// TODO: devise a method of avoiding pre_post in "production"
let defn = (attrs) => {
  let {name, body, ...meta} = attrs;
  let out = pre_post(meta.pre || [], meta.post || [], fn(name, body));

  return Object.defineProperty(
    rename(name, out), 
    'meta', 
    {value: {name, body, ...meta}});
};

///// other useful functional manipulations

// once runs a function exactly once, and afterwards returns the result
// (necessary for seq)
let never = Symbol('ludus/never');
let once = (fn) => {
  let result = never;
  return rename(fn.name, (...args) => {
    if (result === never) result = fn(...args);
    return result;
  });
};

// identity
let id = x => x;

// do nothing
let no_op = () => {};

export let functions = {loop, recur, call, apply, ap, partial, n_ary, id, no_op, once, forward, compose, comp, pipe, pipe_some, multi, method, has_method, methods, delete_method, rename, fn, handle, pre_post, defn };

//////////////////// Working with values
///// undefined
// returns true of something is undefined or null
let is_undefined = x => x == undefined;
let is_undef = is_undefined;

// determines what to do when a value is nullish
let when_undefined = n_ary('when_undefined',
  (if_undef) => partial(when_undefined, if_undef),
  (if_undef, value) => value == undefined ? if_undef : value
);
let when_undef = when_undefined;

///// Objects & records
// At least to start, Ludus has no notion of values other than
// bare "records": object literals with only string keys.
// This simplifies a great deal.
// In addition, this means that Ludus's type system is incredibly
// simple. It should be sufficient for at least the core system.

// get: safer property access
// never throws
// returns null if something is absent
// works for arrays and objects, unlike the equivalent in clj
// ludus will discourage (prevent) direct property access
// allows for default values if property is null
// NB: This is a foundational functions
// NB: note differences from clj property access
let get = n_ary('get',
  (key) => partial(get, key),
  (key, obj) => get(key, undefined, obj),
  (key, if_absent, obj) => {
    if (obj == undefined) return if_absent;

    let value = obj[key];
    
    if (value == undefined) return if_absent;
    
    return value;
  }
);

// has: safer property existence testing
// never throws
// returns false if a property is undefined OR is explicitly null
// TODO: consider if it should only return false on undefined props
let has = n_ary('has',
  (key) => partial(get, key),
  (key, obj) => boolean(get(key, obj))
);

// get_in: safe deep property access
// object-first
// keys (strings or numbers)
let get_in = n_ary('get_in',
  (obj) => partial(get_in, obj),
  (obj, keys) => get_in(obj, undefined, keys),
  (obj, if_absent, keys) => keys.reduce((o, k) => get(k, o, if_absent), obj)
);

export let values = {boolean, is_undefined, when_undefined, is_undef, when_undef, get, has, get_in}

//////////////////// Types
// Ludus's type system is orthogonal to Javascript's
// We know about a few builtin JS types, as below.
// We can learn about arbitrary additional JS types, but
// Ludus is not optimized for them: Ludus does not walk the
// inheritance tree, although it could be made to do so with
// clever prototypes.
//
// Everything else is object literal/records with
// string keys, and a type tag that's a string: 'ludus/type/tag'
// Types themselves Records that hold symbols.

///// Constructed types

// A mapping of constructor names/type names to types
// to be accessed as types.String in multimethods
export let type_map = {
  String: Symbol('ludus/type/string'),
  Number: Symbol('ludus/type/number'),
  Boolean: Symbol('ludus/type/boolean'),
  Symbol: Symbol('ludus/type/symbol'),
  Function: Symbol('ludus/type/function'),
  Array: Symbol('ludus/type/array'),
  undefined: Symbol('ludus/type/undefined'),
  Object: Symbol('ludus/type/object'),
  Map: Symbol('ludus/type/map'),
  Set: Symbol('ludus/type/set'),
  unknown: Symbol('ludus/type/unknown'),
  Record: Symbol('ludus/type/record'),
  Tuple: Symbol('ludus/type/tuple')
};

// a plain string type tag
// use slashes so you can't use normal property access
let type_tag = 'ludus/type';

// a Map containing a mapping of builtin constructors to Ludus types
let constructors = new WeakMap([
  [String, type_map.String],
  [Number, type_map.Number],
  [Boolean, type_map.Boolean],
  [Symbol, type_map.Symbol],
  [Function, type_map.Function],
  [Array, type_map.Array],
  [Object, type_map.Object],
  [Map, type_map.Map],
  [Set, type_map.Set],
  [Record, type_map.Record],
  [Tuple, type_map.Tuple]
]);

// registers a constructor in the constructor map
// does not add it to the types object, however:
// references to the constructor tag have to be managed
let register_constructor = (constructor) => {
  if (constructors.has(constructor)) return constructors.get(constructor);

  let tag = Symbol(`ludus/type/${constructor.name}`);
  constructors.set(constructor, tag);
  return tag;
};

///// Ludus types
// TODO: finish designing & implementing this
// Ludus types are unique Records, each having the shape
// {'ludus/type': Symbol}.
// They also have specs, which we keep track of in a map.
let type_specs = new WeakMap();

let data = (name, spec) => {
  let tag = Symbol(`ludus/type/${name}`),
    type = Record({[type_tag]: tag});

  type_specs.set(type, spec);

  return type;
};

// create an object of a given type
// TODO: automagically use `new` if the type is a constructor
let create = (type, obj) => {
  // check spec
  // if (!check(type_specs.get(type), obj)) throw
  return {[type_tag]: type, ...obj};
};

///// Getting types
// a function to get the type of a thing
let type = (x) => {
  // base case: null or undefined
  if (x == undefined) return type_map.undefined;

  // next: check if the object has a type tag
  let tagged_type = get(type_tag, x);
  if (boolean(tagged_type)) return tagged_type;

  let constructed_type = constructors.get(x.constructor);
  if (boolean(constructed_type)) return constructed_type;

  // finally, return an unknown type so users can extend the type system
  return type_map.unknown;
};

export let types = { type, create, data, register_constructor, map: type_map, ...type_map };

//////////////////// Sequences
// Sequences allow for abstracted lazy iteration across everything
// (well, almost everything): Arrays, Maps, Sets, Objects, Strings,
// generators, etc.

// TODO: like whoa: clean this section up and document it better
// Do this soon! Before, even, working on spec, since getting seqs
// clean and right is important for nearly all the things

// TODO: I believe the immer `produce` bits in conj are actually running
// in O(n**2), which really isn't great. Make `conj` work on
// seqs of seqs (and then carry that optimization forward into
// transducers)

// obj_gen: creates a generator that iterates through the keys of an object
// only covers string keys
// only outputs own properties
// is lazy
// not exported
let obj_gen = function* (obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) yield [key, obj[key]];
  }
};

// is_iterable: tells is someething is iterable
let is_iterable = x => x != null && typeof x[Symbol.iterator] === 'function';

// iterate: creates an iterator over a seq
let iterate = (lazy) => {
  let first = lazy.first();
  let rest = lazy.rest();

  return {
    next () {
      if (rest === undefined) return {done: true}
      let next = {value: first, done: rest === undefined};
      first = rest.first();
      rest = rest.rest();
      return next;
    }
  }
}; 

// Seq: a ludus datatype
// TODO: remove this dependency, although conform to the protocol
let Seq = data('Seq');
let seq_tag = Symbol('ludus/seq');

// make_seq: takes anything that conforms to the iteration protocol
// and returns a seq over it
// seqs themselves conform to the iteration protocol
// they also have `first` and `rest` methods
// they are immutable, stateless, and lazy
let make_seq = (iterator) => {
  let current = iterator.next();
  let rest = once(() => current.done ? undefined : make_seq(iterator));
  let first = () => current.done ? undefined : current.value;
  let out = {
    [type_tag]: seq_tag,
    [Symbol.iterator] () {
      return iterate(out);
    },
    rest,
    first
  };
  return out;
};

// seq: creates a (lazy, immutable) seq over a "seqable"
let seq = (seqable) => {
  // if it's already a seq, just return it
  if (get(type_tag, seqable) === seq_tag) return seqable;
  // if it's undefined, return an empty seq
  if (seqable == undefined) return seq([]);
  // if it's iterable, return a seq over a new iterator over it
  // strings, arrays, Maps, and Sets are iterable
  if (is_iterable(seqable)) return make_seq(seqable[Symbol.iterator]());
  // if it's a record (object literal) return a seq over an object generator
  if (is_object(seqable)) return make_seq(obj_gen(seqable));
  // otherwise we don't know what to do; throw your hands up
  throw Error(`${seqable} is not seqable.`);
};

// 
// TODO: decide if cons_gen should add the new element to the beginning or end
// makes sense to do it at the end for finite seqs
// but not for infinite ones
// problem: we cannot tell if a lazy seq is finite or not
// consideration: we're not actually in lisp-world where the singly-linked
//    list is our normative datatype
let cons_gen = function* (value, seq) {
  yield value;
  yield* seq;
};

// before: grows a seq by adding a value to the beginning
// consumes a seqable, returns a seq
// runs in O(1) for all seqs
let before = function* (seqable, value) {
  // get our seq first, so that if it's not actually seqable, we throw early
  let seq_ = seq(seqable);
  yield value;
  yield* seq_;
};

// after: grows a seq by adding a value to the end
// consumes a seqable, returns a seq
// runs in O(1) for all seqs
// NB: if you add something at the end of an infinite seq, 
//    it will never arrive
let after = function* (seqable, value) {
  yield* seq(seqable);
  yield value;
};

let first = (seq_) => seq(seq_).first();

let rest = (seq_) => seq(seq_).rest();

let cons = (value, seq_) => seq(cons_gen(value, seq_));

// conj: clj's conj as a multimethod
// This is a core function which will get called in tight loops
// TODO: consider optimizing this using prototype-based dispatch
//    But only after finishing proof-of-concept
//    Dispatch is premature optimization
// TODO: replace this with an operation that consumes and returns
//    a sequence, not a multimethod: as after, above
//    NO: fix the implementations to run in constant time
let conj = multi('conj', type, () => null)
method(conj, type_map.Array, 
  (arr, value) => produce(arr, draft => { draft.push(value); }));
method(conj, type_map.Object,
  (obj, [key, value]) => produce(obj, draft => { draft[key] = value; }));
method(conj, type_map.String,
  (str_1, str_2) => str_1.concat(str_2));
method(conj, type_map.Set,
  (set, value) => produce(set, draft => { draft.add(value); }));
method(conj, type_map.Map,
  (map, [key, value]) => produce(map, draft => draft.set(key, value)));
method(conj, Seq,
  (seq_, value) => seq(cons_gen(value, seq_)));
method(conj, type_map.null,
  (_, value) => conj(seq(null), value));

let empty = multi('empty', type, () => undefined);
method(empty, type_map.Array, () => []);
method(empty, type_map.Object, () => ({}));
method(empty, type_map.String, () => '');
method(empty, type_map.Set, () => new Set());
method(empty, type_map.Map, () => new Map());
method(empty, Seq, () => seq(null));
method(empty, type_map.undefined, () => undefined);

let count = multi('count', type, () => undefined);
method(count, type_map.Array, arr => arr.length);
method(count, type_map.String, str => str.length);
method(count, type_map.Set, set => set.size);
method(count, type_map.Map, map => map.size);
method(count, type_map.undefined, () => 0);
method(count, type_map.Object, obj => into([], obj).length);

let is_empty = seq_ => rest(seq(seq_)) === undefined;

// generate: a handy wrapper for a generator function
// returns a lazy iterator over the generator
// TODO: add splats and `recur` to this to allow more robust generation
let generate = (init, step, done) => make_seq((function*() {
  let value = init; //=
  while(!done(value)) {
    yield value;
    value = step(value);
  }
})());

// produces a range of integers
let range = n_ary('range',
  (max) => range(0, max, 1),
  (start, max) => range(start, max, 1),
  (start, max, step) => generate(start, x => x + step, x => x >= max));

let cycle = (seqable) => make_seq((function*() {
  while(true) {
    yield* seq(seqable);
  }
})());

// interleaves seqs
// given a list of seqs, produce a seq that's the first element
// from each, then the second, until one of them is empty
let interleave = (...seqables) => make_seq((function* () {
  let seqs = map(seq, seqables);

  while (true) {
    if (some(is_empty, seqs)) return;
    let firsts = map(first, seqs);
    yield* firsts;
    seqs = map(rest, seqs);
  }
})());

let repeatedly = (value) => generate(value, id, () => false);

export let seqs = {repeatedly, interleave, cycle, range, generate, is_empty, count, empty, conj, rest, first, seq, Seq, is_iterable};

//////////////////// Transducers
let completed = Symbol('ludus/completed');
let complete = (accum) => ({value: accum, [completed]: true});

let reduce = n_ary('reduce', 
  (f, coll) => reduce(f, first(coll), rest(coll)),
  loop((f, accum, coll) => {
    let s = seq(coll);
    if (has(completed, accum)) return accum.value;
    if (is_empty(s)) return accum;
    return recur(f, f(accum, first(s)), rest(s));
  }));

let transduce = n_ary('transduce', 
  (xf, rf, coll) => reduce(xf(rf), coll),
  (xf, rf, accum, coll) => reduce(xf(rf), accum, coll));

let map = n_ary('map',
  (f) => (rf) => (accum, x) => rf(accum, f(x)),
  (f, coll) => transduce(map(f), conj, empty(coll), coll)
);

let filter = n_ary('filter',
  (f) => (rf) => (accum, x) => boolean(f(x)) ? rf(accum, x) : accum,
  (f, coll) => transduce(filter(f), conj, empty(coll), coll)
);

let into = n_ary('into',
  (to, from) => transduce(id, conj, to, from),
  (to, from, xform) => transduce(xform, conj, to, from)
);

let take = n_ary('take',
  (n) => {
    let count = 0;
    return (rf) => (accum, x) => {
      if (count >= n) return complete(accum);
      count += 1;
      return rf(accum, x);
    };
  },
  (n, coll) => transduce(take(n), conj, empty(coll), coll)
);

// TODO: make keep a nullary reducer?
// switch not on arity but on the type of the argument: function or not?
// e.g. multimethod, not n_ary
let keep = n_ary('keep',
  (f) => (rf) => (accum, x) => f(x) == undefined ? accum : rf(accum, x),
  (f, coll) => transduce(keep(f), conj, empty(coll), coll)
);

let every = n_ary('every',
  (f) => (rf) => (_, x) => boolean(f(x)) ? rf(true, true) : complete(false),
  (f, coll) => transduce(every(f), (x, y) => x && y, true, coll)
);

let some = n_ary('some',
  (f) => (rf) => (_, x) => boolean(f(x)) ? complete(true) : rf(false, false),
  (f, coll) => transduce(some(f), (x, y) => x || y, false, coll)
);

let chunk = n_ary('chunk',
  (n) => {
    let chunk = [];
    return (rf) => (accum, x) => {
      chunk = conj(chunk, x);
      if (chunk.length === n) {
        let out = chunk;
        chunk = [];
        return rf(accum, out)
      }
      return accum;
    };
  },
  (n, coll) => transduce(chunk(n), conj, empty(coll), coll)
);

let zip = (...seqs) => 
  transduce(chunk(seqs.length), conj, [], interleave(...seqs));

///// Transduers to add
// cat
// flat
// unique
// dedupe
// interpose
// chunk_by
// repeat
// drop
// drop_while
// drop_nth
// take_while
// take_nth
// remove
// none
// on_keys
// on_values

export let transducers = {reduce, transduce, into, map, complete, filter, take, zip, chunk, every, some, keep};

//////////////////// Spec
// spec offers a robust set of ways to combine predicate functions
// as well as some core predicates
// unlike a type system, spec can use arbitrary predicates
// and is fully exposed to the runtime

///// predicates
// TODO: add more useful predicates
let is = n_ary('is',
  (type) => rename(`is<${type.description}>`, partial(is, type)),
  (type_, value) => type(value) === type_
);

let is_string = s => typeof s === 'string';

let is_number = n => typeof n === 'number';

let is_int = n => is_number(n) && n % 1 === 0;

let is_boolean = b => typeof b === 'boolean';
let is_bool = is_boolean;

let is_symbol = s => typeof s === 'symbol';

let is_object = o => is(type_map.Object, o);

let is_array = a => is(type_map.Array, a);

let is_map = m => is(type_map.Map, m);

let is_set = s => is(type_map.Set, s);

export let predicates = {is, is_string, is_number, is_int, is_boolean, is_bool, is_symbol, is_object, is_array, is_map, is_set};

///// combinators
let spec_tag = Symbol('ludus/spec')

let spec = n_ary('spec',
  (name, predicate) => rename(name, predicate),
  (name, predicate, combinator, joins) => Object.defineProperties(
    predicate, {
      name: {value: name},
      [spec_tag]: {value: combinator},
      joins: {value: joins}
    })
);

let or = (...specs) => spec(
  `or<${specs.map(s => s.name).join(', ')}>`,
  value => specs.some(spec => spec(value)),
  or,
  specs
);

let and = (...specs) => spec(
  `and<${specs.map(s => s.name).join(', ')}>`,
  value => specs.every(spec => spec(value)),
  and,
  specs
);

let not = spec_ => spec(
  `not<${spec_.name}>`,
  value => !spec_(value),
  not,
  [spec_]
);

let maybe = (spec_) => spec(`maybe<${spec_.name}>`, or(spec_, is_undef));

let property = (key, spec_) => spec(
  `property<${key}: ${spec_.name}>`,
  x => x != null && spec_(x[key]),
  property,
  [spec_]
);

let struct = (name, obj) => spec(
  `struct<${name}>`, 
  and(...Object.entries(obj).map(([key, spec_]) => property(key, spec_)))
);

let series = (...specs) => spec(
  `series<${specs.map(s => s.name).join(', ')}>`,
  xs => count(xs) === count(specs) && every(ap, zip(specs, xs)),
  series,
  specs
);

let many = (spec_) => spec(
  `many<${spec_.name}>`,
  xs => every(ap, zip(repeatedly(spec_), xs)),
  many,
  [spec_]
);

///// working with predicates
let check = (spec, value) => spec(value);

let invalid = Symbol('ludus/spec/invalid');

let is_invalid = x => x === invalid;

let conform = (spec, value) => spec(value) ? value : invalid;

let assert = (spec, value) => spec(value) 
  ? value 
  : raise(Error, `${value} did not conform to ${spec.name}`);
  
// TODO: add an explanation regime
// explain should be a recursive multimethod that accumulates failures
let explain = multi('explain', get('ludus/spec'), 
  (predicate, value) => predicate(value)
    ? undefined
    : `${value} : ${type(value).description} failed predicate ${predicate.name || predicate.toString()}`);

//////////////////// Exports
let core = {imports, errors, functions, transducers, predicates, values, seqs, types };
export default core;

//////////////////// REPL workspace

// hold onto these

// number functions
let inc = (x) => x + 1;

let add = (x, y) => x + y;

let neg = (x) => x * -1;

let is_even = x => x % 2 === 0;