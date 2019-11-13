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
const _ = require('lodash');

const debug = require('debug')('tutorial:ultralight');
const IoTDevices = require('./iotDevices');
const DEVICE_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';

// A series of constants used by our set of devices
const OK = ' OK';
const NOT_OK = ' NOT OK';

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

// The bell will respond to the "ring" command.
// this will briefly set the bell to on.
// The bell  is not a sensor - it will not report state northbound
function processHttpBellCommand(req, res) {
  debug('processHttpBellCommand');
  const keyValuePairs = req.body.split('|') || [''];
  const command = getCommand(keyValuePairs[0]);
  const deviceId = 'bell' + req.params.id;
  const result = keyValuePairs[0] + '| ' + command;

  if (IoTDevices.notFound(deviceId)) {
    debug('Unknown IoT device: ' + deviceId);
    return res.status(404).send(result + NOT_OK);
  } else if (_.indexOf(['ring'], command) === -1) {
    debug('Invalid command for a Bell: ' + command);
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  IoTDevices.actuateDevice(deviceId, command);

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

  if (IoTDevices.notFound(deviceId)) {
    debug('Unknown IoT device: ' + deviceId);
    return res.status(404).send(result + NOT_OK);
  } else if (_.indexOf(['open', 'close', 'lock', 'unlock'], command) === -1) {
    debug('Invalid command for a Door: ' + command);
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  IoTDevices.actuateDevice(deviceId, command);

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

  if (IoTDevices.notFound(deviceId)) {
    debug('Unknown IoT device: ' + deviceId);
    return res.status(404).send(result + NOT_OK);
  } else if (_.indexOf(['on', 'off'], command) === -1) {
    debug('Invalid command for a Lamp: ' + command);
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  IoTDevices.actuateDevice(deviceId, command);
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

    if (IoTDevices.notFound(deviceId)) {
      debug('Unknown IoT device: ' + deviceId);
    } else {
      IoTDevices.actuateDevice(deviceId, command);
      const topic = '/' + DEVICE_API_KEY + '/' + deviceId + '/cmdexe';
      MQTT_CLIENT.publish(topic, result + OK);
    }
  }
}

module.exports = {
  processHttpBellCommand,
  processHttpDoorCommand,
  processHttpLampCommand,
  processMqttMessage
};
