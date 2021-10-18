/*
  tristris.js

  Author:  J. Tristan Bayfield
  Desc:    Yet another tristrist clone...
  Created: June 23, 2017
  License: GPLv3
*/

import { Point,
         Rect   } from './util.js'
import { State  } from './state.js'
import   Arena    from './arena.js'
import   Player   from './player.js'

export default class Tristris extends State {

  constructor(game, stateMachine) {
    super(stateMachine, game.config, game.config.input.scopes.game)

    this.addPushTransition('game/pause')
    this.addChangeTransition('game/exitToTitle')

    this.observer.addHandler('arena/overflows', () => this.restartGame())
    this.observer.registerHandlers(this.dispatcher)

    this.canvas   = game.graphics.canvas
    this.context  = game.graphics.context
    this.graphics = game.graphics

    const {grid, tileScale} = game.config.graphics
    const self = this

    this.dimensions = {
      tileScale,
      border: 5,
      grid,
      get scale() {
        return Math.floor(Math.min(
          tileScale, self.canvas.width/grid.main.size.w))
      }
    }

    this.arena = new Arena(this)
    this.player = new Player(this)
  }

  resize() {
    const grid   = this.dimensions.grid
    const scale  = this.dimensions.scale
    const border = this.dimensions.border
    let w = 0, h = 0

    w = grid.main.size.w*scale
    h = grid.main.size.h*scale
    grid.main.rect = new Rect(
      0.5*(this.canvas.width - w),
      0.5*(this.canvas.height - h),
      w,
      h
    )

    grid.held.rect = new Rect(
      grid.main.rect.x - (grid.held.size.w)*scale - border*5,
      grid.main.rect.y + scale,
      grid.held.size.w * scale,
      grid.held.size.h * scale
    )

    grid.next.rect = new Rect(
      grid.main.rect.x + grid.main.rect.w + border*5,
      grid.main.rect.y + scale,
      grid.next.size.w * scale,
      grid.next.size.h * scale
    )
  }

  enter() {
    super.enter.call(this)
    this.resize()

    if ('pause' === this.stateMachine.source.name) return

    this.restartGame()
    this.dispatcher.dispatch(new Event('game/started'))
  }

  exit() {
    super.exit.call(this)
    this.dispatcher.dispatch(new Event('game/stopped'))
  }

  update(dt = 0) {
    this.player.update(dt)
    this.arena.update()
  }

  drawBackground() {
    const {grid, border} = this.dimensions
    this.graphics.drawBorder(grid.main.rect, {lineWidth: border})
    this.graphics.drawBorder(grid.held.rect, {lineWidth: border})
    this.graphics.drawBorder(grid.next.rect, {lineWidth: border})
  }

  drawScoreBox() {
    const dim = this.dimensions
    const font = '12px eight-bit'
    const score = `You have ${this.player.score} points` +
      (this.player.score > 100000 ? '!' : '.')

    this.context.font = font

    const options = {
      maxWidth: Math.max(250, this.context.measureText(score).width + 4*dim.border),
      maxHeight: 30,
      cornerRadius: 15,
      fontSize: 12,
      fillStyle: 'red',
      font: font,
      textAlign: 'center'
    }
    const rect = new Rect(
      0.5*this.canvas.width - options.maxWidth - 3*dim.border,
      dim.grid.main.rect.y + dim.grid.main.rect.h + 3*dim.border,
      options.maxWidth,
      options.maxHeight
    )
    this.graphics.drawRoundedRect(rect, options.cornerRadius, options)

    options.fillStyle = 'white'
    rect.x += 0.5*options.maxWidth + dim.border
    rect.y += 0.5*(options.maxHeight + options.fontSize)
    this.graphics.drawText(score, rect, options)
  }

  drawHighscoreBox() {
    const dim = this.dimensions
    const font = '12px eight-bit'
    const score = `Highscore ${this.player.highscore} points` +
      (this.player.score > 100000 ? '!' : '.')

    this.context.font = font

    const options = {
      maxWidth: Math.max(250, this.context.measureText(score).width + 4*dim.border),
      maxHeight: 30,
      cornerRadius: 15,
      fontSize: 12,
      fillStyle: 'red',
      font: font,
      textAlign: 'center'
    }
    const rect = new Rect(
      0.5*this.canvas.width + 3*dim.border,
      dim.grid.main.rect.y + dim.grid.main.rect.h + 3*dim.border,
      options.maxWidth,
      options.maxHeight
    )
    this.graphics.drawRoundedRect(rect, options.cornerRadius, options)

    options.fillStyle = 'white'
    rect.x += 0.5*options.maxWidth + dim.border
    rect.y += 0.5*(options.maxHeight + options.fontSize)
    this.graphics.drawText(score, rect, options)
  }

  drawText() {
    const grid = this.dimensions.grid
    const border = this.dimensions.border
    const options = {
      fillStyle: 'white',
      textAlign: 'center',
      maxWidth: this.canvas.width-4
    }

    const titleTextPos = new Point(
      0.5*this.canvas.width,
      grid.main.rect.y - 4*border
    )

    const heldTextPos = new Point(
      grid.held.rect.x + 0.5*grid.held.rect.w,
      grid.held.rect.y - 3*border
    )

    const nextTextPos = new Point(
      grid.next.rect.x + 0.5*grid.next.rect.w,
      grid.next.rect.y - 3*border
    )

    options.font = '14px eight-bit'
    this.graphics.drawText('TRISTRIS', titleTextPos, options )
    options.font = '12px eight-bit'
    this.graphics.drawText('held', heldTextPos, options )
    this.graphics.drawText('next', nextTextPos, options )
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawBackground()
    this.drawText()
    this.drawScoreBox()
    this.drawHighscoreBox()
    this.player.draw()
    this.arena.draw()
  }

  restartGame() {
    this.dispatcher.dispatch(new Event('game/restarted'))
  }

}
