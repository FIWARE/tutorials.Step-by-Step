//
// This controller proxies responses from the Twitter API.
//
// For more information see: https://developer.twitter.com/
//

const debug = require('debug')('tutorial:proxy');
const Twitter = require('twitter');
const request = require('request-promise');
const Formatter = require('../../lib/formatter');
const _ = require('lodash');
const monitor = require('../../lib/monitoring');

// The  Twitter Consumer Key & Consumer Secret are personal to you.
// Do not place them directly in the code - read them in as environment variables.
// To do this you will need to add them to the docker-compose.yml file.
//
// To get Consumer Key & Consumer Secret, you have to create an app in Twitter via
//     https://apps.twitter.com/app/new
// Then you'll be taken to a page containing Consumer Key & Consumer Secret.
//
const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
const TWITTER_OAUTH_TOKEN_URL = 'https://api.twitter.com/oauth2/token';
const TWITTER_SEARCH_PATH = 'search/tweets';

//
// The Health Check function merely requests tweets about FIWARE
// to check that your CONSUMER KEY and CONSUMER SECRET are valid.
//
function healthCheck(req, res) {
    debug('healthCheck for Twitter API');
    makeTwitterRequest(
        { q: 'FIWARE' },
        (error, tweets) => {
            debug('Twitter is responding - your keys are valid  - responding with the tweets about FIWARE.');
            monitor('health', 'Twitter API is healthy');
            res.send(tweets);
        },
        (err) => {
            debug(
                'Twitter is not responding - have you added your Consumer Key & Consumer Secret as environment variables?'
            );
            monitor('health', 'Twitter API is unhealthy');
            res.statusCode = err.statusCode || 501;
            res.send(err);
        }
    );
}

//
// The queryContext endpoint responds with data in the legacy NGSI v1 format
// This endpoint is called by the Orion Broker when "legacyForwarding"
// is set to "true" during registration
//
function getAsLegacyNGSIv1(req, res) {
    monitor('/queryContext', 'Data requested from Twitter API', req.body);
    makeTwitterRequest(
        { q: req.params.queryString },
        (error, tweets) => {
            if (tweets.statuses == null) {
                // No tweets were returned for the query.
                throw new Error({ message: 'Not Found', statusCode: 404 });
            }

            res.set('Content-Type', 'application/json');
            const payload = Formatter.formatAsV1Response(req, tweets.statuses, getValuesFromTweets);

            debug(JSON.stringify(payload));

            res.send(payload);
        },
        (err) => {
            debug(err);
            res.statusCode = err.statusCode || 501;
            res.send(err);
        }
    );
}

//
// The op/query endpoint responds with data in the NGSI v2 format
// This endpoint is called by the Orion Broker when "legacyForwarding"
// is not set during registration
//
function getAsNGSIv2(req, res) {
    monitor('/op/query', 'Data requested from Twitter API', req.body);
    makeTwitterRequest(
        { q: req.params.queryString },
        (error, tweets) => {
            if (tweets.statuses == null) {
                // No tweets were returned for the query.
                throw new Error({ message: 'Not Found', statusCode: 404 });
            }

            res.set('Content-Type', 'application/json');
            const payload = Formatter.formatAsV2Response(req, tweets.statuses, getValuesFromTweets);

            debug(JSON.stringify(payload));

            res.send(payload);
        },
        (err) => {
            debug(err);
            res.statusCode = err.statusCode || 501;
            res.send(err);
        }
    );
}

//
// The /ngsi-ld/v1/entities/:id endpoint responds with data in the NGSI-LD format
//
function getAsNgsiLD(req, res) {
    monitor('/ngsi-ld/v1/entities', 'Data requested from Twitter API', req.body);

    makeTwitterRequest(
        { q: req.params.queryString },
        (error, tweets) => {
            if (tweets.statuses == null) {
                // No tweets were returned for the query.
                throw new Error({ message: 'Not Found', statusCode: 404 });
            }

            const response = Formatter.formatAsLDResponse(req, tweets.statuses, getValuesFromTweets);

            if (req.headers.accept === 'application/json') {
                res.set('Content-Type', 'application/json');
                delete response['@context'];
            } else {
                res.set('Content-Type', 'application/ld+json');
            }
            res.send(response);
        },
        (err) => {
            debug(err);
            res.statusCode = err.statusCode || 501;
            res.send(err);
        }
    );
}

//
// When calling the twitter library, for an application with read-only
// access we need to supply CONSUMER KEY, CONSUMER SECRET and a bearer token.
//
// The twitter API uses OAuth to offer the access token so first make an OAuth
// request to obtain the token, then use the token in the actual request.
//
function makeTwitterRequest(params, callback, errorHandler) {
    request({
        url: TWITTER_OAUTH_TOKEN_URL,
        method: 'POST',
        auth: {
            user: TWITTER_CONSUMER_KEY,
            pass: TWITTER_CONSUMER_SECRET
        },
        form: {
            grant_type: 'client_credentials'
        }
    })
        .then(function (result) {
            debug('Making a Twitter Search API request: ' + JSON.stringify(params));
            const client = new Twitter({
                consumer_key: TWITTER_CONSUMER_KEY,
                consumer_secret: TWITTER_CONSUMER_SECRET,
                bearer_token: JSON.parse(result).access_token
            });

            client.get(TWITTER_SEARCH_PATH, params, callback);
        })
        .catch(errorHandler);
}

//
// This function returns a value field from the array of twitter statuses
//
// @param {string} name - The NGSI attribute name requested
// @param {string} type - The type of the attribute requested
// @param {string} key  - The name of the attribute within the tweets
// @param {string} data - The Twitter data - an array of status updates.
//
function getValuesFromTweets(name, type, key, data) {
    debug(name + ' was requested - returning tweet data for ' + key);

    const value = [];
    // In order to avoid script injections attack in some circustances
    // certain  characters are forbidden in any request:
    _.forEach(data, (element) => {
        value.push(element[key].replace(/[<>"'=;()?/%&]/g, ''));
    });

    // Return the data as an array.
    return value;
}

module.exports = {
    healthCheck,
    getAsLegacyNGSIv1,
    getAsNGSIv2,
    getAsNgsiLD
};
