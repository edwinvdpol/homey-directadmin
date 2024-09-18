'use strict';

const fetch = require('node-fetch');
const qs = require('querystring');
const AbortController = require('abort-controller');
const { blank } = require('./Utils');

class Client {

  constructor(store) {
    const {
      host, port, user, pass,
    } = store;

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

  // Return device information
  async getSyncData(id, driver) {
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

  // Get domain
  async getDomain(id) {
    const email = await this.call('POP', { domain: id, action: 'full_list' });
    const domains = await this.call('ADDITIONAL_DOMAINS', { name: id });
    const domain = domains[id] || null;

    // Check if domain exists
    if (blank(domain)) {
      throw new Error('error.domain_not_found');
    }

    return { email, domain };
  }

  // Get server
  async getServer() {
    return {
      stats: await this.call('ADMIN_STATS'),
      license: await this.call('LICENSE'),
    };
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
