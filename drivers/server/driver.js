'use strict';

const Driver = require('/lib/Driver');
const minimalVersion = 1610;

class ServerDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    session.setHandler('connect', async (data) => {
      this.log('Connecting to server...');

      const result = await this.homey.app.client.license(data);
      const version = Number(result.version.replace(/\./g, ''));

      if (version < minimalVersion) {
        throw new Error(this.homey.__('api.version', {version: result.version}));
      }

      data.id = result.lid;

      await session.emit('create', {
        name: `DA v${result.version} server`,
        data: data
      });
    });
  }

}

module.exports = ServerDriver;
