const express = require('express');
const router = express.Router();
const debug = require('debug')('tutorial:ngsi-v2');

const StaticNGSIProxy = require('../controllers/proxy/static-api');
const RandomNGSIProxy = require('../controllers/proxy/random-api');
const TwitterNGSIProxy = require('../controllers/proxy/twitter-api');
const WeatherNGSIProxy = require('../controllers/proxy/openweathermap-api');
const CatFactsNGSIProxy = require('../controllers/proxy/catfacts-api');

debug('NGSI-v2 Context-Forwarding Support is available');
/*
  Supported NGSI-v2 context provider endpoints

  '/random/temperature/op/query',
  '/random/relativeHumidity/op/query',
  '/random/tweets/op/query',
  '/random/weatherConditions/op/query',
  '/static/temperature/op/query',
  '/static/relativeHumidity/op/query',
  '/static/tweets/op/query',
  '/static/weatherConditions/op/query',
  '/catfacts/tweets/op/query',
  '/twitter/tweets/op/query',
  '/weather/temperature/op/query',
  '/weather/relativeHumidity/op/query',
  '/weather/weatherConditions/op/query'

*/

router.post('/catfacts/:type/:mapping/op/query', CatFactsNGSIProxy.getAsNGSIv2);
router.post('/random/:type/:mapping/op/query', RandomNGSIProxy.getAsNGSIv2);
router.post('/static/:type/:mapping/op/query', StaticNGSIProxy.getAsNGSIv2);
router.post('/twitter/:type/:mapping/:queryString/op/query', TwitterNGSIProxy.getAsNGSIv2);
router.post('/weather/:type/:mapping/:queryString/op/query', WeatherNGSIProxy.getAsNGSIv2);

// Convenience endpoints for temperature readings
router.post(
    '/random/temperature/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature';
        next();
    },
    RandomNGSIProxy.getAsNGSIv2
);

router.post(
    '/static/temperature/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature';
        next();
    },
    StaticNGSIProxy.getAsNGSIv2
);

router.post(
    '/weather/temperature/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature:temp';
        req.params.queryString = 'berlin,de';
        next();
    },
    WeatherNGSIProxy.getAsNGSIv2
);

// Convenience endpoints for humidity readings
router.post(
    '/random/relativeHumidity/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'relativeHumidity';
        next();
    },
    RandomNGSIProxy.getAsNGSIv2
);

router.post(
    '/static/relativeHumidity/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'relativeHumidity';
        next();
    },
    StaticNGSIProxy.getAsNGSIv2
);

router.post(
    '/weather/relativeHumidity/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'relativeHumidity:humidity';
        req.params.queryString = 'berlin,de';
        next();
    },
    WeatherNGSIProxy.getAsNGSIv2
);

// Convenience endpoints for weather conditions readings
router.post(
    '/random/weatherConditions/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature,relativeHumidity';
        next();
    },
    RandomNGSIProxy.getAsNGSIv2
);

router.post(
    '/static/weatherConditions/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature,relativeHumidity';
        next();
    },
    StaticNGSIProxy.getAsNGSIv2
);

router.post(
    '/weather/weatherConditions/op/query',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature:temp,relativeHumidity:humidity';
        req.params.queryString = 'berlin,de';
        next();
    },
    WeatherNGSIProxy.getAsNGSIv2
);

// Convenience endpoints for tweets readings
router.post(
    '/random/tweets/op/query',
    (req, res, next) => {
        req.params.type = 'list';
        req.params.mapping = 'tweets:array';
        next();
    },
    RandomNGSIProxy.getAsNGSIv2
);

router.post(
    '/static/tweets/op/query',
    (req, res, next) => {
        req.params.type = 'list';
        req.params.mapping = 'tweets:array';
        next();
    },
    StaticNGSIProxy.getAsNGSIv2
);

router.post(
    '/twitter/tweets/op/query',
    (req, res, next) => {
        req.params.type = 'list';
        req.params.mapping = 'tweets:text';
        req.params.queryString = 'FIWARE';
        next();
    },
    TwitterNGSIProxy.getAsNGSIv2
);

router.post(
    '/catfacts/tweets/op/query',
    (req, res, next) => {
        req.params.type = 'list';
        req.params.mapping = 'tweets:fact';
        req.params.queryString = '';
        next();
    },
    CatFactsNGSIProxy.getAsNGSIv2
);

module.exports = router;
