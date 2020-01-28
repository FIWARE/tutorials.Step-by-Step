const _ = require('lodash');
const parseLinks = require('parse-links');
const moment = require('moment');

//
// Entity types are typically title cased following Schema.org
//
function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => {
    return txt.charAt(0).toUpperCase() + txt.substr(1);
  });
}

// NGSI attribute names should follow Data Model Guidelines (e.g. camelCasing)
// Data returned from third-party APIs such as the Weather API will not enforce the same guidelines.
// It is therefore necessary to invoke a mapping to be able to know which value to retieve.
//
// This function assumes that mappings are defined in the path as follows:
//
//   temperature
//	    temperature NGSI attribute maps to temperature attribute on the API data
//   temperature:temp_c
//      temperature NGSI attribute maps to temp_c attribute on the API data
//   temperature:temp_c,windSpeed:wind_speed
//      temperature NGSI attribute maps to temp_c attribute on the API data
//      windSpeed NGSI attribute maps to wind_speed attribute on the API data
//
// For the full guidelines see:
//    http://fiware-datamodels.readthedocs.io/en/latest/guidelines/index.html
//
function parseMapping(input) {
  const mappedAttributes = {};

  _.forEach(input.split(','), element => {
    if (element.includes(':')) {
      const splitElement = element.split(':');
      mappedAttributes[splitElement[0]] = splitElement[1];
    } else {
      mappedAttributes[element] = element;
    }
  });

  return mappedAttributes;
}

function formatAsV2Response(req, inputData, attributeValueCallback) {
  const mappedAttributes = parseMapping(req.params.mapping);
  const queryResponse = [];
  const addUnitCode = _.indexOf(req.body.metadata, 'unitCode') > -1;
  const addObservedAt = _.indexOf(req.body.metadata, 'observedAt') > -1;

  _.forEach(req.body.entities, entity => {
    const element = {
      id: entity.id,
      type: entity.type
    };

    _.forEach(req.body.attrs, attribute => {
      if (mappedAttributes[attribute]) {
        element[attribute] = {
          type: toTitleCase(req.params.type),
          value: attributeValueCallback(
            attribute,
            req.params.type,
            mappedAttributes[attribute],
            inputData
          )
        };

        if (attribute === 'temperature' || attribute === 'relativeHumidity') {
          if (addUnitCode) {
            element.metadata = element.metadata || {};
            if (attribute === 'temperature') {
              element.metadata.unitCode = 'CEL';
            } else if (attribute === 'relativeHumidity') {
              element.metadata.unitCode = 'P1';
            }
          }
          if (addObservedAt) {
            element.metadata = element.metadata || {};
            element.metadata.observedAt = moment.utc().format();
          }
        }
      }
    });

    queryResponse.push(element);
  });
  return queryResponse;
}

//
// Formatting function for an NGSI v1 response to a context query.
//
function formatAsV1Response(req, inputData, attributeValueCallback) {
  const mappedAttributes = parseMapping(req.params.mapping);

  const ngsiV1Response = {
    contextResponses: []
  };

  _.forEach(req.body.entities, entity => {
    const entityResponse = {
      contextElement: {
        attributes: [],
        id: entity.id,
        isPattern: 'false',
        type: entity.type
      },
      statusCode: {
        code: '200',
        reasonPhrase: 'OK'
      }
    };

    _.forEach(req.body.attributes, attribute => {
      if (mappedAttributes[attribute]) {
        const element = {
          name: attribute,
          type: toTitleCase(req.params.type),
          value: attributeValueCallback(
            attribute,
            req.params.type,
            mappedAttributes[attribute],
            inputData
          )
        };

        entityResponse.contextElement.attributes.push(element);
      }
    });

    ngsiV1Response.contextResponses.push(entityResponse);
  });

  return ngsiV1Response;
}

//
// Formatting function for an NGSI LD response to a context query.
//
function formatAsLDResponse(req, inputData, attributeValueCallback) {
  const mappedAttributes = parseMapping(req.params.mapping);
  const regex = /:.*/gi;
  const type = req.params.id.replace('urn:ngsi-ld:', '').replace(regex, '');
  const links = parseLinks(req.headers.link);
  const attrs = (req.query.attrs || '').split(',');

  const response = {
    '@context': links.context,
    id: req.params.id,
    type
  };

  _.forEach(attrs, attribute => {
    if (mappedAttributes[attribute]) {
      const value = attributeValueCallback(
        attribute,
        req.params.type,
        mappedAttributes[attribute],
        inputData
      );
      if (req.query.options === 'keyValues') {
        response[attribute] = value;
      } else {
        response[attribute] = {
          type: 'Property',
          value
        };
        if (attribute === 'temperature') {
          response.temperature.unitCode = 'CEL';
          response.temperature.observedAt = moment.utc().format();
        } else if (attribute === 'relativeHumidity') {
          response.relativeHumidity.unitCode = 'P1';
          response.relativeHumidity.observedAt = moment.utc().format();
        }
      }
    }
  });
  return response;
}

module.exports = {
  formatAsV1Response,
  formatAsV2Response,
  formatAsLDResponse,
  toTitleCase,
  parseMapping
};
