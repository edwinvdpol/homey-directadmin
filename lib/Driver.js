'use strict';

const Homey = require('homey');

const Api = require('./../lib/Api');

class Driver extends Homey.Driver {

    onPair (socket) {
        socket.on('search_devices', async (data, callback) => {
            if (this._onPairSearchDevices) {
                this._onPairSearchDevices(data, callback);
            } else {
                callback(new Error('missing _onPairSearchDevices'));
            }
        });

        socket.on('list_devices', async (data, callback) => {
            if (this._onPairListDevices) {
                this._onPairListDevices(data, callback);
            } else {
                callback(new Error('missing _onPairListDevices'));
            }
        });
    }

};

module.exports = Driver;