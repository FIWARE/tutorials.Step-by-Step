//
// This controller is an example of accessing and amending the Context Data
// programmatically. The code uses a nodejs library to envelop all the
// necessary HTTP calls and responds with success or failure.
//

// Initialization - first require the NGSI v2 npm library and set
// the client instance
const NgsiV2 = require('ngsi_v2');
const defaultClient = NgsiV2.ApiClient.instance;
const debug = require('debug')('tutorial:ngsi-v2');
const monitor = require('../../lib/monitoring');

debug('Store is retrieved using NGSI-v2');

// The basePath must be set - this is the location of the Orion
// context broker. It is best to do this with an environment
// variable (with a fallback if necessary)
defaultClient.basePath =
  process.env.CONTEXT_BROKER || 'http://localhost:1026/v2';

function setAuthHeaders(req) {
  const headers = {};
  if (req.session.access_token) {
    // If the system has been secured and we have logged in,
    // add the access token to the request to the PEP Proxy
    headers['X-Auth-Token'] = req.session.access_token;
  }
  return headers;
}

function mapTileUrl(zoom, location) {
  const tilesPerRow = Math.pow(2, zoom);
  let longitude = location.coordinates[0];
  let latitude = location.coordinates[1];

  longitude /= 360;
  longitude += 0.5;
  latitude =
    0.5 -
    Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) /
      Math.PI /
      2.0;

  return (
    'https://a.tile.openstreetmap.org/' +
    zoom +
    '/' +
    Math.floor(longitude * tilesPerRow) +
    '/' +
    Math.floor(latitude * tilesPerRow) +
    '.png'
  );
}

// This function receives the details of a store from the context
//
// It is effectively processing the following cUrl command:
//   curl -X GET \
//     'http://{{orion}}/v2/entities/?type=Store&options=keyValues'
//
function displayStore(req, res) {
  debug('displayStore');
  // If the user is not authorized, display the main page.
  if (!res.locals.authorized) {
    req.flash('error', 'Access Denied');
    return res.redirect('/');
  }
  monitor('NGSI', 'retrieveEntity ' + req.params.storeId);
  return retrieveEntity(
    req.params.storeId,
    { options: 'keyValues', type: 'Store' },
    setAuthHeaders(req)
  )
    .then(store => {
      // If a store has been found display it on screen
      store.mapUrl = mapTileUrl(15, store.location);
      return res.render('store', { title: store.name, store, ngsi: 'ngsi-v2' });
    })
    .catch(error => {
      debug(error);
      // If no store has been found, display an error screen
      return res.render('store-error', {
        title: 'Error',
        error,
        ngsi: 'ngsi-v2'
      });
    });
}

// This function receives all products and a set of inventory items
//  from the context
//
// It is effectively processing the following cUrl commands:
//   curl -X GET \
//     'http://{{orion}}/v2/entities/?type=Product&options=keyValues'
//   curl -X GET \
//     'http://{{orion}}/v2/entities/?type=InventoryItem&options=keyValues&q=refStore==<entity-id>'
//
function displayTillInfo(req, res) {
  debug('displayTillInfo');
  monitor('NGSI', 'listEntities type=Product');
  monitor(
    'NGSI',
    'listEntities type=InventoryItem refStore=' + req.params.storeId
  );
  Promise.all([
    listEntities(
      {
        options: 'keyValues',
        type: 'Product'
      },
      setAuthHeaders(req)
    ),
    listEntities(
      {
        q: 'refStore==' + req.params.storeId,
        options: 'keyValues',
        type: 'InventoryItem'
      },
      setAuthHeaders(req)
    )
  ])
    .then(values => {
      // If values have been found display it on screen
      return res.render('till', {
        products: values[0],
        inventory: values[1],
        ngsiLd: false,
        storeId: req.params.storeId
      });
    })
    .catch(error => {
      debug(error);
      // An error occurred, return with no results
      return res.render('till', {
        products: {},
        inventory: {},
        ngsiLd: false,
        storeId: req.params.storeId
      });
    });
}

// This asynchronous function retrieves and updates an inventory item from the context
//
// It is effectively processing the following cUrl commands:
//
//   curl -X GET \
//     'http://{{orion}}/v2/entities/<entity-id>?type=InventoryItem&options=keyValues'
//   curl -X PATCH \
//     'http://{{orion}}/v2/entities/urn:ngsi-ld:Product:001/attrs' \
//     -H 'Content-Type: application/json' \
//     -d ' {
//        "shelfCount":{"type":"Integer", "value": 89}
//     }'
//
// There is no error handling on this function, it has been
// left to a function on the router.
async function buyItem(req, res) {
  debug('buyItem');
  monitor('NGSI', 'retrieveEntity ' + req.params.inventoryId);
  const inventory = await retrieveEntity(
    req.params.inventoryId,
    {
      options: 'keyValues',
      type: 'InventoryItem'
    },
    setAuthHeaders(req)
  );
  const count = inventory.shelfCount - 1;

  monitor('NGSI', 'updateExistingEntityAttributes ' + req.params.inventoryId, {
    shelfCount: { type: 'Integer', value: count }
  });
  await updateExistingEntityAttributes(
    req.params.inventoryId,
    { shelfCount: { type: 'Integer', value: count } },
    {
      type: 'InventoryItem'
    },
    setAuthHeaders(req)
  );
  res.redirect(`/app/store/${inventory.refStore}/till`);
}

// This function renders information for the warehouse of a store
// It is used to display alerts based on any low stock subscriptions received
//
function displayWarehouseInfo(req, res) {
  debug('displayWarehouseInfo');
  res.render('warehouse', { id: req.params.storeId });
}

function priceChange(req, res) {
  debug('priceChange');
  // If the user is not authorized, display the main page.
  if (!res.locals.authorized) {
    req.flash('error', 'Access Denied');
    return res.redirect('/');
  }
  // Render the price page (Managers only)
  return res.render('price-change', { title: 'Price Change' });
}

function orderStock(req, res) {
  debug('orderStock');
  // If the user is not authorized, display the main page.
  if (!res.locals.authorized) {
    req.flash('error', 'Access Denied');
    return res.redirect('/');
  }
  // Render the stock taking page (Managers only)
  return res.render('order-stock', { title: 'Order Stock' });
}

// This is a promise to make an HTTP PATCH request to the /v2/entities/<entity-id>/attr end point
function updateExistingEntityAttributes(entityId, body, opts, headers = {}) {
  return new Promise((resolve, reject) => {
    defaultClient.defaultHeaders = headers;
    const apiInstance = new NgsiV2.EntitiesApi();
    apiInstance.updateExistingEntityAttributes(
      entityId,
      body,
      opts,
      (error, data, response) => {
        debug('updateExistingEntityAttributes returns: ' + response.statusCode);
        return error ? reject(error) : resolve(data);
      }
    );
  });
}

// This is a promise to make an HTTP GET request to the /v2/entities/<entity-id> end point
function retrieveEntity(entityId, opts, headers = {}) {
  return new Promise((resolve, reject) => {
    defaultClient.defaultHeaders = headers;
    const apiInstance = new NgsiV2.EntitiesApi();
    apiInstance.retrieveEntity(entityId, opts, (error, data, response) => {
      debug('retrieveEntity returns: ' + response.statusCode);
      return error ? reject(error) : resolve(data);
    });
  });
}

// This is a promise to make an HTTP GET request to the /v2/entities end point
function listEntities(opts, headers = {}) {
  return new Promise((resolve, reject) => {
    defaultClient.defaultHeaders = headers;
    const apiInstance = new NgsiV2.EntitiesApi();
    apiInstance.listEntities(opts, (error, data, response) => {
      debug('listEntities returns: ' + response.statusCode);
      return error ? reject(error) : resolve(data);
    });
  });
}

module.exports = {
  buyItem,
  displayStore,
  displayTillInfo,
  displayWarehouseInfo,
  priceChange,
  orderStock
};
