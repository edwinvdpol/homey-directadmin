'use strict';

const Homey = require('homey');
const qs = require('querystring');
const Api = require('./lib/Api');

class App extends Homey.App {

  // Initialized
  async onInit() {
    this.log('DirectAdmin App running...');

    // Initiate API client
    if (!this.client) {
      this.client = new Api({ homey: this.homey });
    }

    // Event listeners
    this.homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    }).on('unload', () => {
      this.client = null;

      this.log('-- Unloaded! _o/ --');
    });
  }

  // Request domain(s)
  additionalDomains(data) {
    if (data.id) {
      return this.client.call('ADDITIONAL_DOMAINS', data, { domain: data.id });
    }

    return this.client.call('ADDITIONAL_DOMAINS', data);
  }

  // Request admin statistics
  adminStats(data) {
    return this.client.call('ADMIN_STATS', data);
  }

  // Request email statistics
  async emailStats(data) {
    const result = {
      count: 0,
      usage: 0,
    };

    const response = await this.client.call('POP', data, { domain: data.id, action: 'full_list' });

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

  // Request license information
  license(data) {
    return this.client.call('LICENSE', data);
  }

}

module.exports = App;
