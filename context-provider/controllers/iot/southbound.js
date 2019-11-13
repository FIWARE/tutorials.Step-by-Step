//
// This controller is simulates a receiver for a series of devices.
// Southbound traffic consists of commands which are processed by the
// dummy IoT devices
//

/* global SOCKET_IO */
/* global MQTT_CLIENT */
const _ = require('lodash');

const debug = require('debug')('tutorial:southbound');
const IoTDevices = require('./devices');
const DEVICE_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';
const DEVICE_PAYLOAD = process.env.DUMMY_DEVICES_PAYLOAD || 'ultralight';

// A series of constants used by our set of devices
const OK = ' OK';
const NOT_OK = ' NOT OK';

//
// Splits the deviceId from the command sent.
//
function getUltralightCommand(string) {
  const command = string.split('@');
  if (command.length === 1) {
    command.push('');
  }
  return command[1];
}

// This Processor extracts ultralight commands from
// the payload and actuates the bell, door or lamp
// as necessary.

// Ultralight 2.0 is a lightweight text based protocol aimed to constrained
// devices and communications where the bandwidth and device memory may be limited
// resources.
//
// A device can report new measures to the IoT Platform using an HTTP GET request
// to the /iot/d path with the following query parameters:
//
//  i (device ID): Device ID (unique for the API Key).
//  k (API Key): API Key for the service the device is registered on.
//  t (timestamp): Timestamp of the measure.
//                 Will override the automatic IoTAgent timestamp (optional).
//  d (Data): Ultralight 2.0 payload.
//
// At the moment the API key and timestamp are unused by the simulator.

class UltralightCommand {
  // The bell will respond to the "ring" command.
  // this will briefly set the bell to on.
  // The bell  is not a sensor - it will not report state northbound
  actuateBell(req, res) {
    const keyValuePairs = req.body.split('|') || [''];
    const command = getUltralightCommand(keyValuePairs[0]);
    const deviceId = 'bell' + req.params.id;
    const result = keyValuePairs[0] + '| ' + command;

    if (IoTDevices.notFound(deviceId)) {
      return res.status(404).send(result + NOT_OK);
    } else if (IoTDevices.isUnknownCommand('bell', command)) {
      return res.status(422).send(result + NOT_OK);
    }

    // Update device state
    IoTDevices.actuateDevice(deviceId, command);
    return res.status(200).send(result + OK);
  }

  // The door responds to "open", "close", "lock" and "unlock" commands
  // Each command alters the state of the door. When the door is unlocked
  // it can be opened and shut by external events.
  actuateDoor(req, res) {
    const keyValuePairs = req.body.split('|') || [''];
    const command = getUltralightCommand(keyValuePairs[0]);
    const deviceId = 'door' + req.params.id;
    const result = keyValuePairs[0] + '| ' + command;

    if (IoTDevices.notFound(deviceId)) {
      return res.status(404).send(result + NOT_OK);
    } else if (IoTDevices.isUnknownCommand('door', command)) {
      return res.status(422).send(result + NOT_OK);
    }

    // Update device state
    IoTDevices.actuateDevice(deviceId, command);
    return res.status(200).send(result + OK);
  }

  // The lamp can be "on" or "off" - it also registers luminosity.
  // It will slowly dim as time passes (provided no movement is detected)
  actuateLamp(req, res) {
    const keyValuePairs = req.body.split('|') || [''];
    const command = getUltralightCommand(keyValuePairs[0]);
    const deviceId = 'lamp' + req.params.id;
    const result = keyValuePairs[0] + '| ' + command;

    if (IoTDevices.notFound(deviceId)) {
      return res.status(404).send(result + NOT_OK);
    } else if (IoTDevices.isUnknownCommand('lamp', command)) {
      return res.status(422).send(result + NOT_OK);
    }

    // Update device state
    IoTDevices.actuateDevice(deviceId, command);
    return res.status(200).send(result + OK);
  }

  // cmd topics are consumed by the actuators (bell, lamp and door)
  processMqttMessage(topic, message) {
    const path = topic.split('/');
    if (path.pop() === 'cmd') {
      const keyValuePairs = message.split('|') || [''];
      const command = getUltralightCommand(keyValuePairs[0]);
      const deviceId = path.pop();
      const result = keyValuePairs[0] + '| ' + command;

      if (!IoTDevices.notFound(deviceId)) {
        IoTDevices.actuateDevice(deviceId, command);
        const topic = '/' + DEVICE_API_KEY + '/' + deviceId + '/cmdexe';
        MQTT_CLIENT.publish(topic, result + OK);
      }
    }
  }
}

let SouthboundCommand;

switch (DEVICE_PAYLOAD) {
  case 'ultralight':
    SouthboundCommand = new UltralightCommand();
    break;
  case 'json':
    //SouthboundCommand = new JSONCommand();
    break;
  case 'lorawan':
    //SouthboundCommand = new LoraCommand();
    break;
  case 'sigfox':
    //SouthboundCommand = new SigfoxCommand();
    break;
  case 'xml':
    //SouthboundCommand = new CustomXMLCommand();
    break;
  default:
    debug('Device payload not recognized. Using default');
    SouthboundCommand = new UltralightCommand();
    break;
}

module.exports = {
  // The bell will respond to the "ring" command.
  // this will briefly set the bell to on.
  // The bell  is not a sensor - it will not report state northbound
  bellHttpCommand(req, res) {
    debug('bellHttpCommand');
    return SouthboundCommand.actuateBell(req, res);
  },

  // The door responds to "open", "close", "lock" and "unlock" commands
  // Each command alters the state of the door. When the door is unlocked
  // it can be opened and shut by external events.
  doorHttpCommand(req, res) {
    debug('doorHttpCommand');
    return SouthboundCommand.actuateDoor(req, res);
  },

  // The lamp can be "on" or "off" - it also registers luminosity.
  // It will slowly dim as time passes (provided no movement is detected)
  lampHttpCommand(req, res) {
    debug('lampHttpCommand');
    return SouthboundCommand.actuateLamp(req, res);
  },

  // The device monitor will display all MQTT messages on screen.
  // cmd topics are consumed by the actuators (bell, lamp and door)
  processMqttMessage(topic, message) {
    debug('processMqttMessage');
    const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto';
    SOCKET_IO.emit('mqtt', mqttBrokerUrl + topic + '  ' + message);
    SouthboundCommand.processMqttMessage(topic, message);
  }
};
