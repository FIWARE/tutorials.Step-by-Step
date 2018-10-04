//
// This controlller is a proxy for the Static API which responds with random data.
//

const debug = require('debug')('tutorial:proxy');
const Formatter = require('../lib/formatter');
const monitor = require('../lib/monitoring');

//
// The Health Check endpoint returns some  canned responses to show it is functioning
//
function healthCheck(req, res) {
  debug('Static API is available - responding with some static values');
  monitor('health', 'Static API is healthy');
  res.status(200).send({
    array: staticValueForType('array'),
    boolean: staticValueForType('boolean'),
    number: staticValueForType('number'),
    structuredValue: staticValueForType('structuredValue'),
    text: staticValueForType('text'),
  });
}

//
// The Query Context endpoint responds with data in the NGSI v1 queryContext format
// This endpoint is called by the Orion Broker when "legacyForwarding"
// is set to "true" during registration.
//
// For the static content provider, the response is in the form of static data.
//
function queryContext(req, res) {
  monitor('queryContext', 'Data requested from Static API', req.body);
  const response = Formatter.formatAsV1Response(req, null, (name, type) => {
    return staticValueForType(type);
  });

  res.send(response);
}

//
// A function for generating canned responses.
//
function staticValueForType(type) {
  switch (type.toLowerCase()) {
    case 'array':
      return ['Arthur', 'Dent'];
    case 'list':
      return [
        'it has great practical value – you can wrap it around you for warmth as you bound across the cold moons of Jaglan Beta;',
        'you can lie on it on the brilliant marble-sanded beaches of Santraginus V, inhaling the heady sea vapours;',
        'you can sleep under it beneath the stars which shine so redly on the desert world of Kakrafoon;',
        'use it to sail a mini raft down the slow heavy river Moth; wet it for use in hand-to-hand-combat;',
        'wrap it round your head to ward off noxious fumes or to avoid the gaze of the Ravenous Bugblatter Beast of Traal  ' +
          '(a mindboggingly stupid animal, it assumes that if you can’t see it, it can’t see you – daft as a bush, but very, very ravenous);',
        'you can wave your towel in emergencies as a distress signal, and of course dry yourself off with it if it still seems to be clean enough.',
      ];
    case 'boolean':
      return true;
    case 'float':
    case 'integer':
    case 'number':
      return 42;
    case 'structuredValue':
      return {
        somevalue: 'this',
      };
    case 'string':
    case 'text':
      return 'I never could get the hang of thursdays';
    default:
      return null;
  }
}

module.exports = {
  healthCheck,
  queryContext,
};
