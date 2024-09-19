/* eslint-disable camelcase */

'use strict';

const { filled } = require('../lib/Utils');

class Domain {

  /**
   * Represents a domain.
   *
   * @constructor
   */
  constructor(data) {
    this.active = data.active;
    this.bandwidth = data.bandwidth;
    this.domain = data.domain;
    this.email_accounts = data.email_accounts;
    this.quota = data.quota;
    this.store = data.store;
    this.suspended = data.suspended;
  }

  /**
   * Return device capability values.
   *
   * @return {Object}
   */
  get capabilityValues() {
    if (!this.valid) return {};

    return Object.fromEntries(Object.entries({
      active: this.is_active,
      bandwidth: this.bandwidth ? parseFloat(this.bandwidth) : null,
      email_accounts: this.email_accounts,
      quota: this.quota ? parseFloat(this.quota) : null,
      suspended: this.is_suspended,
    }).filter(([_, v]) => v || typeof v === 'boolean'));
  }

  /**
   * Return device data.
   *
   * @return {Object}
   */
  get data() {
    return {
      name: this.domain,
      data: {
        id: this.domain,
      },
      store: this.store,
    };
  }

  /**
   * Return whether domain is active.
   *
   * @return {boolean}
   */
  get is_active() {
    return this.active === 'yes';
  }

  /**
   * Return whether domain is suspended.
   *
   * @return {boolean}
   */
  get is_suspended() {
    return this.suspended === 'yes';
  }

  /**
   * Return whether domain is valid.
   *
   * @return {boolean}
   */
  get valid() {
    return filled(this.domain);
  }

}

module.exports = Domain;
