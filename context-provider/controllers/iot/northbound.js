//
// This controller is simulates a sender for a series of devices.
// Northbound traffic consists of measures which are processed by the
// the south port of the IoT agent
//

const Security = require('../security');
const debug = require('debug')('tutorial:northbound');
const UltralightMeasure = require('../../models/measure/ultralight');
const JSONMeasure = require('../../models/measure/json');
const XMLMeasure = require('../../models/measure/xml');

// Connect to an IoT Agent and use fallback values if necessary
const DEVICE_TRANSPORT = process.env.DUMMY_DEVICES_TRANSPORT || 'HTTP';
const DEVICE_PAYLOAD = process.env.DUMMY_DEVICES_PAYLOAD || 'ultralight';

// This function offers the Password Authentication flow for a secured IoT Sensors
// It is just a user filling out the Username and password form and adding the access token to
// subsequent requests.
function setAuthToken(header) {
  if (process.env.DUMMY_DEVICES_USER && process.env.DUMMY_DEVICES_PASSWORD) {
    Security.oa
      .getOAuthPasswordCredentials(
        process.env.DUMMY_DEVICES_USER,
        process.env.DUMMY_DEVICES_PASSWORD
      )
      .then((results) => {
        header['X-Auth-Token'] = results.access_token;
      })
      .catch((error) => {
        debug(error);
      });
  }
}

let Measure;
const headers = {};
setAuthToken(headers);

switch (DEVICE_PAYLOAD.toLowerCase()) {
  case 'ultralight':
    Measure = new UltralightMeasure(headers);
    break;
  case 'json':
    Measure = new JSONMeasure(headers);
    break;
  case 'lorawan':
    //Measure = new LoraMeasure();
    break;
  case 'sigfox':
    //Measure = new SigfoxMeasure();
    break;
  case 'xml':
    Measure = new XMLMeasure(headers);
    break;
  default:
    debug('Device payload not recognized. Using default');
    Measure = new UltralightMeasure(headers);
    break;
}

module.exports = {
  sendMeasure(deviceId, state) {
    if (DEVICE_TRANSPORT === 'HTTP') {
      debug('sendHTTPMeasure: ' + deviceId);
      Measure.sendAsHTTP(deviceId, state);
    }
    if (DEVICE_TRANSPORT === 'MQTT') {
      debug('sendMQTTMeasure: ' + deviceId);
      Measure.sendAsMQTT(deviceId, state);
    }
  },
};
