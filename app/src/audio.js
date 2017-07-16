/*
  audio.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

import {EventObserver} from './event.js'

export default class SoundPlayer {

  constructor(game) {

    this.config = game.config
    this.muted = game.config.debug === true
    this.bgMusic = new Audio()
    this.bgMusic.onended = () => this.playNextTrack()

    this.dispatcher = game.dispatcher
    this.observer = new EventObserver()
    this.observer.addHandler('tristris/game/started', () => this.playNextTrack())
    this.observer.addHandler('tristris/game/paused', () => this.stopMusic())
    this.observer.addHandler('tristris/game/unpaused', () => this.startMusic())
    this.observer.addHandler('tristris/audio/toggleMusic', () => this.toggleMusic())
    this.observer.addHandler('tristris/audio/skipSong', () => this.playNextTrack())

    const m = this.config.sound.eventEffectMap
    Object.keys(m).forEach(event => {
      const effect = new Audio(m[event]) // life extended by closure below
      this.observer.addHandler(event, () => this.playSound(effect))
    })

    this.observer.registerHandlers(this.dispatcher)
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

    this.muted ? this.bgMusic.pause() : this.bgMusic.play()
  }

  startMusic() {
    if (!this.muted) this.bgMusic.play()
  }

  stopMusic() {
    this.bgMusic.pause()
  }

  toggleMusic() {
    (this.muted = !this.muted) ? this.bgMusic.pause() : this.bgMusic.play()
  }

}
