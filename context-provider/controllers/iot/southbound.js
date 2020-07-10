//
// This controller is simulates a receiver for a series of devices.
// Southbound traffic consists of commands which are processed by the
// dummy IoT devices
//

/* global SOCKET_IO */
const debug = require('debug')('tutorial:southbound');
const UltralightCommand = require('../../models/command/ultralight');
const JSONCommand = require('../../models/command/json');
const XMLCommand = require('../../models/command/xml');

const DEVICE_PAYLOAD = process.env.DUMMY_DEVICES_PAYLOAD || 'ultralight';

let Command;

switch (DEVICE_PAYLOAD.toLowerCase()) {
  case 'ultralight':
    Command = new UltralightCommand();
    break;
  case 'json':
    Command = new JSONCommand();
    break;
  case 'lorawan':
    //Command = new LoraCommand();
    break;
  case 'sigfox':
    //Command = new SigfoxCommand();
    break;
  case 'xml':
    Command = new XMLCommand();
    break;
  default:
    debug('Device payload not recognized. Using default');
    Command = new UltralightCommand();
    break;
}

module.exports = {
  // The bell will respond to the "ring" command.
  // this will briefly set the bell to on.
  // The bell  is not a sensor - it will not report state northbound
  bellHttpCommand(req, res) {
    debug('bellHttpCommand');
    return Command.actuateBell(req, res);
  },

  // The door responds to "open", "close", "lock" and "unlock" commands
  // Each command alters the state of the door. When the door is unlocked
  // it can be opened and shut by external events.
  doorHttpCommand(req, res) {
    debug('doorHttpCommand');
    return Command.actuateDoor(req, res);
  },

  // The lamp can be "on" or "off" - it also registers luminosity.
  // It will slowly dim as time passes (provided no movement is detected)
  lampHttpCommand(req, res) {
    debug('lampHttpCommand');
    return Command.actuateLamp(req, res);
  },

  // The dummy ISOBUS will just return success.
  isobusHttpCommand(req, res) {
    debug('isobusHttpCommand');
    debug(req.body);
    return res.status(200).send();
  },

  // The device monitor will display all MQTT messages on screen.
  // cmd topics are consumed by the actuators (bell, lamp and door)
  processMqttMessage(topic, message) {
    debug('processMqttMessage');
    const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto';
    SOCKET_IO.emit('mqtt', mqttBrokerUrl + topic + '  ' + message);
    Command.processMqttMessage(topic, message);
  }
};
