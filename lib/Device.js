'use strict';

const Homey = require('homey');
const Client = require('./Client');
const { blank } = require('./Utils');

class Device extends Homey.Device {

  static SYNC_INTERVAL = 15; // Minutes

  /*
  | Device events
  */

  // Device added
  async onAdded() {
    this.log('Added');
  }

  // Device deleted
  async onDeleted() {
    this.log('Deleted');
  }

  // Device initialized
  async onInit() {
    // Connecting to API
    await this.setUnavailable(this.homey.__('authentication.connecting'));

    // Migrate settings to store
    await this.migrate();

    // Register timer
    this.registerTimer();

    // Synchronize device
    await this.sync();

    this.log('Initialized');
  }

  // Device destroyed
  async onUninit() {
    // Unregister timer
    this.unregisterTimer();

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
      this.log('[Sync] Get instance data');

      // Get API client
      client = new Client(this.getStore());
      result = await client.getSyncData(this.getData().id, this.driver.id);

      await this.handleSyncData(result);

      this.setAvailable().catch(this.error);
    } catch (err) {
      const msg = this.homey.__(err.message);

      this.error('[Sync]', err.toString());
      this.setUnavailable(msg).catch(this.error);
    } finally {
      client = null;
      result = null;
    }
  }

  // Handle sync data
  async handleSyncData(data) {
    //
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

  /*
  | Support functions
  */

  async setStoreValues(values) {
    if (blank(values)) return;

    for (const [key, value] of Object.entries(values)) {
      await this.setStoreValue(key, value);
    }

    this.log('[Store] Values updated');
  }

  async migrate() {
    let current = this.getSettings();

    // Already migrated
    if (!('host' in current)) return;
    if (blank(current.host)) return;

    // Migrate
    this.log('[Migrate] Started');

    let settings = {};
    let store = {};

    const remove = [
      'email_accounts', 'email_quota',
      'domain_quota', 'domain_bandwidth',
    ];

    const makeEmpty = [
      'host', 'port', 'user', 'pass',
    ];

    for (const [key, value] of Object.entries(current)) {
      if (!makeEmpty.includes(key) && !remove.includes(key)) continue;

      settings[key] = null;

      if (!makeEmpty.includes(key)) continue;

      store[key] = value;
    }

    this.setSettings(settings).catch(this.error);
    await this.setStoreValues(store);

    current = null;
    settings = null;
    store = null;

    this.log('[Migrate] Finished');
  }

}

module.exports = Device;
