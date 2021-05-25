'use strict';

const Homey = require('homey');

class App extends Homey.App {

  log() {
    console.log.bind(this, '[log]').apply(this, arguments);
  }

  error() {
    console.error.bind(this, '[error]').apply(this, arguments);
  }

  onInit() {
    this.log(Homey.manifest.id + ' running...');

    process.on('unhandledRejection', error => {
      this.error('unhandledRejection! ', error);
    });

    process.on('uncaughtException', error => {
      this.error('uncaughtException! ', error);
    });

    Homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    }).on('unload', () => {
      this.log('Unloading...');
    });
  }

};

module.exports = App;
