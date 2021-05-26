'use strict';

const Device = require('/lib/Device.js');

class ServerDevice extends Device {

  // Update server data
  async syncDevice() {
    try {
      const license = await this.api.license();
      const adminStats = await this.api.adminStats();

      // Set capabilities
      await this.setCapabilityValue('server_bandwidth', Number(adminStats.bandwidth / 1024));
      await this.setCapabilityValue('databases', Number(adminStats.mysql));
      await this.setCapabilityValue('domains', Number(adminStats.vdomains));
      await this.setCapabilityValue('email_accounts', Number(adminStats.nemails));
      await this.setCapabilityValue('email_forwarders', Number(adminStats.nemailf));
      await this.setCapabilityValue('users', Number(adminStats.nusers));
      await this.setCapabilityValue('resellers', Number(adminStats.nresellers));
      await this.setCapabilityValue('update_available', !!Number(license.update_available));

      // Set settings
      await this.setSettings({
        ip: license.ip,
        name: license.name,
        os_name: license.os_name,
        version: license.version
      });

      if (!this.getAvailable()) {
        await this.setAvailable();
      }
    } catch (err) {
      this.error(err);

      await this.setUnavailable(err.message);
    }
  }

}

module.exports = ServerDevice;
