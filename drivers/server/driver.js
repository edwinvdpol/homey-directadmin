'use strict';

const Driver = require('../../lib/Driver');
const Client = require('../../lib/Client');

class ServerDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    session.setHandler('connect', async (data) => {
      this.log('Connecting to server');

      try {
        // Get connection settings
        const settings = this.getConnectSettings(data);

        // Setup client
        const client = new Client(settings);

        // Get license
        const result = await client.call('LICENSE');

        // Get version
        const version = Number(result.version.replace(/\./g, ''));

        // Check if the version valid
        if (version < 1580) {
          throw new Error(this.homey.__('api.version', { version: result.version }));
        }

        data.id = result.lid;
        data.name = `DA v${result.version} server`;

        // Emit create device event
        await session.emit('create', this.getDeviceData(data));
      } catch (err) {
        throw new Error(this.homey.__(err.message));
      }
    });
  }

}

module.exports = ServerDriver;
