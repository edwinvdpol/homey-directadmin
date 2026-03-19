'use strict';

const Driver = require('../../lib/Driver');
const Client = require('../../lib/Client');
const Data = require('../../lib/Data');

class ServerDriver extends Driver {

  /*
  | Pairing functions
  */

  // Pairing
  async onPair(session) {
    this.log('[Pair] Started');

    const onLogin = async (raw) => {
      this.log('[Pair] Connecting to server');

      let data;
      let license;
      let version;
      let client;

      try {
        // Create data object
        data = new Data(raw);

        // Setup client
        client = new Client(data.store);

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
        await session.emit('create', data.device);
      } catch (err) {
        this.error('[Pair]', err.message);
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        data = null;
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

    const onLogin = async (raw) => {
      this.log('[Repair] Connecting');

      let data;
      let license;
      let version;
      let client;

      try {
        // Create data object
        data = new Data(raw);

        // Setup client
        client = new Client(data.store);

        // Get license
        license = await client.call('LICENSE');

        // Get version
        version = Number(license.version.replace(/\./g, ''));

        // Check if the version valid
        if (version < 1580) {
          throw new Error(this.homey.__('error.version', { version: license.version }));
        }

        // Save store values
        await device.setStoreValues(data.store);

        // Close the pair session
        await session.done();
      } catch (err) {
        this.error('[Repair]', err.message);
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        data = null;
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
