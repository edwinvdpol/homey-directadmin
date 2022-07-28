'use strict';

const Homey = require('homey');

class Driver extends Homey.Driver {

  // Driver initialized
  async onInit() {
    this.log('Initialized');
  }

  // Return connect settings
  getConnectSettings(data) {
    // Remove trailing slash
    if (data.host.slice(-1) === '/') {
      data.host = data.host.slice(0, -1);
    }

    return {
      host: data.host,
      port: Number(data.port) || 2222,
      user: data.user,
      pass: data.pass
    };
  }

  // Return data to create the device
  getDeviceData(data) {
    return {
      name: data.name,
      data: {
        id: data.id
      },
      settings: this.getConnectSettings(data)
    };
  }

}

module.exports = Driver;
