# Thoughts while writing `core`
## Or, what I learn when I write actual Ludus code

### Conditional logic gets awkward
What makes them awkward?
* Given Ludus's statement logic (no statement-based conditionals), there's no such thing as early return. You only get one return per function.
* That means we can't assign any names/ids/variables based on conditional logic. 
* Well, we should prefer `when` to `cond`, because it's faster and has less syntactic overhead (function literals everywhere). But:
    - That's the only way to get assignment logic after a return.
    - Also, in Lisp's `cond`, you can have arbitrary expressions in the guard part of a clause, but in Ludus, the bias is towards function evaluation. If you have conditionals that aren't about the state of a single value, you have to write function literals.

### Further reflections on conditional logic
* Well, you absolutely can assign names based on conditional logic: you use conditionals in the right-hand-side of a `let` statement. That means you have to have some kind of default value, usually `undefined`. This is maybe less than ideal because it means, potentially, the proliferation of `undefined` values. Keep an eye on this.
    - That said, `undefined` is more useful in Ludus than in JS: it carries more information and will blow up less stuff (use `get`!).
    - From a stylistic perspective, this means pulling as much conditional logic into `let` statements and out of `return` statements as possible.
    - Also, `when` is not the only useful conditional construct here: `or` and `and` are quite helpful.
* If you need another closure (say, to assign more values) from a `when` clause, use `call(() => {...})`. This requires knowing about deferring a computation.
* As for `cond`, I'm tempted to give it different behavior than it currently has:
    - If a member of a clause is a function, execute it.
    - If a member of a clause is a value that is not a function, just evaluate it.
    - That requires knowing when you want to defer a computation.
    - I'm going to let that sit for a while before I decide it's the thing to do.

### Other additional thoughts
* I find `get` cumbersome; I'm tempted to write `let get_result = get('result');`, which is fine, but feels like it's information. I'm avoiding that for now to see if the format for `get` might begin to feel more natural.
* But when you can use it partially applied, it feels great. So.
* 