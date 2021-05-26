'use strict';

const Homey = require('homey');
const Api = require('./Api');

const refreshDeviceInterval = 1000 * 60 * 15; // 15 minutes

class Device extends Homey.Device {

  // Initialized
  async onInit() {
    this.api = new Api(this.getData());

    // Todo: server version check

    // Set refresh timer
    this.refreshTimer = this.homey.setInterval(this.syncDevice.bind(this), refreshDeviceInterval);

    // Update server data
    await this.syncDevice();
  }

  // Added
  onAdded() {
    this.syncDevice();
  }

  // Deleted
  onDeleted() {
    this.homey.clearInterval(this.refreshTimer);

    this.log('Device is deleted');
  }

}

module.exports = Device;
