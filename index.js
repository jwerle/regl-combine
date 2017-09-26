'use strict'
const extend = require('regl-extend')
const trampa = require('trampa')
const assert = require('assert')

const noop = () => void 0

function wrap(regl) {
  assert('function' == typeof regl,
         "regl-trampoline: Expecting regl constructor function.")
  return Object.assign(wrapRegl, regl)
  function wrapRegl(opts) {
    assert(opts && 'object' == typeof opts,
          "regl-trampoline: Expecting object of regl constructor options.")
    opts = extend.command(opts)
    opts.context = opts.context || {}
    Object.assign(opts.context, {
      reglOptions: ({reglOptions}) => {
        reglOptions = extend.command(reglOptions, opts)
        if (reglOptions.context && 'reglOptions' in reglOptions.context) {
          delete reglOptions.context.reglOptions
        }
        return reglOptions
      }
    })
    return regl(opts)
  }
}

function compose(regl, commands) {
  assert('function' == typeof regl,
         "regl-trampoline: Expecting regl constructor function.")
  assert(Array.isArray(commands),
         "regl-trampoline: Expecting array of regl commands.")
  regl = wrap(regl)
  const getContext = regl({})
  const opts = {}
  let command = null
  exec(noop)
  return Object.assign(exec, {commands})
  function exec(args, done) {
    let ret = null
    if ('function' == typeof args) {
      done = args
      args = {}
    }
    return 'function' == typeof command ? callback() : next(0).run()
    function next(index) {
      return index >= commands.length
        ? trampa.wrap(callback())
        : trampa.lazy(step)
      function step() {
        if ('object' == typeof commands[index]) {
          commands[index] = regl(commands[index])
        }

        if ('function' != typeof commands[index]) {
          ret = next(++index)
        } else {
          commands[index](args, () => {
            // command[i] may be a faux regl command so we capture
            // the regl context explicitly with regl
            getContext(copy)
            ret = next(++index)
          })
        }
        return ret
      }
    }

    function copy(ctx) {
      Object.assign(opts, extend.command(opts, ctx.reglOptions))
    }

    function callback() {
      if (null == command) { command = regl(opts) }
      if (args && 'object' == typeof args) {
        return command(args, done)
      } else if ('function' == typeof done) {
        return command(done)
      } else {
        return command()
      }
    }
  }
}

module.exports = {
  compose, wrap
}
