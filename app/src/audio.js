/*
  audio.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

import {EventObserver} from './event.js'

export default class SoundPlayer extends EventObserver {

  constructor(game) {

    super()

    this.config = game.config
    this.muted = false
    this.bgMusic = new Audio()
    this.bgMusic.onended = () => this.playNextTrack()

    let m = this.config.sound.eventEffectMap
    Object.keys(m).forEach(event => {
      const effect = new Audio(m[event]) // life extended by closure below
      this.addHandler(event, () => this.playSound(effect))
    })

    this.addHandler('tetris/game/started', () => this.playNextTrack())
    this.addHandler('tetris/game/paused', () => this.stopMusic())
    this.addHandler('tetris/game/unpaused', () => this.startMusic())
    this.addHandler('tetris/sound/toggleMusic', () => this.toggleMusic())
    this.addHandler('tetris/sound/skipSong', () => this.playNextTrack())
    this.subscribe(game.eventDispatcher)
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

    if (this.muted)
    {
      this.bgMusic.pause()
    }
    else
    {
      this.bgMusic.play()
    }
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
