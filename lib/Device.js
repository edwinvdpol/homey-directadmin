'use strict';

const Homey = require('homey');

class Device extends Homey.Device {

  static REFRESHINTERVAL = 15; // Minutes

  // Initialized
  async onInit() {
    // Migrate to credentials in settings
    if (this.getSetting('host') === '-') {
      this.log('Migrate settings');

      const data = this.getData();

      await this.setSettings({
        host: data.url,
        port: Number(data.port),
        user: data.username,
        pass: data.password,
      });
    }

    // Update server data
    await this.syncDevice();

    // Refresh timer
    this.setRefreshTimer(this.constructor.REFRESHINTERVAL);
  }

  // Settings changed
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    changedKeys.forEach(name => {
      // Do not log password changes
      if (name !== 'pass') {
        this.log(`Setting '${name}' set '${oldSettings[name]}' => '${newSettings[name]}'`);
      }
    });

    await this.homey.app.license(newSettings);
  }

  // Deleted
  onDeleted() {
    this.setRefreshTimer();

    this.log('Device is deleted');
  }

  // Refresh interval timer
  setRefreshTimer(minutes = 0) {
    if (this._refreshTimer) {
      this.homey.clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }

    if (minutes === 0) {
      this.log('Refresh timer stopped');

      return;
    }

    this._refreshTimer = this.homey.setInterval(this.syncDevice.bind(this), (1000 * 60 * minutes));

    this.log(`Refresh interval set to ${minutes} minutes`);
  }

}

module.exports = Device;
