'use strict';

const fetch = require('node-fetch');
const qs = require('querystring');
const AbortController = require('abort-controller');
const {SimpleClass} = require('homey');

class Client extends SimpleClass {

  // Constructor
  constructor({homey}) {
    super();

    this.homey = homey;

    this.registerEventListeners().catch(this.error);
  }

  // Synchronize device
  async onSync(device) {
    const {id} = device.getData();
    const settings = device.getSettings();
    const driver = device.driver.id;

    try {
      let result = {};

      // Domain
      if (driver === 'domain') {
        const email = await this.call('POP', settings, {domain: id, action: 'full_list'});
        const domains = await this.call('ADDITIONAL_DOMAINS', settings, {name: id});

        // Check if domain exists
        if (!domains.hasOwnProperty(id)) {
          throw new Error(this.homey.__('error.domain_not_found'));
        }

        result.email = email;
        result.domain = domains[id];
      }

      // Server
      if (driver === 'server') {
        result.stats = await this.call('ADMIN_STATS', settings);
        result.license = await this.call('LICENSE', settings);
      }

      this.homey.emit(`sync:${id}`, result);
    } catch (err) {
      this.homey.emit(`error:${id}`, err.message);
    }
  }

  // Make an API call
  async call(command, data, query = {}) {
    // Remove trailing slash
    if (data.host.slice(-1) === '/') {
      data.host = data.host.slice(0, -1);
    }

    query.json = 'yes';

    const fullUrl = `${data.host}:${data.port}/CMD_API_${command}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    const options = {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${data.user}:${data.pass}`).toString('base64')}`
      }
    };

    return fetch(`${fullUrl}?${qs.stringify(query)}`, options)
      .then(this.responseCheck)
      .then(res => res.json())
      .catch(err => {
        throw this.handleError(err);
      }).finally(() => {
        clearTimeout(timeout);
      });
  }

  // Check response status
  responseCheck = res => {
    if (res.ok) {
      return res;
    }

    this.homey.error(`[API] HTTP error ${res.status}:`, JSON.stringify(res));

    if (res.status === 400) {
      throw new Error(this.homey.__('api.badRequest'));
    }

    if (res.status === 401) {
      throw new Error(this.homey.__('api.unauthorized'));
    }

    if (res.status === 502 || res.status === 504) {
      throw new Error(this.homey.__('api.timeout'));
    }

    if (res.status === 500) {
      throw new Error(this.homey.__('api.error'));
    }

    throw new Error(this.homey.__('api.connection'));
  };

  // Handle connection errors
  handleError = err => {
    if (err.type !== 'system' && err.type !== 'aborted') {
      return err;
    }

    this.homey.error('[API] Error:', err.message);

    if (err.type === 'system') {
      return new Error(this.homey.__('api.connection'));
    }

    if (err.type === 'aborted') {
      return new Error(this.homey.__('api.timeout'));
    }

    return err;
  };

  /*
  | Listener functions
  */

  // Register event listeners
  async registerEventListeners() {
    this.onSync = this.onSync.bind(this);

    this.homey.on('sync', this.onSync);
  }

  // Remove event listeners
  async removeEventListeners() {
    this.homey.off('sync', this.onSync);

    this.onSync = null;
  }

}

module.exports = Client;
