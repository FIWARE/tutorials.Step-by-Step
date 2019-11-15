// Connect to an IoT Agent and use fallback values if necessary


const IoTDevices = require('../devices');
const DEVICE_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';


// A series of constants used by our set of devices
const OK = ' OK';
const NOT_OK = ' NOT OK';

/* global MQTT_CLIENT */

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

// This processor sends ultralight payload northbound to
// the southport of the IoT Agent and sends measures
// for the motion sensor, door and lamp.

// Ultralight 2.0 is a lightweight text based protocol aimed to constrained
// devices and communications
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



module.exports = UltralightCommand;

