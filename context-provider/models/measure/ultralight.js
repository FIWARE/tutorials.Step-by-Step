// Connect to an IoT Agent and use fallback values if necessary

const request = require('request');
const debug = require('debug')('tutorial:ultralight');

const DEVICE_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';

const IOT_AGENT_URL =
  'http://' +
  (process.env.IOTA_HTTP_HOST || 'localhost') +
  ':' +
  (process.env.IOTA_HTTP_PORT || 7896) +
  (process.env.IOTA_DEFAULT_RESOURCE || '/iot/d');

function getAPIKey(deviceId) {
  return process.env.DUMMY_DEVICES_API_KEY
    ? DEVICE_API_KEY
    : hashCode(deviceId.replace(/[0-9]/gi, ''));
}

function hashCode(str) {
  let hash = 0;
  let i;
  let chr;
  if (str.length === 0) {
    return hash;
  }
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/* global SOCKET_IO */
/* global MQTT_CLIENT */

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
  constructor(headers) {
    this.headers = headers;
    this.headers['Content-Type'] = 'text/plain';
  }

  // measures sent over HTTP are POST requests with params
  sendAsHTTP(deviceId, state) {
    const options = {
      method: 'POST',
      url: IOT_AGENT_URL,
      qs: { k: getAPIKey(deviceId), i: deviceId },
      headers: this.headers,
      body: state,
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
    const topic = '/' + getAPIKey(deviceId) + '/' + deviceId + '/attrs';
    MQTT_CLIENT.publish(topic, state);
  }
}

module.exports = UltralightMeasure;
