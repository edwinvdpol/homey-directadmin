'use strict';

const Device = require('../../lib/Device');

class ServerDevice extends Device {

  // Update server data
  async syncDevice() {
    try {
      const settings = this.getSettings();

      // Capability values
      const stats = await this.homey.app.client.call('ADMIN_STATS', settings);

      // Set device capabilities
      if (stats.hasOwnProperty('bandwidth')) {
        this.setCapabilityValue('server_bandwidth', Number(stats.bandwidth / 1024)).catch(this.error);
      }

      if (stats.hasOwnProperty('mysql')) {
        this.setCapabilityValue('databases', Number(stats.mysql)).catch(this.error);
      }

      if (stats.hasOwnProperty('vdomains')) {
        this.setCapabilityValue('domains', Number(stats.vdomains)).catch(this.error);
      }

      if (stats.hasOwnProperty('nemails')) {
        this.setCapabilityValue('email_accounts', Number(stats.nemails)).catch(this.error);
      }

      if (stats.hasOwnProperty('nemailf')) {
        this.setCapabilityValue('email_forwarders', Number(stats.nemailf)).catch(this.error);
      }

      if (stats.hasOwnProperty('nusers')) {
        this.setCapabilityValue('users', Number(stats.nusers)).catch(this.error);
      }

      if (stats.hasOwnProperty('nresellers')) {
        this.setCapabilityValue('resellers', Number(stats.nresellers)).catch(this.error);
      }

      // License
      const license = await this.homey.app.client.call('LICENSE', settings);
      let newSettings = {};

      if (license.hasOwnProperty('update_available')) {
        this.setCapabilityValue('update_available', license.update_available !== '0').catch(this.error);
      }

      if (license.hasOwnProperty('ip')) {
        newSettings.ip = license.ip === '' ? '-' : license.ip;
      }

      if (license.hasOwnProperty('name')) {
        newSettings.name = license.name === '' ? '-' : license.name;
      }

      if (license.hasOwnProperty('os_name')) {
        newSettings.os_name = license.os_name === '' ? '-' : license.os_name;
      }

      if (license.hasOwnProperty('version')) {
        newSettings.version = license.version === '' ? '-' : license.version;
      }

      // Set device settings
      await this.setSettings(newSettings);

      if (!this.getAvailable()) {
        this.setAvailable().catch(this.error);
      }
    } catch (err) {
      this.error(err);
      this.setUnavailable(err.message).catch(this.error);
    }
  }

}

module.exports = ServerDevice;
