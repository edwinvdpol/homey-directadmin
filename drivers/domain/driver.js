'use strict';

const Driver = require('../../lib/Driver');
const Client = require('../../lib/Client');

class DomainDriver extends Driver {

  /*
  | Pairing functions
  */

  // Pairing
  async onPair(session) {
    this.log('[Pair] Started');

    let foundDevices = [];

    const onLogin = async (data) => {
      this.log('[Pair] Connecting to server');

      let store;
      let client;

      try {
        // Get store data
        store = this.getStoreData(data);

        // Setup client
        client = new Client(store);

        // Set found devices
        foundDevices = await client.discoverDomains();
      } catch (err) {
        this.error('[Pair]', err.toString());
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        store = null;
        client = null;
      }
    };

    const onListDevices = async () => foundDevices;

    session
      .setHandler('login', onLogin)
      .setHandler('list_devices', onListDevices);
  }

  /**
   * Repairing
   *
   * @param session
   * @param {DomainDevice|Device} device
   */
  async onRepair(session, device) {
    this.log('[Repair] Session connected');

    const onDisconnect = async () => {
      this.log('[Repair] Session disconnected');
    };

    const onLogin = async (data) => {
      this.log('[Repair] Connecting');

      let store;
      let client;

      try {
        // Get store data
        store = this.getStoreData(data);

        // Setup client
        client = new Client(store);

        // Get domain
        await client.getDomain(device.getData().id);

        // Save store values
        await device.setStoreValues(store);

        // Close the pair session
        await session.done();
      } catch (err) {
        this.error('[Repair]', err.toString());
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        store = null;
        client = null;
      }
    };

    session
      .setHandler('login', onLogin)
      .setHandler('disconnect', onDisconnect);
  }

}

module.exports = DomainDriver;
