'use strict';

const Homey = require('homey');
const Device = require('/lib/Device.js');
const pretty = require('prettysize');

const bytesInMb = 1048576;
const refreshDeviceTimeout = 1000 * 60 * 15; // 15 minutes

class DomainDevice extends Device {

  async _initDevice() {
    this.log('_initDevice');

    // Update domain data
    this._syncDevice();

    // Set update timer
    this.intervalId = setInterval(this._syncDevice.bind(this), refreshDeviceTimeout);
  }

  async _deleteDevice() {
    this.log('_deleteDevice');

    clearInterval(this.intervalId);
  }

  // Update domain data
  async _syncDevice() {
    try {
      let found = false;
      const data = this.getData();

      const result = await this.api.getAdditionalDomains(data.id);

      if (Object.keys(result).length === 0) {
        throw new Error(Homey.__('error.no_domains_found'));
      }

      let active = true;
      let suspended = false;

      for (let domain in result) {
        if (domain === data.id) {

          found = true;
          active = !!result[domain].active;
          suspended = !!result[domain].suspended;

          let popStats = await this.api.getPopStats(domain);
          let bandwidthTxt = await this._getBandwidthSetting(result[domain]);
          let quotaTxt = await this._getQuotaSetting(result[domain]);
          let emailQuotaTxt = await this._getEmailQuotaSetting(popStats.usage);

          // Set capabilities
          this.setCapabilityValue('active', active);
          this.setCapabilityValue('bandwidth', parseFloat(result[domain].bandwidth));
          this.setCapabilityValue('quota', parseFloat(result[domain].quota));
          this.setCapabilityValue('suspended', suspended);
          this.setCapabilityValue('email_accounts', Number(popStats.count));

          // Set settings
          this.setSettings({
            domain_bandwidth: bandwidthTxt,
            domain_quota: quotaTxt,
            email_accounts: String(popStats.count),
            email_quota: emailQuotaTxt
          });
        }
      }

      if (!found) {
        this.setUnavailable(Homey.__('error.domain_not_found'));
      } else if (suspended) {
        this.setUnavailable(Homey.__('error.domain_is_suspended'));
      } else if (!active) {
        this.setUnavailable(Homey.__('error.domain_is_deactivated'));
      } else {
        this.setAvailable();
      }
    } catch (error) {
      this.error(error);
      this.setUnavailable(error.message);
    }
  }

  // Domain bandwidth setting text
  async _getBandwidthSetting(domain) {
    let response = (domain.bandwidth > 0 ? pretty((domain.bandwidth * bytesInMb)) : '0');

    if (domain.bandwidth_limit !== 'unlimited') {
      response += ' / ' + pretty((parseFloat(domain.bandwidth_limit) * bytesInMb));
    }

    return response;
  }

  // Disk usage setting text
  async _getQuotaSetting(domain) {
    const response = (domain.quota > 0 ? pretty((domain.quota * bytesInMb)) : '0');

    if (domain.quota_limit !== 'unlimited') {
      response += ' / ' + pretty((parseFloat(domain.quota_limit) * bytesInMb));
    }

    return response;
  }

  // Email disk usage setting text
  async _getEmailQuotaSetting(quota) {
    const response = (quota > 0 ? pretty((quota * bytesInMb)) : '0');

    return response;
  }

}

module.exports = DomainDevice;
