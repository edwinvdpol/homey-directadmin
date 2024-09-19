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
      let server;
      let client;

      try {
        // Get store data
        store = this.getStoreData(data);

        // Setup client
        client = new Client(store);

        // Get server
        server = await client.getServer();

        // Check if the version valid
        if (!server.valid) {
          throw new Error(this.homey.__('error.version', { version: server.version }));
        }

        // Emit create device event
        await session.emit('create', server.data);
      } catch (err) {
        this.error('[Pair]', err.toString());
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        store = null;
        server = null;
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
      let server;
      let client;

      try {
        // Get store data
        store = this.getStoreData(data);

        // Setup client
        client = new Client(store);

        // Get Server
        server = await client.getServer();

        // Check if the version valid
        if (!server.valid) {
          throw new Error(this.homey.__('error.version', { version: server.version }));
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
        server = null;
        client = null;
      }
    };

    session
      .setHandler('login', onLogin)
      .setHandler('disconnect', onDisconnect);
  }

}

module.exports = ServerDriver;
