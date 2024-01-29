'use strict';

const Homey = require('homey');
const Client = require('./Client');

class Device extends Homey.Device {

  static SYNC_INTERVAL = 15; // Minutes

  /*
  | Device events
  */

  // Device added
  onAdded() {
    this.log('Added');
  }

  // Device deleted
  onDeleted() {
    // Unregister timer
    this.unregisterTimer().catch(this.error);

    this.log('Deleted');
  }

  // Device initialized
  async onInit() {
    // Migrate settings
    await this.migrate();

    // Register timer
    await this.registerTimer();

    // Synchronize device
    await this.sync();

    this.log('Initialized');
  }

  // Device settings changed
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Updating settings');

    for (const name of changedKeys) {
      // Do not log password changes
      if (name === 'pass') {
        continue;
      }

      this.log(`Setting '${name}' is now '${newSettings[name]}'`);
    }

    let client;

    try {
      client = new Client(newSettings);
      await client.call('LICENSE');
    } catch (err) {
      throw new Error(this.homey.__(err.message));
    } finally {
      client = null;
    }
  }

  // Device destroyed
  async onUninit() {
    this.log('Destroyed');
  }

  /*
  | Synchronization function
  */

  // Synchronize
  async sync() {
    let client;
    let result;

    try {
      // Get API client
      client = new Client(this.getSettings());
      const { id } = this.getData();

      result = await client.getSyncData(id, this.driver.id);

      await this.handleSyncData(result);
    } catch (err) {
      const msg = this.homey.__(err.message);

      this.error(msg);
      this.setUnavailable(msg).catch(this.error);
    } finally {
      client = null;
      result = null;
    }
  }

  /*
  | Timer functions
  */

  // Register timer
  async registerTimer() {
    if (this.syncDeviceTimer) return;

    this.syncDeviceTimer = this.homey.setInterval(this.sync.bind(this), (1000 * 60 * this.constructor.SYNC_INTERVAL));

    this.log('[Timer] Registered');
  }

  // Unregister timer
  async unregisterTimer() {
    if (!this.syncDeviceTimer) return;

    this.homey.clearInterval(this.syncDeviceTimer);

    this.syncDeviceTimer = null;

    this.log('[Timer] Unregistered');
  }

  /*
  | Support functions
  */

  // Migrate device
  async migrate() {
    if (this.getSetting('user') !== '-') return;

    let settings = this.getSettings();
    let { host } = settings;
    let client = new Client(settings);

    if (!host.startsWith('https://') && !host.startsWith('http://')) {
      settings.host = `https://${host}`;
      client.host = `https://${host}`;

      await client.call('LICENSE').catch(async () => {
        settings.host = `http://${host}`;
        client.host = `http://${host}`;

        await client.call('LICENSE').catch(async (err) => {
          settings.host = host;

          this.setUnavailable(this.homey.__(err.message)).catch(this.error);
        });
      });

      this.setSettings(settings).catch(this.error);
    }

    settings = null;
    client = null;
    host = null;

    this.log('Migrated');
  }

}

module.exports = Device;
