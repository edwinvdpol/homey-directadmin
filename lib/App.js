'use strict';

const Homey = require('homey');
const Api = require('./Api');
const {Log} = require('homey-log');

class App extends Homey.App {

  // Application initialized
  async onInit() {
    // Register event listeners
    this.homey.on('unload', this.onUnload.bind(this));

    // Sentry logging
    this.homeyLog = new Log({homey: this.homey});

    // Initiate API client
    this.client = new Api({homey: this.homey});

    this.log('Application initialized');
  }

  // Application destroyed
  async onUninit() {
    this.clean();

    this.log('Application destroyed');
  }

  // Application unload
  async onUnload() {
    this.clean();

    this.log('Application unloaded');
  }

  // Clean application data
  clean() {
    if (this.client) {
      this.client.removeAllListeners();
    }

    this.client = null;

    this.log('Application data cleaned');
  }

}

module.exports = App;
