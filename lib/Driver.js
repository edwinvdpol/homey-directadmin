'use strict';

const Homey = require('homey');

class Driver extends Homey.Driver {

  // Get connect settings
  getConnectSettings(data) {
    return {
      host: data.host,
      port: Number(data.port) || 2222,
      user: data.user,
      pass: data.pass,
    };
  }

  // Get data to create the device
  getCreateData(data) {
    return {
      name: data.name,
      data: {
        id: data.id,
      },
      settings: this.getConnectSettings(data),
    };
  }

}

module.exports = Driver;
