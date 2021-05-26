'use strict';

const Homey = require('homey');

class App extends Homey.App {

  async onInit() {
    this.log(Homey.manifest.id + ' running...');

    this.homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    });
  }

}

module.exports = App;
