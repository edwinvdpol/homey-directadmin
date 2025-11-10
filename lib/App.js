'use strict';

const Homey = require('homey');

class App extends Homey.App {

  /*
  | Application events
  */

  // Application initialized
  async onInit() {
    this.log('Initialized');
  }

  // Application destroyed
  async onUninit() {
    this.log('Destroyed');
  }

}

module.exports = App;
