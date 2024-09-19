'use strict';

const { blank } = require('../lib/Utils');

class Server {

  /**
   * Represents a server.
   *
   * @constructor
   */
  constructor(data) {
    this.stats = data.stats;
    this.license = data.license;
    this.store = data.store;
  }

  /**
   * Return device capability values.
   *
   * @return {Object}
   */
  get capabilityValues() {
    if (!this.valid) return {};

    return Object.fromEntries(Object.entries({
      databases: Number(this.stats.mysql),
      domains: Number(this.stats.vdomains),
      email_accounts: Number(this.stats.nemails),
      email_forwarders: Number(this.stats.nemailf),
      resellers: Number(this.stats.nresellers),
      server_bandwidth: Number(this.stats.bandwidth / 1024),
      update_available: this.license.update_available !== '0',
      users: Number(this.stats.nusers),
    }).filter(([_, v]) => v || typeof v === 'boolean'));
  }

  /**
   * Return device data.
   *
   * @return {Object}
   */
  get data() {
    if (!this.valid) return {};

    return {
      name: this.license.name,
      data: {
        id: this.license.lid,
      },
      settings: this.settings,
      store: this.store,
    };
  }

  /**
   * Return device settings.
   *
   * @return {Object}
   */
  get settings() {
    if (!this.valid) return {};

    return {
      ip: this.license.ip || '-',
      name: this.license.name || '-',
      os_name: this.license.os_name || '-',
      version: this.license.version || '-',
    };
  }

  /**
   * Return whether device is valid.
   *
   * @return {boolean}
   */
  get valid() {
    if (blank(this.license) || blank(this.stats)) return false;

    const version = Number(this.license.version.replace(/\./g, ''));

    return version >= 1580;
  }

}

module.exports = Server;
