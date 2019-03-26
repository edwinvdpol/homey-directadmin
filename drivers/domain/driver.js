'use strict';

const Homey = require('homey');
const Api = require('../../lib/Api');
const Driver = require('../../lib/Driver');

let foundDevices = [];

class DomainDriver extends Driver {

    async _onPairSearchDevices (pairData, callback) {
        this.log('_onPairSearchDevices');

        foundDevices = [];

        const api = new Api(pairData);

        await api.getAdditionalDomains()
            .then( result => {
                if (Object.keys(result).length) {
                    for (var domain in result) {
                        foundDevices.push({
                            name: domain,
                            data: {
                                id: domain,
                                url: pairData.url,
                                port: pairData.port,
                                username: pairData.username,
                                password: pairData.password
                            }
                        });
                    }
                }
            }).catch( error => {
                callback(error);
            });

        callback(null, true);
    }

    async _onPairListDevices (data, callback) {
        this.log('_onPairListDevices');
        this.log(foundDevices);

        callback(null, foundDevices);
    }

};

module.exports = DomainDriver;