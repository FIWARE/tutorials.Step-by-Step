// Connect to an IoT Agent and use fallback values if necessary

const IoTDevices = require('../devices');
const DEVICE_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';
const xmlParser = require('xml-parser');

// A series of constants used by our set of devices
const OK = 'success';
const NOT_OK = 'error';

/* global MQTT_CLIENT */

//
// Splits the deviceId from the command sent.
//
function getResult(status, info) {
  if (info) {
    return '<' + status + '>' + info + '</' + status + '/>';
  }
  return '<' + status + '/>';
}

// This processor sends XML payload northbound to
// the southport of the IoT Agent and sends measures
// for the motion sensor, door and lamp.

class XMLCommand {
  // The bell will respond to the "ring" command.
  // this will briefly set the bell to on.
  // The bell  is not a sensor - it will not report state northbound
  actuateBell(req, res) {
    const data = xmlParser(req.body);
    const deviceId = data.root.attributes.device;
    const command = data.root.name;

    if (IoTDevices.notFound(deviceId)) {
      return res.status(404).send(getResult(NOT_OK, 'not found'));
    } else if (IoTDevices.isUnknownCommand('bell', command)) {
      return res.status(422).send(getResult(NOT_OK, 'unknown command'));
    }

    // Update device state
    IoTDevices.actuateDevice(deviceId, command);
    return res.status(200).send(getResult(OK));
  }

  // The door responds to "open", "close", "lock" and "unlock" commands
  // Each command alters the state of the door. When the door is unlocked
  // it can be opened and shut by external events.
  actuateDoor(req, res) {
    const data = xmlParser(req.body);
    const deviceId = data.root.attributes.device;
    const command = data.root.name;

    if (IoTDevices.notFound(deviceId)) {
      return res.status(404).send(getResult(NOT_OK, 'not found'));
    } else if (IoTDevices.isUnknownCommand('door', command)) {
      return res.status(422).send(getResult(NOT_OK, 'unknown command'));
    }

    // Update device state
    IoTDevices.actuateDevice(deviceId, command);
    return res.status(200).send(getResult(OK));
  }

  // The lamp can be "on" or "off" - it also registers luminosity.
  // It will slowly dim as time passes (provided no movement is detected)
  actuateLamp(req, res) {
    const data = xmlParser(req.body);
    const deviceId = data.root.attributes.device;
    const command = data.root.name;

    if (IoTDevices.notFound(deviceId)) {
      return res.status(404).send(getResult(NOT_OK, 'not found'));
    } else if (IoTDevices.isUnknownCommand('lamp', command)) {
      return res.status(422).send(getResult(NOT_OK, 'unknown command'));
    }

    // Update device state
    IoTDevices.actuateDevice(deviceId, command);
    return res.status(200).send(getResult(OK));
  }

  // cmd topics are consumed by the actuators (bell, lamp and door)
  processMqttMessage(topic, message) {
    const path = topic.split('/');
    if (path.pop() === 'cmd') {
      const data = xmlParser(message);
      const deviceId = data.root.attributes.device;
      const command = data.root.name;

      if (!IoTDevices.notFound(deviceId)) {
        IoTDevices.actuateDevice(deviceId, command);
        const topic = '/' + DEVICE_API_KEY + '/' + deviceId + '/cmdexe';
        MQTT_CLIENT.publish(topic, getResult(OK));
      }
    }
  }
}

module.exports = XMLCommand;
