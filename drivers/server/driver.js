'use strict';

const Driver = require('../../lib/Driver');

class ServerDriver extends Driver {

  static MINIMUMVERSION = 1580;

  // Pairing
  onPair(session) {
    this.log('Pairing started');

    session.setHandler('connect', async data => {
      this.log('Connecting to server...');

      let result = await this.homey.app.client.license(data);
      const version = Number(result.version.replace(/\./g, ''));

      if (version < this.constructor.MINIMUMVERSION) {
        throw new Error(this.homey.__('api.version', { version: result.version }));
      }

      data.id = result.lid;

      await session.emit('create', {
        name: `DA v${result.version} server`,
        data,
      });

      result = null;
    });
  }

}

module.exports = ServerDriver;
