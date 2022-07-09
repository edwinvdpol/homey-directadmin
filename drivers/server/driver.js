'use strict';

const Driver = require('../../lib/Driver');

class ServerDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    session.setHandler('connect', async (data) => {
      this.log('Connecting to server');

      // Remove trailing slash
      if (data.host.slice(-1) === '/') {
        data.host = data.host.slice(0, -1);
      }

      // Get connection settings
      const settings = this.getConnectSettings(data);

      // Get version
      const result = await this.call('LICENSE', settings);
      const version = Number(result.version.replace(/\./g, ''));

      // Check if the version valid
      if (version < 1580) {
        throw new Error(this.homey.__('api.version', {version: result.version}));
      }

      data.id = result.lid;
      data.name = `DA v${result.version} server`;

      // Emit create device event
      await session.emit('create', this.getCreateData(data));
    });
  }

}

module.exports = ServerDriver;
