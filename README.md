regl-trampoline
===============

Compose hundreds or thousands of regl commands without worrying about
["too much recursion" or "Maximum call stack size exceeded"][tmm] errors.

## Install

```sh
$ npm install regl-trampoline
```

## Why?

Javascript recursion (or stack depth)
[limits](https://rosettacode.org/wiki/Find_limit_of_recursion#JavaScript) vary
from browser to browser.

They can cause errors like

```js
InternalError: too much recursion
```

or

```js
RangeError: Maximum call stack size exceeded.
```

which can happen quite easily if you build many small regl components
that inject contexts, provide shaders, and more. This module allows you
to create small components and compose them together without the
overhead or worry of recursion depth and stack overflows.

## How?

This module composes regl commands together by capturing the constructor
options used to create the commands and merging them into a single object
that is used to create the new returned command. Input commands can be
composed of valid regl options or alredy constructed commands. Each command
is "trampolined" to prevent exceeding the call stack when invoked to capture the
constructor options. This only occurs once.

## API

### trampoline.wrap(regl) -> regl

This function accepts a regl constructor function and returns a new
regl function that when invoked returns a regl command that injects the
options used to create it as an injected context propetry `reglOptions`.
This is needed for `trampoline.compose()` to work properly.


```js
const trampoline = require('regl-trampoline')
const regl = trampoline.wrap(require('regl')())
```

**note:** *If regl isn't wrapped with this function then the only input
that will work with `trampoline.compose()` are regl constructor options
objects.*

### trampoline.compose(regl, commands) -> Function

This function accepts a regl constructor function and an array of
commands. An element in the commands array may be a constructed regl
command if regl was previously wrapped with `trampoline.wrap()`. An
element in the comamnds array may also be a regl constructor options
object.

```js
const command = trampoline.compose(regl, [
  regl({ vert: ` ... ` }),
  { frag: ` ... `},
  { attributes: {position [ ... ]} }
])
```

**note:** *If regl isn't wrapped with `trampoline.wrap()` then the only input
that will work with this function are regl constructor options objects.*

## Example

The following example composes several regl commands into a function. The
commands are ["trampolined"][trampolines] together and made callable.

```js
const trampoline = require('regl-trampoline')
const regl = trampoline.wrap(require('regl')()) // required

const drawTriangle = trampoline.compose(regl, [
  regl({
    frag: `
      precision mediump float;
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }
    `
  }),

  regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0, 1);
      }
    `
  }),

  regl({
		 attributes: {
       position: regl.buffer([
         [-2, -2],
         [4, -2],
         [4,  4]
       ])
     }
  }),

  regl({
    uniforms: {
      color: regl.prop('color')
    }
  }),

  regl({
    count: 3
	})
])

regl.frame(({time}) => {
  drawTriangle({
    color: [
      Math.cos(time * 0.001),
      Math.sin(time * 0.0008),
      Math.cos(time * 0.003),
      1
    ]
  })
})
```

## See Also

* [Trampolines in JavaScript](http://raganwald.com/2013/03/28/trampolines-in-javascript.html)
* [High Level Trampolining](http://raganwald.com/2013/03/29/high-level-trampolining.html)
* [Functional JavaScript – Tail Call Optimization and Trampolines](https://taylodl.wordpress.com/2013/06/07/functional-javascript-tail-call-optimization-and-trampolines/)
* [How to avoid Stack overflow error on recursion](http://www.thinkingincrowd.me/2016/06/06/How-to-avoid-Stack-overflow-error-on-recursive/)

## License

MIT

[trampolines]: https://en.wikipedia.org/wiki/Trampoline_(computing)#High-level_programming
[regl]: https://github.com/regl-project/regl
[tmm]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion
