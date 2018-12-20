const express = require('express');
const router = express.Router();

const StaticNGSIProxy = require('../controllers/proxy/static-api');
const RandomNGSIProxy = require('../controllers/proxy/random-api');
const TwitterNGSIProxy = require('../controllers/proxy/twitter-api');
const WeatherNGSIProxy = require('../controllers/proxy/openweathermap-api');
const CatFactsNGSIProxy = require('../controllers/proxy/catfacts-api');

router.post(
  '/catfacts/:type/:mapping/queryContext',
  CatFactsNGSIProxy.queryContext
);
router.post(
  '/random/:type/:mapping/queryContext',
  RandomNGSIProxy.queryContext
);
router.post(
  '/static/:type/:mapping/queryContext',
  StaticNGSIProxy.queryContext
);
router.post(
  '/twitter/:type/:mapping/:queryString/queryContext',
  TwitterNGSIProxy.queryContext
);
router.post(
  '/weather/:type/:mapping/:queryString/queryContext',
  WeatherNGSIProxy.queryContext
);

// Convenience endpoints for temperature readings
router.post(
  '/random/temperature/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'temperature';
    next();
  },
  RandomNGSIProxy.queryContext
);

router.post(
  '/static/temperature/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'temperature';
    next();
  },
  StaticNGSIProxy.queryContext
);

router.post(
  '/weather/temperature/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'temperature:temp';
    req.params.queryString = 'berlin,de';
    next();
  },
  WeatherNGSIProxy.queryContext
);

// Convenience endpoints for humidity readings
router.post(
  '/random/relativeHumidity/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'relativeHumidity';
    next();
  },
  RandomNGSIProxy.queryContext
);

router.post(
  '/static/relativeHumidity/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'relativeHumidity';
    next();
  },
  StaticNGSIProxy.queryContext
);

router.post(
  '/weather/relativeHumidity/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'relativeHumidity:humidity';
    req.params.queryString = 'berlin,de';
    next();
  },
  WeatherNGSIProxy.queryContext
);

// Convenience endpoints for weather conditions readings
router.post(
  '/random/weatherConditions/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'temperature,relativeHumidity';
    next();
  },
  RandomNGSIProxy.queryContext
);

router.post(
  '/static/weatherConditions/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'temperature,relativeHumidity';
    next();
  },
  StaticNGSIProxy.queryContext
);

router.post(
  '/weather/weatherConditions/queryContext',
  (req, res, next) => {
    req.params.type = 'number';
    req.params.mapping = 'temperature:temp,relativeHumidity:humidity';
    req.params.queryString = 'berlin,de';
    next();
  },
  WeatherNGSIProxy.queryContext
);

// Convenience endpoints for tweets readings
router.post(
  '/random/tweets/queryContext',
  (req, res, next) => {
    req.params.type = 'list';
    req.params.mapping = 'tweets:array';
    next();
  },
  RandomNGSIProxy.queryContext
);

router.post(
  '/static/tweets/queryContext',
  (req, res, next) => {
    req.params.type = 'list';
    req.params.mapping = 'tweets:array';
    next();
  },
  StaticNGSIProxy.queryContext
);

router.post(
  '/twitter/tweets/queryContext',
  (req, res, next) => {
    req.params.type = 'list';
    req.params.mapping = 'tweets:text';
    req.params.queryString = 'FIWARE';
    next();
  },
  TwitterNGSIProxy.queryContext
);

router.post(
  '/catfacts/tweets/queryContext',
  (req, res, next) => {
    req.params.type = 'list';
    req.params.mapping = 'tweets:fact';
    req.params.queryString = '';
    next();
  },
  CatFactsNGSIProxy.queryContext
);

router.get('/', (req, res) => {
  res.status(200).send({
    context_urls: [
      '/proxy/v1/random/temperature/queryContext',
      '/proxy/v1/random/relativeHumidity/queryContext',
      '/proxy/v1/random/tweets/queryContext',
      '/proxy/v1/random/weatherConditions/queryContext',
      '/proxy/v1/static/temperature/queryContext',
      '/proxy/v1/static/relativeHumidity/queryContext',
      '/proxy/v1/static/tweets/queryContext',
      '/proxy/v1/static/weatherConditions/queryContext',
      '/proxy/v1/catfacts/tweets/queryContext',
      '/proxy/v1/twitter/tweets/queryContext',
      '/proxy/v1/weather/temperature/queryContext',
      '/proxy/v1/weather/relativeHumidity/queryContext',
      '/proxy/v1/weather/weatherConditions/queryContext'
    ]
  });
});

module.exports = router;
