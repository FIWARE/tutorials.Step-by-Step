const Security = require('./security');
const debug = require('debug')('tutorial:device-payload');
const request = require('request');

// Connect to an IoT Agent and use fallback values if necessary
const DEVICE_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';
const DEVICE_TRANSPORT = process.env.DUMMY_DEVICES_TRANSPORT || 'HTTP';

const IOT_AGENT_HOST = process.env.IOTA_HTTP_HOST || 'localhost';
const IOT_AGENT_SOUTH_PORT = process.env.IOTA_HTTP_PORT || 7896;
const IOT_AGENT_URL =
  'http://' + IOT_AGENT_HOST + ':' + IOT_AGENT_SOUTH_PORT + '/iot/d';

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

class UltralightPayloads {
  constructor() {
    this.headers = { 'Content-Type': 'text/plain' };
    setAuthToken(this.headers);
  }
  sendHTTPPayload(deviceId, state) {
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

  sendMQTTPayload(deviceId, state) {
    const topic = '/' + DEVICE_API_KEY + '/' + deviceId + '/attrs';
    MQTT_CLIENT.publish(topic, state);
  }
}

// if Ultralight then
const DeviceSender = new UltralightPayloads();

function send(deviceId, state) {
  if (DEVICE_TRANSPORT === 'HTTP') {
    DeviceSender.sendHTTPPayload(deviceId, state);
  }
  // if Ultralight then
  if (DEVICE_TRANSPORT === 'MQTT') {
    DeviceSender.sendMQTTPayload(deviceId, state);
  }
}
module.exports = send;
