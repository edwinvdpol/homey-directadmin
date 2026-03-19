'use strict';

const Device = require('../../lib/Device');

class DomainDevice extends Device {

  /*
  | Synchronization functions
  */

  // Handle sync data
  async handleSyncData(data) {
    // Check if domain is active
    if ('active' in data && !data.active) {
      throw new Error('error.domain_deactivated');
    }

    // Check if domain is suspended
    if ('suspended' in data && data.suspended) {
      throw new Error('error.domain_suspended');
    }
  }

}

module.exports = DomainDevice;
