'use strict';

const Device = require('../../lib/Device');

class DomainDevice extends Device {

  /*
  | Synchronization functions
  */

  // Handle sync data
  async handleSyncData(domain) {
    // Check if domain is suspended
    if (domain.is_suspended) {
      throw new Error(this.homey.__('error.domain_suspended'));
    }

    // Check if domain is active
    if (!domain.is_active) {
      throw new Error(this.homey.__('error.domain_deactivated'));
    }
  }

}

module.exports = DomainDevice;
