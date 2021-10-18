import config from '../assets/data/config.json'
import {getCanvas, getContext} from './util.js'
import Graphics from './graphics.js'
import {State} from './state.js'
import {Point, Rect} from './util.js'

class Particle {

  constructor(area) {
    const dist = Math.random()*200
    const angle = Math.random()*Math.PI
    const vel = Math.random() * 0.02

    const xdist = dist*Math.cos(angle)
    const ydist = Math.sign(2*Math.random() - 1) * dist * Math.sin(angle)

    this.x = xdist + area.width/2
    this.y = ydist + area.height/2

    this.vx = vel*Math.cos(angle)
    this.vy = vel*Math.sin(angle) * Math.sign(ydist)

    this.size = 25
    const brightness = 50
    const saturation = 100
    this.color = 'hsl('+Math.sign(ydist)*angle*360/Math.PI+','+saturation+'%,'+brightness+'%)'
  }
}

export default class Title extends State {

  constructor(stateMachine) {
    super(stateMachine, config.input.contexts.title)
    this.addChangeTransition('game/start')
    this.addChangeTransition('game/exitToTitle')

    this.canvas = getCanvas(config.graphics.canvas.id)
    this.context = getContext(this.canvas)
    this.graphics = new Graphics

    this.titleFontSize = 102
    this.fontSize = 22
    this.font = 'eight-bit'

    this.particles = []

    this.time = {
      accumulated: 0,
      step: 750
    }
    this.flags = {
      drawText: true
    }

    this.resize()
  }

  enter() {
    super.enter.call(this)
    this.resize()
  }

  exit() {
    super.exit.call(this)
    this.particles = []
  }

  resize() {
    this.size = {
      width: this.canvas.width,
      height: this.canvas.height
    }
  }

  updateParticles(dt = 0) {

    if (this.particles.length < 500)
      this.particles.push(new Particle(this.size))

    this.particles.forEach(p => {
      p.x += p.vx * dt
      p.y += p.vy * dt
    })

    this.particles = this.particles.filter(p =>
      p.x >= -this.size.width
      && p.x < this.size.width
      && p.y >= -this.size.height
      && p.y < this.size.height
    )
  }

  updateText(dt = 0) {
    const {time} = this
    time.accumulated += dt;
    if (time.accumulated >= time.step) {
      time.accumulated = 0
      this.flags.drawText = !this.flags.drawText
    }
  }

  update(dt = 0) {
    this.updateParticles(dt)
    this.updateText(dt)
  }

  drawText() {

    const options = {
      fillStyle: 'white',
      strokeStyle: 'red',
      lineWidth: 2,
      textAlign: 'center',
      maxWidth: this.size.width-4
    }

    const titleTextPos = new Point(
      0.5*this.size.width,
      0.5*(this.size.height + this.titleFontSize)
    )

    const startTextPos = new Point(
      0.5*this.size.width,
      0.65*(this.size.height + this.fontSize)
    )

    options.font = '' + this.titleFontSize + 'px ' + this.font
    this.graphics.drawText('TRISTRIS', titleTextPos, options )

    if (this.flags.drawText) {
      options.font = this.fontSize + 'px ' + this.font
      this.graphics.drawText('Press enter to start', startTextPos, options)
    }
  }

  drawParticles() {
    this.particles.forEach(p => {
      this.context.fillStyle = p.color
      this.context.fillRect(p.x, p.y, p.size, p.size)
    })
  }

  draw() {
    this.context.clearRect(0, 0, this.size.width, this.size.height)
    this.drawParticles()
    this.drawText()
  }

}
