const request = require('request');
const moment = require('moment');
const _ = require('lodash');
const debug = require('debug')('tutorial:history');

const cometUrl = (process.env.STH_COMET_SERVICE_URL || 'http://localhost:8666/STH/v1') + '/contextEntities/type/';
const crateUrl = process.env.CRATE_DB_SERVICE_URL || 'http://localhost:4200/_sql';

const nsgiLdPrefix = process.env.NGSI_LD_PREFIX !== undefined ? process.env.NGSI_LD_PREFIX : 'urn:ngsi-ld:';

function readCometMotionCount(id, aggMethod) {
    debug('readCometMotionCount');
    return new Promise(function(resolve, reject) {
        const options = {
            method: 'GET',
            url: cometUrl + 'Motion/id/' + nsgiLdPrefix + 'Motion:' + id + '/attributes/count',
            qs: { aggrMethod: aggMethod, aggrPeriod: 'minute' },
            headers: {
                'fiware-servicepath': '/',
                'fiware-service': 'openiot'
            }
        };

        request(options, (error, response, body) => {
            return error ? reject(error) : resolve(JSON.parse(body));
        });
    });
}

function readCrateMotionCount(id, aggMethod) {
    debug('readCrateMotionCount');
    return new Promise(function(resolve, reject) {
        const sqlStatement =
            "SELECT DATE_FORMAT (DATE_TRUNC ('minute', time_index)) AS minute, " +
            aggMethod +
            '(count) AS ' +
            aggMethod +
            " FROM mtopeniot.etmotion WHERE entity_id = 'Motion:" +
            id +
            "' GROUP BY minute ORDER BY minute";
        const options = {
            method: 'POST',
            url: crateUrl,
            headers: { 'Content-Type': 'application/json' },
            body: { stmt: sqlStatement },
            json: true
        };
        request(options, (error, response, body) => {
            return error ? reject(error) : resolve(body);
        });
    });
}

function readCrateLampLuminosity(id, aggMethod) {
    debug('readCrateLampLuminosity');
    return new Promise(function(resolve, reject) {
        const sqlStatement =
            "SELECT DATE_FORMAT (DATE_TRUNC ('minute', time_index)) AS minute, " +
            aggMethod +
            '(luminosity) AS ' +
            aggMethod +
            " FROM mtopeniot.etlamp WHERE entity_id = 'Lamp:" +
            id +
            "' GROUP BY minute ORDER BY minute";
        const options = {
            method: 'POST',
            url: crateUrl,
            headers: { 'Content-Type': 'application/json' },
            body: { stmt: sqlStatement },
            json: true
        };
        request(options, (error, response, body) => {
            return error ? reject(error) : resolve(body);
        });
    });
}

function readCometLampLuminosity(id, aggMethod) {
    debug('readCometLampLuminosity');
    return new Promise(function(resolve, reject) {
        const options = {
            method: 'GET',
            url: cometUrl + 'Lamp/id/' + nsgiLdPrefix + 'Lamp:' + id + '/attributes/luminosity',
            qs: { aggrMethod: aggMethod, aggrPeriod: 'minute' },
            headers: {
                'fiware-servicepath': '/',
                'fiware-service': 'openiot'
            }
        };
        request(options, (error, response, body) => {
            return error ? reject(error) : resolve(JSON.parse(body));
        });
    });
}

function cometToTimeSeries(cometResponse, aggMethod, hexColor) {
    debug('cometToTimeSeries');
    const data = [];
    const labels = [];
    const color = [];

    if (
        cometResponse &&
        cometResponse.contextResponses[0].contextElement.attributes.length > 0 &&
        cometResponse.contextResponses[0].contextElement.attributes[0].values.length > 0
    ) {
        const values = cometResponse.contextResponses[0].contextElement.attributes[0].values[0];
        let date = moment(values._id.origin);

        _.forEach(values.points, (element) => {
            data.push({ t: date.valueOf(), y: element[aggMethod] });
            labels.push(date.format('HH:mm'));
            color.push(hexColor);
            date = date.clone().add(1, 'm');
        });
    }

    return {
        labels,
        data,
        color
    };
}

function crateToTimeSeries(crateResponse, aggMethod, hexColor) {
    debug('crateToTimeSeries');

    const data = [];
    const labels = [];
    const color = [];

    if (crateResponse && crateResponse.rows && crateResponse.rows.length > 0) {
        _.forEach(crateResponse.rows, (element) => {
            const date = moment(element[0]);
            data.push({ t: date, y: element[1] });
            labels.push(date.format('HH:mm'));
            color.push(hexColor);
        });
    }

    return {
        labels,
        data,
        color
    };
}

async function readCometDeviceHistory(req, res) {
    debug('readCometDeviceHistory');
    const id = req.params.deviceId.split(':').pop();

    const cometMotionData = await readCometMotionCount(id, 'sum');
    const cometLampMinData = await readCometLampLuminosity(id, 'min');
    const cometLampMaxData = await readCometLampLuminosity(id, 'max');

    const sumMotionData = cometToTimeSeries(cometMotionData, 'sum', '#45d3dd');
    const minLampData = cometToTimeSeries(cometLampMinData, 'min', '#45d3dd');
    const maxLampData = cometToTimeSeries(cometLampMaxData, 'max', '#45d3dd');

    res.render('history', {
        title: 'IoT Device History',
        id,
        sumMotionData,
        minLampData,
        maxLampData
    });
}

async function readCrateDeviceHistory(req, res) {
    debug('readCrateDeviceHistory');
    const id = req.params.deviceId.split(':').pop();

    const crateMotionData = await readCrateMotionCount(id, 'sum');
    const crateLampMinData = await readCrateLampLuminosity(id, 'min');
    const crateLampMaxData = await readCrateLampLuminosity(id, 'max');

    const sumMotionData = crateToTimeSeries(crateMotionData, 'sum', '#45d3dd');
    const minLampData = crateToTimeSeries(crateLampMinData, 'min', '#45d3dd');
    const maxLampData = crateToTimeSeries(crateLampMaxData, 'max', '#45d3dd');

    res.render('history', {
        title: 'IoT Device History',
        id,
        sumMotionData,
        minLampData,
        maxLampData
    });
}

module.exports = {
    readCometDeviceHistory,
    readCrateDeviceHistory
};
