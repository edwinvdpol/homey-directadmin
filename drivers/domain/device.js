'use strict';

const pretty = require('prettysize');
const Device = require('../../lib/Device');
const qs = require('querystring');

class DomainDevice extends Device {

  static BYTESINMB = 1048576;

  // Update domain data
  async syncDevice() {
    try {
      const name = this.getData().id;
      const settings = this.getSettings();

      // Get and set domain data
      const domains = await this.homey.app.client.call('ADDITIONAL_DOMAINS', settings, { name });

      // Check if domain exists
      if (!domains.hasOwnProperty(name)) {
        return this.setUnavailable(this.homey.__('error.domain_not_found'));
      }

      const data = domains[name];
      let newSettings = {};

      // Check if domain is suspended
      if (data.hasOwnProperty('suspended')) {
        await this.checkDomainIsSuspended(data.suspended);
      }

      // Check if domain is active
      if (data.hasOwnProperty('active')) {
        await this.checkDomainIsActive(data.active);
      }

      // Set device capabilities
      if (data.hasOwnProperty('bandwidth')) {
        this.setCapabilityValue('bandwidth', parseFloat(data.bandwidth)).catch(this.error);

        if (data.hasOwnProperty('bandwidth_limit')) {
          newSettings.domain_bandwidth = await this.getBandwidthSetting(data.bandwidth, data.bandwidth_limit);
        }
      }

      if (data.hasOwnProperty('quota')) {
        this.setCapabilityValue('quota', parseFloat(data.quota)).catch(this.error);

        if (data.hasOwnProperty('quota_limit')) {
          newSettings.domain_quota = await this.getQuotaSetting(data.quota, data.quota_limit);
        }
      }

      // Fetch email statistics
      const emailStats = await this.emailStats(settings, name);

      if (emailStats.hasOwnProperty('count')) {
        this.setCapabilityValue('email_accounts', Number(emailStats.count)).catch(this.error);

        newSettings.email_accounts = String(emailStats.count);
      }

      if (emailStats.hasOwnProperty('usage')) {
        newSettings.email_quota = await this.getEmailQuotaSetting(emailStats.usage);
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

  // Domain bandwidth setting text
  async getBandwidthSetting(bandwidth, limit) {
    let response = bandwidth > 0 ? pretty((bandwidth * this.constructor.BYTESINMB)) : '0';

    if (limit !== 'unlimited') {
      response += ` / ${pretty((parseFloat(limit) * this.constructor.BYTESINMB))}`;
    }

    // eslint-disable-next-line consistent-return
    return response;
  }

  // Request email statistics
  async emailStats() {
    const result = {
      count: 0,
      usage: 0,
    };

    const domain = this.getData().id;

    const response = await this.homey.app.client.call('POP', this.getSettings(), { domain, action: 'full_list' });

    if (Object.keys(response).length === 0) {
      return result;
    }

    Object.keys(response).forEach(user => {
      const inbox = qs.parse(response[user]);

      result.count++;
      result.usage += parseFloat(inbox.usage);
    });

    return result;
  }

  // Disk usage setting text
  async getQuotaSetting(quota, limit) {
    let response = quota > 0 ? pretty((quota * this.constructor.BYTESINMB)) : '0';

    if (limit !== 'unlimited') {
      response += ` / ${pretty((parseFloat(limit) * this.constructor.BYTESINMB))}`;
    }

    return response;
  }

  // Email disk usage setting text
  async getEmailQuotaSetting(quota) {
    return quota > 0 ? pretty((quota * this.constructor.BYTESINMB)) : '0';
  }

  // Check if domain is active
  async checkDomainIsActive(active) {
    if (active === 'no') {
      this.setCapabilityValue('active', false).catch(this.error);

      this.error('Domain is deactivated');

      throw new Error(this.homey.__('error.domain_is_deactivated'));
    }

    this.setCapabilityValue('active', true).catch(this.error);
  }

  // Check if domain is suspended
  async checkDomainIsSuspended(suspended) {
    if (suspended === 'yes') {
      this.setCapabilityValue('suspended', true).catch(this.error);

      this.error('Domain is suspended');

      throw new Error(this.homey.__('error.domain_is_suspended'));
    }

    this.setCapabilityValue('suspended', false).catch(this.error);
  }

}

module.exports = DomainDevice;
