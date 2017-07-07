

export default class Input {

  constructor(game) {
    this.game = game
    this.keyCodeEventMap = game.config.input.keyCodeEventMap
    document.addEventListener('keydown', event => {
      this.handleInput(event)
    })
  }

  handleInput(event) {
    if (event.altKey || event.ctrKey || event.metaKey) {
      return
    }
    else if (event.keyCode in this.keyCodeEventMap) {
      this.game.eventDispatcher.dispatch(
        new Event(this.keyCodeEventMap[event.keyCode])
      )
    }
  }

}
