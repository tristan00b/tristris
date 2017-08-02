/*
  config.js

  Author:  J. Tristan Bayfield
  Created: Aug 1, 2017
  License: GPLv3
*/

import config_data from '../assets/data/config.json'

let config = Object.freeze(Object.assign(config_data, {
  debug: process.env.NODE_ENV !== 'production',
  appVersion: process.env.VERSION,
}));

export default config;
