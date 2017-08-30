/*
  util.js

  Author:  J. Tristan Bayfield
  Created: June 29, 2017
  License: GPLv3
*/

export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function getCanvas(className, index=0) {
  return document.getElementsByClassName(className)[index]
}

export function getContext(canvas, type='2d') {
  return canvas.getContext(type)
}

export function zeroMatrix(width, height) {
  return Array(height || width).fill().map(() => Array(width).fill(0))
}

export function onesMatrix(width, height) {
  return Array(height || width).fill().map(() => Array(width).fill(1))
}

export class Point {
  constructor(x=0, y=0) {
    Object.assign(this, {x: x, y: y})
  }
}

export class Rect {
  constructor(x=0, y=0, w=1, h=1) {
    Object.assign(this, {x:x, y:y, w:w, h:h, x1:x, y1:y, x2:x+w, y2:y+h})
  }
}
