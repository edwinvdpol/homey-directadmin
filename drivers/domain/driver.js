'use strict';

const Driver = require('../../lib/Driver');
const { blank } = require('../../lib/Utils');
const Client = require('../../lib/Client');

class DomainDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    const foundDevices = [];

    session.setHandler('connect', async (data) => {
      this.log('Connecting to server');

      // Remove trailing slash
      if (data.host.slice(-1) === '/') {
        data.host = data.host.slice(0, -1);
      }

      try {
        // Get connection settings
        const settings = this.getConnectSettings(data);

        // Setup client
        const client = new Client(settings);

        // Get domains
        const domains = await client.call('ADDITIONAL_DOMAINS');

        // No domains found
        if (blank(domains)) {
          throw new Error('error.no_domains_found');
        }

        Object.keys(domains).forEach((domain) => {
          data.id = domain;
          data.name = domain;

          foundDevices.push(this.getDeviceData(data));
        });
      } catch (err) {
        throw new Error(this.homey.__(err.message));
      }
    });

    session.setHandler('list_devices', async () => {
      return Promise.resolve(foundDevices);
    });
  }

}

module.exports = DomainDriver;
