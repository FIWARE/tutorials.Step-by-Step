const express = require('express');
const router = express.Router();

const StaticNGSIProxy = require('../controllers/static');
const RandomNGSIProxy = require('../controllers/random');
const TwitterNGSIProxy = require('../controllers/twitter');
const WeatherNGSIProxy = require('../controllers/openweathermap');

router.get('/random', RandomNGSIProxy.healthCheck);
router.get('/static', StaticNGSIProxy.healthCheck);
router.get('/twitter', TwitterNGSIProxy.healthCheck);
router.get('/weather', WeatherNGSIProxy.healthCheck);

router.get('/', (req, res) => {
  res.status(200).send({
    health_urls: [
      '/health/random',
      '/health/static',
      '/health/weather',
      '/health/twitter',
    ],
  });
});

module.exports = router;
