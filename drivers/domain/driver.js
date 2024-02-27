'use strict';

const Driver = require('../../lib/Driver');
const { blank } = require('../../lib/Utils');
const Client = require('../../lib/Client');

class DomainDriver extends Driver {

  // Pairing
  async onPair(session) {
    this.log('Pairing domains');

    const foundDevices = [];

    const onLogin = async (data) => {
      this.log('Connecting to server');

      let store;
      let domains;
      let client;

      try {
        // Get store data
        store = this.getStoreData(data);

        // Setup client
        client = new Client(store);

        // Get domains
        domains = await client.call('ADDITIONAL_DOMAINS');

        // No domains found
        if (blank(domains)) {
          throw new Error('errors.no_domains_found');
        }

        Object.keys(domains).forEach((domain) => {
          data.id = domain;
          data.name = domain;

          foundDevices.push(this.getDeviceData(data));
        });
      } catch (err) {
        this.error('[Pair]', err.toString());
        throw new Error(this.homey.__(err.message) || err.message);
      } finally {
        store = null;
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
    this.log('Repairing device');

    const onLogin = async (data) => {
      this.log('Connecting to server');

      let store;
      let domains;
      let client;

      try {
        // Get store data
        store = this.getStoreData(data);

        // Setup client
        client = new Client(store);

        // Get domains
        domains = await client.call('ADDITIONAL_DOMAINS');

        // No domains found
        if (blank(domains)) {
          throw new Error('errors.no_domains_found');
        }

        // Check if domain exists
        if (blank(domains[device.getData().id])) {
          throw new Error('errors.domain_not_found');
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
        domains = null;
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

module.exports = DomainDriver;
