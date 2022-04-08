'use strict';

const Homey = require('homey');
const qs = require('querystring');
const Api = require('./Api');

class App extends Homey.App {

  // App initialized
  async onInit() {
    // Initiate API client
    if (!this.client) {
      this.client = new Api({ homey: this.homey });
    }

    // Register actions, condition flow cards and event listeners
    await this.registerEventListeners();
  }

  // Register event listeners
  async registerEventListeners() {
    this.homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    }).on('unload', () => {
      this.client = null;

      this.log('-- Unloaded! --');
    });
  }

}

module.exports = App;
