//
// This controller demonstrates how to override NGSI-LD contexts
// through compaction and expansion
//
// For more information see: https://json-ld.org/
//

const debug = require('debug')('tutorial:ngsi-ld');
const request = require('request-promise');
const jsonld = require('jsonld');

const BASE_PATH = process.env.CONTEXT_BROKER || 'http://localhost:1026/ngsi-ld/v1';

const coreContext = require('./jsonld-context/ngsi-ld.json');
const japaneseContext = require('./jsonld-context/japanese.json');

// This function is a simple forward to the context broker
//
// When the response is received the payload is treated so that
// the JSON uses attribute names based in Japanese.
//
function translateRequest(req, res) {
    debug('translateRequest');

    const headers = req.headers;
    headers.Accept = 'application/json';

    const options = {
        url: BASE_PATH + req.path,
        method: req.method,
        headers,
        qs: req.query,
        json: true
    };

    request(options)
        .then(async function (cbResponse) {
            // Having received a response, the payload is expanded using
            // the core context - this forces all attribute ids to be
            // URIs
            cbResponse['@context'] = coreContext;
            const expanded = await jsonld.expand(cbResponse);
            // The payload is then compacted using the "japanese" context
            // This maps the URIs to short attribute names.
            const compacted = await jsonld.compact(expanded, japaneseContext);
            delete compacted['@context'];
            return res.send(compacted);
        })
        .catch(function (err) {
            return res.send(err);
        });
}

module.exports = {
    translateRequest
};
