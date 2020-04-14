'use strict';

const speedTest = require('speedtest-net');
const inherits = require('util').inherits;

let Service, Characteristic, FakeGatoHistoryService, HomebridgeAPI;

module.exports = function(homebridge) {
  FakeGatoHistoryService = require('fakegato-history')(homebridge);
  HomebridgeAPI = homebridge;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-speedtest-net', 'SpeedtestNet', SpeedtestNet);
};

function SpeedtestNet(log, config, api) {

  //HB
  this.config = config;
  this.log = log;
  this.api = api;

  //BASE
  this.name = config['name'] || 'SpeedtestNet';
  this.displayName = config.name;
  this.interval = (config.interval * 60 * 1000) || 60 * 60 * 1000;
  !this.dlspeed ? this.dlspeed = 0 : this.dlspeed;
  !this.ulspeed ? this.ulspeed = 0 : this.ulspeed;
  !this.ping ? this.ping = 0 : this.ping;
  !this.externalIp ? this.externalIp = '0.0.0.0' : this.externalIp;

  Characteristic.DownloadSpeed = function() {
    Characteristic.call(this, 'Download', 'C1107888-007C-2000-8000-0026BB765291');
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'Mbps',
      maxValue: 99999,
      minValue: 0,
      minStep: 0.01,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.DownloadSpeed, Characteristic);
  Characteristic.DownloadSpeed.UUID = 'C1107888-007C-2000-8000-0026BB765291';

  Characteristic.UploadSpeed = function() {
    Characteristic.call(this, 'Upload', 'C1107889-007C-2000-8000-0026BB765291');
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'Mbps',
      maxValue: 99999,
      minValue: 0,
      minStep: 0.01,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.UploadSpeed, Characteristic);
  Characteristic.UploadSpeed.UUID = 'C1107889-007C-2000-8000-0026BB765291';

  Characteristic.Ping = function() {
    Characteristic.call(this, 'Ping', 'C1107890-007C-2000-8000-0026BB765291');
    this.setProps({
      format: Characteristic.Formats.INT,
      unit: 'ms',
      maxValue: 999,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.Ping, Characteristic);
  Characteristic.Ping.UUID = 'C1107890-007C-2000-8000-0026BB765291';

  Characteristic.ExternalIp = function() {
    Characteristic.call(this, 'External IP', 'C1107891-007C-2000-8000-0026BB765291');
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.ExternalIp, Characteristic);
  Characteristic.ExternalIp.UUID = 'C1107891-007C-2000-8000-0026BB765291';

}

SpeedtestNet.prototype = {

  getServices: function() {
    const self = this;

    this.informationService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Identify, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Kienz')
      .setCharacteristic(Characteristic.Model, 'SpeedtestNet')
      .setCharacteristic(Characteristic.SerialNumber, '11111100100');

    this.Sensor = new Service.TemperatureSensor(this.name);

    this.Sensor.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: 0,
        maxValue: 9999,
        minStep: 0.01
      })
      .updateValue(this.dlspeed);

    this.Sensor.addCharacteristic(Characteristic.DownloadSpeed);
    this.Sensor.getCharacteristic(Characteristic.DownloadSpeed)
      .updateValue(this.dlspeed);

    this.Sensor.addCharacteristic(Characteristic.UploadSpeed);
    this.Sensor.getCharacteristic(Characteristic.UploadSpeed)
      .updateValue(this.ulspeed);

    this.Sensor.addCharacteristic(Characteristic.Ping);
    this.Sensor.getCharacteristic(Characteristic.Ping)
      .updateValue(this.ping);

    this.Sensor.addCharacteristic(Characteristic.ExternalIp);
    this.Sensor.getCharacteristic(Characteristic.ExternalIp)
      .updateValue(this.externalIp);

    this.historyService = new FakeGatoHistoryService('weather', this, {
      storage: 'fs',
      path: HomebridgeAPI.user.cachedAccessoryPath()
    });

    (async function() {
      await self.getData();
      self.getHistory();
    })();

    return [this.informationService, this.Sensor, this.historyService];

  },

  getData: async function() {
    const self = this;
    let data;
    self.log('Starting broadband measurement...');

    try {
      data = await speedTest({
          acceptLicense: true,
          acceptGdpr: true
      });

      self.dlspeed = (data.download.bandwidth * 8 / 1000 / 1000).toFixed(2);
      self.ulspeed = (data.upload.bandwidth * 8/ 1000 / 1000).toFixed(2);
      self.ping = data.ping.latency;
      self.externalIp = data.interface.externalIp;

      self.log('Download: ' + self.speedText(data.download.bandwidth));
      self.log('Upload: ' + self.speedText(data.upload.bandwidth));
      self.log('Ping: ' + self.ping + ' ms');
      self.log('External IP: ' + self.externalIp);

      self.Sensor.getCharacteristic(Characteristic.CurrentTemperature).updateValue(self.dlspeed);
      self.Sensor.getCharacteristic(Characteristic.DownloadSpeed).updateValue(self.dlspeed);
      self.Sensor.getCharacteristic(Characteristic.UploadSpeed).updateValue(self.ulspeed);
      self.Sensor.getCharacteristic(Characteristic.Ping).updateValue(self.ping);
      self.Sensor.getCharacteristic(Characteristic.ExternalIp).updateValue(self.externalIp);

      setTimeout(function() {
        self.getData();
      }, self.interval);
  } catch (err) {
    self.log('An error occured: ' + err + ' - Trying again in 1 min');
      self.dlspeed = self.dlspeed;
      self.ulspeed = self.ulspeed;
      self.ping = self.ping;
      self.externalIp = self.externalIp;

      self.Sensor.getCharacteristic(Characteristic.CurrentTemperature).updateValue(self.dlspeed);
      self.Sensor.getCharacteristic(Characteristic.DownloadSpeed).updateValue(self.dlspeed);
      self.Sensor.getCharacteristic(Characteristic.UploadSpeed).updateValue(self.ulspeed);
      self.Sensor.getCharacteristic(Characteristic.Ping).updateValue(self.ping);
      self.Sensor.getCharacteristic(Characteristic.ExternalIp).updateValue(self.externalIp);

      setTimeout(async function() {
        await self.getData();
      }, 60000);
    }
  },

  getHistory: function() {
    const self = this;

    if (self.dlspeed != 0 && self.ulspeed != 0 && self.ping != 0) {
        self.log('Add history data', self.dlspeed, self.ulspeed, self.ping);

        self.historyService.addEntry({
          time: parseInt((Date.now() / 1000).toFixed(0), 10),
          temp: self.dlspeed,
          pressure: self.ping,
          humidity: self.ulspeed
        });
    }
    setTimeout(function() {
      self.getHistory();
    }, 8 * 60 * 1000); // Every 8 minutes
  },

  identify: function(callback) {
    this.log(this.name + ': Identified!');
    callback();
  },

  speedText(speed) {
    let bits = speed * 8;
    const units = ['', 'K', 'M', 'G', 'T'];
    const places = [0, 1, 2, 3, 3];
    let unit = 0;

    while (bits >= 2000 && unit < 4) {
      unit++;
      bits /= 1000;
    }

    return `${bits.toFixed(places[unit])} ${units[unit]}bps`;
  }

};