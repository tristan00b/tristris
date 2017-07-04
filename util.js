/*
  util.js

  Author:  J. Tristan Bayfield
  Created: June 29, 2017
  License: GPLv3
*/

function zeroMatrix(width, height) {
  return Array(height || width).fill().map(() => Array(width).fill(0))
}

function identityMatrix(width, height) {
  return Array(height || width).fill().map(() => Array(width).fill(1))
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}
