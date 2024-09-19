'use strict';

const fetch = require('node-fetch');
const qs = require('querystring');
const AbortController = require('abort-controller');
const { blank } = require('./Utils');
const Domain = require('../models/Domain');
const Server = require('../models/Server');

class Client {

  constructor(store) {
    const {
      host, port, user, pass,
    } = store;

    this.store = store;
    this.controller = new AbortController();
    this.url = `${host}:${port}/CMD_API_`;

    this.options = {
      method: 'GET',
      signal: this.controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
      },
    };
  }

  /*
  | Domain functions
  */

  // Return domains
  async discoverDomains() {
    const domains = await this.getDomains();

    return Object.values(domains)
      .filter((domain) => domain.valid)
      .map((domain) => domain.data)
      .filter((e) => e);
  }

  // Return domain data
  async getDomain(id) {
    let domains = await this.getDomains();
    const domain = domains[id] || null;

    domains = null;

    // Check if domain exists
    if (blank(domain)) {
      throw new Error('error.domain_not_found');
    }

    const pop = await this.call('POP', { domain: id, action: 'full_list' });

    domain.email_accounts = Number(Object.keys(pop).length);

    return domain;
  }

  // Return all domains
  async getDomains() {
    const data = await this.call('ADDITIONAL_DOMAINS');
    const domains = {};

    Object.keys(data).forEach((key) => {
      data[key].store = this.store;
      domains[key] = new Domain(data[key]);
    });

    return domains;
  }

  /*
  | Server functions
  */

  // Get server
  async getServer() {
    return new Server({
      stats: await this.call('ADMIN_STATS'),
      license: await this.call('LICENSE'),
      store: this.store,
    });
  }

  /*
  | Device functions
  */

  // Return device information
  async getDevice(id, driver) {
    // Domain
    if (driver === 'domain') {
      return this.getDomain(id);
    }

    // Server
    if (driver === 'server') {
      return this.getServer();
    }

    return {};
  }

  // Make an API call
  async call(command, query = {}) {
    query.json = 'yes';

    const timeout = setTimeout(() => {
      this.controller.abort();
    }, 5000);

    return fetch(`${this.url}${command}?${qs.stringify(query)}`, this.options)
      .then(this.responseCheck)
      .then((res) => res.json())
      .catch((err) => {
        return this.handleError(err);
      })
      .finally(() => {
        clearTimeout(timeout);
      });
  }

  // Check response status
  responseCheck = (res) => {
    if (res.ok) {
      return res;
    }

    console.log(`[API] HTTP error ${res.status}:`, JSON.stringify(res));

    // Client errors
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new Error(`error.${res.status}`);
    }

    // Internal server error
    if (res.status >= 500 && res.status < 600) {
      throw new Error('error.50x');
    }

    throw new Error('error.unknown');
  };

  // Handle connection errors
  handleError = (err) => {
    if (err.type !== 'system' && err.type !== 'aborted') {
      throw err;
    }

    console.log('[API] Error:', err.message);

    if (err.type === 'system') {
      throw new Error('error.network');
    }

    if (err.type === 'aborted') {
      throw new Error('error.network');
    }

    throw err;
  };

}

module.exports = Client;
