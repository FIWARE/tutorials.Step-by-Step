const debug = require('debug')('tutorial:ngsi-v2-convert');
const request = require('request');

const basePath = process.env.CONTEXT_BROKER || 'http://localhost:1026/ngsi-ld/v1';
const dataModelContext = 'https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld';
const jsonLdHeader = 'application/ld+json';

/* eslint-disable no-unused-vars */

function convertAttributeToLD(attr) {
    function orBlank(value) {
        return isNaN(value) ? { '@type': 'Intangible', '@value': null } : value;
    }

    function isFloat(value) {
        return !isNaN(value) && value.toString().indexOf('.') !== -1;
    }

    const obj = { type: 'Property', value: attr.value };
    switch (attr.type) {
        case 'Text':
            break;
        case 'Property':
            break;
        case 'Relationship':
            obj.type = 'Relationship';
            obj.object = attr.value;
            delete obj.value;
            break;
        case 'Number':
            if (isFloat(attr.value)) {
                obj.value = orBlank(Number.parseFloat(attr.value));
            } else {
                obj.value = orBlank(Number.parseInt(attr.value));
            }
            break;
        case 'Integer':
            obj.value = orBlank(Number.parseInt(attr.value));
            break;
        case 'Float':
            obj.value = orBlank(Number.parseFloat(attr.value));
            break;
        case 'Boolean':
            obj.value = !!attr.value;
            break;
        default:
            obj.value = { '@type': attr.type, '@value': attr.value };
    }

    if (obj.value === null){
        obj.value = { '@type': 'Intangible', '@value': null };
    }

    if (attr.metadata) {
        Object.keys(attr.metadata).forEach(function (key) {
            switch (key) {
                case 'TimeInstant':
                    obj.observedAt = attr.metadata[key].value;
                    break;
                case 'observedAt':
                    obj[key] = attr.metadata[key].value;
                    break;
                case 'unitCode':
                    obj[key] = attr.metadata[key].value;
                    break;
                default:
                    obj[key] = convertAttributeToLD(attr.metadata[key]);
            }
        });
    }

    return obj;
}

function convertEntityToLD(json) {
    const obj = { '@context': dataModelContext };
    Object.keys(json).forEach(function (key) {
        switch (key) {
            case 'id':
                obj[key] = json[key];
                if (!obj.id.startsWith('urn:ngsi-ld:')) {
                    obj.id = 'urn:ngsi-ld:' + obj.id;
                }
                break;
            case 'type':
                obj[key] = json[key];
                break;
            default:
                obj[key] = convertAttributeToLD(json[key]);
        }
    });

    return obj;
}

// This is a promise to make an HTTP PATCH request to the /v2/entities end point
// for each individual device.
function upsertDeviceEntityAsLD(device) {
    return new Promise((resolve, reject) => {
        const json = convertEntityToLD(device);
        delete json['@context']; // Not required for Linked Data Upsert.

        const options = {
            url: basePath + '/entityOperations/upsert/?options=update',
            method: 'POST',
            json: [json],
            headers: {
                'Content-Type': 'application/json',
                Link:
                    '<' + dataModelContext + '>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
            }
        };

        debug(JSON.stringify(options));
        request(options, (error, response, body) => {
            return error ? reject(error) : resolve();
        });
    });
}

// This is a promise to make an HTTP PATCH request to the /v2/entities end point
// for each individual device reading.
function upsertLinkedAttributeDataAsLD(device, refid, attrib) {
    return new Promise((resolve, reject) => {
        const payload = {};
        const headers = {};

        headers['Content-Type'] = jsonLdHeader;

        payload[attrib] = {
            type: device[attrib].type,
            value: device[attrib].value,
            metadata: {
                providedBy: {
                    type: 'Relationship',
                    value: device.id
                }
            }
        };

        if (device.supportedUnits) {
            payload[attrib].metadata.unitCode = {
                type: 'Text',
                value: device.supportedUnits.value
            };
        }
        if (device[attrib].metadata && device[attrib].metadata.TimeInstant) {
            payload[attrib].metadata.observedAt = device[attrib].metadata.TimeInstant;
        }

        const options = {
            method: 'POST',
            url: basePath + '/entities/' + device[refid].value + '/attrs',
            headers,
            body: convertEntityToLD(payload),
            json: true
        };

        debug(JSON.stringify(options));
        request(options, (error, response, body) => {
            return error ? reject(error) : resolve();
        });
    });
}

// Function to create NGSI-LD device entities
// when receiving an NGSI-v2 subscription.
function duplicateDevices(req, res) {
    async function copyEntityData(device, index) {
        await upsertDeviceEntityAsLD(device);
    }
    req.body.data.forEach(copyEntityData);
    res.status(204).send();
}

// Function to update NGSI-LD device entities
// and the linked data within the NGSI-LD building entities
// when receiving an NGSI-v2 subscription.
function shadowDeviceMeasures(req, res) {
    const attrib = req.params.attrib;

    async function copyAttributeData(device, index) {
        await upsertDeviceEntityAsLD(device);
        if (device[attrib]) {
            await upsertLinkedAttributeDataAsLD(device, 'controlledAsset', attrib);
        }
    }

    req.body.data.forEach(copyAttributeData);
    res.status(204).send();
}

module.exports = {
    duplicateDevices,
    shadowDeviceMeasures
};
