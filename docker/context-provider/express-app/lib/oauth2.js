const querystring = require('querystring');

const https = require('https');

const http = require('http');

const URL = require('url');

exports.OAuth2 = function(
  clientId,
  clientSecret,
  baseSite,
  baseIPAddress,
  authorizePath,
  accessTokenPath,
  callbackURL,
  customHeaders
) {
  this._clientId = clientId;
  this._clientSecret = clientSecret;
  this._baseSite = baseSite;
  this._baseIPAddress = baseIPAddress || baseSite;
  this._authorizeUrl = authorizePath || '/oauth/authorize';
  this._accessTokenUrl = accessTokenPath || '/oauth/access_token';
  this._callbackURL = callbackURL;
  this._accessTokenName = 'access_token';
  this._authMethod = 'Basic';
  this._customHeaders = customHeaders || {};
};

// This 'hack' method is required for sites that don't use
// 'access_token' as the name of the access token (for requests).
// ( http://tools.ietf.org/html/draft-ietf-oauth-v2-16#section-7 )
// it isn't clear what the correct value should be atm, so allowing
// for specific (temporary?) override for now.
exports.OAuth2.prototype.setAccessTokenName = function(name) {
  this._accessTokenName = name;
};

exports.OAuth2.prototype._getAccessTokenUrl = function() {
  return this._baseIPAddress + this._accessTokenUrl;
};

// Build the authorization header. In particular, build the part after the colon.
// e.g. Authorization: Bearer <token>  # Build "Bearer <token>"
exports.OAuth2.prototype.buildAuthHeader = function() {
  const key = this._clientId + ':' + this._clientSecret;
  const base64 = new Buffer(key).toString('base64');
  return this._authMethod + ' ' + base64;
};

exports.OAuth2.prototype._request = function(
  method,
  url,
  headers,
  postBody,
  accessToken,
  callback
) {
  let httpLibrary = https;
  const parsedUrl = URL.parse(url, true);
  if (parsedUrl.protocol === 'https:' && !parsedUrl.port) {
    parsedUrl.port = 443;
  }

  // As this is OAUth2, we *assume* https unless told explicitly otherwise.
  if (parsedUrl.protocol !== 'https:') {
    httpLibrary = http;
  }

  const realHeaders = {};
  for (const key in this._customHeaders) {
    realHeaders[key] = this._customHeaders[key];
  }
  if (headers) {
    for (const key in headers) {
      realHeaders[key] = headers[key];
    }
  }
  realHeaders.Host = parsedUrl.host;

  //realHeaders['Content-Length']= postBody ? Buffer.byteLength(postBody) : 0;
  if (accessToken && !('Authorization' in realHeaders)) {
    if (!parsedUrl.query) {
      parsedUrl.query = {};
    }
    parsedUrl.query[this._accessTokenName] = accessToken;
  }

  let queryStr = querystring.stringify(parsedUrl.query);
  if (queryStr) {
    queryStr = '?' + queryStr;
  }
  const options = {
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + queryStr,
    method,
    headers: realHeaders,
  };

  this._executeRequest(httpLibrary, options, postBody, callback);
};

exports.OAuth2.prototype._executeRequest = function(
  httpLibrary,
  options,
  postBody,
  callback
) {
  // Some hosts *cough* google appear to close the connection early / send no content-length header
  // allow this behaviour.
  const allowEarlyClose =
    options.host && options.host.match('.*google(apis)?.com$');
  let callbackCalled = false;
  function passBackControl(response, result, err) {
    if (!callbackCalled) {
      callbackCalled = true;
      if (
        response.statusCode !== 200 &&
        response.statusCode !== 201 &&
        response.statusCode !== 301 &&
        response.statusCode !== 302
      ) {
        callback({ statusCode: response.statusCode, data: result });
      } else {
        callback(err, result, response);
      }
    }
  }

  let result = '';

  const request = httpLibrary.request(options, function(response) {
    response.on('data', function(chunk) {
      result += chunk;
    });
    response.on('close', function(err) {
      if (allowEarlyClose) {
        passBackControl(response, result, err);
      }
    });
    response.addListener('end', function() {
      passBackControl(response, result);
    });
  });
  request.on('error', function(e) {
    callbackCalled = true;
    callback(e);
  });

  if (options.method === 'POST' && postBody) {
    request.write(postBody);
  }
  request.end();
};

exports.OAuth2.prototype.getAuthorizeUrl = function(responseType) {
  responseType = responseType || 'code';

  return (
    this._baseSite +
    this._authorizeUrl +
    '?response_type=' +
    responseType +
    '&client_id=' +
    this._clientId +
    '&state=xyz&redirect_uri=' +
    this._callbackURL
  );
};

function getResults(data) {
  let results;
  try {
    results = JSON.parse(data);
  } catch (e) {
    results = querystring.parse(data);
  }
  return results;
}

exports.OAuth2.prototype.getOAuthAccessToken = function(code) {
  const that = this;

  return new Promise((resolve, reject) => {
    const postData =
      'grant_type=authorization_code&code=' +
      code +
      '&redirect_uri=' +
      that._callbackURL;

    const postHeaders = {
      Authorization: that.buildAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
    };

    that._request(
      'POST',
      that._getAccessTokenUrl(),
      postHeaders,
      postData,
      null,
      (error, data) => {
        return error ? reject(error) : resolve(getResults(data));
      }
    );
  });
};

exports.OAuth2.prototype.getOAuthClientCredentials = function() {
  const that = this;
  return new Promise((resolve, reject) => {
    const postData = 'grant_type=client_credentials';
    const postHeaders = {
      Authorization: that.buildAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
    };

    that._request(
      'POST',
      that._getAccessTokenUrl(),
      postHeaders,
      postData,
      null,
      (error, data) => {
        return error ? reject(error) : resolve(getResults(data));
      }
    );
  });
};

exports.OAuth2.prototype.getOAuthPasswordCredentials = function(
  username,
  password
) {
  const that = this;
  return new Promise((resolve, reject) => {
    const postData =
      'grant_type=password&username=' + username + '&password=' + password;
    const postHeaders = {
      Authorization: that.buildAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
    };

    that._request(
      'POST',
      that._getAccessTokenUrl(),
      postHeaders,
      postData,
      null,
      (error, data) => {
        return error ? reject(error) : resolve(getResults(data));
      }
    );
  });
};

exports.OAuth2.prototype.getOAuthRefreshToken = function(refreshToken) {
  const that = this;

  return new Promise((resolve, reject) => {
    const postData = 'grant_type=refresh_token&refresh_token=' + refreshToken;

    const postHeaders = {
      Authorization: that.buildAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
    };

    that._request(
      'POST',
      that._getAccessTokenUrl(),
      postHeaders,
      postData,
      null,
      (error, data) => {
        return error ? reject(error) : resolve(getResults(data));
      }
    );
  });
};

exports.OAuth2.prototype.get = function(url, accessToken) {
  const that = this;
  return new Promise((resolve, reject) => {
    that._request('GET', url, {}, '', accessToken, (error, data) => {
      return error ? reject(error) : resolve(data);
    });
  });
};
