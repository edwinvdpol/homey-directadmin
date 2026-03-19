'use strict';

const Homey = require('homey');

class Driver extends Homey.Driver {

  /*
  | Driver events
  */

  // Driver initialized
  async onInit() {
    this.log('Initialized');
  }

  // Driver destroyed
  async onUninit() {
    this.log('Destroyed');
  }

}

module.exports = Driver;
