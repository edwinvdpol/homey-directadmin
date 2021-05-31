'use strict';

const Device = require('../../lib/Device');

class ServerDevice extends Device {

  // Update server data
  async syncDevice() {
    try {
      const _settings = this.getSettings();

      // Get server data from API
      const _license = await this.homey.app.license(_settings);
      const _stats = await this.homey.app.adminStats(_settings);

      // Set device capabilities
      await this.setCapabilityValue('server_bandwidth', Number(_stats.bandwidth / 1024));
      await this.setCapabilityValue('databases', Number(_stats.mysql));
      await this.setCapabilityValue('domains', Number(_stats.vdomains));
      await this.setCapabilityValue('email_accounts', Number(_stats.nemails));
      await this.setCapabilityValue('email_forwarders', Number(_stats.nemailf));
      await this.setCapabilityValue('users', Number(_stats.nusers));
      await this.setCapabilityValue('resellers', Number(_stats.nresellers));
      await this.setCapabilityValue('update_available', _license.update_available !== '0');

      // Set device settings
      await this.setSettings({
        ip: _license.ip,
        name: _license.name,
        os_name: _license.os_name,
        version: _license.version,
      });

      if (!this.getAvailable()) {
        await this.setAvailable();
      }
    } catch (err) {
      await this.setUnavailable(err.message);
    }
  }

}

module.exports = ServerDevice;
