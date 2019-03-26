'use strict';

const Homey = require('homey');
const Device = require('../../lib/Device.js');
const boolean = require('boolean');

const refreshDeviceTimeout = 1000 * 60 * 15; // 15 minutes

class ServerDevice extends Device {

    async _initDevice () {
        this.log('_initDevice');

        // Register flowcard triggers
        this._registerFlowCardTriggers();

        // Update server data
        this._syncDevice();

        // Set update timer
        this.intervalId = setInterval(this._syncDevice.bind(this), refreshDeviceTimeout);
    }

    async _deleteDevice () {
        this.log('_deleteDevice');

        clearInterval(this.intervalId);
    }

    // Update server data
    async _syncDevice () {
        try {
            let license = await this.api.getLicense();
            let adminStats = await this.api.getAdminStats();

            // Set capabilities
            this.setCapabilityValue('server_bandwidth', Number(adminStats.bandwidth / 1024));
            this.setCapabilityValue('databases', Number(adminStats.mysql));
            this.setCapabilityValue('domains', Number(adminStats.vdomains));
            this.setCapabilityValue('email_accounts', Number(adminStats.nemails));
            this.setCapabilityValue('email_forwarders', Number(adminStats.nemailf));
            this.setCapabilityValue('users', Number(adminStats.nusers));
            this.setCapabilityValue('resellers', Number(adminStats.nresellers));
            this.setCapabilityValue('update_available', boolean(license.update_available));

            // Set settings
            this.setSettings({
                ip: license.ip,
                name: license.name,
                os_name: license.os_name,
                version: license.version
            });

            this.setAvailable();
        } catch (error) {
            this.error(error);
            this.setUnavailable(error.message);
        }
    }

    // Register flowcard triggers
    async _registerFlowCardTriggers () {
        this.updateAvailableTrigger = new Homey.FlowCardTriggerDevice('update_available_true')
            .register();
    }

};

module.exports = ServerDevice;