'use strict';

const Homey = require('homey');

class Driver extends Homey.Driver {

  // Driver initialized
  async onInit() {
    this.log('Driver initialized');
  }

  // Get connect settings
  getConnectSettings(data) {
    return {
      host: data.host,
      port: Number(data.port) || 2222,
      user: data.user,
      pass: data.pass
    };
  }

  // Get data to create the device
  getDeviceData(data) {
    return {
      name: data.name,
      data: {
        id: data.id
      },
      settings: this.getConnectSettings(data)
    };
  }

  // Make API call
  async call(cmd, settings, query = {}) {
    return this.homey.app.client.call(cmd, settings, query);
  }

}

module.exports = Driver;
