'use strict';

const Driver = require('../../lib/Driver');

class ServerDriver extends Driver {

  static MINIMUMVERSION = 1580;

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    session.setHandler('connect', async data => {
      this.log('Connecting to server...');

      // Get version
      const result = await this.homey.app.client.license(data);
      const version = Number(result.version.replace(/\./g, ''));

      // Check if the version valid
      if (version < this.constructor.MINIMUMVERSION) {
        throw new Error(this.homey.__('api.version', { version: result.version }));
      }

      data.id = result.lid;

      // Emit create device event
      await session.emit('create', {
        name: `DA v${result.version} server`,
        data,
      });
    });
  }

}

module.exports = ServerDriver;
