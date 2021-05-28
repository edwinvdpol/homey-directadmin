'use strict';

const Device = require('../../lib/Device');

class ServerDevice extends Device {

  // Update server data
  async syncDevice() {
    try {
      this._device = this.getData();
      this._license = await this.homey.app.client.license(this._device);
      this._stats = await this.homey.app.client.adminStats(this._device);

      // Set capabilities
      await this.setCapabilityValue('server_bandwidth', Number(this._stats.bandwidth / 1024));
      await this.setCapabilityValue('databases', Number(this._stats.mysql));
      await this.setCapabilityValue('domains', Number(this._stats.vdomains));
      await this.setCapabilityValue('email_accounts', Number(this._stats.nemails));
      await this.setCapabilityValue('email_forwarders', Number(this._stats.nemailf));
      await this.setCapabilityValue('users', Number(this._stats.nusers));
      await this.setCapabilityValue('resellers', Number(this._stats.nresellers));
      await this.setCapabilityValue('update_available', this._license.update_available !== '0');

      // Set settings
      await this.setSettings({
        ip: this._license.ip,
        name: this._license.name,
        os_name: this._license.os_name,
        version: this._license.version,
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

  // Reset variables
  reset() {
    this._device = null;
    this._license = null;
    this._stats = null;
  }

}

module.exports = ServerDevice;
