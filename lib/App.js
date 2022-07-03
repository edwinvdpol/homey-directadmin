'use strict';

const Homey = require('homey');
const Api = require('./Api');
const {Log} = require('homey-log');

class App extends Homey.App {

  // App initialized
  async onInit() {
    // Sentry logging
    this.homeyLog = new Log({ homey: this.homey });

    // Initiate API client
    this.client = new Api({ homey: this.homey });

    // Register actions, condition flow cards and event listeners
    await this.registerEventListeners();
  }

  // Register event listeners
  async registerEventListeners() {
    this.homey.on('unload', () => {
      this.client = null;
    });
  }

}

module.exports = App;
