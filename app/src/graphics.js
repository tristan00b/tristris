export default class Graphics {

  constructor(game) {
    this.scale = game.config.graphics.tileScale
    this.colours = game.config.graphics.tetrominos.colours
  }

  drawTile(context, x, y, scale, colour) {
    [x, y] = [x*scale, y*scale]
    context.fillStyle = colour
    context.fillRect(x, y, scale, scale)
    context.strokeStyle = 'white'
    context.lineWidth = 1
    context.strokeRect(x, y, scale, scale)
  }

  drawTiles(context, tiles, pos = {x: 0, y: 0}) {
    tiles.forEach((row, yOffset) => {
      row.forEach((value, xOffset) => {
        if (value) {
          this.drawTile(
            context,
            pos.x + xOffset,
            pos.y + yOffset,
            this.scale,
            this.colours[value-1])
        }
      })
    })
  }

}
