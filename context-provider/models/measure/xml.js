// Connect to an IoT Agent and use fallback values if necessary

const request = require('request');
const debug = require('debug')('tutorial:xml');

const DEVICE_API_KEY = process.env.DUMMY_DEVICES_API_KEY || '1234';

const IOT_AGENT_URL =
  'http://' +
  (process.env.IOTA_HTTP_HOST || 'localhost') +
  ':' +
  (process.env.IOTA_HTTP_PORT || 7896) +
  (process.env.IOTA_DEFAULT_RESOURCE || '/iot/xml');

function getIoTAgentSouthport(deviceId) {
  let url = IOT_AGENT_URL;

  if (!process.env.IOTA_DEFAULT_RESOURCE) {
    url = url + '/' + deviceId.replace(/[0-9]/gi, '');
  }
  return url;
}
/* global SOCKET_IO */
/* global MQTT_CLIENT */

// This processor sends XML payloads northbound to
// the southport of the IoT Agent and sends measures
// for the motion sensor, door and lamp.

function ultralightToXML(key, deviceId, state) {
  const keyValuePairs = state.split('|');
  let payload = '';

  payload = payload + '<measure device="' + deviceId + '" key="' + key + '">\n';
  for (let i = 0; i < keyValuePairs.length; i = i + 2) {
    payload =
      payload +
      '<' +
      keyValuePairs[i] +
      ' value="' +
      keyValuePairs[i + 1] +
      '"/>\n';
  }
  payload = payload + '</measure>';
  return payload;
}

class XMLMeasure {
  constructor(headers) {
    this.headers = headers;
    this.headers['Content-Type'] = 'application/xml';
  }

  // measures sent over HTTP are POST requests with params
  sendAsHTTP(deviceId, state) {
    const payload = ultralightToXML(DEVICE_API_KEY, deviceId, state);
    const options = {
      method: 'POST',
      url: getIoTAgentSouthport(deviceId),
      headers: this.headers,
      body: payload,
    };
    const debugText = 'POST ' + getIoTAgentSouthport(deviceId);

    request(options, error => {
      if (error) {
        debug(debugText + ' ' + error.code);
      }
    });

    SOCKET_IO.emit(
      'http',
      debugText +
        '<br/> ' +
        payload
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>')
    );
  }

  // measures sent over MQTT are posted as topics (motion sensor, lamp and door)
  sendAsMQTT(deviceId, state) {
    const topic = '/' + DEVICE_API_KEY + '/' + deviceId + '/attrs';
    MQTT_CLIENT.publish(topic, state);
  }
}

module.exports = XMLMeasure;
