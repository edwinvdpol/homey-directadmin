'use strict';

const Homey = require('homey');
const Api = require('./lib/Api');

class App extends Homey.App {

  // Initialized
  async onInit() {
    this.log('DirectAdmin App running...');

    // Initiate API client
    if (!this.client) {
      this.client = new Api({ homey: this.homey });
    }

    // Event listeners
    this.homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    }).on('unload', () => {
      this.client = null;

      this.log('-- Unloaded! _o/ --');
    });
  }

}

module.exports = App;
