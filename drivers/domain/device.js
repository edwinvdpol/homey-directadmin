'use strict';

const Device = require('../../lib/Device');
const { blank } = require('../../lib/Utils');

class DomainDevice extends Device {

  static BYTESINMB = 1048576;

  /*
  | Synchronization functions
  */

  // Handle sync data
  async handleSyncData(data) {
    if (blank(data)) return;

    this.log('[Sync]', JSON.stringify(data));

    // Set domain data
    if ('domain' in data) {
      await this.handleDomainData(data.domain);
    }

    // Set email data
    if ('email' in data) {
      await this.handleEmailData(data.email);
    }
  }

  // Handle domain data
  async handleDomainData(data) {
    // Check if domain is suspended
    if ('suspended' in data) {
      await this.checkDomainIsSuspended(data.suspended);
    }

    // Check if domain is active
    if ('active' in data) {
      await this.checkDomainIsActive(data.active);
    }

    // Set device capabilities
    if ('bandwidth' in data) {
      this.setCapabilityValue('bandwidth', parseFloat(data.bandwidth)).catch(this.error);
    }

    if ('quota' in data) {
      this.setCapabilityValue('quota', parseFloat(data.quota)).catch(this.error);
    }
  }

  // Handle email data
  async handleEmailData(data) {
    this.setCapabilityValue('email_accounts', Number(Object.keys(data).length)).catch(this.error);
  }

  /*
  | Validate functions
  */

  // Check if domain is active
  async checkDomainIsActive(active) {
    if (active === 'no') {
      this.setCapabilityValue('active', false).catch(this.error);

      throw new Error(this.homey.__('error.domain_deactivated'));
    }

    this.setCapabilityValue('active', true).catch(this.error);
  }

  // Check if domain is suspended
  async checkDomainIsSuspended(suspended) {
    if (suspended === 'yes') {
      this.setCapabilityValue('suspended', true).catch(this.error);

      throw new Error(this.homey.__('error.domain_suspended'));
    }

    this.setCapabilityValue('suspended', false).catch(this.error);
  }

}

module.exports = DomainDevice;
