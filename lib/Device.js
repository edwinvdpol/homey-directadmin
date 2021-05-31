'use strict';

const Homey = require('homey');

class Device extends Homey.Device {

  static REFRESHINTERVAL = 15; // Minutes

  // Initialized
  async onInit() {
    // Migrate to credentials in settings
    if (this.getSetting('host') === '-') {
      this.log('Migrate settings');

      await this.migrateSettings();
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

  // Migrate data to settings
  async migrateSettings() {
    const old = this.getData();
    const data = {
      host: old.url,
      port: Number(old.port),
      user: old.username,
      pass: old.password,
    };

    const { host } = data;

    if (!data.host.startsWith('https://') && !data.host.startsWith('http://')) {
      data.host = `https://${host}`;

      await this.homey.app.version(data).catch(async () => {
        data.host = `http://${host}`;

        await this.homey.app.version(data).catch(async err => {
          data.host = host;

          await this.setSettings(data);

          return this.setUnavailable(err.message);
        });
      });

      await this.setSettings(data);
    }
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
