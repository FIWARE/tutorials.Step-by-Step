const _ = require("lodash");

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

  _.forEach(input.split(","), element => {
    if (element.includes(":")) {
      const splitElement = element.split(":");
      mappedAttributes[splitElement[0]] = splitElement[1];
    } else {
      mappedAttributes[element] = element;
    }
  });

  return mappedAttributes;
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
        isPattern: "false",
        type: entity.type
      },
      statusCode: {
        code: "200",
        reasonPhrase: "OK"
      }
    };

    _.forEach(req.body.attributes, attribute => {
      if (mappedAttributes[attribute]) {
        entityResponse.contextElement.attributes.push({
          name: attribute,
          type: toTitleCase(req.params.type),
          value: attributeValueCallback(
            attribute,
            req.params.type,
            mappedAttributes[attribute],
            inputData
          )
        });
      }
    });

    ngsiV1Response.contextResponses.push(entityResponse);
  });

  return ngsiV1Response;
}

module.exports = {
  formatAsV1Response,
  toTitleCase
};
