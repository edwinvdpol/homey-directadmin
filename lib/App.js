'use strict';

const Homey = require('homey');
const { Log } = require('homey-log');

class App extends Homey.App {

  /*
  | Application events
  */

  // Application initialized
  async onInit() {
    // Sentry logging
    this.homeyLog = new Log({ homey: this.homey });

    this.log('Initialized');
  }

  // Application destroyed
  async onUninit() {
    this.log('Destroyed');
  }

}

module.exports = App;
