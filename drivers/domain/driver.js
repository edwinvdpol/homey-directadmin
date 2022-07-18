'use strict';

const Driver = require('../../lib/Driver');
const {blank} = require('../../lib/Utils');

class DomainDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    let foundDevices = [];

    session.setHandler('connect', async (data) => {
      this.log('Connecting to server');

      // Remove trailing slash
      if (data.host.slice(-1) === '/') {
        data.host = data.host.slice(0, -1);
      }

      // Get connection settings
      const settings = this.getConnectSettings(data);

      // Get domains
      const domains = await this.call('ADDITIONAL_DOMAINS', settings);

      // No domains found
      if (blank(domains)) {
        throw new Error(this.homey.__('error.no_domains_found'));
      }

      Object.keys(domains).forEach(domain => {
        data.id = domain;
        data.name = domain;

        foundDevices.push(this.getDeviceData(data));
      });
    });

    session.setHandler('list_devices', async () => {
      return Promise.resolve(foundDevices);
    });
  }

}

module.exports = DomainDriver;
