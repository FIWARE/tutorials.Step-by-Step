//
// This controller proxies responses from the OpenWeatherMap API.
//
// For more information see: https://openweathermap.org/api
//

const debug = require('debug')('proxy:server');
const request = require('request-promise');
const Formatter = require('../lib/formatter');
const monitor = require('../lib/monitoring');

//  The  OpenWeatherMap API key is personal to you.
//  Do not place them directly in the code - read them in as environment variables.
//  To do this you will need to add them to the docker-compose.yml file.
//
//	Before you start using the OpenWeatherMap API,  Sign up for a key at http://openweathermap.org/appid
//
const OPENWEATHERMAP_URL =
	'http://api.openweathermap.org/data/2.5/weather?appid=' + process.env.OPENWEATHERMAP_KEY_ID + '&q=';

//
// The Health Check function merely requests a weather forecast from Berlin
// to check that your API KEY ID is valid.
//
function healthCheck(req, res) {
	makeWeatherRequest('berlin,de')
		.then(result => {
			const response = JSON.parse(result).response || {};
			if (response.error) {
				// An error response was returned for the query for Berlin.
				throw new Error({ message: 'API Key Not Found', statusCode: 401 });
			}
			debug('OpenWeatherMap API is available - KeyID is valid  - responding with the weather for Berlin.');
			monitor('health', 'OpenWeatherMap API is healthy');
			res.set('Content-Type', 'application/json');
			res.send(result);
		})
		.catch(err => {
			debug(
				'OpenWeatherMap API is not responding - have you added your KeyID as an environment variable?'
			);
			monitor('health', 'OpenWeatherMap API is unhealthy');
			res.statusCode = err.statusCode || 501;
			res.send(err);
		});
}

//
// The Query Context endpoint responds with data in the NGSI v1 queryContext format
// This endpoint is called by the Orion Broker when "legacyForwarding"
// is set to "true" during registration
//
function queryContext(req, res) {
	monitor('queryContext', 'Data requested from OpenWeatherMap API', req.body);
	makeWeatherRequest(req.params.queryString)
		.then(result => {
			// Weather observation data is held in the main attribute
			const observation = JSON.parse(result).main;

			if (observation == null) {
				// No weather observation was returned for the query.
				throw new Error({ message: 'Not Found', statusCode: 404 });
			}

			res.set('Content-Type', 'application/json');
			res.send(Formatter.formatAsV1Response(req, observation, getValueFromObservation));
		})
		.catch(err => {
			debug(err);
			res.statusCode = err.statusCode || 501;
			res.send(err);
		});
}

//
// When calling the OpenWeatherMap API we need to supply the API Key as part of the
// URL. This method logs the request and appends the query to the base URL
//
function makeWeatherRequest(query) {
	debug('Making a OpenWeatherMap API request: ' + query);
	return request({
		url: OPENWEATHERMAP_URL + query,
		method: 'GET',
	});
}

//
// This function returns a value field from the weather observation
//
// @param {string} name - The NGSI attribute name requested
// @param {string} type - The type of the attribute requested
// @param {string} key  - The name of the attribute within the weather observation
// @param {string} data - The Weather Data - an object of Weather observations
//
function getValueFromObservation(name, type, key, data) {
	debug(name + ' was requested - returning current_observation.' + key + ' : ' + data[key]);
	return data[key];
}

module.exports = {
	healthCheck,
	queryContext,
};
