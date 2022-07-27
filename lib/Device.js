'use strict';

const Homey = require('homey');
const Client = require('./Client');

class Device extends Homey.Device {

  /*
  | Device events
  */

  // Device added
  onAdded() {
    this.log('Added');
  }

  // Device deleted
  onDeleted() {
    // Stop timer
    this.stopTimer();

    this.log('Deleted');
  }

  // Device initialized
  async onInit() {
    // Migrate settings
    await this.migrate();

    // Wait for driver to become ready
    await this.driver.ready();

    // Start timer
    this.startTimer();

    this.log('Initialized');

    // Synchronize device
    await this.sync();
  }

  // Settings changed
  async onSettings({oldSettings, newSettings, changedKeys}) {
    for (const name of changedKeys) {
      // Do not log password changes
      if (name === 'pass') {
        continue;
      }

      this.log(`Setting '${name}' set '${oldSettings[name]}' => '${newSettings[name]}'`);
    }

    try {
      const client = new Client(newSettings);
      await client.call('LICENSE');
    } catch (err) {
      throw new Error(this.homey.__(err.message));
    }
  }

  // Device destroyed
  async onUninit() {
    // Stop timer
    this.stopTimer();

    this.log('Destroyed');
  }

  /*
  | Synchronization function
  */

  async sync() {
    try {
      // Get API client
      const client = new Client(this.getSettings());
      const driver = this.driver.id;
      const {id} = this.getData();

      const data = await client.getSyncData(id, driver);

      await this.handleSyncData(data);
    } catch (err) {
      const msg = this.homey.__(err.message);

      this.error(msg);
      this.setUnavailable(msg).catch(this.error);
    }
  }

  /*
  | Timer functions
  */

  // Start timer
  startTimer(minutes = null) {
    if (this.timer) {
      return;
    }

    if (!minutes) {
      minutes = 15;
    }

    this.timer = this.homey.setInterval(this.sync.bind(this), (1000 * 60 * minutes));

    this.log(`Timer started with ${minutes} minutes`);
  }

  // Stop timer
  stopTimer() {
    if (!this.timer) {
      return;
    }

    this.homey.clearTimeout(this.timer);
    this.timer = null;

    this.log('Timer stopped');
  }

  /*
  | Support functions
  */

  // Migrate device
  async migrate() {
    if (this.getSetting('user') !== '-') {
      return;
    }

    this.log('Migrate settings');

    const cmd = 'LICENSE';
    const settings = this.getSettings();
    const {host} = settings;

    let client = new Client(settings);

    if (!host.startsWith('https://') && !host.startsWith('http://')) {
      settings.host = `https://${host}`;
      client.host = `https://${host}`;

      client.call(cmd).catch(async () => {
        settings.host = `http://${host}`;
        client.host = `http://${host}`;

        client.call(cmd).catch(async (err) => {
          settings.host = host;

          this.setUnavailable(this.homey.__(err.message)).catch(this.error);
        });
      });

      this.setSettings(settings).catch(this.error);
    }
  }

}

module.exports = Device;
