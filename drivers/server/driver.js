'use strict';

const Driver = require('../../lib/Driver');
const Client = require('../../lib/Client');

class ServerDriver extends Driver {

  /*
  | Pairing functions
  */

  // Pairing
  async onPair(session) {
    this.log('[Pair] Started');

    const onLogin = async (data) => {
      this.log('[Pair] Connecting to server');

      let store;
      let license;
      let version;
      let client;

      try {
        // Get store data
        store = this.getStoreData(data);

        // Setup client
        client = new Client(store);

        // Get license
        license = await client.call('LICENSE');

        // Get version
        version = Number(license.version.replace(/\./g, ''));

        // Check if the version valid
        if (version < 1580) {
          throw new Error(this.homey.__('error.version', { version: license.version }));
        }

        data.id = license.lid;
        data.name = license.name || `DA v${license.version} server`;

        // Emit create device event
        await session.emit('create', this.getDeviceData(data));
      } catch (err) {
        this.error('[Pair]', err.toString());
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        store = null;
        license = null;
        version = null;
        client = null;
      }
    };

    session.setHandler('login', onLogin);
  }

  /**
   * Repairing
   *
   * @param session
   * @param {ServerDevice|Device} device
   */
  async onRepair(session, device) {
    this.log('[Repair] Session connected');

    const onDisconnect = async () => {
      this.log('[Repair] Session disconnected');
    };

    const onLogin = async (data) => {
      this.log('[Repair] Connecting');

      let store;
      let license;
      let version;
      let client;

      try {
        // Get store data
        store = this.getStoreData(data);

        // Setup client
        client = new Client(store);

        // Get license
        license = await client.call('LICENSE');

        // Get version
        version = Number(license.version.replace(/\./g, ''));

        // Check if the version valid
        if (version < 1580) {
          throw new Error(this.homey.__('error.version', { version: license.version }));
        }

        // Save store values
        await device.setStoreValues(store);

        // Close the pair session
        await session.done();
      } catch (err) {
        this.error('[Repair]', err.toString());
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        store = null;
        license = null;
        version = null;
        client = null;
      }
    };

    session
      .setHandler('login', onLogin)
      .setHandler('disconnect', onDisconnect);
  }

}

module.exports = ServerDriver;
