'use strict'
const trampoline = require('./')
const regl = trampoline.wrap(require('regl')())

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

console.log(drawTriangle);

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
