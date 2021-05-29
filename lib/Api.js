'use strict';

const fetch = require('node-fetch');
const qs = require('querystring');
const AbortController = require('abort-controller');

const controller = new AbortController();

class Api {

  constructor(homey) {
    if (!this.homey) {
      this.homey = homey;
    }
  }

  async additionalDomains(config) {
    if (config.id) {
      return this.call(config, 'ADDITIONAL_DOMAINS', { domain: config.id });
    }

    return this.call(config, 'ADDITIONAL_DOMAINS');
  }

  async adminStats(config) {
    return this.call(config, 'ADMIN_STATS');
  }

  async license(config) {
    return this.call(config, 'LICENSE');
  }

  async emailStats(config) {
    const result = {
      count: 0,
      usage: 0,
    };

    const response = await this.call(config, 'POP', { domain: config.id, action: 'full_list' });

    if (Object.keys(response).length === 0) {
      return result;
    }

    Object.keys(response).forEach(user => {
      const inbox = qs.parse(response[user]);

      result.count++;
      result.usage += parseFloat(inbox.usage);
    });

    return result;
  }

  async call(config, command, query = {}) {
    const fullUrl = `${config.url}:${config.port}/CMD_API_${command}`;

    query.json = 'yes';

    this.homey.log('Requested GET', fullUrl, JSON.stringify(query));

    const timeout = this.homey.setTimeout(() => {
      controller.abort();
    }, 5000);

    try {
      const res = await fetch(`${fullUrl}?${qs.stringify(query)}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
        },
      });

      // Check HTTP response
      await this.checkStatus(res);

      return res.json();
    } catch (err) {
      return this.handleError(err);
    } finally {
      this.homey.clearTimeout(timeout);
    }
  }

  checkStatus = res => {
    if (res.ok) {
      return res;
    }

    if (res.status === 400) {
      this.homey.error('Bad request', JSON.stringify(res));
      throw new Error(this.homey.__('api.badRequest'));
    }

    if (res.status === 401) {
      this.homey.error('Unauthorized', JSON.stringify(res));
      throw new Error(this.homey.__('api.unauthorized'));
    }

    if (res.status === 502 || res.status === 504) {
      this.homey.error('Timeout', JSON.stringify(res));
      throw new Error(this.homey.__('api.timeout'));
    }

    if (res.status === 500) {
      this.homey.error('Server error', JSON.stringify(res));
      throw new Error(this.homey.__('api.error'));
    }

    this.homey.error('Unknown error', JSON.stringify(res));
    throw new Error(this.homey.__('api.connection'));
  }

  handleError = err => {
    this.homey.error(err);

    if (err.type === 'system') {
      throw new Error(this.homey.__('api.connection'));
    }

    if (err.type === 'aborted') {
      throw new Error(this.homey.__('api.timeout'));
    }

    throw new Error(err.message);
  }

}

module.exports = Api;
