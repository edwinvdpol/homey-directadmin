'use strict';

const { clean } = require('./Utils');

class Data {

  constructor(raw) {
    Object.assign(this, clean({
      ...this.fromApiData(raw),
      ...this.fromLoginData(raw),
    }));
  }

  get device() {
    return {
      name: this.name,
      data: { id: this.id },
      store: this.store,
    };
  }

  get store() {
    return {
      host: this.host,
      port: this.port || 2222,
      user: this.user || 'admin',
      pass: this.pass,
    };
  }

  fromApiData(raw) {
    const data = {};

    if ('active' in raw) data.active = raw.active === 'yes';
    if ('bandwidth' in raw) data.bandwidth = Math.round((Number(raw.bandwidth) + Number.EPSILON) * 100) / 100;
    if ('email' in raw) data.email_accounts = Number(Object.keys(raw.email).length);
    if ('ip' in raw) data.ip = raw.ip;
    if ('mysql' in raw) data.databases = Number(raw.mysql);
    if ('name' in raw) data.name = raw.name;
    if ('nemailf' in raw) data.email_forwarders = Number(raw.nemailf);
    if ('nemails' in raw) data.email_accounts = Number(raw.nemails);
    if ('nresellers' in raw) data.resellers = Number(raw.nresellers);
    if ('nusers' in raw) data.users = Number(raw.nusers);
    if ('os_name' in raw) data.os_name = raw.os_name;
    if ('quota' in raw) data.quota = Math.round((Number(raw.quota) + Number.EPSILON) * 100) / 100;
    if ('server_bandwidth' in raw) data.server_bandwidth = Math.round(((Number(raw.server_bandwidth) / 1024) + Number.EPSILON) * 100) / 100;
    if ('suspended' in raw) data.suspended = raw.suspended === 'yes';
    if ('update_available' in raw) data.update_available = raw.update_available === '1';
    if ('version' in raw) data.version = raw.version;
    if ('vdomains' in raw) data.domains = Number(raw.vdomains);

    return data;
  }

  fromLoginData(raw) {
    const data = {};

    if ('host' in raw) data.host = raw.host;
    if ('port' in raw) data.port = Number(raw.port);
    if ('user' in raw) data.user = raw.user;
    if ('pass' in raw) data.pass = raw.pass;

    return data;
  }

}

module.exports = Data;
