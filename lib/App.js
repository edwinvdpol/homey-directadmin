'use strict';

const Homey = require('homey');
const Client = require('./Client');
const {Log} = require('homey-log');

class App extends Homey.App {

  // Application initialized
  async onInit() {
    // Register event listeners
    this.homey.on('unload', this.onUnload.bind(this));

    // Sentry logging
    this.homeyLog = new Log({homey: this.homey});

    // Initiate API client
    this.client = new Client({homey: this.homey});

    this.log('Initialized');
  }

  // Application destroyed
  async onUninit() {
    this.clean();

    this.log('Destroyed');
  }

  // Application unload
  async onUnload() {
    this.clean();

    this.log('Unloaded');
  }

  // Clean application data
  clean() {
    if (this.client) {
      this.client.removeEventListeners().catch(this.error);
    }

    this.client = null;

    this.log('Data cleaned');
  }

}

module.exports = App;
