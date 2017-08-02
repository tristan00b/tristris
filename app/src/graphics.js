/*
  graphics.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

import config from './config.js'

export default class Graphics {

  constructor(game) {
    this.scale = config.graphics.tileScale
    this.colours = config.graphics.tetrominos.colours
  }

  drawTile(context, x, y, scale, fillColour, strokeColour, alpha = 1.0) {
    [x, y] = [x*scale, y*scale]
    context.globalAlpha = alpha
    context.fillStyle = fillColour
    context.fillRect(x, y, scale, scale)
    context.strokeStyle = strokeColour
    context.lineWidth = 1
    context.strokeRect(x, y, scale, scale)
  }

  drawTiles(context, tiles, pos = {x: 0, y: 0}) {
    tiles.forEach((row, yOffset) => {
      row.forEach((value, xOffset) => {
        if (value) {
          this.drawTile(context, pos.x + xOffset, pos.y + yOffset,
            this.scale, this.colours[value-1], 'white')
        }
      })
    })
  }

  drawShadow(context, tiles, pos = {x: 0, y: 0}) {
    tiles.forEach((row, yOffset) => {
      row.forEach((value, xOffset) => {
        if (value) {
          this.drawTile(context, pos.x + xOffset, pos.y + yOffset,
            this.scale, '#222', '#444', 0.5)
        }
      })
    })
  }

}
