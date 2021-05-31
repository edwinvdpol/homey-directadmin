'use strict';

const Driver = require('../../lib/Driver');

class DomainDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    let foundDevices = [];

    session.setHandler('connect', async data => {
      this.log('Connecting to server...');

      // Remove trailing slash
      if (data.host.slice(-1) === '/') {
        data.host = data.host.slice(0, -1);
      }

      // Get connection settings
      const connectSettings = this.getConnectSettings(data);

      // Get domains
      const _domains = await this.homey.app.additionalDomains(connectSettings);

      // No domains found
      if (Object.keys(_domains).length === 0) {
        throw new Error(this.homey.__('error.no_domains_found'));
      }

      Object.keys(_domains).forEach(domain => {
        data.id = domain;
        data.name = domain;

        // Get create device data
        const createData = this.getCreateData(data);

        foundDevices.push(createData);
      });
    });

    session.setHandler('list_devices', async () => {
      return Promise.resolve(foundDevices);
    });
  }

}

module.exports = DomainDriver;
