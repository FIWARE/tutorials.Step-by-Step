const createError = require('http-errors');
const express = require('express');
const Southbound = require('./controllers/iot/southbound');
const debug = require('debug')('tutorial:iot-device');
const mqtt = require('mqtt');

/* global MQTT_CLIENT */
const DEVICE_TRANSPORT = process.env.DUMMY_DEVICES_TRANSPORT || 'HTTP';

// The motion sensor offers no commands, hence it does not need an endpoint.

// parse everything as a stream of text
function rawBody(req, res, next) {
  req.setEncoding('utf8');
  req.body = '';
  req.on('data', function(chunk) {
    req.body += chunk;
  });
  req.on('end', function() {
    next();
  });
}

const iot = express();
iot.use(rawBody);

const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto';
global.MQTT_CLIENT = mqtt.connect(mqttBrokerUrl);

// If the Ultralight Dummy Devices are configured to use the HTTP transport, then
// listen to the command endpoints using HTTP
if (DEVICE_TRANSPORT === 'HTTP') {
  debug('Listening on HTTP endpoints: /iot/bell, /iot/door, iot/lamp');

  const iotRouter = express.Router();

  // The router listening on the IoT port is responding to commands going southbound only.
  // Therefore we need a route for each actuator
  iotRouter.post('/iot/bell:id', Southbound.bellHttpCommand);
  iotRouter.post('/iot/door:id', Southbound.doorHttpCommand);
  iotRouter.post('/iot/lamp:id', Southbound.lampHttpCommand);

  iot.use('/', iotRouter);
}
// If the IoT Devices are configured to use the MQTT transport, then
// subscribe to the assoicated topics for each device.
if (DEVICE_TRANSPORT === 'MQTT') {
  const apiKey = process.env.DUMMY_DEVICES_API_KEY || '1234';
  const topics = '/' + apiKey + '/#';

  MQTT_CLIENT.on('connect', () => {
    debug('Subscribing to MQTT Broker: ' + mqttBrokerUrl + ' ' + topics);
    MQTT_CLIENT.subscribe(topics);
    MQTT_CLIENT.subscribe(topics + '/#');
  });

  mqtt.connect(mqttBrokerUrl);

  MQTT_CLIENT.on('message', function(topic, message) {
    // message is a buffer. The IoT devices will be listening and
    // responding to commands going southbound.
    Southbound.processMqttMessage(topic.toString(), message.toString());
  });
}

// catch 404 and forward to error handler
iot.use(function(req, res) {
  res.status(404).send(new createError.NotFound());
});

module.exports = iot;
