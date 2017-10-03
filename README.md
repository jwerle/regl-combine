regl-combine
============

Compbine hundreds or thousands of regl commands without worrying about
["too much recursion" or "Maximum call stack size exceeded"][tmm] errors. This module
will group and segment multiple sequential regl calls into a single regl function
while also allowing for intermediate "middleware" functions.

## Install

```sh
$ npm install regl-combine
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
that is used to create the new returned command. Commands are grouped
together and are only segmented when a non-regl command is reached.

The following will segment the regl commands and create 4 function
groups where *group 1* contains `command1, command2, command3`,
*group 2* contains `middleware1`, *group 3* contains `middleware2`,
and *group 4* contains `command4`, and `command5`.

```js
combine(
    regl,
    command1,
    command2,
    command3,
    middleware1,
    middleware2,
    command4,
    command5)
```

## Caveats

### Parent Context Dependencies

In order to mitigate parent context dependencies, such as a `command2`
dynamic context property depending on the result of a `command1` dynamic
context property, you must ensure that `command2` is not "combined"
directly with `command1` because the order in which their context
properties cannot be guaranteed. You can achieve this by doing the
following:

```js
combine(regl, command1, (...args) => command2(...args))
```

which will produce two distinct groups.

### Context Property Conflict

If a dynamic or static context property in `command2` exists as a
dynamic or static context property in `command1`, `command1` will
overwrite the context property in `command1` and void it from creation.

## API

### wrap(regl) -> regl

This function accepts a regl constructor function and returns a new
regl function that when invoked returns a regl command that injects the
options used to create it as an injected context propetry `reglOptions`.
This is needed for `combine()` to work properly if you provide it
already created regl commands. Otherwise, you will have to expose regl
command options to `combine()` only.

```js
const { wrap } = require('regl-combine')
const regl = wrap(require('regl')())
```

**note:** *If regl isn't wrapped with this function then the only input
that will work with `combine()` are regl constructor options
objects.*

### combine(regl, commands) -> Function

This function accepts a regl constructor function and an array of
commands. An element in the commands array may be a constructed regl
command if regl was previously wrapped with `wrap()`. An element in
the comamnds array may also be a regl constructor options
object, which is required if regl wasn't wrapped with the `wrap()`
function call.

```js
const command = combine(regl, [
  regl({ vert: ` ... ` }),
  { frag: ` ... `},
  { attributes: {position [ ... ]} }
])
```

**note:** *If regl isn't wrapped with `wrap()` then the only input
that will work with this function are regl constructor options objects.*

## Example

The following example composes several regl command functions into a single
function.

```js
const { combine, wrap } = require('regl-combine')
const regl = wrap(require('regl')()) // required

const drawTriangle = combine(regl, [
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

## License

MIT

[regl]: https://github.com/regl-project/regl
[tmm]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion
