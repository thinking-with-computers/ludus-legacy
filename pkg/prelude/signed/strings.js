///// Strings
// String manipulations, excepting regexes because ugh regexes

import L from './deps.js';
import Fn from './fns.js';
import Spec from './spec.js';
import Pred from './preds.js';
import NS from './ns.js';

let {fn, partial} = Fn;
let {is_str, is_num, is_iter, is_undef, or} = Pred;
let {args} = Spec;
let {ns} = NS;

let concat = fn({
  name: 'concat',
  doc: 'Concatenates strings togheter, returning a new string made up of each argument in order.',
  pre: args([is_str]),
  body: [
    () => '',
    (x) => x,
    (x, y) => x + y,
    (x, y, z, ...more) => x.concat(y, z, ...more)
  ]
});

let str_ = fn({
  name: 'str',
  doc: 'Produces a quick and dirty string representation of any arguments it is given, concatenating the resulting strings. It returns strings unharmed. With zero arguments, it returns the empty string. Note that these string representations dispatch to JS\'s `toString` method on a value, which may not produce lovely or especially informative results: `string({}); //=> \'[object Object]\'` and `string([1, 2, 3]); //=> \'1,2,3\'`. For prettier (and slower) output, see `show`.',
  //pre: args([is_str]),
  body: [
    () => '',
    (x) => x.toString(),
    (x, y, ...more) => {
      let xs_str = [x, y, ...more].map(x => x.toString());
      return ''.concat(...xs_str);
    }
  ]
});

let from = fn({
  name: 'from',
  doc: 'Produces a string from any iterable. Takes an optional separator argument.',
  pre: args([or(is_iter, is_undef)], [or(is_iter, is_undef), is_str]),
  body: [
    (iter) => iter == undefined ? '' : [...iter].join(''),
    (iter, separator) => iter == undefined ? '' : [...iter].join(separator)
  ]
});

let join_with = fn({
  name: 'join_with',
  doc: 'Produces a string from any iterable, separator first.',
  pre: args([is_str], [is_str, or(is_iter, is_undef)]),
  body: [
  (separator) => partial(join_with, separator),
  (separator, iter) => from(iter, separator)
  ]
});

let count = fn({
  name: 'count',
  doc: 'Tells the length of a string.',
  pre: args([is_str]),
  body: (str) => [...str].length //NB: use spread syntax for better unicode counting
});

let split = fn({
  name: 'split',
  doc: 'Splits a string into substrings, using a separator that is also a string. Returns an array of strings. With one argument, returns a function that splits strings using the argument as a separator. With two arguments, splits the second string using the first as the separator.',
  pre: args([is_str]),
  body: [
    (sep) => partial(split, sep),
    // NB: use spread syntax for character splitting to avoid unicode bugs
    (sep, str) => sep === '' ? [...str] : str.split(sep)
  ]
});

let chars = fn({
  name: 'chars',
  doc: 'Splits a string into "characters," strings of size 1. Returns an array of "chars." E.g., `chars(\'abc\'); //=> [\'a\', \'b\', \'c\']`.',
  pre: args([is_str]),
  body: (str) => [...str]
});

let is_char = fn({
  name: 'is_char',
  doc: 'Tells if something is a char, i.e. a string of length 1. Returns false if the input is not a string.',
  body: (x) => is_str(x) && count(x) === 1
});

let is_blank = fn({
  name: 'is_blank',
  doc: 'Tells if a string is nothing but whitespace (spaces, newlines, tabs, etc.).',
  pre: args([is_str]),
  body: (str) => str.trim() === ''
});

let is_empty = fn({
  name: 'is_empty',
  doc: 'Tells if a string is the empty string.',
  pre: args([is_str]),
  body: (str) => str === ''
});

let trim = fn({
  name: 'trim',
  doc: 'Trims all preceding and trailing whitespace from a string. E.g., `trim(\'    foo  \'); //=>  \'foo\'`.',
  pre: args([is_str]),
  body: (str) => str.trim()
});

let trim_left = fn({
  name: 'trim_left',
  doc: 'Trims whitespace from the beginning of a string.',
  pre: args([is_str]),
  body: (str) => str.trimStart()
});

let trim_right = fn({
  name: 'trim_right',
  doc: 'Trims whitespace from the end of a string.',
  pre: args([is_str]),
  body: (str) => str.trimEnd()
});

let index_of = fn({
  name: 'index_of',
  doc: 'Takes a search string and a target string, and returns the index of the first character of the search string in the target string, if indeed the target string includes the whole search string. Returns `undefined` if the target string does not include the search string. If there are multiple matches, returns only the first instance.',
  // TODO: consider if the second argument should be a char, not a string.
  pre: args([is_str]),
  body: [
    (search) => partial(index_of, search),
    (search, target) => {
      let index = target.indexOf(search);
      return index === -1 ? undefined : index;
    }
  ]
});

let last_index_of = fn({
  name: 'last_index_of',
  doc: 'Takes a search string and a target string, and returns the index of the first character of the search string in the target string, if indeed the target string includes the whole search string. Returns `undefined` if the target string does not include the search string. If there are multiple matches, returns the last instance.',
  pre: args([is_str]),
  body: [
    (search) => partial(last_index_of, search),
    (search, target) => {
      let index = target.lastIndexOf(search);
      return index === -1 ? undefined : index;
    }
  ]
});

let upcase = fn({
  name: 'upcase',
  doc: 'Uppercases all characters in a string.',
  pre: args([is_str]),
  body: (str) => str.toUpperCase()
});

let lowcase = fn({
  name: 'lowcase',
  doc: 'Lowercases all characters in a string.',
  pre: args([is_str]),
  body: (str) => str.toLowerCase()
});

let capitalize = fn({
  name: 'capitalize',
  doc: 'Capitalizes the first character of a string, lowercasing the rest. Does not test whether the first character is a letter; if the first character cannot be capitalized, returns the string unharmed.',
  pre: args([is_str]),
  body: (str) => 
    str[0].toUpperCase() + str.slice(1, str.length).toLowerCase()
});

let words = fn({
  name: 'words',
  doc: 'Splits a string into "words," by splitting and removing any whitespace, and stripping common punctuation marks. Numbers, emoji, other characters, etc., remain.', 
  pre: args([is_str]),
  body: (str) => str
    .trim()
    // thanks StackOverflow for this regex:
    // https://stackoverflow.com/questions/4328500/how-can-i-strip-all-punctuation-from-a-string-in-javascript-using-regex
    .replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']/g,'')
    .split(/\s+/)
});

let replace = fn({
  name: 'replace',
  doc: 'Replaces all instances of a search string in a target string with a replacement string. If no instances of the search are found, returns the original string. Case-sensitive.',
  pre: args([is_str]),
  body: [
    (search, replace_with) => partial(replace, search, replace_with),
    (search, replace_with, target) => {
      let regex = new RegExp(search, 'g');
      return target.replace(regex, replace_with);
    }
  ]
});

let replace_first = fn({
  name: 'replace_first',
  doc: 'Replaces the first instance of a search string in a target string with a replacement string. If no instances of the search are found, returns the original string Case-sensitive.',
  pre: args([is_str]),
  body: [
    (search, replace_with) => partial(replace_first, search, replace_with),
    (search, replace_with, target) => target.replace(search, replace_with)
  ]
});

let from_code = fn({
  name: 'from_code',
  doc: 'Creates a 1-character string from its unicode representation.',
  pre: args([is_num]),
  body: (code) => String.fromCodePoint(code)
});

let code_at = fn({
  name: 'code_at',
  doc: 'Returns the unicode representation of the given character in a string.',
  pre: args([is_num], [is_num, is_str]),
  body: [
    (char) => partial(code_at, char),
    (char, str) => char >= count(str) 
      ? undefined 
      : [...str][char].codePointAt(0)
  ] 
});

let starts_with = fn({
  name: 'starts_with',
  doc: 'Given a test string and a target string to test, returns `true` if the target string starts with the test string.',
  pre: args([is_str]),
  body: [
    (test) => partial(starts_with, test),
    (test, target) => target.startsWith(test)
  ]
});

let ends_with = fn({
  name: 'ends_with',
  doc: 'Given a test string and a target to test, returns `true` if the target string ends with the test string.',
  pre: args([is_str]),
  body: [
    (test) => partial(ends_with, test),
    (test, target) => target.endsWith(test)
  ]
});

let includes = fn({
  name: 'includes',
  doc: 'Given a test string and a target to test, returns `true` if the target string includes the test string.',
  pre: args([is_str]),
  body: [
    (test) => partial(includes, test),
    (test, target) => target.includes(test)
  ]
});

let repeat = fn({
  name: 'repeat',
  doc: 'Repeats a string a given number of times.',
  pre: args([is_num], [is_num, is_str]),
  body: [
    (times) => partial(repeat, times),
    (times, str) => str.repeat(times)
  ]  
});

let pad_left = fn({
  name: 'pad_left',
  doc: 'Pads a string to the left, by prepending spaces, or the optional string given in `padding`, over and over until the string reaches the specified size. It will truncate the padding if need be.',
  pre: args([is_num, is_str]),
  body: [
    (size, str) => str.padStart(size),
    (size, str, padding) => str.padStart(size, padding)
  ]
});

let pad_right = fn({
  name: 'pad_right',
  doc: 'Pads a string to the right, by appending spaces, or the optional string given in `padding`, over and over until the string reaches the specified size. It will truncate the padding if need be.',
  body: [
    (size, str) => str.padEnd(size),
    (size, str, padding) => str.padEnd(size, padding)
  ]
});

let slice = fn({
  name: 'slice',
  doc: 'Takes a "slice" of a string, returning the substring specified by `start`, and, optionally, `end`. Negative numbers wrap around, taking numbers from the end of the string. E.g., `slice(3, \'foobar\'); //=> \'bar\'`, and `slice(-2, \'foobar\'); //=> \'ar\'`.',
  pre: args([is_str, is_num], [is_str, is_num, is_num]),
  body: [
    (str, start) => str.slice(start),
    (str, start, end) => str.slice(start, end)
  ]
});

let empty = fn({
  name: 'empty',
  doc: 'Returns an empty string.',
  body: () => ''
});

let conj = fn({
  name: 'conj',
  doc: '`conj`oins two strings.',
  pre: args([is_str, is_str]),
  body: concat
});

let show = fn({
  name: 'show',
  doc: 'Shows a string.',
  pre: args([is_str]),
  body: (str) => `'${str}'`
});

export default ns(L.Str, {
  capitalize, chars, code_at, concat, ends_with, from, from_code, includes,
  index_of, is_blank, is_char, is_empty, join_with, last_index_of, lowcase, 
  pad_left, pad_right, repeat, replace, replace_first, count, slice, split, 
  starts_with, str: str_, trim, trim_left, trim_right, upcase, words, empty, 
  conj, show
});
