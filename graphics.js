class Graphics {

  constructor(game) {
    const graphics = game.config.graphics
    this.canvas = game.canvas
    this.context = game.context
    this.gridSize = graphics.gridSize
    this.scale = graphics.tileScale
    this.colours = graphics.tetrominos.colours
  }

  drawTile(x, y, scale, colour) {
    [x, y] = [x*scale, y*scale]
    this.context.fillStyle = colour
    this.context.fillRect(x, y, scale, scale)
    this.context.strokeStyle = 'white'
    this.context.lineWidth = 1
    this.context.strokeRect(x, y, scale, scale)
  }

  drawTiles(tiles, pos = {x: 0, y: 0}) {
    tiles.forEach((row, yOffset) => {
      row.forEach((value, xOffset) => {
        if (value) {
          this.drawTile(
            pos.x + xOffset,
            pos.y + yOffset,
            this.scale,
            this.colours[value-1])
        }
      })
    })
  }

}
