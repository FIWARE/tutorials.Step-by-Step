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
const Security = require('./security');

// Connect to an IoT Agent and use fallback values if necessary
const UL_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';
const UL_HOST = process.env.IOTA_HTTP_HOST || 'localhost';
const UL_PORT = process.env.IOTA_HTTP_PORT || 7896;
const UL_URL = 'http://' + UL_HOST + ':' + UL_PORT + '/iot/d';
const UL_TRANSPORT = process.env.DUMMY_DEVICES_TRANSPORT || 'HTTP';
const UL_CONTEXT_BROKER =
  process.env.CONTEXT_BROKER || 'http://localhost:1026/v2';
const UL_NGSI_PREFIX =
  process.env.NGSI_LD_PREFIX !== undefined
    ? process.env.NGSI_LD_PREFIX
    : 'urn:ngsi-ld:';
const DUMMY_DEVICE_HTTP_HEADERS = { 'Content-Type': 'text/plain' };
const AUTHZFORCE_ENABLED = process.env.AUTHZFORCE_ENABLED || false;

// A series of constants used by our set of devices
const OK = ' OK';
const NOT_OK = ' NOT OK';
const DOOR_LOCKED = 's|LOCKED';
const DOOR_OPEN = 's|OPEN';
const DOOR_CLOSED = 's|CLOSED';

const BELL_OFF = 's|OFF';
const BELL_ON = 's|ON';

const LAMP_ON = 's|ON|l|1750';
const LAMP_OFF = 's|OFF|l|0';

const NO_MOTION_DETECTED = 'c|0';
const MOTION_DETECTED = 'c|1';

// The bell will respond to the "ring" command.
// this will briefly set the bell to on.
// The bell  is not a sensor - it will not report state northbound
function processHttpBellCommand(req, res) {
  debug('processHttpBellCommand');
  const keyValuePairs = req.body.split('|') || [''];
  const command = getCommand(keyValuePairs[0]);
  const deviceId = 'bell' + req.params.id;
  const result = keyValuePairs[0] + '| ' + command;

  // Check for a valid device and command
  if (
    _.indexOf(myCache.keys(), deviceId) === -1 ||
    _.indexOf(['ring'], command) === -1
  ) {
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  actuateDevice(deviceId, command);

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

  // Check for a valid device and command
  if (
    _.indexOf(myCache.keys(), deviceId) === -1 ||
    _.indexOf(['open', 'close', 'lock', 'unlock'], command) === -1
  ) {
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  actuateDevice(deviceId, command);

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

  // Check for a valid device and command
  if (
    _.indexOf(myCache.keys(), deviceId) === -1 ||
    _.indexOf(['on', 'off'], command) === -1
  ) {
    return res.status(422).send(result + NOT_OK);
  }

  // Update device state
  actuateDevice(deviceId, command);
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

    if (_.indexOf(myCache.keys(), deviceId) !== -1) {
      actuateDevice(deviceId, command);
      const topic = '/' + UL_API_KEY + '/' + deviceId + '/cmdexe';
      MQTT_CLIENT.publish(topic, result + OK);
    }
  }
}

// Change the state of a dummy IoT device based on the command received.
function actuateDevice(deviceId, command) {
  debug('actuateDevice');
  switch (deviceId.replace(/\d/g, '')) {
    case 'bell':
      if (command === 'ring') {
        setDeviceState(deviceId, BELL_ON, false);
        SOCKET_IO.emit(deviceId, BELL_ON);
      }
      break;
    case 'door':
      if (command === 'open') {
        setDeviceState(deviceId, DOOR_OPEN);
      } else if (command === 'close' || command === 'unlock') {
        setDeviceState(deviceId, DOOR_CLOSED);
      } else if (command === 'lock') {
        setDeviceState(deviceId, DOOR_LOCKED);
      }
      break;
    case 'lamp':
      if (command === 'on') {
        setDeviceState(deviceId, LAMP_ON);
      }
      if (command === 'off') {
        setDeviceState(deviceId, LAMP_OFF);
      }
      break;
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

// Set up 16 IoT devices, a door, bell, motion sensor and lamp for each of 4 locations.
//
// The door can be OPEN CLOSED or LOCKED
// The bell can be ON or OFF - it does not report state.
// The motion sensor counts the number of people passing by
// The lamp can be ON or OFF. This also registers luminocity.
// It will slowly dim as time passes (provided no movement is detected)
function init() {
  debug('init');

  if (process.env.DUMMY_DEVICES_USER && process.env.DUMMY_DEVICES_PASSWORD) {
    initSecureDevices();
  }

  myCache.set('door001', DOOR_LOCKED);
  myCache.set('door002', DOOR_LOCKED);
  myCache.set('door003', DOOR_LOCKED);
  myCache.set('door004', DOOR_LOCKED);

  myCache.set('bell001', BELL_OFF, false);
  myCache.set('bell002', BELL_OFF, false);
  myCache.set('bell003', BELL_OFF, false);
  myCache.set('bell004', BELL_OFF, false);

  myCache.set('lamp001', LAMP_OFF);
  myCache.set('lamp002', LAMP_OFF);
  myCache.set('lamp003', LAMP_OFF);
  myCache.set('lamp004', LAMP_OFF);

  myCache.set('motion001', NO_MOTION_DETECTED);
  myCache.set('motion002', NO_MOTION_DETECTED);
  myCache.set('motion003', NO_MOTION_DETECTED);
  myCache.set('motion004', NO_MOTION_DETECTED);

  // Once a minute, read the existing state of the dummy devices
  const deviceIds = myCache.keys();
  let wait = 4000;
  _.forEach(deviceIds, deviceId => {
    wait = wait + 1999;
    setTimeout(setUpDeviceReading, wait, deviceId);
  });
}

let isDoorActive = false;
let isDevicesActive = false;
let devicesInitialized = false;

// Open and shut an unlocked door
function activateDoor() {
  if (isDoorActive) {
    return;
  }

  isDoorActive = true;
  const deviceIds = myCache.keys();

  _.forEach(deviceIds, deviceId => {
    const state = getDeviceState(deviceId);
    const isSensor = true;

    switch (deviceId.replace(/\d/g, '')) {
      case 'door':
        //  The door is OPEN or CLOSED or LOCKED,
        if (state.s !== 'LOCKED') {
          // Randomly open and close the door if not locked.
          // lower the rate if the lamp is off.
          const rate = getLampState(deviceId, 'door') === 'ON' ? 3 : 6;
          state.s = getRandom() > rate ? 'OPEN' : 'CLOSED';
        }
        setDeviceState(deviceId, toUltraLight(state), isSensor);
        break;
    }
  });
  isDoorActive = false;
}

// Update state of Lamps, Doors and Motion Sensors
function activateDevices() {
  if (isDevicesActive) {
    return;
  }

  isDevicesActive = true;

  const deviceIds = myCache.keys();

  _.forEach(deviceIds, deviceId => {
    const state = getDeviceState(deviceId);
    let isSensor = true;

    switch (deviceId.replace(/\d/g, '')) {
      case 'bell':
        // ON or OFF - Switch off the bell if it is still ringing
        if (state.s === 'ON') {
          state.s = 'OFF';
        }
        isSensor = false;
        break;

      case 'motion':
        // If the door is OPEN, randomly switch the count of the motion sensor
        if (getDoorState(deviceId, 'motion') === 'OPEN') {
          if (state.c === 1) {
            state.c = 0;
          } else {
            state.c = getRandom() > 3 ? 1 : 0;
          }
        } else {
          state.c = 0;
        }
        setDeviceState(deviceId, toUltraLight(state), isSensor);
        break;

      case 'lamp':
        if (state.s === 'OFF') {
          state.l = 0;
        } else if (getDoorState(deviceId, 'lamp') === 'OPEN') {
          // if the door is open set the light to full power
          state.l = parseInt(state.l) || 1000;
          state.l = state.l + getRandom() * getRandom();
          if (state.l < 1850) {
            state.l = state.l + 30 + getRandom() * getRandom();
          }
          if (state.l > 1990) {
            state.l = 1990 + getRandom();
          }
        } else if (state.l > 1000) {
          // if the door is closed dim the light
          state.l = parseInt(state.l) || 1990;
          if (getRandom() > 3) {
            state.l = state.l - 30 - getRandom() * getRandom();
          }
          state.l = state.l + getRandom();
        }
        break;
    }

    setDeviceState(deviceId, toUltraLight(state), isSensor);
  });
  isDevicesActive = false;
}

// Read the existing state of the dummy devices when requested.
function sendDeviceReading(deviceId) {
  const state = toUltraLight(getDeviceState(deviceId));
  const isSensor = deviceId.replace(/\d/g, '') !== 'bell';
  setDeviceState(deviceId, state, isSensor, true);
}

//
// Transformation function from Ultralight Protocol to an object
// Ultralight is a series of pipe separated key-value pairs.
// Each key and value is in turn separated by a pipe character
//
// e.g. s|ON|l|1000 becomes
// { s: 'ON', l: '1000'}
//
function getDeviceState(deviceId) {
  const ultraLight = myCache.get(deviceId);
  const obj = {};
  const keyValuePairs = ultraLight.split('|');
  for (let i = 0; i < keyValuePairs.length; i = i + 2) {
    obj[keyValuePairs[i]] = keyValuePairs[i + 1];
  }
  return obj;
}
//
// Sets the device state in the in-memory cache. If the device is a sensor
// it also reports (and attempts to send) the northbound traffic to the IoT agent.
// The state of the dummy device is also sent to the browser for display
//
// * If we are running under HTTP mode the device will respond with a result
// * If we are running under MQTT mode the device will post the result as a topic
function setDeviceState(deviceId, state, isSensor = true, force = false) {
  const previousState = myCache.get(deviceId);
  myCache.set(deviceId, state);

  if (isSensor && (state !== previousState || force)) {
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

  SOCKET_IO.emit(deviceId, state);
}

// Transformation function from a state object to the Ultralight Protocol
// Ultralight is a series of pipe separated key-value pairs.
// Each key and value is in turn separated by a pipe character
//
// e.g. s|ON,l|1000
function toUltraLight(object) {
  const strArray = [];
  _.forEach(object, function(value, key) {
    strArray.push(key + '|' + value);
  });
  return strArray.join('|');
}

// Return the state of the door with the same number as the current element
// this is because no people will enter if the door is LOCKED, and therefore
// both the motion sensor will not increment an the smart lamp will slowly
// decrease
function getDoorState(deviceId, type) {
  const door = getDeviceState(deviceId.replace(type, 'door'));
  return door.s || 'LOCKED';
}

// Return the state of the lamp with the same number as the current element
// this is because fewer people will enter the building if the lamp is OFF,
// and therefore the motion sensor will increment more slowly
function getLampState(deviceId, type) {
  const lamp = getDeviceState(deviceId.replace(type, 'lamp'));
  return lamp.s || 'OFF';
}

// Pick a random number between 1 and 10
function getRandom() {
  return Math.floor(Math.random() * 10) + 1;
}

function accessControl(req, res, next) {
  debug('accessControl');
  const action = req.body.action;
  // Ringing the bell and unlocking the door are restricted actions, everything else
  // can be done by any user.
  if (action === 'ring') {
    // LEVEL 2: BASIC AUTHORIZATION - Resources are accessible on a User/Verb/Resource basis
    // LEVEL 3: ADVANCED AUTHORIZATION - Resources are accessible on XACML Rules
    return AUTHZFORCE_ENABLED
      ? Security.authorizeAdvancedXACML(req, res, next, '/bell/ring')
      : Security.authorizeBasicPDP(req, res, next, '/bell/ring');
  } else if (action === 'unlock') {
    // LEVEL 2: BASIC AUTHORIZATION - Resources are accessible on a User/Verb/Resource basis
    // LEVEL 3: ADVANCED AUTHORIZATION - Resources are accessible on XACML Rules
    return AUTHZFORCE_ENABLED
      ? Security.authorizeAdvancedXACML(req, res, next, '/door/unlock')
      : Security.authorizeBasicPDP(req, res, next, '/door/unlock');
  }
  // LEVEL 1: AUTHENTICATION ONLY - Every user is authorized, just ensure the user exists.
  return Security.authenticate(req, res, next);
}

// This function offers the Password Authentication flow for a secured IoT Sensors
// It is just a user filling out the Username and password form and adding the access token to
// subsequent requests.
function initSecureDevices() {
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

// This function allows a Bell, Door or Lamp command to be sent to the Dummy IoT devices
// via the Orion Context Broker and the UltraLight IoT Agent.
function sendCommand(req, res) {
  debug('sendCommand');
  if (!res.locals.authorized) {
    // If the user is not authorized, return an error code.
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).send({ message: 'Forbidden' });
  }
  let id = req.body.id.split(':').pop();
  const action = req.body.action;
  // This is not a command, just a manually activated motion sensor event.
  const isMotionSensor = action === 'presence';
  const payload = {};

  payload[action] = {
    type: 'command',
    value: ''
  };

  if (action === 'ring') {
    id = 'Bell:' + id;
  } else if (action === 'on' || action === 'off') {
    id = 'Lamp:' + id;
  } else if (action === 'presence') {
    id = 'motion' + id;
  } else {
    id = 'Door:' + id;
  }

  const options = {
    method: 'PATCH',
    url: UL_CONTEXT_BROKER + '/entities/' + UL_NGSI_PREFIX + id + '/attrs',
    headers: {
      'Content-Type': 'application/json',
      'fiware-servicepath': '/',
      'fiware-service': 'openiot'
    },
    body: payload,
    json: true
  };

  if (req.session.access_token) {
    // If the system has been secured and we have logged in,
    // add the access token to the request to the PEP Proxy
    options.headers['X-Auth-Token'] = req.session.access_token;
  }

  if (isMotionSensor) {
    // The motion sensor does not accept commands,
    // Update the state of the device directly
    setDeviceState(id, MOTION_DETECTED, true);
  } else {
    request(options, error => {
      if (error) {
        debug(error);
      }
    });
  }
  // Return a success code.
  return res.status(204).send();
}

// Once a minute, read the existing state of the dummy devices
function setUpDeviceReading(deviceId) {
  const deviceType = deviceId.replace(/\d/g, '');
  if (deviceType === 'lamp' || deviceType === 'motion') {
    setInterval(sendDeviceReading, 59999, deviceId);
  }
}

// Initialize the array of sensors and periodically update them.
// Intervals are prime numbers to avoid simultaneous updates.
function initDevices(req, res, next) {
  if (!devicesInitialized) {
    init();
    // Every few seconds, update the state of the dummy devices in a
    // semi-random fashion.
    setInterval(activateDoor, 4999);
    // Every second, update the state of the dummy devices in a
    // semi-random fashion.
    setInterval(activateDevices, 997);
    devicesInitialized = true;
  }

  next();
}

module.exports = {
  processHttpBellCommand,
  processHttpDoorCommand,
  processHttpLampCommand,
  processMqttMessage,
  accessControl,
  sendCommand,
  initDevices
};
