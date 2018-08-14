
const OAuth2 = require('../lib/oauth2').OAuth2;
const debug = require('debug')('tutorial:security');
const keyrockPort = (process.env.KEYROCK_PORT || '3005');
const keyrockUrl = (process.env.KEYROCK_URL || 'http://localhost' ) + ':' + keyrockPort;
const keyrockIPAddress = (process.env.KEYROCK_IP_ADDRESS || 'http://127.0.0.1' ) + ':' + keyrockPort;
const clientId = (process.env.KEYROCK_CLIENT_ID || 'tutorial-dckr-site-0000-xpresswebapp');
const clientSecret = (process.env.KEYROCK_CLIENT_SECRET || 'tutorial-dkcr-site-0000-clientsecret');
const callbackURL = (process.env.CALLBACK_URL || 'http://localhost:3000/login');

// Creates oauth library object with the config data
const oa = new OAuth2(clientId,
    clientSecret,
    keyrockUrl,
    keyrockIPAddress,
    '/oauth2/authorize',
    '/oauth2/token',
    callbackURL);


function getUserFromAccessToken(req, accessToken){
    debug('getUserFromAccessToken')
    return new Promise(function(resolve, reject) {
        // Using the access token asks the IDM for the user info
        oa.get(keyrockIPAddress + '/user', accessToken)
        .then(response => {
            const user = JSON.parse(response);
            // Store the username in a session cookie
            req.session.access_token = accessToken;
            req.session.username = (user !== undefined) ? user.username : undefined;
            return resolve(req.session.username);
         })
        .catch(error => {
            debug(error);
            req.flash('error', 'User not found');
            return reject (error)
         });
    });
}


// Handles callback responses from Keyrock with the access code or token
function logInCallback(req, res){
    if (req.query.token){
        // If we have received an access_token, this is an Implicit Grant
        implicitGrantCallback(req,res);
    } else {
        // If no access_token is received, this is an authCode Grant
        authCodeGrantCallback(req,res);
    }
}


// Redirection to Keyrock for an Implicit Token Grant
function implicitGrant(req, res){
    debug('implicitGrant');
    const path = oa.getAuthorizeUrl('token');
    return res.redirect(path);
}
// Response from Keyrock for an Implicit Token Grant
function implicitGrantCallback(req,res){
    debug('implicitGrantCallback')
    // With the implicit grant, an access token is included in the response
    debug('Access Token is ' + req.query.token);
    req.flash('success', 'token: '+ req.query.token);
    req.session.access_token = req.query.token;

    return getUserFromAccessToken(req, req.query.token)
    .then (username => {
        debug('The user is ' +  username);
        req.flash('success', username + ' logged in with Implicit Grant');
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
function authCodeGrant(req, res){
    debug('authCodeGrant')
    const path = oa.getAuthorizeUrl('code');
    return res.redirect(path);
}
// Response from Keyrock for an Authorization Code Grant
function authCodeGrantCallback(req,res){
    debug('authCodeGrantCallback')
    // With the authcode grant, a code is included in the response
    // We need to make a second request to obtain an access token
    return oa.getOAuthAccessToken(req.query.code)
    .then(results => {
        debug('Access Token is ' + results.access_token);
        req.flash('success', 'token: '+ results.access_token);
        return getUserFromAccessToken(req, results.access_token); 
    })
    .then (username => {
        debug('The user is ' +  username);
        req.flash('success', username + ' logged in with Authcode');
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
function clientCredentialGrant(req, res){
    debug('clientCredentialGrant')
    
    oa.getOAuthClientCredentials()
    .then(results => {
        debug('Access Token is ' + results.access_token);
        req.flash('success', 'Application logged in with Client Credentials');
        req.flash('success', 'token: '+ results.access_token);
        return  res.redirect('/');
    })
    .catch(error => {
        debug(error);
        req.flash('error', 'Access Denied');
        return res.redirect('/');
    });
}


// This function offers the Password Authentication flow
// It is just a user filling out the Username and password form.
function userCredentialGrant(req, res){
    debug('userCredentialGrant');

    const email = req.body.email;
    const password = req.body.password;

    // With the Password flow, an access token is returned in 
    // the response.
    oa.getOAuthPasswordCredentials(email, password)
    .then(results => {
        debug('Access Token is ' + results.access_token);
        req.flash('success', 'token: '+ results.access_token);
        return getUserFromAccessToken(req, results.access_token)
    })
    .then(username =>{
        debug('The user is ' + username);
        req.flash('success', username + ' logged in with Password');
        return res.redirect('/');
    })
    .catch(error => {
        debug(error);
        req.flash('error', 'Access Denied');
        return res.redirect('/');
    });
}






// Handles logout requests to remove access_token from the session cookie
function logOut(req, res){
    debug('logOut')
    req.flash('success', req.session.username + ' logged Out');
    req.session.access_token = undefined;
    req.session.username = undefined;
    return res.redirect('/');
}

module.exports = {
    authCodeGrant,
    clientCredentialGrant,
    userCredentialGrant,
    implicitGrant,
    logInCallback,
    logOut
};




