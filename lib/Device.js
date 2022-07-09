'use strict';

const Homey = require('homey');

class Device extends Homey.Device {

  /*
  | Device events
  */

  // Device added
  onAdded() {
    this.log('Device added');
  }

  // Device deleted
  onDeleted() {
    // Stop timer
    this.stopTimer().catch(this.error);

    // Remove event listeners
    this.removeEventListeners();

    this.log('Device deleted');
  }

  // Device initialized
  async onInit() {
    // Migrate settings
    this.migrate().catch(this.error);

    // Wait for driver to become ready
    await this.driver.ready();

    // Register event listeners
    this.registerEventListeners();

    // Start timer
    this.startTimer().catch(this.error);

    this.log('Device initialized');

    // Sync device data
    this.sync();
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

    await this.call('LICENSE', newSettings);
  }

  /*
  | Synchronization functions
  */

  // Make API call
  async call(cmd, settings = null, params = {}) {
    if (!settings) {
      settings = this.getSettings();
    }

    return this.homey.app.client.call(cmd, settings, params);
  }

  // Synchronize device
  sync() {
    const device = this;

    this.homey.emit('sync', device);
  }

  /*
  | Listener functions
  */

  // Register event listeners
  registerEventListeners() {
    const {id} = this.getData();

    this.onSync = this.handleSyncData.bind(this);
    this.onError = this.setUnavailable.bind(this);

    this.homey.on(`error:${id}`, this.onError);
    this.homey.on(`sync:${id}`, this.onSync);

    this.log('Event listeners registered');
  }

  // Remove event listeners
  removeEventListeners() {
    const {id} = this.getData();

    this.homey.off(`error:${id}`, this.onError);
    this.homey.off(`sync:${id}`, this.onSync);

    this.onError = null;
    this.onSync = null;

    this.log('Event listeners removed');
  }

  /*
  | Timer functions
  */

  // Start timer
  async startTimer(seconds = null) {
    if (this._timer) {
      return;
    }

    if (!seconds) {
      seconds = 15;
    }

    this._timer = this.homey.setInterval(this.sync.bind(this), (1000 * seconds));

    this.log(`Timer started with ${seconds} seconds`);
  }

  // Stop timer
  async stopTimer() {
    if (!this._timer) {
      return;
    }

    this.homey.clearTimeout(this._timer);
    this._timer = null;

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
    const old = this.getData();
    const settings = {
      host: old.url,
      port: Number(old.port),
      user: old.username,
      pass: old.password
    };

    const {host} = settings;

    if (!settings.host.startsWith('https://') && !settings.host.startsWith('http://')) {
      settings.host = `https://${host}`;

      this.call(cmd, settings).catch(async () => {
        settings.host = `http://${host}`;

        this.call(cmd, settings).catch(async (err) => {
          settings.host = host;

          this.setUnavailable(err.message).catch(this.error);
        });
      });

      this.setSettings(settings).catch(this.error);
    }
  }

}

module.exports = Device;
