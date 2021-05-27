'use strict';

const Device = require('/lib/Device.js');
const pretty = require('prettysize');

const bytesInMb = 1048576;

class DomainDevice extends Device {

  // Update domain data
  async syncDevice() {
    try {
      const data = this.getData();

      // Get domains data
      const domains = await this.homey.app.client.additionalDomains(data);

      // Check if domain is found
      if (Object.keys(domains).length === 0 || ! domains.hasOwnProperty(data.id)) {
        return this.setUnavailable(this.homey.__('error.domain_not_found'));
      }

      // Set domain data
      const domain = domains[data.id];
      let active = domain.active === 'yes';
      let suspended = domain.suspended === 'yes';

      // Domain is deactivated
      if (!active) {
        this.error('Domain is deactivated');

        return this.setUnavailable(this.homey.__('error.domain_is_deactivated'));
      }

      // Domain is suspended
      if (suspended) {
        this.error('Domain is suspended');

        return this.setUnavailable(this.homey.__('error.domain_is_suspended'));
      }

      // Fetch email statistics
      const emailStats = await this.homey.app.client.emailStats(data);

      const bandwidthTxt = await this.getBandwidthSetting(domain);
      const quotaTxt = await this.getQuotaSetting(domain);
      const emailQuotaTxt = await this.getEmailQuotaSetting(emailStats.usage);

      // Set capabilities
      await this.setCapabilityValue('active', active);
      await this.setCapabilityValue('bandwidth', parseFloat(domain.bandwidth));
      await this.setCapabilityValue('quota', parseFloat(domain.quota));
      await this.setCapabilityValue('suspended', suspended);
      await this.setCapabilityValue('email_accounts', Number(emailStats.count));

      // Set settings
      await this.setSettings({
        domain_bandwidth: bandwidthTxt,
        domain_quota: quotaTxt,
        email_accounts: String(emailStats.count),
        email_quota: emailQuotaTxt
      });

      if (!this.getAvailable()) {
        await this.setAvailable();
      }
    } catch (err) {
      await this.setUnavailable(err.message);
    }
  }

  // Domain bandwidth setting text
  async getBandwidthSetting(domain) {
    let response = domain.bandwidth > 0 ? pretty((domain.bandwidth * bytesInMb)) : '0';

    if (domain.bandwidth_limit !== 'unlimited') {
      response += ' / ' + pretty((parseFloat(domain.bandwidth_limit) * bytesInMb));
    }

    return response;
  }

  // Disk usage setting text
  async getQuotaSetting(domain) {
    let response = domain.quota > 0 ? pretty((domain.quota * bytesInMb)) : '0';

    if (domain.quota_limit !== 'unlimited') {
      response += ' / ' + pretty((parseFloat(domain.quota_limit) * bytesInMb));
    }

    return response;
  }

  // Email disk usage setting text
  async getEmailQuotaSetting(quota) {
    return quota > 0 ? pretty((quota * bytesInMb)) : '0';
  }

}

module.exports = DomainDevice;
