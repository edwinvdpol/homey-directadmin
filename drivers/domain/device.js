'use strict';

const pretty = require('prettysize');
const Device = require('../../lib/Device');
const {filled} = require('../../lib/Utils');
const qs = require('querystring');

class DomainDevice extends Device {

  static BYTESINMB = 1048576;

  /*
  | Capabilities
  */

  // Set device data
  handleSyncData(data) {
    this.log('Update device', this.getData().id, JSON.stringify(data));

    Promise.resolve().then(async () => {
      // Set domain data
      if (filled(data.domain)) {
        await this.handleDomainData(data.domain);
      }

      // Set email data
      if (filled(data.email)) {
        await this.handleEmailData(data.email);
      }

      this.setAvailable().catch(this.error);
    }).catch(err => {
      this.setUnavailable(err.message).catch(this.error);
    });
  }

  // Set domain data
  async handleDomainData(data) {
    // Check if domain is suspended
    if (filled(data.suspended)) {
      await this.checkDomainIsSuspended(data.suspended);
    }

    // Check if domain is active
    if (filled(data.active)) {
      await this.checkDomainIsActive(data.active);
    }

    let newSettings = {};

    // Set device capabilities
    if (filled(data.bandwidth)) {
      this.setCapabilityValue('bandwidth', parseFloat(data.bandwidth)).catch(this.error);

      if (filled(data.bandwidth_limit)) {
        newSettings.domain_bandwidth = this.getBandwidth(data.bandwidth, data.bandwidth_limit);
      }
    }

    if (filled(data.quota)) {
      this.setCapabilityValue('quota', parseFloat(data.quota)).catch(this.error);

      if (filled(data.quota_limit)) {
        newSettings.domain_quota = this.getQuota(data.quota, data.quota_limit);
      }
    }

    // Set device settings
    if (filled(newSettings)) {
      this.setSettings(newSettings).catch(this.error);
    }
  }

  // Set email data
  async handleEmailData(data) {
    let emailCount = 0;
    let emailUsage = 0;

    Object.keys(data).forEach(user => {
      const inbox = qs.parse(data[user]);

      emailCount++;
      emailUsage += parseFloat(inbox.usage);
    });

    this.setCapabilityValue('email_accounts', Number(emailCount)).catch(this.error);

    // Set device settings
    this.setSettings({
      email_accounts: String(emailCount),
      email_quota: this.getEmailQuota(emailUsage)
    }).catch(this.error);
  }

  /*
  | Validate functions
  */

  // Check if domain is active
  async checkDomainIsActive(active) {
    if (active === 'no') {
      this.setCapabilityValue('active', false).catch(this.error);

      throw new Error(this.homey.__('error.domain_is_deactivated'));
    }

    this.setCapabilityValue('active', true).catch(this.error);
  }

  // Check if domain is suspended
  async checkDomainIsSuspended(suspended) {
    if (suspended === 'yes') {
      this.setCapabilityValue('suspended', true).catch(this.error);

      throw new Error(this.homey.__('error.domain_is_suspended'));
    }

    this.setCapabilityValue('suspended', false).catch(this.error);
  }

  /*
  | Support functions
  */

  // Domain bandwidth text
  getBandwidth(bandwidth, limit) {
    let response = bandwidth > 0 ? pretty((bandwidth * this.constructor.BYTESINMB)) : '0';

    if (limit !== 'unlimited') {
      response += ` / ${pretty((parseFloat(limit) * this.constructor.BYTESINMB))}`;
    }

    return response;
  }

  // Email disk usage text
  getEmailQuota(quota) {
    return quota > 0 ? pretty((quota * this.constructor.BYTESINMB)) : '0';
  }

  // Disk usage text
  getQuota(quota, limit) {
    let response = quota > 0 ? pretty((quota * this.constructor.BYTESINMB)) : '0';

    if (limit !== 'unlimited') {
      response += ` / ${pretty((parseFloat(limit) * this.constructor.BYTESINMB))}`;
    }

    return response;
  }

}

module.exports = DomainDevice;
