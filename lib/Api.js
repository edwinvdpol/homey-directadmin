'use strict';

const {SimpleClass} = require('homey');
const superagent = require('superagent');
const qs = require('querystring');

class Api extends SimpleClass {

  constructor(data) {
    super();

    this.config = data;
  }

  async additionalDomains(domain = null) {
    if (domain !== null) {
      return this.call('ADDITIONAL_DOMAINS?domain=' + domain);
    }

    return this.call('ADDITIONAL_DOMAINS');
  }

  async adminStats() {
    return this.call('ADMIN_STATS');
  }

  async license() {
    return this.call('LICENSE');
  }

  async emailStats(domain) {
    let result = {
      count: 0,
      usage: 0
    };

    const response = await this.call('POP', {domain: domain, action: 'full_list'});

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

  /**
   * Make a API call.
   */
  async call(command, query = {}, method = 'get') {
    const fullUrl = this.config.url + ':' + this.config.port + '/CMD_API_' + command;

    if (method === 'get') {
      query.json ='yes';
    }

    return superagent
      [method](fullUrl)
      .query(query)
      .auth(this.config.username, this.config.password)
      .then(res => {
        return this._onSuccess(res);
      }).catch(err => {
        return this._onError(err);
      });
  }

  /**
   * Success handler.
   *
   * @param {object} res
   * @returns {any}
   * @private
   */
  _onSuccess(res) {
    if (res.unauthorized) {
      throw new Error('api.unauthorized');
    }

    if (res.forbidden) {
      throw new Error('api.forbidden');
    }

    if (res.error) {
      throw new Error('api.error');
    }

    if (res.header.hasOwnProperty('x-directadmin') && res.header['x-directadmin'].includes('Unauthorized')) {
      throw new Error('api.unauthorized');
    }

    if (!res.hasOwnProperty('body')) {
      throw new Error('api.response');
    }

    if (res.body.error) {
      throw new Error('DA error: ' + res.body.error.message);
    }

    return res.body;
  }

  /**
   * Error handler.
   *
   * @param {object} err
   * @private
   */
  _onError(err) {
    console.log('onError', err);

    throw new Error('api.connection');
  }

}

module.exports = Api;
