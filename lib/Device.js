'use strict';

const Homey = require('homey');
const Client = require('./Client');
const { blank, filled } = require('./Utils');
const Data = require('./Data');

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
    let data;
    let raw;

    try {
      this.log('[Sync] Get instance data');

      // Get API client
      client = new Client(this.getStore());
      raw = await client.getSyncData(this.getData().id, this.driver.id);

      // Create data object
      data = new Data(raw);

      // Check if data is valid
      if (blank(data)) return;

      this.log('[Sync]', JSON.stringify(data));

      // Synchronize data
      await this.syncCapabilityValues(data);
      await this.syncSettings(data);

      // Handle sync data
      await this.handleSyncData(data);

      this.setAvailable().catch(this.error);
    } catch (err) {
      const msg = this.homey.__(err.message);

      this.error('[Sync]', err.message);
      this.setUnavailable(msg).catch(this.error);
    } finally {
      client = null;
      data = null;
      raw = null;
    }
  }

  // Set capability values
  async syncCapabilityValues(data) {
    for (const name of this.getCapabilities()) {
      if (name in data && data[name] !== this.getCapabilityValue(name)) {
        this.setCapabilityValue(name, data[name]).catch(this.error);
        this.log(`[Sync] Device changed capability '${name}' to '${data[name]}'`);
      }
    }

    data = null;
  }

  // Synchronize settings
  async syncSettings(data) {
    let settings = {};

    for (const [name, old] of Object.entries(this.getSettings())) {
      if (name in data && old !== data[name]) {
        this.log(`Device changed setting '${name}' to '${data[name]}'`);
        settings[name] = data[name];
      }
    }

    if (filled(settings)) {
      this.setSettings(settings).catch(this.error);
    }

    settings = null;
    data = null;
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
