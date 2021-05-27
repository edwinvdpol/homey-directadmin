'use strict';

const superagent = require('superagent');
const qs = require('querystring');

class Api {

  constructor(homey) {
    this.homey = homey;
  }

  async additionalDomains(config) {
    if (config.id) {
      return this.call(config, 'ADDITIONAL_DOMAINS', {domain: config.id});
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
    let result = {
      count: 0,
      usage: 0
    };

    const response = await this.call(config, 'POP', {domain: config.id, action: 'full_list'});

    if (Object.keys(response).length === 0) {
      return result;
    }

    for (const user in response) {
      if (!response.hasOwnProperty(user)) {
        continue;
      }

      const inbox = qs.parse(response[user]);

      result.count++;
      result.usage += parseFloat(inbox.usage);
    }

    return result;
  }

  async call(config, command, query = {}, method = 'get') {
    const fullUrl = config.url + ':' + config.port + '/CMD_API_' + command;

    if (method === 'get') {
      query.json ='yes';
    }

    this.homey.log('Requested', method, fullUrl, JSON.stringify(query));

    return superagent
      [method](fullUrl)
      .query(query)
      .auth(config.username, config.password)
      .timeout({
        deadline: 5000 // 5 second timeout
      })
      .then(res => {
        return this.onSuccess(res);
      }).catch(err => {
        return this.onError(err);
      });
  }

  async onSuccess(res) {
    await this.onResponse(res);

    if (!res.hasOwnProperty('body')) {
      throw new Error(this.homey.__('api.response', JSON.stringify(res)));
    }

    if (res.body.error) {
      throw new Error(res.body.error.message);
    }

    return res.body;
  }

  async onError(err) {
    if (err.response) {
      await this.onResponse(err.response);
    } else {
      await this.onResponse(err);
    }

    if (err.data.message) {
      this.homey.error(err.data.message, JSON.stringify(err));
    } else {
      this.homey.error('Unknown error', JSON.stringify(err));
    }

    throw new Error(this.homey.__('api.connection'));
  }

  async onResponse(res) {
    if (res.unauthorized) {
      this.homey.error('Unauthorized', JSON.stringify(res));
      throw new Error(this.homey.__('api.unauthorized'));
    }

    if (res.forbidden) {
      this.homey.error('Forbidden', JSON.stringify(res));
      throw new Error(this.homey.__('api.forbidden'));
    }

    if (res.error) {
      this.homey.error('Server error', JSON.stringify(res));
      throw new Error(this.homey.__('api.error'));
    }

    if (res.timeout) {
      this.homey.error('Timeout', JSON.stringify(res));
      throw new Error(this.homey.__('api.timeout'));
    }

    if (res.header && res.header.hasOwnProperty('x-directadmin') && res.header['x-directadmin'].includes('Unauthorized')) {
      this.homey.error('Unauthorized via header', JSON.stringify(res));
      throw new Error(this.homey.__('api.unauthorized'));
    }
  }
}

module.exports = Api;
