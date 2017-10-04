'use strict'
const extend = require('regl-extend')
const trampa = require('trampa')
const assert = require('assert')

const noop = () => void 0

const kReglOptions = '__reglOptions'

// as defined here https://github.com/regl-project/regl/blob/gh-pages/regl.js#L68
const reglContextKeys = [
  'drawingBufferHeight',
  'drawingBufferWidth',
  'framebufferHeight',
  'framebufferWidth',
  'pixelRatio',
  'tick',
  'time',
  'viewportHeight',
  'viewportWidth',
]

/**
 * Wraps regl constructor with a function that injects a context
 * property exposing the options used to create the regl command.
 * They property merges in regl options found in the injected context
 * before injecting into scope. The constructor options are also assigned
 * to a `.reglOptions` property on the command function.
 *
 * wrap(regl: Function) -> (opts: Object) => regl(opts: Object) -> void
 */
function wrap(regl) {
  assert('function' == typeof regl,
         "regl-combine: Expecting regl constructor function.")
  return Object.assign(wrapRegl, regl)
  function wrapRegl(opts) {
    return Object.assign(regl(injectCommandOptions(opts)),
                         {[kReglOptions]: opts})
  }
}

/**
 * Extends a regl command object by injecting command options
 * into the context object as a special readonly property.
 *
 * injectCommandOptions(opts: Object) -> Object
 */
function injectCommandOptions(opts) {
  return Object.assign(extend.command(opts), {
    context: Object.assign({}, opts.context, Object.create(null, {
      reglOptions: { get() { return this[kReglOptions] } },
      [kReglOptions]: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: getReglOptions
      }
    }))
  })
  function getReglOptions(ctx) {
    const reglOptions = extend.command(ctx[kReglOptions], opts)
    if (reglOptions.context && kReglOptions in reglOptions.context) {
      delete reglOptions.context[kReglOptions]
    }
    return reglOptions
  }
}

/**
 * combine(regl: Function, commands: Array<Function>) -> Function
 */
function combine(regl, ...commands) {
  if (Array.isArray(commands[0])) {
    commands = commands[0]
  }
  assert('function' == typeof regl,
    "regl-combine: Expecting regl constructor function.")
  assert(Array.isArray(commands),
    "regl-combine: Expecting array of regl commands.")

  commands = flattenCommands(commands)
  regl = wrap(regl)

  const getContext = createCommand()
  const currentReglOpts = {}
  const groups = []

  let ret = null

  return Object.assign(exec, {commands, groups, isCombined: true})

  function flattenCommands(commands) {
    return commands.map(select).reduce(flatten, [])
    function select(command, i) {
      return command && Array.isArray(command.commands)
        ? splice(command).commands
        : command
    }

    function flatten(commands, command) {
      return commands.concat(command)
    }

    function splice(command) {
      return commands.splice(commands.indexOf(command), 1)[0]
    }
  }

  function createCommand(opts) {
    return regl(opts || {})
  }

  function exec(args, done) {
    if ('function' == typeof args) {
      done = args
      args = null
    }

    if (0 == groups.length) {
      generate(0).run()
    }

    return getContext(args, ({}, args) => loop(0, args))
    function loop(index, args) {
      return index < groups.length
        ? groups[index++](args, () => loop(index, args))
        : getContext(args, done)
    }

    function generate(index) {
      if (index >= commands.length) {
        return trampa.wrap(concat())
      } else {
        return trampa.lazy(step)
      }
      function step() {
        const command = commands[index]
        if ('object' == typeof command) {
          copy(command)
        } else if ('function' == typeof command) {
          if (kReglOptions in command) {
            copy(command)
          } else {
            concat()
            groups.push(command)
          }
        }
        return generate(++index)
      }
    }
  }

  function concat() {
    const kopts = {}
    let klen = 0
    for (const k in currentReglOpts) {
      void klen ++
      kopts[k] = currentReglOpts[k]
      delete currentReglOpts[k]
    }
    return klen && groups.push(createCommand(kopts))
  }

  function copy(command) {
    return Object.assign(
      currentReglOpts,
      extend.command(currentReglOpts, command[kReglOptions] || command))
  }
}

module.exports = combine
Object.assign(module.exports, {
  combine, wrap
})
