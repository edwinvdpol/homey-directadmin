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
    this.unregisterTimer();

    this.log('Deleted');
  }

  // Device initialized
  async onInit() {
    // Register timer
    this.registerTimer();

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
      result = await client.getSyncData(this.getData(), this.driver.id);

      await this.handleSyncData(result);
    } catch (err) {
      const msg = this.homey.__(err.message);

      this.error('[Sync]', err.toString());
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
  registerTimer() {
    if (this.syncDeviceTimer) return;

    const interval = 1000 * 60 * this.constructor.SYNC_INTERVAL;

    this.syncDeviceTimer = this.homey.setInterval(this.sync.bind(this), interval);

    this.log('[Timer] Registered');
  }

  // Unregister timer
  unregisterTimer() {
    if (!this.syncDeviceTimer) return;

    this.homey.clearInterval(this.syncDeviceTimer);

    this.syncDeviceTimer = null;

    this.log('[Timer] Unregistered');
  }

}

module.exports = Device;
