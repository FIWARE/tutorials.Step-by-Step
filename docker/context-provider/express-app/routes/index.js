const express = require('express');
const router = express.Router();
const monitor = require('../lib/monitoring');
const Store = require('../controllers/store');
const History = require('../controllers/history');
const Ultralight = require('../controllers/ultraLight');
const Security = require('../controllers/security');
const _ = require('lodash');


const TRANSPORT = (process.env.DUMMY_DEVICES_TRANSPORT || 'HTTP');
const GIT_COMMIT = (process.env.GIT_COMMIT || 'unknown');
const SECURE_ENDPOINTS =  process.env.SECURE_ENDPOINTS  || false;

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
router.get('/',  function(req, res) {
	res.render('index', { title: 'FIWARE Tutorial', success: req.flash('success'), errors: req.flash('error')});
});

// Logs users in and out using Keyrock.
router.get('/login', Security.logInCallback);
router.get('/clientCredentials', Security.clientCredentialGrant);
router.get('/implicitGrant', Security.implicitGrant);
router.post('/userCredentials', Security.userCredentialGrant);
router.get('/authCodeGrant', Security.authCodeGrant);
router.get('/logout', Security.logOut);


router.get('/version', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.send({ gitHash: GIT_COMMIT });
});

// Render the monitoring page
router.get('/device/monitor', Ultralight.initDevices, function(req, res) {
	const traffic = (TRANSPORT === 'HTTP' ? 'Northbound Traffic' : 'MQTT Messages');
	res.render('device-monitor', { title: 'UltraLight IoT Devices', traffic});
});

router.post('/device/command', Ultralight.initDevices, Ultralight.sendCommand);

// Retrieve Device History from STH-Comet
if (process.env.STH_COMET_SERVICE_URL) {
	router.get('/device/history/:deviceId', catchErrors(History.readCometDeviceHistory));
}
// Retrieve Device History from Crate-DB
if (process.env.CRATE_DB_SERVICE_URL ){
	router.get('/device/history/:deviceId', catchErrors(History.readCrateDeviceHistory));
}

router.get('/app/monitor', function(req, res) {
	res.render('monitor', { title: 'Event Monitor' });
});

// Render a store with products and warehouse notifications
router.get('/app/store/:storeId', Store.displayStore);
router.get('/app/store/:storeId/till', Store.displayTillInfo);
router.get('/app/store/:storeId/warehouse', Store.displayWarehouseInfo);
// Buy something.
router.post('/app/inventory/:inventoryId', catchErrors(Store.buyItem));


router.get('/price-change', Store.priceChange);
router.get('/order-stock', Store.orderStock);


// Whenever a subscription is received, display it on the monitor
// and notify any interested parties using Socket.io
router.post('/subscription/:type', (req, res) => {
	monitor('notify', req.params.type + ' received', req, req.body);
	_.forEach(req.body.data, item => {
		broadcastEvents(req, item, ['refStore', 'refProduct', 'refShelf', 'type']);
	});
	res.status(204).send();
});



module.exports = router;
