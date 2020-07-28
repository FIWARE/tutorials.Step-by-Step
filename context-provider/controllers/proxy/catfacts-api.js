//
// This controller proxies responses from the Cat Facts API.
//
// For more information see: https://catfacts.org/api
//

const debug = require('debug')('tutorial:proxy');
const request = require('request-promise');
const Formatter = require('../../lib/formatter');
const _ = require('lodash');
const monitor = require('../../lib/monitoring');

//  The  Cat Facts API key is personal to you.
//  Do not place them directly in the code - read them in as environment variables.
//  To do this you will need to add them to the docker-compose.yml file.
//
//	Before you start using the Cat Facts API,  Sign up for a key at http://catfacts.org/appid
//
const CAT_FACTS_URL = 'https://catfact.ninja/facts?limit=5';

//
// The Health Check function merely requests a weather forecast from Berlin
// to check that your API KEY ID is valid.
//
function healthCheck(req, res) {
  debug('healthCheck for Cat Facts API');
  makeCatFactsRequest()
    .then((result) => {
      const response = JSON.parse(result).response || {};
      if (response.error) {
        // An error response was returned
        throw new Error({ message: 'Service Not Found', statusCode: 401 });
      }
      debug('Cat Facts API is available - responding with facts about cats.');
      monitor('health', 'Cat Facts API is healthy');
      res.set('Content-Type', 'application/json');
      res.send(result);
    })
    .catch((err) => {
      debug('Cat Facts API is not responding');
      monitor('health', 'Cat Facts API is unhealthy');
      res.statusCode = err.statusCode || 501;
      res.send(err);
    });
}

//
// The queryContext endpoint responds with data in the legacy NGSI v1 format
// This endpoint is called by the Orion Broker when "legacyForwarding"
// is set to "true" during registration
//
function getAsLegacyNGSIv1(req, res) {
  monitor('/queryContext', 'Data requested from Cat Facts API', req.body);
  makeCatFactsRequest()
    .then((result) => {
      // Cat facts data is held in the main attribute
      const facts = JSON.parse(result).data;

      if (facts == null) {
        // No weather facts was returned for the query.
        throw new Error({ message: 'Not Found', statusCode: 404 });
      }

      res.set('Content-Type', 'application/json');
      res.send(Formatter.formatAsV1Response(req, facts, getValuesFromCatFacts));
    })
    .catch((err) => {
      debug(err);
      res.statusCode = err.statusCode || 501;
      res.send(err);
    });
}

//
// The op/query endpoint responds with data in the NGSI v2 format
// This endpoint is called by the Orion Broker when "legacyForwarding"
// is not set during registration
//
function getAsNGSIv2(req, res) {
  monitor('/op/query', 'Data requested from Cat Facts API', req.body);
  makeCatFactsRequest()
    .then((result) => {
      // Cat facts data is held in the main attribute
      const facts = JSON.parse(result).data;

      if (facts == null) {
        // No weather facts was returned for the query.
        throw new Error({ message: 'Not Found', statusCode: 404 });
      }

      res.set('Content-Type', 'application/json');
      res.send(Formatter.formatAsV2Response(req, facts, getValuesFromCatFacts));
    })
    .catch((err) => {
      debug(err);
      res.statusCode = err.statusCode || 501;
      res.send(err);
    });
}

//
// The /ngsi-ld/v1/entities/:id endpoint responds with data in the NGSI-LD format
//
function getAsNgsiLD(req, res) {
  monitor(
    '/ngsi-ld/v1/entities',
    'Data requested from Cat Facts API',
    req.body
  );
  makeCatFactsRequest()
    .then((result) => {
      // Cat facts data is held in the main attribute
      const facts = JSON.parse(result).data;

      if (facts == null) {
        // No weather facts was returned for the query.
        throw new Error({ message: 'Not Found', statusCode: 404 });
      }
      const response = Formatter.formatAsLDResponse(
        req,
        facts,
        getValuesFromCatFacts
      );

      if (req.headers.accept === 'application/json') {
        res.set('Content-Type', 'application/json');
        delete response['@context'];
      } else {
        res.set('Content-Type', 'application/ld+json');
      }
      res.send(response);
    })
    .catch((err) => {
      debug(err);
      res.statusCode = err.statusCode || 501;
      res.send(err);
    });
}

//
// When calling the Cat Facts API we need to supply the API Key as part of the
// URL. This method logs the request and appends the query to the base URL
//
function makeCatFactsRequest() {
  debug('Making a Cat Facts API request');
  return request({
    url: CAT_FACTS_URL,
    method: 'GET',
  });
}

//
// This function returns a value field from the array of twitter statuses
//
// @param {string} name - The NGSI attribute name requested
// @param {string} type - The type of the attribute requested
// @param {string} key  - The name of the attribute within the tweets
// @param {string} data - The Cat Fact data - an array of cat facts
//
function getValuesFromCatFacts(name, type, key, data) {
  debug(name + ' was requested - returning cat fact data for ' + key);

  const value = [];
  // In order to avoid script injections attack in some circustances
  // certain  characters are forbidden in any request:
  _.forEach(data, (element) => {
    value.push(element.fact.replace(/[<>"'=;()?/%&]/g, ''));
  });

  // Return the data as an array.
  return value;
}

module.exports = {
  healthCheck,
  getAsLegacyNGSIv1,
  getAsNGSIv2,
  getAsNgsiLD,
};
