# homebridge-speedtest-net
Homebridge Plugin for broadband speed measurement as temperature sensor

[![npm](https://img.shields.io/npm/v/homebridge-speedtest-net.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-speedtest-net)
[![npm](https://img.shields.io/npm/dt/homebridge-speedtest-net.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-speedtest-net)
[![GitHub last commit](https://img.shields.io/github/last-commit/Kienz/homebridge-speedtest-net.svg?style=flat-square)](https://github.com/SeydX/homebridge-speedtest-net)

# Homebridge plugin for checking your broadband speed

This homebridge plugin exposes a new temperature sensor to HomeKit to see your broadband speed at home. It also has characteristics to see the download- and upload speed, your ping and your external ip within i.e. [Elgato Eve app](https://apps.apple.com/de/app/eve-f%C3%BCr-homekit/id917695792).

For the download speed the Eve History ([fakegato-history](https://github.com/simont77/fakegato-history)) is used.

**NOTE:** The Eve History seems to have problems with high values - sometimes it shows negative values instead. Have to look deeper in this issue.

See [Images](https://github.com/Kienz/homebridge-speedtest-net/tree/master/images/) for more details.

# Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

 ```sudo npm install -g homebridge-speedtest-net@latest --unsafe-perm```

 **NOTE**:
 If you get the follwing error in the console you have to manually create the directories `binaries` and `pkg`.

 _An error occured: Error: EACCES: permission denied, mkdir '/usr/lib/node_modules/homebridge-speedtest-net/node_modules/speedtest-net/binaries' - Trying again in 1 min_

Open the terminal (eg. in homebridge-config-ui-x) and execute the following commands.

 ```bash
 cd /usr/lib/node_modules/homebridge-speedtest-net/node_modules/speedtest-net/
 su pi
 sudo mkdir binaries pkg
 sudo chmod 777 binaries/ pkg/
 ````

This problems occures because the NodeJS tool [speedtest.net](https://github.com/ddsol/speedtest.net) wants to create directories to download the test files for speed test. I have to look into it.


 ## Example config.json:

 ```
{
  "bridge": {
      ...
  },
  "accessories": [
    {
      "accessory": "SpeedtestNet",
      "name": "Internet",
      "interval": 60
    }
  ]
}
```


## Options

| **Attributes** | **Required** | **Usage** |
|------------|----------|-------|
| accessory | **Yes** | Must be "SpeedtestNet" |
| name | No | Name for the Accessory (Default: SpeedtestNet) |
| interval | No | Interval for checing the broadband in mins (Default: 60min) |


## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/Kienz/homebridge-speedtest-net/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/Kienz/homebridge-speedtest-net/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are welcome.

This plugin is forked from [homebridge-broadband](https://github.com/SeydX/homebridge-broadband).
