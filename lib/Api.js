'use strict';

const Homey = require('homey');
const http = require('httpreq');
const util = require('util');

class Api {

  constructor(data) {
    this.config = data;
  }

  async processData(data) {
    if (data.error) {
      console.error('processData', data);
      throw new Error(Homey.__('error.permission_denied'));
    }

    return data;
  }

  async httpResponse(result) {
    const data = result && result.body || '';

    // Authorisation error
    if (result.headers.hasOwnProperty('x-directadmin') && result.headers['x-directadmin'].includes('Unauthorized')) {
      throw new Error(Homey.__('error.login_failed'));
    }

    // HTML page is returned
    if (data.includes('<html>')) {
      console.error('HTML response', data);
      throw new Error(Homey.__('error.invalid_data'));
    }

    return await this.processData(data);
  }

  async httpRequest(params) {
    const fullUrl = this.config.url + ':' + this.config.port + '/CMD_API_' + this.command;

    console.log(fullUrl);

    let options = {
      url: fullUrl,
      method: 'GET',
      timeout: 5000,
      auth: this.config.username + ':' + this.config.password
    };

    // Params is optional
    if (typeof params === 'undefined') {
      params = {};
    }

    // Build parameters
    if (Object.keys(params).length) {
      options.parameters = params;
    }

    const httpPromise = util.promisify(http.doRequest);

    // Do request
    return await httpPromise(options)
      .then(result => {
        return this.httpResponse(result);
      });
  }

  async getJsonData(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('getJsonData', error);
      throw new Error(Homey.__('error.invalid_data'));
    }
  }

  async getAdditionalDomains(domain = null) {
    if (domain !== null) {
      this.command = 'ADDITIONAL_DOMAINS?domain=' + domain + '&json=yes';
    } else {
      this.command = 'ADDITIONAL_DOMAINS?json=yes';
    }

    const data = await this.httpRequest();
    return this.getJsonData(data);
  }

  async getAdminStats() {
    this.command = 'ADMIN_STATS?json=yes';
    const data = await this.httpRequest();
    return this.getJsonData(data);
  }

  async getLicense() {
    this.command = 'LICENSE?json=yes';
    const data = await this.httpRequest();
    return this.getJsonData(data);
  }

  // async getPopStats (domain) {
  //     this.command = 'POP?domain=' + domain + '&action=full_list';
  //     let data = await this.httpRequest();
  //     let popObj = { count: 0, usage: 0 };
  //
  //     if (data.length === 0) {
  //         return popObj;
  //     }
  //
  //     let lines = querystring.parse(data);
  //
  //     for (var user in lines) {
  //         let userdata = querystring.parse(lines[user]);
  //         popObj.count++;
  //         popObj.usage += parseFloat(userdata.usage);
  //     }
  //
  //     return popObj;
  // }

}

module.exports = Api;
