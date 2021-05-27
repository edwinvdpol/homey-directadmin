'use strict';

const Device = require('/lib/Device.js');

class ServerDevice extends Device {

  // Update server data
  async syncDevice() {

    try {
      const data = this.getData();

      const license = await this.homey.app.client.license(data);
      const adminStats = await this.homey.app.client.adminStats(data);

      // Set capabilities
      await this.setCapabilityValue('server_bandwidth', Number(adminStats.bandwidth / 1024));
      await this.setCapabilityValue('databases', Number(adminStats.mysql));
      await this.setCapabilityValue('domains', Number(adminStats.vdomains));
      await this.setCapabilityValue('email_accounts', Number(adminStats.nemails));
      await this.setCapabilityValue('email_forwarders', Number(adminStats.nemailf));
      await this.setCapabilityValue('users', Number(adminStats.nusers));
      await this.setCapabilityValue('resellers', Number(adminStats.nresellers));
      await this.setCapabilityValue('update_available', license.update_available !== '0');

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
      await this.setUnavailable(err.message);
    }
  }

}

module.exports = ServerDevice;
