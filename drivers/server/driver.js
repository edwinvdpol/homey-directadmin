'use strict';

const Driver = require('../../lib/Driver');

class ServerDriver extends Driver {

  static MINIMUMVERSION = 1580;

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    session.setHandler('connect', async data => {
      this.log('Connecting to server...');

      // Remove trailing slash
      if (data.host.slice(-1) === '/') {
        data.host = data.host.slice(0, -1);
      }

      // Get connection settings
      const connectSettings = this.getConnectSettings(data);

      // Get version
      const result = await this.homey.app.client.call('LICENSE', connectSettings);
      const version = Number(result.version.replace(/\./g, ''));

      // Check if the version valid
      if (version < this.constructor.MINIMUMVERSION) {
        throw new Error(this.homey.__('api.version', { version: result.version }));
      }

      data.id = result.lid;
      data.name = `DA v${result.version} server`;

      // Emit create device event
      await session.emit('create', this.getCreateData(data));
    });
  }

}

module.exports = ServerDriver;
