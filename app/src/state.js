/*
  fsm.js

  Author:  J. Tristan Bayfield
  Created: July 22, 2017
  License: GPLv3
*/

import {EventDispatcher, EventObserver} from './event.js'
import InputHander from './input.js'


class Transition {
  constructor(event, source, target) {
    this.event  = event
    this.source = source
    this.target = target
  }
}

export class State {

  constructor(stateMachine, config, inputScope) {
    this._name        = ''
    this.config       = config
    this.dispatcher   = EventDispatcher.getInstance()
    this.input        = new InputHander({ scope: inputScope,  consumesEvents: true })
    this.stateMachine = stateMachine
  }

  get name() {
    return this._name
  }



  /* Methods overridden by subclass */

  enter() {
    this.input.startListening()
    this.config.debug && console.log('entering ' + this.name)
  }
  exit() {
    this.input.stopListening()
    this.config.debug && console.log('exiting '  + this.name)
  }
  update(dt) { }
  draw()     { }
  resize()   { }
}

export class StateMachine {

  constructor(game, options = {}) {
    this.observer   = new EventObserver()
    this.dispatcher = EventDispatcher.getInstance()

    // assign option defaults
    const defaults = {
      initialState: options.initialState || 'default',
      states: (options.states || { 'default': State }),
      transitions: (options.transitions || [])
    }

    // prepare states dict
    const states = Object.entries(defaults.states).reduce((states, state) => {
      const [name, ctor] = state
      states[name] = Object.assign(new ctor(game, this), {_name: name})
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

  _push(state) {
    this._state.push(state)
  }

  _pop() {
    return this.source = this._state.pop()
  }

  pushState(transition) {
    if (transition in this.transitions) {
      this.exitState()
      this._push(this.transitions[transition].target)
      this.enterState()
    }
  }

  popState() {
    this.exitState()
    this._pop()
    this.enterState()
  }

  _addTransition(transition, handler) {
    this.observer.addHandler(transition, () =>
      handler.call(this.stateMachine, transition))
    this.dispatcher.subscribe(transition, this.observer)
  }

  addChangeTransition(transition) {
    this._addTransition(transition, this.stateMachine.changeState)
  }

  addPushTransition(transition) {
    this._addTransition(transition, this.stateMachine.pushState)
  }

  addPopTransition(transition) {
    this._addTransition(transition, this.stateMachine.popState)
  }

  enterState() {
    this.state && this.state.enter()
  }

  exitState() {
    this.state && this.state.exit()
  }
  changeState(transition) {
    if (transition in this.transitions) {
      this.exitState()
      this._pop()
      this._push(this.transitions[transition].target)
      this.enterState()
    }
  }

}
