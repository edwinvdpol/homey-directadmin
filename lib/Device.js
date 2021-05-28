'use strict';

const Homey = require('homey');

const refreshDeviceInterval = 1000 * 60 * 15; // 15 minutes

class Device extends Homey.Device {

  // Initialized
  async onInit() {
    // Set refresh timer
    this._refreshTimer = this.homey.setInterval(this.syncDevice.bind(this), refreshDeviceInterval);

    // Update server data
    await this.syncDevice();
  }

  // Deleted
  onDeleted() {
    this.homey.clearInterval(this._refreshTimer);
    this._refreshTimer = null;

    this.log('Device is deleted');
  }

}

module.exports = Device;
