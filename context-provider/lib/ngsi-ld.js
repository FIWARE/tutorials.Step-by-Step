////

/* eslint-disable no-unused-vars */

const request = require('request-promise');

// The basePath must be set - this is the location of the Orion
// context broker. It is best to do this with an environment
// variable (with a fallback if necessary)
const BASE_PATH =
  process.env.CONTEXT_BROKER || 'http://localhost:1026/ngsi-ld/v1';

const JSON_LD_HEADER = 'application/ld+json';

function setHeaders(accessToken, link, contentType) {
  const headers = {};
  if (accessToken) {
    // If the system has been secured and we have logged in,
    // add the access token to the request to the PEP Proxy
    headers['X-Auth-Token'] = accessToken;
  }
  if (link) {
    headers.Link = link;
  }
  if (contentType) {
    headers['Content-Type'] = contentType || JSON_LD_HEADER;
  }
  return headers;
}

// This is a promise to make an HTTP POST request to the
// /ngsi-ld/v1/entities/<entity-id>/attrs end point
function createAttribute(entityId, body, headers = {}) {
  return request({
    url: BASE_PATH + '/entities/' + entityId + '/attrs',
    method: 'POST',
    body,
    headers,
    json: true,
  });
}

// This is a promise to make an HTTP POST request to the
// /ngsi-ld/v1/entities/<entity-id>/attrs end point
function readAttribute(entityId, headers = {}) {
  /*	
  return request({
    url: BASE_PATH + '/entities/' + entityId + '/attrs',
    method: 'POST',
    body,
    headers,
    json: true,
  }); */
}

// This is a promise to make an HTTP PATCH request to the
// /ngsi-ld/v1/entities/<entity-id>/attr end point
function updateAttribute(entityId, body, headers = {}) {
  return request({
    url: BASE_PATH + '/entities/' + entityId + '/attrs',
    method: 'PATCH',
    body,
    headers,
    json: true,
  });
}

// This is a promise to make an HTTP DELETE request to the
// /ngsi-ld/v1/entities/<entity-id>/attrs end point
function deleteAttribute(entityId, headers = {}) {
  return request({
    url: BASE_PATH + '/entities/' + entityId + '/attrs',
    method: 'DELETE',
    headers,
    json: true,
  });
}

// This is a promise to make an HTTP POST request to the
// /ngsi-ld/v1/entities end point
function createEntity(entityId, type, body, headers = {}) {
  /*  return request({
    url: BASE_PATH + '/entities/' + entityId + '/attrs',
    method: 'POST',
    body,
    headers,
    json: true,
  });*/
}

// This is a promise to make an HTTP PATCH request to the
// /ngsi-ld/v1/entities/<entity-id>/attr end point
function updateEntity(entityId, body, headers = {}) {
  /* return request({
    url: BASE_PATH + '/entities/' + entityId + '/attrs',
    method: 'PATCH',
    body,
    headers,
    json: true,
  });*/
}

// This is a promise to make an HTTP DELETE request to the
// /ngsi-ld/v1/entities/<entity-id> end point
function deleteEntity(entityId, headers = {}) {
  return request({
    url: BASE_PATH + '/entities/' + entityId,
    method: 'DELETE',
    headers,
    json: true,
  });
}

// This is a promise to make an HTTP GET request to the
// /ngsi-ld/v1/entities/<entity-id> end point
function readEntity(entityId, opts, headers = {}) {
  return request({
    qs: opts,
    url: BASE_PATH + '/entities/' + entityId,
    method: 'GET',
    headers,
    json: true,
  });
}

// This is a promise to make an HTTP GET request to the
// /ngsi-ld/v1/entities/ end point
function listEntities(opts, headers = {}) {
  return request({
    qs: opts,
    url: BASE_PATH + '/entities',
    method: 'GET',
    headers,
    json: true,
  });
}

module.exports = {
  createAttribute,
  readAttribute,
  updateAttribute,
  deleteAttribute,
  createEntity,
  readEntity,
  updateEntity,
  deleteEntity,
  listEntities,
  setHeaders,
};
