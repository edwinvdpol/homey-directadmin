'use strict';

const Api = require('/lib/Api');
const Driver = require('/lib/Driver');

let foundDevices = [];

class ServerDriver extends Driver {

  async _onPairSearchDevices(data, callback) {
    this.log('_onPairSearchDevices');

    foundDevices = [];

    const api = new Api(data);

    await api.getLicense()
      .then(result => {
        data.id = result.lid + result.uid;

        foundDevices.push({
          name: 'DA v' + result.version + ' server',
          data: data
        });
      }).catch(error => {
        callback(error);
      });

    callback(null, true);
  }

  async _onPairListDevices(data, callback) {
    this.log('_onPairListDevices');
    this.log(foundDevices);

    callback(null, foundDevices);
  }

}

module.exports = ServerDriver;
