///// Strings
// String manipulations, excepting regexes because ugh regexes

import L from './deps.js';
import P from './preds.js';
import F from './fns.js';

let {sign, splat, ns} = L;
let {defn, partial} = F;
let {is_string, is_number} = P; 

let concat = defn({
  name: 'concat',
  doc: 'Concatenates strings togheter, returning a new string made up of each argument in order.',
  pre: splat(is_string),
  body: [
    () => '',
    (x) => x,
    (x, y) => x + y,
    (x, y, z, ...more) => x.concat(y, z, ...more)
  ]
});

let string = defn({
  name: 'string',
  doc: 'Produces a quick and dirty string representation of any arguments it is given, concatenating the resulting strings. It returns strings unharmed. With zero arguments, it returns the empty string. Note that these string representations dispatch to JS\'s `toString` method on a value, which may not produce lovely or especially informative results: `string({}); //=> \'[object Object]\'` and `string([1, 2, 3]); //=> \'1,2,3\'`. For prettier (and slower) output, see `show`.',
  body: [
    () => '',
    (x) => x.toString(),
    (x, y, ...more) => {
      let xs_str = [x, y, ...more].map(x => x.toString());
      return ''.concat(...xs_str);
    }
  ]
});

let size = defn({
  name: 'size',
  doc: 'Tells the length of a string.',
  pre: sign([is_string]),
  body: (str) => [...str].length
});

let split = defn({
  name: 'split',
  doc: 'Splits a string into substrings, using a separator that is also a string. Returns an array of strings. With one argument, returns a function that splits strings using the argument as a separator. With two arguments, splits the second string using the first as the separator.',
  pre: sign([is_string], [is_string, is_string]),
  body: [
    (sep) => partial(split, sep),
    // NB: use spread syntax for character splitting to avoid unicode bugs
    (sep, str) => sep === '' ? [...str] : str.split(sep)
  ]
});

let chars = defn({
  name: 'chars',
  doc: 'Splits a string into "characters," strings of size 1. Returns an array of "chars." E.g., `chars(\'abc\'); //=> [\'a\', \'b\', \'c\']`.',
  pre: sign([is_string]),
  body: (str) => [...str]
})

let is_blank = defn({
  name: 'is_blank',
  doc: 'Tells if a string is nothing but whitespace (spaces, newlines, tabs, etc.).',
  pre: sign([is_string]),
  body: (str) => str.trim() === ''
});

let is_empty = defn({
  name: 'is_empty',
  doc: 'Tells if a string is the empty string.',
  pre: sign([is_string]),
  body: (str) => str === ''
});

let trim = defn({
  name: 'trim',
  doc: 'Trims all preceding and trailing whitespace from a string. E.g., `trim(\'    foo  \'); //=>  \'foo\'`.',
  pre: sign([is_string]),
  body: (str) => str.trim()
});

let trim_left = defn({
  name: 'trim_left',
  doc: 'Trims whitespace from the beginning of a string.',
  pre: sign([is_string]),
  body: (str) => str.trimStart()
});

let trim_right = defn({
  name: 'trim_right',
  doc: 'Trims whitespace from the end of a string.',
  pre: sign([is_string]),
  body: (str) => str.trimEnd()
});

let index_of = defn({
  name: 'index_of',
  doc: 'Takes a search string and a target string, and returns the index of the first character of the search string in the target string, if indeed the target string includes the whole search string. Returns `undefined` if the target string does not include the search string. If there are multiple matches, returns only the first instance.',
  pre: sign([is_string], [is_string, is_string]),
  body: [
    (search) => partial(index_of, search),
    (search, target) => {
      let index = target.indexOf(search);
      return index === -1 ? undefined : index;
    }
  ]
});

let last_index_of = defn({
  name: 'last_index_of',
  doc: 'Takes a search string and a target string, and returns the index of the first character of the search string in the target string, if indeed the target string includes the whole search string. Returns `undefined` if the target string does not include the search string. If there are multiple matches, returns the last instance.',
  pre: sign([is_string], [is_string, is_string]),
  body: [
    (search) => partial(last_index_of, search),
    (search, target) => {
      let index = target.lastIndexOf(search);
      return index === -1 ? undefined : index;
    }
  ]
});

let upcase = defn({
  name: 'upcase',
  doc: 'Uppercases all characters in a string.',
  pre: sign([is_string]),
  body: (str) => str.toUpperCase()
});

let lowcase = defn({
  name: 'lowcase',
  doc: 'Lowercases all characters in a string.',
  pre: sign([is_string]),
  body: (str) => str.toLowerCase()
});

let capitalize = defn({
  name: 'capitalize',
  doc: 'Capitalizes the first letter of a string, lowercasing the rest.',
  pre: sign([is_string]),
  body: (str) => 
    str[0].toUpperCase() + str.slice(1, str.length).toLowerCase()
})

let words = defn({
  name: 'words',
  doc: 'Splits a string into "words," by splitting and removing any whitespace, and stripping common punctuation marks. Numbers, emoji, other characters, etc., remain.', 
  pre: sign([is_string]),
  body: (str) => str
    .trim()
    // thanks StackOverflow for this regex:
    // https://stackoverflow.com/questions/4328500/how-can-i-strip-all-punctuation-from-a-string-in-javascript-using-regex
    .replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']/g,'')
    .split(/\s+/)
});

let replace = defn({
  name: 'replace',
  doc: 'Replaces all instances of a search string in a target string with a replacement string. If no instances of the search are found, returns the original string. Case-sensitive.',
  pre: sign([is_string, is_string], [is_string, is_string, is_string]),
  body: [
    (search, replace_with) => partial(replace, search, replace_with),
    (search, replace_with, target) => {
      let regex = new RegExp(search, 'g');
      return target.replace(regex, replace_with);
    }
  ]
});

let replace_first = defn({
  name: 'replace_first',
  doc: 'Replaces the first instance of a search string in a target string with a replacement string. If no instances of the search are found, returns the original string Case-sensitive.',
  pre: sign([is_string, is_string], [is_string, is_string, is_string]),
  body: [
    (search, replace_with) => partial(replace_first, search, replace_with),
    (search, replace_with, target) => target.replace(search, replace_with)
  ]
});

let from_code = defn({
  name: 'from_code',
  doc: 'Creates a 1-character string from its unicode representation.',
  pre: sign([is_number]),
  body: (code) => String.fromCodePoint(code)
});

let code_at = defn({
  name: 'code_at',
  doc: 'Returns the unicode representation of the given character in a string.',
  pre: sign([is_number, is_string]),
  body: (char, str) => char >= size(str) 
    ? undefined 
    : [...str][char].codePointAt(0)
});

let starts_with = defn({
  name: 'starts_with',
  doc: 'Given a test string and a target string to test, returns `true` if the target string starts with the test string.',
  pre: sign([is_string], [is_string, is_string]),
  body: [
    (test) => partial(starts_with, test),
    (test, target) => target.startsWith(test)
  ]
});

let ends_with = defn({
  name: 'ends_with',
  doc: 'Given a test string and a target to test, returns `true` if the target string ends with the test string.',
  pre: sign([is_string], [is_string, is_string]),
  body: [
    (test) => partial(ends_with, test),
    (test, target) => target.endsWith(test)
  ]
});

let includes = defn({
  name: 'includes',
  doc: 'Given a test string and a target to test, returns `true` if the target string includes the test string.',
  pre: sign([is_string], [is_string, is_string]),
  body: [
    (test) => partial(includes, test),
    (test, target) => target.includes(test)
  ]
});

let repeat = defn({
  name: 'repeat',
  doc: 'Repeats a string a given number of times.',
  pre: sign([is_number], [is_number, is_string]),
  body: [
    (times) => partial(repeat, times),
    (times, str) => str.repeat(times)
  ]  
});

let pad_left = defn({
  name: 'pad_left',
  doc: 'Pads a string to the left, by prepending spaces, or the optional string given in `padding`, over and over until the string reaches the specified size. It will truncate the padding if need be.',
  pre: sign([is_number, is_string], [is_number, is_string, is_string]),
  body: [
    (size, str) => str.padStart(size),
    (size, str, padding) => str.padStart(size, padding)
  ]
});

let pad_right = defn({
  name: 'pad_right',
  doc: 'Pads a string to the right, by appending spaces, or the optional string given in `padding`, over and over until the string reaches the specified size. It will truncate the padding if need be.',
  pre: sign([is_number, is_string], [is_number, is_string, is_string]),
  body: [
    (size, str) => str.padEnd(size),
    (size, str, padding) => str.padEnd(size, padding)
  ]
});

let slice = defn({
  name: 'slice',
  doc: 'Takes a "slice" of a string, returning the substring specified by `start`, and, optionally, `end`. Negative numbers wrap around, taking numbers from the end of the string. E.g., `slice(3, \'foobar\'); //=> \'bar\'`, and `slice(-2, \'foobar\'); //=> \'ar\'`.',
  pre: sign([is_number, is_string], [is_number, is_number, is_string]),
  body: [
    (start, str) => str.slice(start),
    (start, end, str) => str.slice(start, end)
  ]
});

let String_ = ns({
  name: 'String',
  space: {
    capitalize, chars, code_at, concat, ends_with, from_code, includes,
    index_of, is_blank, is_empty, last_index_of, lowcase, pad_left,
    pad_right, repeat, replace, replace_first, size, slice, split, starts_with,
    string, trim, trim_left, trim_right, upcase, words
  }
});

export default String_;