#!/usr/bin/env node

const http = require('http');
const port = process.env.WEB_APP_PORT || '3000';
const path = process.env.HEALTHCHECK_PATH || '/version';
const httpCode = process.env.HEALTHCHECK_CODE || 200;

const options = {
    host: 'localhost',
    port,
    timeout: 2000,
    method: 'GET',
    path
};

const request = http.request(options, (result) => {
    // eslint-disable-next-line no-console
    console.info(`Performed health check, result ${result.statusCode}`);
    if (result.statusCode === httpCode) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

request.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while performing health check, error: ${err}`);
    process.exit(1);
});

request.end();
