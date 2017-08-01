/*
  audio.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

import {EventDispatcher, EventObserver} from './event.js'

export default class SoundPlayer {

  constructor(game) {
    this.config = game.config
    this.muted = game.config.debug === true
    this.bgMusic = new Audio()
    this.bgMusic.onended = () => this.playNextTrack()

    this.dispatcher = EventDispatcher.getInstance()
    this.observer = new EventObserver()
    this.observer.addHandler('game/started', () => this.playNextTrack())
    this.observer.addHandler('game/paused', () => this.stopMusic())
    this.observer.addHandler('game/unpaused', () => this.startMusic())
    this.observer.addHandler('audio/toggleMusic', () => this.toggleMusic())
    this.observer.addHandler('audio/skipSong', () => this.playNextTrack())

    const {eventEffectMap} = this.config.sound
    Object.keys(eventEffectMap).forEach(event => {
      const effect = new Audio(eventEffectMap[event]) // closure extends life
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

    this.bgMusic.src = tracks[trackNo]
    this.startMusic()
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
