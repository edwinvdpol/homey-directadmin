'use strict';

const pretty = require('prettysize');
const Device = require('../../lib/Device');

class DomainDevice extends Device {

  static BYTESINMB = 1048576;

  // Update domain data
  async syncDevice() {
    try {
      this._device = this.getData();

      // Get domains data
      this._domains = await this.homey.app.client.additionalDomains(this._device);

      // Check if domain is found
      await this.checkDomainIsFound(this._device.id);

      // Set domain data
      this._domain = { ...this._domains[this._device.id] };

      // Check if domain is suspended
      await this.checkDomainIsSuspended();

      // Check if domain is active
      await this.checkDomainIsActive();

      // Fetch email statistics
      this._emailStats = await this.homey.app.client.emailStats(this._device);

      const bandwidthTxt = await this.getBandwidthSetting();
      const quotaTxt = await this.getQuotaSetting();
      const emailQuotaTxt = await this.getEmailQuotaSetting(this._emailStats.usage);

      // Set capabilities
      await this.setCapabilityValue('bandwidth', parseFloat(this._domain.bandwidth));
      await this.setCapabilityValue('quota', parseFloat(this._domain.quota));
      await this.setCapabilityValue('email_accounts', Number(this._emailStats.count));

      // Set settings
      await this.setSettings({
        domain_bandwidth: bandwidthTxt,
        domain_quota: quotaTxt,
        email_accounts: String(this._emailStats.count),
        email_quota: emailQuotaTxt,
      });

      if (!this.getAvailable()) {
        await this.setAvailable();
      }
    } catch (err) {
      await this.setUnavailable(err.message);
    } finally {
      this.reset();
    }
  }

  // Domain bandwidth setting text
  async getBandwidthSetting() {
    if (!this._domain) {
      return;
    }

    let response = this._domain.bandwidth > 0 ? pretty((this._domain.bandwidth * this.constructor.BYTESINMB)) : '0';

    if (this._domain.bandwidth_limit !== 'unlimited') {
      response += ` / ${pretty((parseFloat(this._domain.bandwidth_limit) * this.constructor.BYTESINMB))}`;
    }

    // eslint-disable-next-line consistent-return
    return response;
  }

  // Disk usage setting text
  async getQuotaSetting() {
    if (!this._domain) {
      return;
    }

    let response = this._domain.quota > 0 ? pretty((this._domain.quota * this.constructor.BYTESINMB)) : '0';

    if (this._domain.quota_limit !== 'unlimited') {
      response += ` / ${pretty((parseFloat(this._domain.quota_limit) * this.constructor.BYTESINMB))}`;
    }

    // eslint-disable-next-line consistent-return
    return response;
  }

  // Email disk usage setting text
  async getEmailQuotaSetting(quota) {
    return quota > 0 ? pretty((quota * this.constructor.BYTESINMB)) : '0';
  }

  // Check if domain is found
  async checkDomainIsFound(domain) {
    if (Object.keys(this._domains).length === 0 || !this._domains[domain]) {
      throw new Error(this.homey.__('error.domain_not_found'));
    }
  }

  // Check if domain is active
  async checkDomainIsActive() {
    if (!this._domain) {
      return;
    }

    if (this._domain.active === 'no') {
      await this.setCapabilityValue('active', false);

      this.error('Domain is deactivated');

      throw new Error(this.homey.__('error.domain_is_deactivated'));
    }

    await this.setCapabilityValue('active', true);
  }

  // Check if domain is suspended
  async checkDomainIsSuspended() {
    if (!this._domain) {
      return;
    }

    if (this._domain.suspended === 'yes') {
      await this.setCapabilityValue('suspended', true);

      this.error('Domain is suspended');

      throw new Error(this.homey.__('error.domain_is_suspended'));
    }

    await this.setCapabilityValue('suspended', false);
  }

  // Reset variables
  reset() {
    this._device = null;
    this._domain = null;
    this._domains = null;
    this._emailStats = null;
  }

}

module.exports = DomainDevice;
