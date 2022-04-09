'use strict';

const Homey = require('homey');

class Device extends Homey.Device {

  static REFRESH_INTERVAL = 15; // Minutes

  /*
  |-----------------------------------------------------------------------------
  | Device events
  |-----------------------------------------------------------------------------
  */

  // Device initialized
  async onInit() {
    this.log('Device initialized');

    // Migrate to credentials in settings
    if (this.getSetting('host') === '-') {
      await this.migrateSettings();
    }

    // Update server data
    await this.syncDevice();

    // Refresh timer
    this.setRefreshTimer(this.constructor.REFRESH_INTERVAL).catch(this.error);
  }

  // Device uninitialized
  async onUninit() {
    this.log('Device uninitialized');

    // Stop timer
    this.setRefreshTimer().catch(this.error);
  }

  // Settings changed
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    changedKeys.forEach(name => {
      // Do not log password changes
      if (name !== 'pass') {
        this.log(`Setting '${name}' set '${oldSettings[name]}' => '${newSettings[name]}'`);
      }
    });

    await this.homey.app.client.call('LICENSE', newSettings);
  }

  // Deleted
  onDeleted() {
    this.log('Device is deleted');

    this.setRefreshTimer().catch(this.error);
  }

  /*
  |-----------------------------------------------------------------------------
  | Support functions
  |-----------------------------------------------------------------------------
  */

  // Migrate data to settings
  async migrateSettings() {
    this.log('Migrate settings');

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

      this.homey.app.client.call('LICENSE', data).catch(async () => {
        data.host = `http://${host}`;

        this.homey.app.client.call('LICENSE', data).catch(async (err) => {
          data.host = host;

          this.setUnavailable(err.message).catch(this.error);
        });
      });

      this.setSettings(data).catch(this.error);
    }
  }

  // Refresh interval timer
  async setRefreshTimer(minutes = 0) {
    if (this.refreshTimer) {
      this.homey.clearInterval(this.refreshTimer);

      this.refreshTimer = null;

      this.log('Refresh timer stopped');
    }

    if (minutes === 0) {
      return;
    }

    this.refreshTimer = this.homey.setInterval(this.syncDevice.bind(this), (1000 * 60 * minutes));

    this.log(`Refresh interval set to ${minutes} minutes`);
  }

}

module.exports = Device;
