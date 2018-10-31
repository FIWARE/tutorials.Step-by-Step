const express = require("express");
const router = express.Router();
const monitor = require("../lib/monitoring");
const Store = require("../controllers/store");
const History = require("../controllers/history");
const Ultralight = require("../controllers/ultraLight");
const Security = require("../controllers/security");
const _ = require("lodash");

const TRANSPORT = process.env.DUMMY_DEVICES_TRANSPORT || "HTTP";
const GIT_COMMIT = process.env.GIT_COMMIT || "unknown";
const SECURE_ENDPOINTS = process.env.SECURE_ENDPOINTS || false;

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
  const message = req.params.type + " received";
  _.forEach(types, type => {
    if (item[type]) {
      monitor(item[type], message);
    }
  });
}

// Handles requests to the main page
router.get("/", function(req, res) {
  const securityEnabled = SECURE_ENDPOINTS;
  res.render("index", {
    title: "FIWARE Tutorial",
    success: req.flash("success"),
    errors: req.flash("error"),
    info: req.flash("info"),
    securityEnabled
  });
});

// Logs users in and out using Keyrock.
router.get("/login", Security.logInCallback);
router.get("/clientCredentials", Security.clientCredentialGrant);
router.get("/implicitGrant", Security.implicitGrant);
router.post("/userCredentials", Security.userCredentialGrant);
router.post("/refreshToken", Security.refreshTokenGrant);
router.get("/authCodeGrant", Security.authCodeGrant);
router.get("/logout", Security.logOut);

router.get("/version", function(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.send({ gitHash: GIT_COMMIT });
});

// Render the monitoring page
router.get("/device/monitor", Ultralight.initDevices, function(req, res) {
  const traffic = TRANSPORT === "HTTP" ? "Northbound Traffic" : "MQTT Messages";
  const securityEnabled = SECURE_ENDPOINTS;
  res.render("device-monitor", {
    title: "UltraLight IoT Devices",
    traffic,
    securityEnabled
  });
});

// This endpoint is secured by Keyrock PDP.
// LEVEL 1: AUTHENTICATION ONLY -  For most actions, any user is authorized, just ensure the user exists.
// LEVEL 2: BASIC AUTHORIZATION -  Ringing the alarm bell and unlocking the Door are restricted to certain
//                                 users.
router.post(
  "/device/command",
  Ultralight.accessControl,
  Ultralight.initDevices,
  Ultralight.sendCommand
);

// Retrieve Device History from STH-Comet
if (process.env.STH_COMET_SERVICE_URL) {
  router.get(
    "/device/history/:deviceId",
    catchErrors(History.readCometDeviceHistory)
  );
}
// Retrieve Device History from Crate-DB
if (process.env.CRATE_DB_SERVICE_URL) {
  router.get(
    "/device/history/:deviceId",
    catchErrors(History.readCrateDeviceHistory)
  );
}

// Display the app monitor page
router.get("/app/monitor", function(req, res) {
  res.render("monitor", { title: "Event Monitor" });
});

// This endpoint is secured by Keyrock PDP.
// LEVEL 1: AUTHENTICATION ONLY - Users must be logged in to view the store page.
router.get(
  "/app/store/:storeId",
  Security.pdpAuthentication,
  Store.displayStore
);
// Display products for sale
router.get("/app/store/:storeId/till", Store.displayTillInfo);
// Render warehouse notifications
router.get("/app/store/:storeId/warehouse", Store.displayWarehouseInfo);
// Buy something.
router.post("/app/inventory/:inventoryId", catchErrors(Store.buyItem));

// This endpoint is secured by Keyrock PDP.
// LEVEL 2: BASIC AUTHORIZATION - Only managers may change prices.
router.get(
  "/app/price-change",
  Security.pdpBasicAuthorization,
  Store.priceChange
);
// This endpoint is secured by Keyrock PDP.
// LEVEL 2: BASIC AUTHORIZATION - Only managers may order stock.
router.get(
  "/app/order-stock",
  Security.pdpBasicAuthorization,
  Store.orderStock
);

// Whenever a subscription is received, display it on the monitor
// and notify any interested parties using Socket.io
router.post("/subscription/:type", (req, res) => {
  monitor("notify", req.params.type + " received", req, req.body);
  _.forEach(req.body.data, item => {
    broadcastEvents(req, item, ["refStore", "refProduct", "refShelf", "type"]);
  });
  res.status(204).send();
});

module.exports = router;
