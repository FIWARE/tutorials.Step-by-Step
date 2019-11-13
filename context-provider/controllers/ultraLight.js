//
// This controlller is simulates a series of devices using the Ultralight protocol
//
// Ultralight 2.0 is a lightweight text based protocol aimed to constrained devices and communications
// where the bandwidth and device memory may be limited resources.
//
// A device can report new measures to the IoT Platform using an HTTP GET request to the /iot/d path with the following query parameters:
//
//  i (device ID): Device ID (unique for the API Key).
//  k (API Key): API Key for the service the device is registered on.
//  t (timestamp): Timestamp of the measure. Will override the automatic IoTAgent timestamp (optional).
//  d (Data): Ultralight 2.0 payload.
//
// At the moment the API key and timestamp are unused by the simulator.

/* global SOCKET_IO */
/* global MQTT_CLIENT */
const NodeCache = require('node-cache');
const myCache = new NodeCache();
const _ = require('lodash');
const request = require('request');
const debug = require('debug')('tutorial:iot-device');
const IotDevices = require('./iotDevices');
const Security = require('./security');

// Connect to an IoT Agent and use fallback values if necessary
const UL_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';
const UL_HOST = process.env.IOTA_HTTP_HOST || 'localhost';
const UL_PORT = process.env.IOTA_HTTP_PORT || 7896;
const UL_URL = 'http://' + UL_HOST + ':' + UL_PORT + '/iot/d';
const UL_TRANSPORT = process.env.DUMMY_DEVICES_TRANSPORT || 'HTTP';

const DUMMY_DEVICE_HTTP_HEADERS = { 'Content-Type': 'text/plain' };

// A series of constants used by our set of devices
const OK = ' OK';
const NOT_OK = ' NOT OK';

// The bell will respond to the "ring" command.
// this will briefly set the bell to on.
// The bell  is not a sensor - it will not report state northbound
function processHttpBellCommand(req, res) {
  debug('processHttpBellCommand');
  const keyValuePairs = req.body.split('|') || [''];
  const command = getCommand(keyValuePairs[0]);
  const deviceId = 'bell' + req.params.id;
  const result = keyValuePairs[0] + '| ' + command;

  if (_.indexOf(myCache.keys(), deviceId) === -1) {
    debug('Unknown IoT device: ' + deviceId);
    return res.status(404).send(result + NOT_OK);
  } else if (_.indexOf(['ring'], command) === -1) {
    debug('Invalid command for a Bell: ' + command);
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  IotDevices.actuateDevice(deviceId, command);

  return res.status(200).send(result + OK);
}

// The door responds to "open", "close", "lock" and "unlock" commands
// Each command alters the state of the door. When the door is unlocked
// it can be opened and shut by external events.
function processHttpDoorCommand(req, res) {
  debug('processHttpDoorCommand');
  const keyValuePairs = req.body.split('|') || [''];
  const command = getCommand(keyValuePairs[0]);
  const deviceId = 'door' + req.params.id;
  const result = keyValuePairs[0] + '| ' + command;

  if (_.indexOf(myCache.keys(), deviceId) === -1) {
    debug('Unknown IoT device: ' + deviceId);
    return res.status(404).send(result + NOT_OK);
  } else if (_.indexOf(['open', 'close', 'lock', 'unlock'], command) === -1) {
    debug('Invalid command for a Door: ' + command);
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  IotDevices.actuateDevice(deviceId, command);

  return res.status(200).send(result + OK);
}

// The lamp can be "on" or "off" - it also registers luminocity.
// It will slowly dim as time passes (provided no movement is detected)
function processHttpLampCommand(req, res) {
  debug('processHttpLampCommand');
  const keyValuePairs = req.body.split('|') || [''];
  const command = getCommand(keyValuePairs[0]);
  const deviceId = 'lamp' + req.params.id;
  const result = keyValuePairs[0] + '| ' + command;

  if (_.indexOf(myCache.keys(), deviceId) === -1) {
    debug('Unknown IoT device: ' + deviceId);
    return res.status(404).send(result + NOT_OK);
  } else if (_.indexOf(['on', 'off'], command) === -1) {
    debug('Invalid command for a Lamp: ' + command);
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  IotDevices.actuateDevice(deviceId, command);
  return res.status(200).send(result + OK);
}

// The device monitor will display all MQTT messages on screen.
// cmd topics are consumed by the actuators (bell, lamp and door)
function processMqttMessage(topic, message) {
  debug('processMqttMessage');
  const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto';
  SOCKET_IO.emit('mqtt', mqttBrokerUrl + topic + '  ' + message);
  const path = topic.split('/');
  if (path.pop() === 'cmd') {
    const keyValuePairs = message.split('|') || [''];
    const command = getCommand(keyValuePairs[0]);
    const deviceId = path.pop();
    const result = keyValuePairs[0] + '| ' + command;

    if (_.indexOf(myCache.keys(), deviceId) === -1) {
      debug('Unknown IoT device: ' + deviceId);
    } else {
      IotDevices.actuateDevice(deviceId, command);
      const topic = '/' + UL_API_KEY + '/' + deviceId + '/cmdexe';
      MQTT_CLIENT.publish(topic, result + OK);
    }
  }
}


//
// Splits the deviceId from the command sent.
//
function getCommand(string) {
  const command = string.split('@');
  if (command.length === 1) {
    command.push('');
  }
  return command[1];
}

function sendPayload(deviceId, state){
   if (UL_TRANSPORT === 'HTTP') {
      const options = {
        method: 'POST',
        url: UL_URL,
        qs: { k: UL_API_KEY, i: deviceId },
        headers: DUMMY_DEVICE_HTTP_HEADERS,
        body: state
      };
      const debugText =
        'POST ' + UL_URL + '?i=' + options.qs.i + '&k=' + options.qs.k;

      request(options, error => {
        if (error) {
          debug(debugText + ' ' + error.code);
        }
      });
      SOCKET_IO.emit('http', debugText + '  ' + state);
    }
    if (UL_TRANSPORT === 'MQTT') {
      const topic = '/' + UL_API_KEY + '/' + deviceId + '/attrs';
      MQTT_CLIENT.publish(topic, state);
    }
}


// This function offers the Password Authentication flow for a secured IoT Sensors
// It is just a user filling out the Username and password form and adding the access token to
// subsequent requests.
function addAuthtoken() {
  debug('initSecureDevices');
  // With the Password flow, an access token is returned in the response.
  Security.oa
    .getOAuthPasswordCredentials(
      process.env.DUMMY_DEVICES_USER,
      process.env.DUMMY_DEVICES_PASSWORD
    )
    .then(results => {
      DUMMY_DEVICE_HTTP_HEADERS['X-Auth-Token'] = results.access_token;
    })
    .catch(error => {
      debug(error);
    });
}



// Transformation function from a state object to the Ultralight Protocol
// Ultralight is a series of pipe separated key-value pairs.
// Each key and value is in turn separated by a pipe character
//
// e.g. s|ON,l|1000
/*function toUltraLight(object) {
  const strArray = [];
  _.forEach(object, function(value, key) {
    strArray.push(key + '|' + value);
  });
  return strArray.join('|');
}*/


module.exports = {
  processHttpBellCommand,
  processHttpDoorCommand,
  processHttpLampCommand,
  processMqttMessage,
  sendPayload,
  addAuthtoken
};
