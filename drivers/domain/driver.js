'use strict';

const Driver = require('../../lib/Driver');
const { blank } = require('../../lib/Utils');
const Client = require('../../lib/Client');

class DomainDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing domains');

    const foundDevices = [];

    session.setHandler('connect', async (data) => {
      this.log('Connecting to server');

      let settings;
      let domains;
      let client;

      try {
        // Get connection settings
        settings = this.getConnectSettings(data);

        // Setup client
        client = new Client(settings);

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
        throw new Error(this.homey.__(err.message));
      } finally {
        settings = null;
        domains = null;
        client = null;
      }
    });

    session.setHandler('list_devices', async () => {
      return Promise.resolve(foundDevices);
    });
  }

}

module.exports = DomainDriver;
