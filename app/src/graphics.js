/*
  graphics.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

import config from './config.js'
import {getCanvas, getContext, Point, Rect} from './util.js'

export default class Graphics {

  constructor() {
    this.canvas = getCanvas(config.graphics.canvas.id)
    this.context = getContext(this.canvas)
  }

  drawText(string, pos, options = {}) {
    this.context.fillStyle = options.fillStyle || 'white'
    this.context.strokeStyle = options.strokeStyle || 'black'
    this.context.textAlign = options.textAlign || 'left'
    this.context.lineWidth = options.lineWidth || 1
    this.context.font = options.font || '12px Verdana'
    options.maxWidth = options.maxWidth || this.canvas.width

    this.context.fillText(string, pos.x, pos.y, options.maxWidth)
    if (options.strokeStyle)
      this.context.strokeText(string, pos.x, pos.y, options.maxWidth)
  }

  drawRoundedRect(rect, radius, options = {}) {
    this.context.fillStyle = options.fillStyle || 'white'
    this.context.strokeStyle = options.strokeStyle || 'black'
    this.context.globalAlpha = options.globalAlpha || 1.0
    this.context.lineWidth = options.lineWidth || 1

    const {x1, y1, x2, y2} = rect
    this.context.beginPath()
    this.context.moveTo(x1+radius, y1)
    this.context.lineTo(x2-radius, y1)
    this.context.quadraticCurveTo(x2, y1, x2, y1+radius)
    this.context.lineTo(x2, y2-radius)
    this.context.quadraticCurveTo(x2, y2, x2-radius, y2)
    this.context.lineTo(x1+radius, y2)
    this.context.quadraticCurveTo(x1, y2, x1, y2-radius)
    this.context.lineTo(x1, y1+radius)
    this.context.quadraticCurveTo(x1, y1, x1+radius, y1)
    this.context.closePath();
    this.context.fill();
    if (options.strokeStyle)
      this.context.stroke()
  }

  drawBorder(rect, options = {}) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width  = rect.w + 2*options.lineWidth
    canvas.height = rect.h + 2*options.lineWidth
    context.fillStyle = options.strokeStyle || 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.clearRect(options.lineWidth, options.lineWidth, rect.w, rect.h)
    this.context.globalAlpha = options.globalAlpha || 1.0
    this.context.drawImage(canvas, rect.x - options.lineWidth, rect.y - options.lineWidth)
  }

  drawTile(pos, options) {
    this.context.globalAlpha = options.alpha
    this.context.fillStyle = options.fillStyle
    this.context.strokeStyle = options.strokeStyle
    this.context.lineWidth = options.alpha
    this.context.fillRect(pos.x, pos.y, options.scale, options.scale)
    this.context.strokeRect(pos.x, pos.y, options.scale, options.scale)
  }

  drawTiles(array, options = {}) {
    const opt = Object.assign({
      pos: new Point(),
      origin: new Point(),
      scale: config.graphics.tileScale,
      strokeStyle: 'white',
      alpha: 1.0,
      tileFilter: () => false
    }, options)

    array.forEach((row, yOffset) => {
      row.forEach((value, xOffset) => {
        const pos = new Point(opt.pos.x + xOffset, opt.pos.y + yOffset)
        if (!value || opt.tileFilter(pos)) return
        opt.fillStyle = options.fillStyle
          ? options.fillStyle
          : config.tetrominos.colours[value - 1]
        pos.x = pos.x*opt.scale + opt.origin.x
        pos.y = pos.y*opt.scale + opt.origin.y
        this.drawTile(pos, opt)
      })
    })
  }

}
