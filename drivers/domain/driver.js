'use strict';

const Api = require('/lib/Api');
const Driver = require('/lib/Driver');



class DomainDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    let foundDevices = [];

    session.setHandler('connect', async (data) => {
      this.log('Connecting to server...');

      const result = await new Api(data).additionalDomains().catch(err => {
        throw new Error(this.homey.__(err.message));
      });

      if (Object.keys(result).length === 0) {
        throw new Error(this.homey.__('error.no_domains_found'));
      }

      for (const domain in result) {
        if (!result.hasOwnProperty(domain)) {
          continue;
        }

        data.id = domain;

        foundDevices.push({
          name: domain,
          data: data
        });
      }
    });

    session.setHandler("list_devices", async () => {
      return foundDevices;
    });
  }

}

module.exports = DomainDriver;
