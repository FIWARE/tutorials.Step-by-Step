//
// This controller is simulates a series of devices.
// The internal state is maintained using the Ultralight protocol
//

/* global SOCKET_IO */

const NodeCache = require('node-cache');
const myCache = new NodeCache();
const _ = require('lodash');
const debug = require('debug')('tutorial:devices');
const Northbound = require('../controllers/iot/northbound');

// A series of constants used by our set of devices
const DOOR_LOCKED = 's|LOCKED';
const DOOR_OPEN = 's|OPEN';
const DOOR_CLOSED = 's|CLOSED';

const BELL_OFF = 's|OFF';
const BELL_ON = 's|ON';

const LAMP_ON = 's|ON|l|1750';
const LAMP_OFF = 's|OFF|l|0';

const NO_MOTION_DETECTED = 'c|0';
const MOTION_DETECTED = 'c|1';

const VALID_COMMANDS = {
    door: ['open', 'close', 'lock', 'unlock'],
    lamp: ['on', 'off'],
    bell: ['ring']
};

// Change the state of a dummy IoT device based on the command received.
function actuateDevice(deviceId, command) {
    debug('actuateDevice: ' + deviceId + ' ' + command);
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

// Set up 16 IoT devices, a door, bell, motion sensor and lamp for each of 4 locations.
//
// The door can be OPEN CLOSED or LOCKED
// The bell can be ON or OFF - it does not report state.
// The motion sensor counts the number of people passing by
// The lamp can be ON or OFF. This also registers luminocity.
// It will slowly dim as time passes (provided no movement is detected)
function initDevices() {
    debug('initDevices');

    // Once a minute, read the existing state of the dummy devices
    const deviceIds = myCache.keys();
    let wait = 4000;
    _.forEach(deviceIds, (deviceId) => {
        wait = wait + 1999;
        setTimeout(setUpSensorReading, wait, deviceId);
    });

    // Every few seconds, update the state of the dummy devices in a
    // semi-random fashion.
    setInterval(activateDoor, 4999);
    // Every second, update the state of the dummy devices in a
    // semi-random fashion.
    setInterval(activateDevices, 997);
}

let isDoorActive = false;
let isDevicesActive = false;
let devicesInitialized = false;

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

// Open and shut an unlocked door
function activateDoor() {
    if (isDoorActive) {
        return;
    }

    isDoorActive = true;
    const deviceIds = myCache.keys();

    _.forEach(deviceIds, (deviceId) => {
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

    _.forEach(deviceIds, (deviceId) => {
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
function setDeviceState(deviceId, state, isSensor = true, force = false) {
    const previousState = myCache.get(deviceId);
    myCache.set(deviceId, state);

    if (!devicesInitialized) {
        initDevices();
        devicesInitialized = true;
    }

    // If we are running under HTTP mode the device will respond with a result
    // If we are running under MQTT mode the device will post the result as a topic
    if (isSensor && (state !== previousState || force)) {
        Northbound.sendMeasure(deviceId, state);
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

// Directly alter the state of a motion sensor.
function fireMotionSensor(id) {
    debug('fireMotionSensor');
    setDeviceState(id, MOTION_DETECTED, true);
}

// Once a minute, read the existing state of the dummy devices
function setUpSensorReading(deviceId) {
    const deviceType = deviceId.replace(/\d/g, '');
    if (deviceType === 'lamp' || deviceType === 'motion') {
        setInterval(sendDeviceReading, 59999, deviceId);
    }
}

// Check to see if a deviceId has a corresponding entry in the cache
function notFound(deviceId) {
    const deviceUnknown = _.indexOf(myCache.keys(), deviceId) === -1;
    if (deviceUnknown) {
        debug('Unknown IoT device: ' + deviceId);
    }
    return deviceUnknown;
}

// Check to see if a command can be processed by a class of devices
function isUnknownCommand(device, command) {
    const invalid = _.indexOf(VALID_COMMANDS[device], command) === -1;
    if (invalid) {
        debug('Invalid command for a ' + device + ': ' + command);
    }
    return invalid;
}

module.exports = {
    actuateDevice,
    fireMotionSensor,
    notFound,
    isUnknownCommand
};
