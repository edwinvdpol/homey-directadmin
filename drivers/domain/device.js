'use strict';

const pretty = require('prettysize');
const Device = require('../../lib/Device');

class DomainDevice extends Device {

  static BYTESINMB = 1048576;

  // Update domain data
  async syncDevice() {
    try {
      const _name = this.getData().id;
      const _settings = this.getSettings();

      // Get and set domain data
      const _domains = await this.homey.app.additionalDomains(_settings, _name);
      const _data = _domains[_name];

      // Check if domain is suspended
      await this.checkDomainIsSuspended(_data.suspended);

      // Check if domain is active
      await this.checkDomainIsActive(_data.active);

      // Fetch email statistics
      this._emailStats = await this.homey.app.emailStats(_settings, _name);

      // Set device capabilities
      await this.setCapabilityValue('bandwidth', parseFloat(_data.bandwidth));
      await this.setCapabilityValue('quota', parseFloat(_data.quota));
      await this.setCapabilityValue('email_accounts', Number(this._emailStats.count));

      // Set device settings
      await this.setSettings({
        domain_bandwidth: await this.getBandwidthSetting(_data.bandwidth, _data.bandwidth_limit),
        domain_quota: await this.getQuotaSetting(_data.quota, _data.quota_limit),
        email_accounts: String(this._emailStats.count),
        email_quota: await this.getEmailQuotaSetting(this._emailStats.usage),
      });

      if (!this.getAvailable()) {
        await this.setAvailable();
      }
    } catch (err) {
      await this.setUnavailable(err.message);
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

  // Disk usage setting text
  async getQuotaSetting(quota, limit) {
    let response = quota > 0 ? pretty((quota * this.constructor.BYTESINMB)) : '0';

    if (limit !== 'unlimited') {
      response += ` / ${pretty((parseFloat(limit) * this.constructor.BYTESINMB))}`;
    }

    // eslint-disable-next-line consistent-return
    return response;
  }

  // Email disk usage setting text
  async getEmailQuotaSetting(quota) {
    return quota > 0 ? pretty((quota * this.constructor.BYTESINMB)) : '0';
  }

  // Check if domain is active
  async checkDomainIsActive(active) {
    if (active === 'no') {
      await this.setCapabilityValue('active', false);

      this.error('Domain is deactivated');

      throw new Error(this.homey.__('error.domain_is_deactivated'));
    }

    await this.setCapabilityValue('active', true);
  }

  // Check if domain is suspended
  async checkDomainIsSuspended(suspended) {
    if (suspended === 'yes') {
      await this.setCapabilityValue('suspended', true);

      this.error('Domain is suspended');

      throw new Error(this.homey.__('error.domain_is_suspended'));
    }

    await this.setCapabilityValue('suspended', false);
  }

}

module.exports = DomainDevice;
