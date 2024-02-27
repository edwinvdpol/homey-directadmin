'use strict';

const Driver = require('../../lib/Driver');
const Client = require('../../lib/Client');

class ServerDriver extends Driver {

  // Pairing
  async onPair(session) {
    this.log('Pairing servers');

    const onLogin = async (data) => {
      this.log('Connecting to server');

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
          throw new Error(this.homey.__('errors.version', { version: license.version }));
        }

        data.id = license.lid;
        data.name = `DA v${license.version} server`;

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
    this.log('Repairing device');

    const onLogin = async (data) => {
      this.log('Connecting to server');

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
          throw new Error(this.homey.__('errors.version', { version: license.version }));
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

    const onShowView = async (viewId) => {
      if (viewId === 'credentials') {
        session.emit('fill', device.getStore()).catch(this.error);
      }
    };

    session
      .setHandler('login', onLogin)
      .setHandler('showView', onShowView);
  }

}

module.exports = ServerDriver;
