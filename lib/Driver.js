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

  /*
  | Pairing functions
  */

  // Return store data
  getStoreData(device) {
    return {
      host: device.host,
      port: Number(device.port) || 2222,
      user: device.user,
      pass: device.pass,
    };
  }

}

module.exports = Driver;
