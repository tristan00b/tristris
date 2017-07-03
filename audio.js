/*
  audio.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

class SoundPlayer extends EventObserver {

  constructor(game) {

    super();

    this.config = game.config
    this.muted = false
    this.bgMusic = new Audio()
    this.bgMusic.onended = () => this.playNextTrack()

    this.eventHandlers = {
      'tetris/game/started': () => this.playNextTrack(),
      'tetris/game/paused': () => this.stopMusic(),
      'tetris/game/unpaused': () => this.startMusic(),
      'tetris/sound/toggleMusic': () => this.toggleMusic(),
      'tetris/sound/skipSong': () => this.playNextTrack(),
    }

    // Extend eventHandlers to include sound effects
    let m = this.config.sound.eventEffectMap
    Object.keys(m).forEach(event => {
      const effect = new Audio(m[event]) // life extended by closure below
      this.eventHandlers[event] = () => this.playSound(effect)
    })

    game.eventDispatcher.subscribeAll(this.eventHandlers, this)
  }

  playSound(sound) {
    sound.cloneNode().play();
  }

  playNextTrack() {
    // Choose a random track to play, then play it
    const tracks = this.config.sound.tracks
    const numTracks = tracks.length
    const trackNo = Math.random()*numTracks | 0
    const file = tracks[trackNo]
    console.log('playing: ' + file)
    this.bgMusic.src = file
    this.bgMusic.play()
  }

  startMusic() {
    if (!this.muted) this.bgMusic.play()
  }

  stopMusic() {
    this.bgMusic.pause()
  }

  toggleMusic() {
    (this.muted = !this.muted)
    ? this.bgMusic.pause()
    : this.bgMusic.play()
  }
}
