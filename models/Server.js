'use strict';

class Server {

  /**
   * Represents a server.
   *
   * @constructor
   */
  constructor(data) {
    this.id = data.lid;
    this.bandwidth = data.bandwidth;
    this.ip = data.ip;
    this.mysql = data.mysql;
    this.name = data.name;
    this.nemailf = data.nemailf;
    this.nemails = data.nemails;
    this.nresellers = data.nresellers;
    this.nusers = data.nusers;
    this.os_name = data.os_name;
    this.update_available = data.update_available;
    this.store = data.store;
    this.version = data.version;
    this.vdomains = data.vdomains;
  }

  /**
   * Return device capability values.
   *
   * @return {Object}
   */
  get capabilityValues() {
    if (!this.valid) return {};

    return Object.fromEntries(Object.entries({
      databases: Number(this.mysql),
      domains: Number(this.vdomains),
      email_accounts: Number(this.nemails),
      email_forwarders: Number(this.nemailf),
      resellers: Number(this.nresellers),
      server_bandwidth: Number(this.bandwidth / 1024),
      update_available: this.update_available !== '0',
      users: Number(this.nusers),
    }).filter(([_, v]) => v || typeof v === 'boolean'));
  }

  /**
   * Return device data.
   *
   * @return {Object}
   */
  get data() {
    return {
      name: this.name,
      data: {
        id: this.id,
      },
      settings: this.settings,
      store: this.store,
    };
  }

  /**
   * Return device settings.
   *
   * @return {{ip: string, name: string, os_name: string, version: string}}
   */
  get settings() {
    return {
      ip: this.ip || '-',
      name: this.name || '-',
      os_name: this.os_name || '-',
      version: this.version || '-',
    };
  }

  /**
   * Return whether device is valid.
   *
   * @return {boolean}
   */
  get valid() {
    const version = Number(this.version.replace(/\./g, ''));

    return version >= 1580;
  }

}

module.exports = Server;
