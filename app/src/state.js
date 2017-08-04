/*
  fsm.js

  Author:  J. Tristan Bayfield
  Created: July 22, 2017
  License: GPLv3
*/

import config from './config.js'
import {EventDispatcher, EventObserver} from './event.js'
import InputHander from './input.js'

class Transition {
  constructor(event, source, target) {
    this.event = event
    this.source = source
    this.target = target
  }
}

export class State {

  constructor(stateMachine, inputContext = {}) {
    this.machine = stateMachine
    this.context = inputContext
    this.input = new InputHander(this, {consumeEvents: true})
    this.dispatcher = EventDispatcher.getInstance();
    this.observer = new EventObserver()
  }

  get name() {
    return this._name || 'undefined'
  }

  _addTransition(transition, handler) {
    this.observer.addHandler(transition, () =>
      handler.call(this.machine, transition))
    this.dispatcher.subscribe(transition, this.observer)
  }

  addChangeTransition(transition) {
    this._addTransition(transition, this.machine.changeState)
  }

  addPushTransition(transition) {
    this._addTransition(transition, this.machine.pushState)
  }

  addPopTransition(transition) {
    this._addTransition(transition, this.machine.popState)
  }

  /* Methods overridden by subclass */

  enter() {
    config.debug && console.log('entering ' + this.name)
  }
  exit() {
    config.debug && console.log('exiting '  + this.name)
  }
  update(dt) { }
  draw()     { }
  resize()   { }
}

export class StateMachine {

  constructor(options = {}) {

    // assign option defaults
    const defaults = {
      initialState: options.initialState || 'default',
      states: (options.states || { 'default': State }),
      transitions: (options.transitions || [])
    }

    // prepare states dict
    const states = Object.entries(defaults.states).reduce((states, state) => {
      const [name, ctor] = state
      states[name] = Object.assign(new ctor(this), {_name: name})
      return states
    }, {})
    states.initialState = states[defaults.initialState]

    // prepare transitions dict
    const transitions = defaults.transitions.reduce((transitions, triplet) => {
      const [event, source, target] = triplet
      transitions[event] = new Transition(event, states[source], states[target])
      return transitions
    }, {})

    // init this
    Object.assign(this, defaults, {states, transitions, _state: []})

    // startup the machine
    this._push(states.initialState)
    this.state.enter()
  }

  get state() {
    return this._state[this._state.length - 1]
  }

  get source() {
    return this._source || {}
  }

  set source(state) {
    this._source = state
  }

  // get target() {
  //   return this._target || {}
  // }
  //
  // set target(state) {
  //   return this._target
  // }

  enterCurrentState() {
    this.state && this.state.enter()
  }

  exitCurrentState() {
    this.state && this.state.exit()
  }

  _push(state) {
    this._state.push(state)
  }

  _pop() {
    return this.source = this._state.pop()
  }

  changeState(transition) {
    if (transition in this.transitions) {
      this.exitCurrentState()
      this._pop()
      this._push(this.transitions[transition].target)
      this.enterCurrentState()
    }
  }

  pushState(transition) {
    if (transition in this.transitions) {
      this.exitCurrentState()
      this._push(this.transitions[transition].target)
      this.enterCurrentState()
    }
  }

  popState() {
    this.exitCurrentState()
    this._pop()
    this.enterCurrentState()
  }

  // update(dt = 0) {
  //   this.state.update(dt)
  // }
  //
  // draw() {
  //   this._state.forEach(state => state.draw())
  // }
}
