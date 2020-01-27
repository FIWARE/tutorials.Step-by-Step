const express = require('express');
const router = express.Router();

const StaticNGSIProxy = require('../controllers/proxy/static-api');
const RandomNGSIProxy = require('../controllers/proxy/random-api');
const TwitterNGSIProxy = require('../controllers/proxy/twitter-api');
const WeatherNGSIProxy = require('../controllers/proxy/openweathermap-api');
const CatFactsNGSIProxy = require('../controllers/proxy/catfacts-api');

/*
  Supported NGSI-LD context provider endpoints

  '/random/temperature/ngsi-ld/v1/entities/',
  '/random/relativeHumidity/ngsi-ld/v1/entities/',
  '/random/tweets/ngsi-ld/v1/entities/',
  '/random/weatherConditions/ngsi-ld/v1/entities/',
  '/static/temperature/ngsi-ld/v1/entities/',
  '/static/relativeHumidity/ngsi-ld/v1/entities/',
  '/static/tweets/ngsi-ld/v1/entities/',
  '/static/weatherConditions/ngsi-ld/v1/entities/',
  '/catfacts/tweets/ngsi-ld/v1/entities/',
  '/twitter/tweets/ngsi-ld/v1/entities/',
  '/weather/temperature/ngsi-ld/v1/entities/',
  '/weather/relativeHumidity/ngsi-ld/v1/entities/',
  '/weather/weatherConditions/ngsi-ld/v1/entities/'

*/

function weatherDefaults(req, res, next) {
  req.params.type = 'number';
  req.params.mapping = 'temperature,relativeHumidity';
  req.query.attrs = req.query.attrs || 'temperature,relativeHumidity';
  req.params.queryString = 'berlin,de';
  next();
}

function tweetDefaults(req, res, next) {
  req.params.type = 'list';
  req.params.mapping = 'tweets:text';
  req.params.queryString = 'FIWARE';
  req.query.attrs = req.query.attrs || 'tweets';
  next();
}

function humidityDefault(req, res, next) {
  req.query.attrs = req.query.attrs || 'relativeHumidity';
  next();
}

function temperatureDefault(req, res, next) {
  req.query.attrs = req.query.attrs || 'temperature';
  next();
}

router.get(
  '/catfacts/:type/:mapping/ngsi-ld/v1/entities/:id',
  CatFactsNGSIProxy.getAsNgsiLD
);
router.get(
  '/random/:type/:mapping/ngsi-ld/v1/entities/:id',
  RandomNGSIProxy.getAsNgsiLD
);
router.get(
  '/static/:type/:mapping/ngsi-ld/v1/entities/:id',
  StaticNGSIProxy.getAsNgsiLD
);
router.get(
  '/twitter/:type/:mapping/:queryString/ngsi-ld/v1/entities/:id',
  TwitterNGSIProxy.getAsNgsiLD
);
router.get(
  '/weather/:type/:mapping/:queryString/ngsi-ld/v1/entities/:id',
  WeatherNGSIProxy.getAsNgsiLD
);

// Convenience endpoints for temperature readings
router.get(
  '/random/temperature/ngsi-ld/v1/entities/:id',
  temperatureDefault,
  weatherDefaults,
  RandomNGSIProxy.getAsNgsiLD
);

router.get(
  '/static/temperature/ngsi-ld/v1/entities/:id',
  temperatureDefault,
  weatherDefaults,
  StaticNGSIProxy.getAsNgsiLD
);

router.get(
  '/weather/temperature/ngsi-ld/v1/entities/:id',
  temperatureDefault,
  weatherDefaults,
  WeatherNGSIProxy.getAsNgsiLD
);

// Convenience endpoints for humidity readings
router.get(
  '/random/relativeHumidity/ngsi-ld/v1/entities/:id',
  humidityDefault,
  weatherDefaults,
  RandomNGSIProxy.getAsNgsiLD
);

router.get(
  '/static/relativeHumidity/ngsi-ld/v1/entities/:id',
  humidityDefault,
  weatherDefaults,
  StaticNGSIProxy.getAsNgsiLD
);

router.get(
  '/weather/relativeHumidity/ngsi-ld/v1/entities/:id',
  humidityDefault,
  weatherDefaults,
  WeatherNGSIProxy.getAsNgsiLD
);

// Convenience endpoints for weather conditions readings
router.get(
  '/random/weatherConditions/ngsi-ld/v1/entities/:id',
  weatherDefaults,
  RandomNGSIProxy.getAsNgsiLD
);

router.get(
  '/static/weatherConditions/ngsi-ld/v1/entities/:id',
  weatherDefaults,
  StaticNGSIProxy.getAsNgsiLD
);

router.get(
  '/weather/weatherConditions/ngsi-ld/v1/entities/:id',
  weatherDefaults,
  WeatherNGSIProxy.getAsNgsiLD
);

// Convenience endpoints for tweets readings
router.get(
  '/random/tweets/ngsi-ld/v1/entities/:id',
  tweetDefaults,
  RandomNGSIProxy.getAsNgsiLD
);

router.get(
  '/static/tweets/ngsi-ld/v1/entities/:id',
  tweetDefaults,
  StaticNGSIProxy.getAsNgsiLD
);

router.get(
  '/twitter/tweets/ngsi-ld/v1/entities/:id',
  tweetDefaults,
  TwitterNGSIProxy.getAsNgsiLD
);

router.get(
  '/catfacts/tweets/ngsi-ld/v1/entities/:id',
  tweetDefaults,
  CatFactsNGSIProxy.getAsNgsiLD
);

module.exports = router;
