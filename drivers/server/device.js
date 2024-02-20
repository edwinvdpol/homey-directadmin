'use strict';

const Device = require('../../lib/Device');
const { blank, filled } = require('../../lib/Utils');

class ServerDevice extends Device {

  /*
  | Synchronization functions
  */

  // Handle sync data
  async handleSyncData(data) {
    if (blank(data)) return;

    this.log('[Sync]', JSON.stringify(data));

    // Set license data
    if ('license' in data) {
      await this.handleLicenseData(data.license);
    }

    // Set statistics data
    if ('stats' in data) {
      await this.handleStatsData(data.stats);
    }

    this.setAvailable().catch(this.error);
  }

  // Handle license data
  async handleLicenseData(license) {
    if ('update_available' in license) {
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
    if ('bandwidth' in stats) {
      this.setCapabilityValue('server_bandwidth', Number(stats.bandwidth / 1024)).catch(this.error);
    }

    if ('mysql' in stats) {
      this.setCapabilityValue('databases', Number(stats.mysql)).catch(this.error);
    }

    if ('vdomains' in stats) {
      this.setCapabilityValue('domains', Number(stats.vdomains)).catch(this.error);
    }

    if ('nemails' in stats) {
      this.setCapabilityValue('email_accounts', Number(stats.nemails)).catch(this.error);
    }

    if ('nemailf' in stats) {
      this.setCapabilityValue('email_forwarders', Number(stats.nemailf)).catch(this.error);
    }

    if ('nusers' in stats) {
      this.setCapabilityValue('users', Number(stats.nusers)).catch(this.error);
    }

    if ('nresellers' in stats) {
      this.setCapabilityValue('resellers', Number(stats.nresellers)).catch(this.error);
    }
  }

}

module.exports = ServerDevice;
