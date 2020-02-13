const express = require('express');
const router = express.Router();
const debug = require('debug')('tutorial:ngsi-ld');
const alternateContext = require('../controllers/ngsi-ld/amending-context');

debug('Loading Compaction/Expansion endpoint');

router.get('/entities/:id', (req, res) => {
  alternateContext.translateRequest(req, res);
});

router.get('/entities', (req, res) => {
  alternateContext.translateRequest(req, res);
});

module.exports = router;
