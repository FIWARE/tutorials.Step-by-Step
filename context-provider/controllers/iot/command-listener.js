//
// This controller is a backdoor which allows a user to directly
// interact with the IoT devices by pressing a button on screen.
// The button press is converted to an NGSI call to the context
// broker.
//

const request = require('request');
const debug = require('debug')('tutorial:command-listener');
const Security = require('../security');
const IoTDevices = require('./devices');

// Connect to the context broker and use fallback values if necessary
const CONTEXT_BROKER = process.env.CONTEXT_BROKER || 'http://localhost:1026/v2';
const NGSI_PREFIX =
  process.env.NGSI_LD_PREFIX !== undefined
    ? process.env.NGSI_LD_PREFIX
    : 'urn:ngsi-ld:';
const AUTHZFORCE_ENABLED = process.env.AUTHZFORCE_ENABLED || false;

// This function allows a Bell, Door or Lamp command to be sent to the Dummy IoT devices
// via the Orion Context Broker and an IoT Agent.
function sendCommand(req, res) {
  debug('sendCommand: ' + req.body.id + ' ' + req.body.action);
  let id = req.body.id.split(':').pop();
  const action = req.body.action;
  if (!res.locals.authorized) {
    // If the user is not authorized, return an error code.
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).send({ message: 'Forbidden' });
  }

  if (action === 'presence') {
    // The motion sensor does not accept commands,
    // Update the state of the device directly
    IoTDevices.fireMotionSensor('motion' + id);
    return res.status(204).send();
  }

  if (action === 'ring') {
    id = 'Bell:' + id;
  } else if (action === 'on' || action === 'off') {
    id = 'Lamp:' + id;
  } else {
    id = 'Door:' + id;
  }

  const payload = {};

  payload[action] = {
    type: 'command',
    value: ''
  };

  const options = {
    method: 'PATCH',
    url: CONTEXT_BROKER + '/entities/' + NGSI_PREFIX + id + '/attrs',
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

  request(options, error => {
    if (error) {
      debug(error);
    }
  });

  // Return a success code.
  return res.status(204).send();
}


// Ringing the bell and unlocking the door are restricted actions, everything else
// can be done by any user. This is a simple access control function to ensure 
// only users who are authorized can do certain things.
function accessControl(req, res, next) {
  debug('accessControl');
  const action = req.body.action;
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

module.exports = {
  accessControl,
  sendCommand
};
