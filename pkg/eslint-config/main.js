/* eslint-disable */

module.exports = {
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "extends": ["./js_globals.cjs", "./node_globals.cjs", "./ludus_globals.cjs"],
  "plugins": [
    "@ludus", "import", "fp"
  ],
  "rules": {
    "@ludus/ensure-object-casing": "error",
    "@ludus/ensure-proper-dots": "error",
    "@ludus/ensure-proper-exports": "error",
    "@ludus/ensure-proper-imports": "error",
    "@ludus/no-capitalized-variables": "error",
    "@ludus/no-classes": "error",
    "@ludus/no-const": "error",
    "@ludus/no-empty-declarations": "error",
    "@ludus/no-getters-or-setters": "error",
    "@ludus/no-invalid-expressions": "error",
    "@ludus/no-invalid-literals": "error",
    "@ludus/no-invalid-statements": "error",
    "@ludus/no-operators": "error",
    "@ludus/only-arrow-functions": "error",
    "@ludus/when-expressions": "error",

    "no-var": "error",
    "no-console": "error",
    "no-dupe-args": "error",
    "no-dupe-keys": "error",
    "no-empty": "error",
    "no-irregular-whitespace": "error",
    "no-sparse-arrays": "error",
    "no-template-curly-in-string": "error",
    "no-unexpected-multiline": "error",
    "no-unreachable": "error",
    "block-scoped-var": "error",
    "no-empty-pattern": "error",
    "no-labels": "error",
    "no-multi-spaces": "error",
    "no-octal": "error",
    "no-sequences": "error",
    "no-void": "error",
    "no-with": "error",
    "no-shadow": "warn",
    "init-declarations": ["error", "always"],
    "no-undef": "error",
    "max-statements-per-line": ["error", {"max": 1}],
    "no-bitwise": "error",
    "no-continue": "error",
    "no-plusplus": "error",
    "operator-assignment": ["error", "never"],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "semi-style": ["error", "last"],
    "arrow-parens": ["error", "always"],

    "import/no-unresolved": "error",
    "import/named": "error",
    "import/default": "error",
    "import/no-absolute-path": "error",
    "import/no-self-import": "error",
    "import/first": "error",
    "import/exports-last": "error",
    "import/no-namespace": "error",
    "import/extensions": ["error", "always"],
    "import/no-unassigned-import": "warn",  
    "import/no-named-default": "error",

    "fp/no-arguments": "error",
    "fp/no-class": "error",
    "fp/no-delete": "error",
    "fp/no-get-set": "error",
    "fp/no-loops": "error",
    "fp/no-mutation": "error",
    "fp/no-this": "error",
    "fp/no-throw": "error"

  }
}