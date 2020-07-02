const Authzforce = require('../lib/azf').Authzforce;
const OAuth2 = require('../lib/oauth2').OAuth2;
const debug = require('debug')('tutorial:security');
const jwt = require('jsonwebtoken');
const keyrockPort = process.env.KEYROCK_PORT || '3005';
const keyrockUrl =
  (process.env.KEYROCK_URL || 'http://localhost') + ':' + keyrockPort;
const keyrockIPAddress =
  (process.env.KEYROCK_IP_ADDRESS || 'http://127.0.0.1') + ':' + keyrockPort;
const clientId =
  process.env.KEYROCK_CLIENT_ID || 'tutorial-dckr-site-0000-xpresswebapp';
const clientSecret =
  process.env.KEYROCK_CLIENT_SECRET || 'tutorial-dkcr-site-0000-clientsecret';
const jwtSecret = process.env.KEYROCK_JWT_SECRET || '123456789';
const callbackURL = process.env.CALLBACK_URL || 'http://localhost:3000/login';
const SECURE_ENDPOINTS = process.env.SECURE_ENDPOINTS || false;

// Creates oauth library object with the config data
const oa = new OAuth2(
  clientId,
  clientSecret,
  keyrockUrl,
  keyrockIPAddress,
  '/oauth2/authorize',
  '/oauth2/token',
  callbackURL
);

// Creates an authzforce library object with the config data
const azf = new Authzforce(clientId);

function logAccessToken(req, accessToken, refreshToken, idToken, store = true) {
  if (accessToken) {
    debug('<strong>Access Token</strong> received ' + accessToken);
    req.flash('info', 'access_token: <code>' + accessToken + '</code>');
    req.session.access_token = store ? accessToken : undefined;
  }

  if (refreshToken) {
    debug('<strong>Refresh Token</strong> received ' + refreshToken);
    req.flash('info', 'refresh_token:  <code>' + refreshToken + '</code>');
    req.session.refresh_token = store ? refreshToken : undefined;
  }

  if (idToken) {
    debug('<strong>Id Token</strong> received ' + idToken);
    req.flash('info', 'id_token:  <code>' + idToken + '</code>');
    req.session.id_token = store ? idToken : undefined;
  }
}

function logUser(req, user, message) {
  debug('The user is ' + user.username);
  req.flash('success', user.username + ' ' + message);
  req.session.username = user.username;
}

function getUserFromAccessToken(req, accessToken) {
  debug('getUserFromAccessToken');
  return new Promise(function(resolve, reject) {
    // Using the access token asks the IDM for the user info
    oa.get(keyrockIPAddress + '/user', accessToken)
      .then(response => {
        const user = JSON.parse(response);
        return resolve(user);
      })
      .catch(error => {
        debug(error);
        req.flash('error', 'User not found');
        return reject(error);
      });
  });
}

function getUserFromIdToken(req, idToken) {
  debug('getUserFromIdToken');
  return new Promise(function(resolve, reject) {
    jwt.verify(idToken, jwtSecret, function(error, decoded) {
      if (error) {
        return reject(error);
      }
      return resolve(decoded);
    });
  });
}

// Handles callback responses from Keyrock with the access code or token
function logInCallback(req, res) {
  debug('logInCallback');
  debug(req.query);
  if (req.query.state === 'oic') {
    if (req.query.token && req.query.code && req.query.id_token) {
      // If we have received an access_token, id_token and a code, this is a Hybrid Grant
      hybridOICGrantCallback(req, res);
    } else if (req.query.id_token) {
      // If we have received an access_token, this is an Implicit Grant
      implicitOICGrantCallback(req, res);
    } else if (req.query.code) {
      // If no access_token is received, this is an authCode Grant
      authCodeOICGrantCallback(req, res);
    }
  } else if (req.query.state === 'oauth2') {
    if (req.query.token && req.query.code) {
      // If we have received an access_token and a code, this is a Hybrid Grant
      hybridGrantCallback(req, res);
    } else if (req.query.token) {
      // If we have received an access_token, this is an Implicit Grant
      implicitGrantCallback(req, res);
    } else if (req.query.code) {
      // If no access_token is received, this is an authCode Grant
      authCodeGrantCallback(req, res);
    }
  }
}

// Redirection to Keyrock for an Implicit Token Grant
function implicitGrant(req, res) {
  debug('implicitGrant');
  const path = oa.getAuthorizeUrl('token', null, 'oauth2');
  return res.redirect(path);
}
// Response from Keyrock for an Implicit Token Grant
function implicitGrantCallback(req, res) {
  debug('implicitGrantCallback');
  // With the implicit grant, an access token is included in the response
  logAccessToken(req, req.query.token, null, null);

  return getUserFromAccessToken(req, req.query.token)
    .then(user => {
      logUser(req, user, 'logged in with <strong>Implicit Grant</strong>');
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

// Authorization Code Grant

// Redirection to Keyrock for an Authorization Code Grant
function authCodeGrant(req, res) {
  debug('authCodeGrant');
  const path = oa.getAuthorizeUrl('code', null, 'oauth2');
  return res.redirect(path);
}
// Response from Keyrock for an Authorization Code Grant
function authCodeGrantCallback(req, res) {
  debug('authCodeGrantCallback');
  // With the authcode grant, a code is included in the response
  // We need to make a second request to obtain an access token
  debug('Auth Code received ' + req.query.code);
  return oa
    .getOAuthAccessToken(req.query.code, 'authorization_code')
    .then(results => {
      logAccessToken(req, results.access_token, results.refresh_token, null);
      return getUserFromAccessToken(req, results.access_token);
    })
    .then(user => {
      logUser(req, user, 'logged in with <strong>Authorization Code</strong>');
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

// This function offers the Client credentials flow
// It is just the application logging in on its own without a user
function clientCredentialGrant(req, res) {
  debug('clientCredentialGrant');

  oa.getOAuthClientCredentials()
    .then(results => {
      logAccessToken(
        req,
        results.access_token,
        results.refresh_token,
        null,
        false
      );
      req.flash(
        'success',
        'Application logged in with <strong>Client Credentials</strong>'
      );
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

// This function offers the Password Authentication flow
// It is just a user filling out the Username and password form.
function userCredentialGrant(req, res) {
  debug('userCredentialGrant');

  const email = req.body.email;
  const password = req.body.password;

  // With the Password flow, an access token is returned in
  // the response.
  oa.getOAuthPasswordCredentials(email, password)
    .then(results => {
      logAccessToken(req, results.access_token, results.refresh_token, null);
      return getUserFromAccessToken(req, results.access_token);
    })
    .then(user => {
      logUser(req, user, 'logged in with <strong>Password</strong>');
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

// This function offers the Password Authentication flow
// It is just a user filling out the Username and password form.
function refreshTokenGrant(req, res) {
  debug('refreshTokenGrant');

  if (!req.session.refresh_token) {
    req.flash('error', 'No Refresh Token');
    return res.redirect('/');
  }

  // With the Refresh Token flow, an access token is returned in
  // the response.
  return oa
    .getOAuthRefreshToken(req.session.refresh_token)
    .then(results => {
      logAccessToken(req, results.access_token, results.refresh_token, null);
      return getUserFromAccessToken(req, results.access_token);
    })
    .then(user => {
      logUser(req, user, '<strong>refreshed token</strong>');
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

// This function offers the Hybrid flow (Authorization Code and Implicit)
function hybrid(req, res) {
  debug('hybrid');
  const path = oa.getAuthorizeUrl('code token', null, 'oauth2');
  return res.redirect(path);
}

// Response from Keyrock for an Authorization Code Grant
function hybridGrantCallback(req, res) {
  debug('hybridGrantCallback');
  // With the hybrid grant, a code is included in the response
  // and an access token too
  // We need to make a second request to obtain another
  // access token
  debug('Auth Code received ' + req.query.code);
  debug('Access Token received ' + req.query.token);
  return oa
    .getOAuthAccessToken(req.query.code, 'hybrid')
    .then(results => {
      logAccessToken(req, results.access_token, results.refresh_token, null);
      return getUserFromAccessToken(req, results.access_token);
    })
    .then(user => {
      logUser(req, user, 'logged in with <strong>Hybrid Grant</strong>');
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

//Authenticate using Open ID Connect

// This function offers Open ID Connect over Authorization Code
function authCodeOICGrant(req, res) {
  debug('authCodeOICGrant');
  const path = oa.getAuthorizeUrl('code', 'openid', 'oic');
  return res.redirect(path);
}

// Response from Keyrock for an Authorization Code Grant with Open ID Connect
function authCodeOICGrantCallback(req, res) {
  debug('authCodeOICGrantCallback');
  // With the authcode grant, a code is included in the response
  // We need to make a second request to obtain an access token
  debug('Auth Code received ' + req.query.code);
  return oa
    .getOAuthAccessToken(req.query.code, 'authorization_code')
    .then(results => {
      logAccessToken(req, null, null, results.id_token);
      return getUserFromIdToken(req, results.id_token);
    })
    .then(user => {
      logUser(
        req,
        user,
        'logged in with <strong>Open ID Connect over Authorization Code</strong>'
      );
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

// This function offers Open ID Connect over Implicit Grant
function implicitOICGrant(req, res) {
  debug('implicitOICGrant');
  const path = oa.getAuthorizeUrl('id_token', null, 'oic');
  return res.redirect(path);
}

// Response from Keyrock for an Implicit Token Grant
function implicitOICGrantCallback(req, res) {
  debug('implicitOICGrantCallback');

  debug('Id Token received ' + req.query.id_token);
  // With the implicit grant, an access token is included in the response
  logAccessToken(req, null, null, req.query.id_token);

  return getUserFromIdToken(req, req.query.id_token)
    .then(user => {
      logUser(
        req,
        user,
        'logged in with <strong>Open ID Connect over Implicit Grant</strong>'
      );
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

// This function offers Open ID Connect over Hybrid flow
function hybridOICGrant(req, res) {
  debug('hybridOICGrant');
  const path = oa.getAuthorizeUrl('code id_token token', 'openid', 'oic');
  return res.redirect(path);
}

// Response from Keyrock for an Authorization Code Grant
function hybridOICGrantCallback(req, res) {
  debug('hybridOICGrantCallback');
  // With the hybrid grant, a code is included in the response
  // and an access token too
  // We need to make a second request to obtain another
  // access token
  debug('Auth Code received ' + req.query.code);
  debug('Access Token received ' + req.query.token);
  debug('Id Token received ' + req.query.id_token);
  return oa
    .getOAuthAccessToken(req.query.code, 'hybrid')
    .then(results => {
      debug(results);
      logAccessToken(
        req,
        results.access_token,
        results.refresh_token,
        results.id_token
      );
      return getUserFromIdToken(req, results.id_token);
    })
    .then(user => {
      logUser(
        req,
        user,
        'logged in with <strong>Open ID Connect over Hybrid Grant</strong>'
      );
      return res.redirect('/');
    })
    .catch(error => {
      debug(error);
      req.flash('error', 'Access Denied');
      return res.redirect('/');
    });
}

// Use of Keyrock as a PDP (Policy Decision Point)
// LEVEL 1: AUTHENTICATION ONLY - Any user is authorized, just ensure the user exists.
function authenticate(req, res, next) {
  debug('authenticate');

  if (!SECURE_ENDPOINTS) {
    res.locals.authorized = true;
  } else {
    res.locals.authorized = !!req.session.access_token;
  }
  return next();
}

// By Default always allow access if security is disabled.
// If security is enabled and no session is found, always deny access.
function bypassAuthorization(req, res) {
  if (!SECURE_ENDPOINTS) {
    res.locals.authorized = true;
    return true;
  } else if (!req.session.access_token) {
    debug('No session found');
    res.locals.authorized = false;
    return true;
  }
  return false;
}

// Use of Keyrock as a PDP (Policy Decision Point)
// LEVEL 2: BASIC AUTHORIZATION - Resources are accessible on a User/Verb/Resource basis
function authorizeBasicPDP(req, res, next, resource = req.url) {
  debug('authorizeBasicPDP');

  if (bypassAuthorization(req, res)) {
    return next();
  }

  // Using the access token asks the IDM for the user info

  const keyrockUserUrl =
    keyrockIPAddress +
    '/user' +
    '?access_token=' +
    req.session.access_token +
    '&app_id=' +
    clientId +
    '&action=' +
    req.method +
    '&resource=' +
    resource;

  return oa
    .get(keyrockUserUrl)
    .then(response => {
      const user = JSON.parse(response);
      res.locals.authorized = user.authorization_decision === 'Permit';
      return next();
    })
    .catch(error => {
      debug(error);
      res.locals.authorized = false;
      return next();
    });
}

// Use of Authzforce as a PDP (Policy Decision Point)
// LEVEL 3: ADVANCED AUTHORIZATION - Resources are accessible via XACML Rules
function authorizeAdvancedXACML(req, res, next, resource = req.url) {
  debug('authorizeAdvancedXACML');

  if (bypassAuthorization(req, res)) {
    return next();
  }
  // Using the access token asks the IDM for the user info

  const keyrockUserUrl =
    keyrockIPAddress +
    '/user' +
    '?access_token=' +
    req.session.access_token +
    '&app_id=' +
    clientId +
    '&authzforce=true';

  return oa
    .get(keyrockUserUrl)
    .then(response => {
      const user = JSON.parse(response);
      return azf.policyDomainRequest(
        user.app_azf_domain,
        user.roles,
        resource,
        req.method,
        user.username,
        user.email
      );
    })
    .then(authzforceResponse => {
      res.locals.authorized = authzforceResponse === 'Permit';
      return next();
    })
    .catch(error => {
      debug(error);
      res.locals.authorized = false;
      return next();
    });
}

// Handles logout requests to remove access_token from the session cookie
function logOut(req, res) {
  debug('logOut');
  req.flash('success', req.session.username + ' logged out');
  req.session.access_token = undefined;
  req.session.refresh_token = undefined;
  req.session.username = undefined;
  return res.redirect('/');
}

module.exports = {
  authCodeGrant,
  clientCredentialGrant,
  userCredentialGrant,
  implicitGrant,
  refreshTokenGrant,
  authenticate,
  authorizeBasicPDP,
  authorizeAdvancedXACML,
  logInCallback,
  logOut,
  oa,
  hybrid,
  authCodeOICGrant,
  implicitOICGrant,
  hybridOICGrant
};
