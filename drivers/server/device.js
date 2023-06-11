'use strict';

const Device = require('../../lib/Device');
const { filled } = require('../../lib/Utils');

class ServerDevice extends Device {

  /*
  | Synchronization functions
  */

  // Handle sync data
  async handleSyncData(data) {
    this.log('Update device', JSON.stringify(data));

    // Set license data
    if (filled(data.license)) {
      await this.handleLicenseData(data.license);
    }

    // Set statistics data
    if (filled(data.stats)) {
      await this.handleStatsData(data.stats);
    }

    this.setAvailable().catch(this.error);
  }

  // Handle license data
  async handleLicenseData(license) {
    if (filled(license.update_available)) {
      this.setCapabilityValue('update_available', license.update_available !== '0').catch(this.error);
    }

    // Set device settings
    this.setSettings({
      ip: filled(license.ip) ? license.ip : '-',
      name: filled(license.name) ? license.name : '-',
      os_name: filled(license.os_name) ? license.os_name : '-',
      version: filled(license.version) ? license.version : '-',
    }).catch(this.error);
  }

  // Handle statistics data
  async handleStatsData(stats) {
    if (filled(stats.bandwidth)) {
      this.setCapabilityValue('server_bandwidth', Number(stats.bandwidth / 1024)).catch(this.error);
    }

    if (filled(stats.mysql)) {
      this.setCapabilityValue('databases', Number(stats.mysql)).catch(this.error);
    }

    if (filled(stats.vdomains)) {
      this.setCapabilityValue('domains', Number(stats.vdomains)).catch(this.error);
    }

    if (filled(stats.nemails)) {
      this.setCapabilityValue('email_accounts', Number(stats.nemails)).catch(this.error);
    }

    if (filled(stats.nemailf)) {
      this.setCapabilityValue('email_forwarders', Number(stats.nemailf)).catch(this.error);
    }

    if (filled(stats.nusers)) {
      this.setCapabilityValue('users', Number(stats.nusers)).catch(this.error);
    }

    if (filled(stats.nresellers)) {
      this.setCapabilityValue('resellers', Number(stats.nresellers)).catch(this.error);
    }
  }

}

module.exports = ServerDevice;
