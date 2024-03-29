//////////////////// Refs, or how Ludus does state
// Refs are the way Ludus handles state, which is also to say persistence,
// which is also to say asynchronicity. They are modeled on Clojure's Atoms,
// but Ludus calls "atoms" simple datatypes (e.g., strings, numbers, bools).
// Ludus does not need the robust set of state-management constructs as
// Clojure does, since JS is (mostly) single-threaded---and anyway, multi-
// threading falls beyond Ludus's intended use cases. But we *do* need 
// something.

// A ref contains a value, which can change over time. The way to change the
// value of a ref is to pass it and a new value to `swap`. `swap` updates the
// value of the ref immediately. In addition, you can add `Watcher`s to the
// ref, which will call a function (presumably with side effects) when the
// ref's value changs---once the event loop clears.

// In additon, to get refs working, we need a way to represent a deferred 
// computation, that runs once the event loop clears; we use `future`.
// It may be necessary to develop more robust constructs later (monads!) in
// order to reify deferred computations (so that, e.g., they can be canceled).
// But for now, this should do what we need.

import L from './deps.js';
import T from './type.js';
import NS from './ns.js';
import Fn from './fns.js';
import S from './spec.js';
import P from './preds.js';

let {eq} = L;
let {fn} = Fn;
let {type, create} = T;
let {is_str, is_any, is, is_fn, is_arr, is_int} = P;
let {record, maybe, args} = S;
let {ns} = NS;

let ref_t = type({name: 'Ref'});

let ref_descriptor = record('ref_descriptor', {
  name: maybe(is_str), 
  value: is_any, 
  doc: maybe(is_str)
});

let ref = fn({
  name: 'ref',
  doc: 'Creates a ref',
  pre: args([ref_descriptor]),
  body: ({name, doc, value, ...attrs}) => 
    create(ref_t, {name, doc, value, pending: false, watchers: [], attrs})
});

let show = fn({
  name: 'show',
  doc: 'Shows a ref.',
  pre: args([is(ref_t)]),
  body: (ref) => `Ref${ref.name ? ': ' + ref.name : ''} { ${ref.value} }`
});

let deref = fn({
  name: 'deref',
  doc: 'Gets the value stored in a ref.',
  pre: args([is(ref_t)]),
  body: ({value}) => value
});

let swap = fn({
  name: 'swap',
  doc: 'Updates the value in a ref, mutating its state. Returns undefined.',
  pre: args([is(ref_t), is_any]),
  body: (ref, new_value) => {
    if (!eq(ref.value, new_value)) {
      ref.value = new_value;
      ref.pending = true;
      future(ping_watchers, [ref]);
    };
    return undefined;
  }
});

let update = fn({
  name: 'update',
  doc: 'Updates the value in a ref, mutating its state, by applying the supplied function to its value.',
  pre: args([is(ref_t), is_fn, is_any]),
  body: (ref, updater, ...args) => {
    let new_value = updater(ref.value, ...args);
    swap(ref, new_value);
    return undefined;
  }
});

// not exported
let ping_watchers = (ref) => {
  if (ref.pending) {
    for (let {fn, args} of ref.watchers) {
      fn(deref(ref), ...args);
    }
  }
  ref.pending = false;
  return undefined;
};

let watcher_t = type({name: 'Watcher'});

let watcher = fn({
  name: 'watcher',
  doc: 'Creates a watcher.',
  body: (ref, fn, args) => create(watcher_t, {ref, fn, args})
});

let watch = fn({
  name: 'watch',
  doc: 'Adds a watcher to a ref. The function (presumably with side effects) will be called whenever the ref changes value (i.e. somebody, somewhere `swap`ped the ref). It will call `fn` with any additional arguments passed to `watch`. Returns a Watcher, which you can then pass to `unwatch` to cancel the watcher.',
  pre: args([is(ref_t), is_fn]),
  body: (ref, fn, ...args) => {
    let w = watcher(ref, fn, args);
    ref.watchers.push(w);
    return w;
  }
});

let unwatch = fn({
  name: 'unwatch',
  doc: 'Removes a watcher from a ref, such that it will no longer be called when the ref\'s value changes.',
  pre: args([is(watcher_t)]),
  body: (watcher) => {
    let new_watchers = [];
    let {ref} = watcher;
    for (let w of ref.watchers) {
      if (w !== watcher) {
        new_watchers.push(w);
      }
    }
    ref.watchers = new_watchers;
    return undefined;
  }
});


let future = fn({
  name: 'future',
  doc: 'Schedules a function call in the future.',
  pre: args(
    [is_fn], 
    [is_fn, is_arr], 
    [is_fn, is_arr, is_int]),
  body: [
    (fn) => future(fn, [], 0),
    (fn, args) => future(fn, args, 0),
    (fn, args, delay) => setTimeout(() => { fn(...args); }, delay)
  ]
});

let forward = fn({
  name: 'forward',
  doc: 'Creates a forward reference. Allows declaration of a function before its definition. Returns a tuple with the function and a setter function. Note that the setter function may only be called once (subsequent invocations will do nothing).',
  pre: args([is_str]),
  body: (name) => {
    let inner = ref({name, value: () => raise(`Cannot use forward reference before setting its value.`)});
    let out = Fn.rename(name, (...args) => deref(inner)(...args));
    let set = fn({
      name: `set<${name}>`,
      pre: args([is_fn]),
      body: Fn.once((f) => { swap(inner, f); })
    });
    return [out, set];
}});

export default ns({
  type: ref_t,
  members: { 
    ref, deref, swap, watch, unwatch, future, show, update, forward
  }
});
