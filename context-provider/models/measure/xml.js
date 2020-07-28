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

function getAPIKey(deviceId) {
    return process.env.DUMMY_DEVICES_API_KEY ? DEVICE_API_KEY : hashCode(deviceId.replace(/[0-9]/gi, ''));
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

// This processor sends XML payloads northbound to
// the southport of the IoT Agent and sends measures
// for the motion sensor, door and lamp.

function ultralightToXML(key, deviceId, state) {
    const keyValuePairs = state.split('|');
    let payload = '';

    payload = payload + '<measure device="' + deviceId + '" key="' + key + '">\n';
    for (let i = 0; i < keyValuePairs.length; i = i + 2) {
        payload = payload + '<' + keyValuePairs[i] + ' value="' + keyValuePairs[i + 1] + '"/>\n';
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
            url: IOT_AGENT_URL,
            headers: this.headers,
            body: payload
        };
        const debugText = 'POST ' + IOT_AGENT_URL;

        request(options, (error) => {
            if (error) {
                debug(debugText + ' ' + error.code);
            }
        });

        SOCKET_IO.emit(
            'http',
            debugText + '<br/> ' + payload.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')
        );
    }

    // measures sent over MQTT are posted as topics (motion sensor, lamp and door)
    sendAsMQTT(deviceId, state) {
        const topic = '/' + getAPIKey(deviceId) + '/' + deviceId + '/attrs';
        MQTT_CLIENT.publish(topic, state);
    }
}

module.exports = XMLMeasure;
