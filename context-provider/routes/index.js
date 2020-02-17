const NGSI_VERSION = process.env.NGSI_VERSION || 'ngsi-v2';

const express = require('express');
const router = express.Router();
const monitor = require('../lib/monitoring');
const Store = require('../controllers/' + NGSI_VERSION + '/store');
const History = require('../controllers/history');
const DeviceListener = require('../controllers/iot/command-listener');
const Security = require('../controllers/security');
const _ = require('lodash');

const TRANSPORT = process.env.DUMMY_DEVICES_TRANSPORT || 'HTTP';
const DEVICE_PAYLOAD = process.env.DUMMY_DEVICES_PAYLOAD || 'ultralight';
const GIT_COMMIT = process.env.GIT_COMMIT || 'unknown';
const SECURE_ENDPOINTS = process.env.SECURE_ENDPOINTS || false;
const AUTHZFORCE_ENABLED = process.env.AUTHZFORCE_ENABLED || false;

const NOTIFY_ATTRIBUTES = [
  'refStore',
  'refProduct',
  'refShelf',
  'type',
  'locatedIn',
  'stocks'
];

const NGSI_V2_STORES = [
  {
    href: 'app/store/urn:ngsi-ld:Store:001',
    name: 'Store 1'
  },
  {
    href: 'app/store/urn:ngsi-ld:Store:002',
    name: 'Store 2'
  },
  {
    href: 'app/store/urn:ngsi-ld:Store:003',
    name: 'Store 3'
  },
  {
    href: 'app/store/urn:ngsi-ld:Store:004',
    name: 'Store 4'
  }
];

const NGSI_LD_STORES = [
  {
    href: 'app/store/urn:ngsi-ld:Building:store001',
    name: 'Store 1'
  },
  {
    href: 'app/store/urn:ngsi-ld:Building:store002',
    name: 'Store 2'
  },
  {
    href: 'app/store/urn:ngsi-ld:Building:store003',
    name: 'Store 3'
  },
  {
    href: 'app/store/urn:ngsi-ld:Building:store004',
    name: 'Store 4'
  }
];

// Error handler for async functions
function catchErrors(fn) {
  return (req, res, next) => {
    return fn(req, res, next).catch(next);
  };
}

// If an subscription is recieved emit socket io events
// using the attribute values from the data received to define
// who to send the event too.
function broadcastEvents(req, item, types) {
  const message = req.params.type + ' received';
  _.forEach(types, type => {
    if (item[type]) {
      monitor(item[type], message);
    }
  });
}

// Handles requests to the main page
router.get('/', function(req, res) {
  const securityEnabled = SECURE_ENDPOINTS;
  const stores = NGSI_VERSION === 'ngsi-v2' ? NGSI_V2_STORES : NGSI_LD_STORES;
  res.render('index', {
    title: 'FIWARE Tutorial',
    success: req.flash('success'),
    errors: req.flash('error'),
    info: req.flash('info'),
    securityEnabled,
    stores
  });
});

// Logs users in and out using Keyrock.
router.get('/login', Security.logInCallback);
router.get('/clientCredentials', Security.clientCredentialGrant);
router.get('/implicitGrant', Security.implicitGrant);
router.post('/userCredentials', Security.userCredentialGrant);
router.post('/refreshToken', Security.refreshTokenGrant);
router.get('/authCodeGrant', Security.authCodeGrant);
router.get('/logout', Security.logOut);

router.get('/version', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send({ gitHash: GIT_COMMIT });
});

// Render the monitoring page
router.get('/device/monitor', function(req, res) {
  const traffic = TRANSPORT === 'HTTP' ? 'Northbound Traffic' : 'MQTT Messages';
  const title = 'IoT Devices (' + DEVICE_PAYLOAD + ' over ' + TRANSPORT + ')';
  const securityEnabled = SECURE_ENDPOINTS;
  res.render('device-monitor', {
    title,
    traffic,
    securityEnabled
  });
});

// Access to IoT devices is secured by a Policy Decision Point (PDP).
// LEVEL 1: AUTHENTICATION ONLY -  For most actions, any user is authorized, just ensure the user exists.
// LEVEL 2: BASIC AUTHORIZATION -  Ringing the alarm bell and unlocking the Door are restricted to certain
//                                 users.
// LEVEL 3: XACML AUTHORIZATION -  Ringing the alarm bell and unlocking the Door are restricted via XACML
//                                 rules to certain users at certain times of day.
router.post(
  '/device/command',
  DeviceListener.accessControl,
  DeviceListener.sendCommand
);

// Retrieve Device History from STH-Comet
if (process.env.STH_COMET_SERVICE_URL) {
  router.get(
    '/device/history/:deviceId',
    catchErrors(History.readCometDeviceHistory)
  );
}
// Retrieve Device History from Crate-DB
if (process.env.CRATE_DB_SERVICE_URL) {
  router.get(
    '/device/history/:deviceId',
    catchErrors(History.readCrateDeviceHistory)
  );
}

// Display the app monitor page
router.get('/app/monitor', function(req, res) {
  res.render('monitor', { title: 'Event Monitor' });
});

// Viewing Store information is secured by Keyrock PDP.
// LEVEL 1: AUTHENTICATION ONLY - Users must be logged in to view the store page.
router.get('/app/store/:storeId', Security.authenticate, Store.displayStore);
// Display products for sale
router.get('/app/store/:storeId/till', Store.displayTillInfo);
// Render warehouse notifications
router.get('/app/store/:storeId/warehouse', Store.displayWarehouseInfo);
// Buy something.
router.post('/app/inventory/:inventoryId', catchErrors(Store.buyItem));

// Changing Prices is secured by a Policy Decision Point (PDP).
// LEVEL 2: BASIC AUTHORIZATION - Only managers may change prices - use Keyrock as a PDP
// LEVEL 3: XACML AUTHORIZATION - Only managers may change prices are restricted via XACML
//                                - use Authzforce as a PDP
router.get(
  '/app/price-change',
  function(req, res, next) {
    // Use Advanced Autorization if Authzforce is present.
    return AUTHZFORCE_ENABLED
      ? Security.authorizeAdvancedXACML(req, res, next)
      : Security.authorizeBasicPDP(req, res, next);
  },
  Store.priceChange
);
// Ordering Stock is secured by a Policy Decision Point (PDP).
// LEVEL 2: BASIC AUTHORIZATION - Only managers may order stock - use Keyrock as a PDP
// LEVEL 3: XACML AUTHORIZATION - Only managers may order stock are restricted via XACML
//                                - use Authzforce as a PDP
router.get(
  '/app/order-stock',
  function(req, res, next) {
    // Use Advanced Authorization if Authzforce is present.
    return AUTHZFORCE_ENABLED
      ? Security.authorizeAdvancedXACML(req, res, next)
      : Security.authorizeBasicPDP(req, res, next);
  },
  Store.orderStock
);

// Whenever a subscription is received, display it on the monitor
// and notify any interested parties using Socket.io
router.post('/subscription/:type', (req, res) => {
  monitor('notify', req.params.type + ' received', req.body);
  _.forEach(req.body.data, item => {
    broadcastEvents(req, item, NOTIFY_ATTRIBUTES);
  });
  res.status(204).send();
});

module.exports = router;
