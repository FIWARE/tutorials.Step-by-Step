const express = require('express');
const router = express.Router();

const StaticNGSIProxy = require('../controllers/proxy/static-api');
const RandomNGSIProxy = require('../controllers/proxy/random-api');
const TwitterNGSIProxy = require('../controllers/proxy/twitter-api');
const WeatherNGSIProxy = require('../controllers/proxy/openweathermap-api');
const CatFactsNGSIProxy = require('../controllers/proxy/catfacts-api');

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
      '/health/twitter',
    ],
  });
});

module.exports = router;
