'use strict'
const { combine, wrap } = require('./')
const bunny = require('bunny')
const regl = wrap(require('regl')())
const mat4 = require('gl-mat4')

for (const p of bunny.positions) {
  p[1] = p[1] - 4
}

const attributes = regl({attributes: {position: bunny.positions}})
const elements = regl({elements: bunny.cells})
const color = regl({uniforms: {color: [0.1, 0.2, 0.3] }})

const projection = regl({
  uniforms: {
    projection: ({viewportWidth: w, viewportHeight: h}) => {
      return mat4.perspective([], 60*Math.PI/180, w/h, 0.01, 1000)
    }
  }
})

const view = regl({
  uniforms: {
    view: ({}, {camera} = {}) => {
      const {position = [0, 0, 10]} = (camera || {})
      return mat4.lookAt([], position, [0, 0, 0], [0, 1, 0])
    }
  }
})

const model = regl({
  uniforms: {
    model: mat4.scale([], mat4.identity([]), [0.5, 0.5, 0.5])
  }
})

const vert = regl({
  vert: `
  precision mediump float;
  uniform mat4 projection;
  uniform mat4 view;
  uniform mat4 model;
  attribute vec3 position;
  void main() {
    gl_Position = projection * view * model * vec4(position, 1.0);
  }
  `
})

const frag = regl({
  frag: `
  precision mediump float;
  uniform vec3 color;
  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
  `
})

const draw = regl({})

const commands = combine(regl,
  [
    projection,
    view,
    model,
    color,
    attributes,
    elements,
    frag,
    vert,
    draw
  ]
)

regl.frame(() => {
  regl.clear({depth: true, color: [0, 0, 0, 1]})
  //commands({camera: {position: [0, 0, 10]}})
  commands()
})
