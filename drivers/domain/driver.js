'use strict';

const Driver = require('../../lib/Driver');
const { blank } = require('../../lib/Utils');
const Client = require('../../lib/Client');
const Data = require('../../lib/Data');

class DomainDriver extends Driver {

  /*
  | Pairing functions
  */

  // Pairing
  async onPair(session) {
    this.log('[Pair] Started');

    const foundDevices = [];

    const onLogin = async (raw) => {
      this.log('[Pair] Connecting to server');

      let data;
      let domains;
      let client;

      try {
        // Create data object
        data = new Data(raw);

        // Setup client
        client = new Client(data.store);

        // Get domains
        domains = await client.call('ADDITIONAL_DOMAINS');

        // No domains found
        if (blank(domains)) {
          throw new Error('error.no_domains_found');
        }

        Object.keys(domains).forEach((domain) => {
          data.id = domain;
          data.name = domain;

          foundDevices.push(data.device);
        });
      } catch (err) {
        this.error('[Pair]', err.message);
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        data = null;
        domains = null;
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

    const onLogin = async (raw) => {
      this.log('[Repair] Connecting');

      let data;
      let domains;
      let client;

      try {
        // Create data object
        data = new Data(raw);

        // Setup client
        client = new Client(data.store);

        // Get domains
        domains = await client.call('ADDITIONAL_DOMAINS');

        // No domains found
        if (blank(domains)) {
          throw new Error('error.no_domains_found');
        }

        // Check if domain exists
        if (blank(domains[device.getData().id])) {
          throw new Error('error.domain_not_found');
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
        domains = null;
        client = null;
      }
    };

    session
      .setHandler('login', onLogin)
      .setHandler('disconnect', onDisconnect);
  }

}

module.exports = DomainDriver;
