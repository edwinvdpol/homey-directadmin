'use strict';

const Driver = require('../../lib/Driver');

class DomainDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    let foundDevices = [];

    session.setHandler('connect', async data => {
      this.log('Connecting to server...');

      // Get domain data
      const result = await this.homey.app.additionalDomains(data);

      if (Object.keys(result).length === 0) {
        throw new Error(this.homey.__('error.no_domains_found'));
      }

      Object.keys(result).forEach(domain => {
        data.id = domain;

        foundDevices.push({
          name: domain,
          data,
        });
      });
    });

    session.setHandler('list_devices', async () => {
      return Promise.resolve(foundDevices);
    });
  }

}

module.exports = DomainDriver;
