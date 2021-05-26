'use strict';

const Api = require('/lib/Api');
const Driver = require('/lib/Driver');

const minimalVersion = 1610;

class ServerDriver extends Driver {

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    session.setHandler('connect', async (data) => {
      this.log('Connecting to server...');

      const result = await new Api(data).license().catch(err => {
        throw new Error(this.homey.__(err.message));
      });

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
