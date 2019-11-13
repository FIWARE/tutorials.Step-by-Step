//
// This controller is simulates a sender for a series of devices.
// Northbound traffic consists of measures which are processed by the
// the south port of the IoT agent
//

const Security = require('../security');
const debug = require('debug')('tutorial:northbound');
const request = require('request');

// Connect to an IoT Agent and use fallback values if necessary
const DEVICE_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';
const DEVICE_TRANSPORT = process.env.DUMMY_DEVICES_TRANSPORT || 'HTTP';
const DEVICE_PAYLOAD = process.env.DUMMY_DEVICES_PAYLOAD || 'ultralight';

const IOT_AGENT_HOST = process.env.IOTA_HTTP_HOST || 'localhost';
const IOT_AGENT_SOUTH_PORT = process.env.IOTA_HTTP_PORT || 7896;
const IOT_AGENT_DEFAULT_RESOURCE =
  process.env.IOTA_DEFAULT_RESOURCE || '/iot/d';
const IOT_AGENT_URL =
  'http://' +
  IOT_AGENT_HOST +
  ':' +
  IOT_AGENT_SOUTH_PORT +
  IOT_AGENT_DEFAULT_RESOURCE;

/* global SOCKET_IO */
/* global MQTT_CLIENT */

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
      .then(results => {
        header['X-Auth-Token'] = results.access_token;
      })
      .catch(error => {
        debug(error);
      });
  }
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

class UltralightMeasure {
  constructor() {
    this.headers = { 'Content-Type': 'text/plain' };
    setAuthToken(this.headers);
  }

  // measures sent over HTTP are POST requests with params
  sendAsHTTP(deviceId, state) {
    const options = {
      method: 'POST',
      url: IOT_AGENT_URL,
      qs: { k: DEVICE_API_KEY, i: deviceId },
      headers: this.headers,
      body: state
    };
    const debugText =
      'POST ' + IOT_AGENT_URL + '?i=' + options.qs.i + '&k=' + options.qs.k;

    request(options, error => {
      if (error) {
        debug(debugText + ' ' + error.code);
      }
    });
    SOCKET_IO.emit('http', debugText + '  ' + state);
  }

  // measures sent over MQTT are posted as topics (motion sensor, lamp and door)
  sendAsMQTT(deviceId, state) {
    const topic = '/' + DEVICE_API_KEY + '/' + deviceId + '/attrs';
    MQTT_CLIENT.publish(topic, state);
  }
}

let NorthboundMeasure;

switch (DEVICE_PAYLOAD) {
  case 'ultralight':
    NorthboundMeasure = new UltralightMeasure();
    break;
  case 'json':
    //NorthboundMeasure = new JSONMeasure();
    break;
  case 'lorawan':
    //NorthboundMeasure = new LoraMeasure();
    break;
  case 'sigfox':
    //NorthboundMeasure = new SigfoxMeasure();
    break;
  case 'xml':
    //NorthboundMeasure = new CustomXMLMeasure();
    break;
  default:
    debug('Device payload not recognized. Using default');
    NorthboundMeasure = new UltralightMeasure();
    break;
}

module.exports = {
  sendMeasure(deviceId, state) {
    if (DEVICE_TRANSPORT === 'HTTP') {
      debug('sendHTTPMeasure ' + deviceId);
      NorthboundMeasure.sendAsHTTP(deviceId, state);
    }
    if (DEVICE_TRANSPORT === 'MQTT') {
      debug('sendMQTTMeasure ' + deviceId);
      NorthboundMeasure.sendAsMQTT(deviceId, state);
    }
  }
};
