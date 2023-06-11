'use strict';

const fetch = require('node-fetch');
const qs = require('querystring');
const AbortController = require('abort-controller');
const { blank } = require('./Utils');

class Client {

  // Constructor
  constructor(settings) {
    const {
      host, port, user, pass,
    } = settings;

    let aHost = host;

    // Remove trailing slash
    if (host.slice(-1) === '/') {
      aHost = host.slice(0, -1);
    }

    this.controller = new AbortController();
    this.url = `${aHost}:${port}/CMD_API_`;

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
    const result = {};

    // Domain
    if (driver === 'domain') {
      const email = await this.call('POP', { domain: id, action: 'full_list' });
      const domains = await this.call('ADDITIONAL_DOMAINS', { name: id });

      // Check if domain exists
      if (blank(domains[id])) {
        throw new Error('errors.domain_not_found');
      }

      result.email = email;
      result.domain = domains[id];
    }

    // Server
    if (driver === 'server') {
      result.stats = await this.call('ADMIN_STATS');
      result.license = await this.call('LICENSE');
    }

    return result;
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
      throw new Error(`errors.${res.status}`);
    }

    // Internal server error
    if (res.status >= 500 && res.status < 600) {
      throw new Error('errors.50x');
    }

    throw new Error('errors.unknown');
  };

  // Handle connection errors
  handleError = (err) => {
    if (err.type !== 'system' && err.type !== 'aborted') {
      throw err;
    }

    console.log('[API] Error:', err.message);

    if (err.type === 'system') {
      throw new Error('errors.network');
    }

    if (err.type === 'aborted') {
      throw new Error('errors.network');
    }

    throw err;
  };

}

module.exports = Client;
