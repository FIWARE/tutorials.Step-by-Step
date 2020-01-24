const express = require('express');
const router = express.Router();

const NGSI_VERSION = process.env.NGSI_VERSION || 'ngsi-v2';
const CONTROLLER_PATH = '../controllers/' + NGSI_VERSION + '/proxy/';

const StaticNGSIProxy = require(CONTROLLER_PATH + 'static-api');
const RandomNGSIProxy = require(CONTROLLER_PATH + 'random-api');
const TwitterNGSIProxy = require(CONTROLLER_PATH + 'twitter-api');
const WeatherNGSIProxy = require(CONTROLLER_PATH + 'openweathermap-api');
const CatFactsNGSIProxy = require(CONTROLLER_PATH + 'catfacts-api');

router.get('/catfacts', CatFactsNGSIProxy.healthCheck);
router.get('/random', RandomNGSIProxy.healthCheck);
router.get('/static', StaticNGSIProxy.healthCheck);
router.get('/twitter', TwitterNGSIProxy.healthCheck);
router.get('/weather', WeatherNGSIProxy.healthCheck);

router.get('/', (req, res) => {
  res.status(200).send({
    health_urls: [
      '/health/catfacts',
      '/health/random',
      '/health/static',
      '/health/weather',
      '/health/twitter'
    ]
  });
});

module.exports = router;
