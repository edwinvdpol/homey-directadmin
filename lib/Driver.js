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

  /*
  | Pairing functions
  */

  // Return connect settings
  getConnectSettings(device) {
    // Remove trailing slash
    if (device.host.slice(-1) === '/') {
      device.host = device.host.slice(0, -1);
    }

    return {
      host: device.host,
      port: Number(device.port) || 2222,
      user: device.user,
      pass: device.pass,
    };
  }

  // Return data to create the device
  getDeviceData(device) {
    const data = {
      name: device.name,
      data: {
        id: device.id,
      },
      settings: this.getConnectSettings(device),
    };

    this.log('Device found', JSON.stringify(data));

    return data;
  }

}

module.exports = Driver;
