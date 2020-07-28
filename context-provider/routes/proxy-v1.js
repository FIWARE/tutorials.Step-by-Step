const express = require('express');
const router = express.Router();
const debug = require('debug')('tutorial:ngsi-v1');

const StaticNGSIProxy = require('../controllers/proxy/static-api');
const RandomNGSIProxy = require('../controllers/proxy/random-api');
const TwitterNGSIProxy = require('../controllers/proxy/twitter-api');
const WeatherNGSIProxy = require('../controllers/proxy/openweathermap-api');
const CatFactsNGSIProxy = require('../controllers/proxy/catfacts-api');

debug('NGSI-v1 Context-Forwarding Support is available');
/*
  Supported legacy NGSI-v1 context provider endpoints
  
  '/random/temperature/queryContext',
  '/random/relativeHumidity/queryContext',
  '/random/tweets/queryContext',
  '/random/weatherConditions/queryContext',
  '/static/temperature/queryContext',
  '/static/relativeHumidity/queryContext',
  '/static/tweets/queryContext',
  '/static/weatherConditions/queryContext',
  '/catfacts/tweets/queryContext',
  '/twitter/tweets/queryContext',
  '/weather/temperature/queryContext',
  '/weather/relativeHumidity/queryContext',
  '/weather/weatherConditions/queryContext'

*/

router.post('/catfacts/:type/:mapping/queryContext', CatFactsNGSIProxy.getAsLegacyNGSIv1);
router.post('/random/:type/:mapping/queryContext', RandomNGSIProxy.getAsLegacyNGSIv1);
router.post('/static/:type/:mapping/queryContext', StaticNGSIProxy.getAsLegacyNGSIv1);
router.post('/twitter/:type/:mapping/:queryString/queryContext', TwitterNGSIProxy.getAsLegacyNGSIv1);
router.post('/weather/:type/:mapping/:queryString/queryContext', WeatherNGSIProxy.getAsLegacyNGSIv1);

// Convenience endpoints for temperature readings
router.post(
    '/random/temperature/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature';
        next();
    },
    RandomNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/static/temperature/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature';
        next();
    },
    StaticNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/weather/temperature/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature:temp';
        req.params.queryString = 'berlin,de';
        next();
    },
    WeatherNGSIProxy.getAsLegacyNGSIv1
);

// Convenience endpoints for humidity readings
router.post(
    '/random/relativeHumidity/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'relativeHumidity';
        next();
    },
    RandomNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/static/relativeHumidity/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'relativeHumidity';
        next();
    },
    StaticNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/weather/relativeHumidity/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'relativeHumidity:humidity';
        req.params.queryString = 'berlin,de';
        next();
    },
    WeatherNGSIProxy.getAsLegacyNGSIv1
);

// Convenience endpoints for weather conditions readings
router.post(
    '/random/weatherConditions/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature,relativeHumidity';
        next();
    },
    RandomNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/static/weatherConditions/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature,relativeHumidity';
        next();
    },
    StaticNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/weather/weatherConditions/queryContext',
    (req, res, next) => {
        req.params.type = 'number';
        req.params.mapping = 'temperature:temp,relativeHumidity:humidity';
        req.params.queryString = 'berlin,de';
        next();
    },
    WeatherNGSIProxy.getAsLegacyNGSIv1
);

// Convenience endpoints for tweets readings
router.post(
    '/random/tweets/queryContext',
    (req, res, next) => {
        req.params.type = 'list';
        req.params.mapping = 'tweets:array';
        next();
    },
    RandomNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/static/tweets/queryContext',
    (req, res, next) => {
        req.params.type = 'list';
        req.params.mapping = 'tweets:array';
        next();
    },
    StaticNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/twitter/tweets/queryContext',
    (req, res, next) => {
        req.params.type = 'list';
        req.params.mapping = 'tweets:text';
        req.params.queryString = 'FIWARE';
        next();
    },
    TwitterNGSIProxy.getAsLegacyNGSIv1
);

router.post(
    '/catfacts/tweets/queryContext',
    (req, res, next) => {
        req.params.type = 'list';
        req.params.mapping = 'tweets:fact';
        req.params.queryString = '';
        next();
    },
    CatFactsNGSIProxy.getAsLegacyNGSIv1
);

module.exports = router;
