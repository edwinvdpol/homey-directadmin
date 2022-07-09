'use strict';

const Device = require('../../lib/Device');

class ServerDevice extends Device {

  // Set device data
  handleSyncData(data) {
    // Set license data
    if (data.hasOwnProperty('license')) {
      this.handleLicenseData(data.license);
    }

    // Set statistics data
    if (data.hasOwnProperty('stats')) {
      this.handleStatsData(data.stats);
    }

    this.setAvailable().catch(this.error);
  }

  // Set license data
  handleLicenseData(license) {
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
    this.setSettings(newSettings).catch(this.error);
  }

  // Set statistics data
  handleStatsData(stats) {
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
  }

}

module.exports = ServerDevice;
