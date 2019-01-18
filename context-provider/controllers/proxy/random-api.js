//
// This controlller is a proxy for the Random API which responds with random data.
//

const debug = require('debug')('tutorial:proxy');
const Formatter = require('../../lib/formatter');
const monitor = require('../../lib/monitoring');

const LOREM_IPSUM =
  'lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua. enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ' +
  'ut aliquip ex ea commodo consequat. duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore ' +
  'eu fugiat nulla pariatur. excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit ';
const LOREM_IPSUM_WORD_BANK = LOREM_IPSUM.split(' ');

//
// The Health Check endpoint returns some random data values to show it is functioning
//
function healthCheck(req, res) {
  debug('Random API is available - responding with some random values');
  monitor('health', 'Random API is healthy');
  res.status(200).send({
    array: randomValueForType('array'),
    boolean: randomValueForType('boolean'),
    number: randomValueForType('number'),
    structuredValue: randomValueForType('structuredValue'),
    text: randomValueForType('text')
  });
}

//
// The Query Context endpoint responds with data in the NGSI v1 queryContext format
// This endpoint is called by the Orion Broker when "legacyForwarding"
// is set to "true" during registration
//
// For the random content provider, the response is in the form of random values
// which change with each request.
//
function queryContext(req, res) {
  monitor('queryContext', 'Data requested from Random API', req.body);
  const response = Formatter.formatAsV1Response(req, null, (name, type) => {
    return randomValueForType(type);
  });

  res.send(response);
}

//
// A function to generate some random responses.
//
function randomValueForType(type) {
  const randy = Math.floor(Math.random() * 10) + 5;
  let ret;

  switch (type.toLowerCase()) {
    case 'array':
      ret = [];
      // eslint-disable-next-line id-blacklist
      for (let i = 0; i < randy; i++) {
        ret.push(
          LOREM_IPSUM_WORD_BANK[
            Math.floor(Math.random() * (LOREM_IPSUM_WORD_BANK.length - 1))
          ]
        );
      }
      break;
    case 'list':
      ret = [];
      // eslint-disable-next-line id-blacklist
      for (let i = 0; i < randy; i++) {
        ret.push(getLoremIpsum());
      }
      break;
    case 'boolean':
      ret = Math.random() >= 0.5;
      break;

    case 'float':
      ret = Math.floor(Math.random() * 430) / 10.0;
      break;
    case 'integer':
    case 'number':
      ret = Math.floor(Math.random() * 43);
      break;
    case 'structuredvalue':
      ret = {
        somevalue: 'this'
      };
      break;
    case 'string':
    case 'text':
      ret = getLoremIpsum();
      break;
    default:
      return null;
  }
  return ret;
}

function getLoremIpsum() {
  const randy = Math.floor(Math.random() * 10) + 5;
  let text = '';
  // eslint-disable-next-line id-blacklist
  for (let i = 0; i < randy; i++) {
    let newTxt =
      LOREM_IPSUM_WORD_BANK[
        Math.floor(Math.random() * (LOREM_IPSUM_WORD_BANK.length - 1))
      ];
    if (
      text.substring(text.length - 1, text.length) === '.' ||
      text.substring(text.length - 1, text.length) === '?'
    ) {
      newTxt =
        newTxt.substring(0, 1).toUpperCase() +
        newTxt.substring(1, newTxt.length);
    }
    text += ' ' + newTxt;
  }
  return text;
}

module.exports = {
  healthCheck,
  queryContext
};
