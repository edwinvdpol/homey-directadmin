'use strict';

const Homey = require('homey');
const {Log} = require('homey-log');

class App extends Homey.App {

  // Application initialized
  async onInit() {
    // Register event listeners
    this.homey.on('unload', this.onUnload.bind(this));

    // Sentry logging
    this.homeyLog = new Log({homey: this.homey});

    this.log('Initialized');
  }

  // Application destroyed
  async onUninit() {
    this.log('Destroyed');
  }

  // Application unload
  async onUnload() {
    this.log('Unloaded');
  }

}

module.exports = App;
