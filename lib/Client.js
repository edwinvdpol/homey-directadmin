'use strict';

const fetch = require('node-fetch');
const qs = require('querystring');
const AbortController = require('abort-controller');
const { blank } = require('./Utils');

class Client {

  constructor(store) {
    const { host, port, user, pass } = store;

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
  async getSyncData(domain, driver) {
    let result = {};

    // Domain
    if (driver === 'domain') {
      const [email, domains] = await Promise.all([
        await this.call('POP', { domain, action: 'full_list' }),
        await this.call('ADDITIONAL_DOMAINS'),
      ]);

      // Check if domain exists
      if (!(domain in domains)) {
        throw new Error('error.domain_not_found');
      }

      result = domains[domain];
      result.email = email;
    }

    // Server
    if (driver === 'server') {
      const [licence, stats] = await Promise.all([
        await this.call('LICENSE'),
        await this.call('ADMIN_STATS'),
      ]);

      result = { ...licence, ...stats };

      if ('bandwidth' in result) {
        result.server_bandwidth = result.bandwidth;
        delete result.bandwidth;
      }
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
    if (res.ok) return res;

    console.log(`[API] HTTP error ${res.status}:`, JSON.stringify(res));

    // Client errors
    if ([400, 401, 403].includes(res.status)) {
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

    if (err.type === 'system') throw new Error('error.network');
    if (err.type === 'aborted') throw new Error('error.network');

    throw err;
  };

}

module.exports = Client;
