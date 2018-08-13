
const OAuth2 = require('../lib/oauth2').OAuth2;
const debug = require('debug')('proxy:server');
const keyrockPort = (process.env.KEYROCK_PORT || '3005');
const keyrockUrl = (process.env.KEYROCK_URL || 'http://localhost' ) + ':' + keyrockPort;
const keyrockIPAddress = (process.env.KEYROCK_IP_ADDRESS || 'http://127.0.0.1' ) + ':' + keyrockPort;
const clientId = (process.env.KEYROCK_CLIENT_ID || 'tutorial-dckr-site-0000-xpresswebapp');
const clientSecret = (process.env.KEYROCK_CLIENT_SECRET || 'tutorial-dkcr-site-0000-clientsecret');
const callbackURL = (process.env.CALLBACK_URL || 'http://localhost:3000/login');




// Depending on Grant Type:
// Authorization Code Grant: code
// Implicit Grant: token
const responseType = 'code';


// Creates oauth library object with the config data
const oa = new OAuth2(clientId,
                    clientSecret,
                    keyrockUrl,
                    keyrockIPAddress,
                    '/oauth2/authorize',
                    '/oauth2/token',
                    callbackURL);



function getUserFromAccessToken(res,req, accessToken, callback){
    debug('getUserFromAccessToken')
    // Using the access token asks the IDM for the user info
    oa.get(keyrockIPAddress + '/user', accessToken,(error, response) =>{
        if(error){
            debug(error);
            req.flash('error', 'User not found');
            return callback();
        }

       
        const user = JSON.parse(response);
        // Store the username in a session cookie
        req.session.access_token = accessToken;
        req.session.username = (user !== undefined) ? user.username : undefined;
        return callback(req.session.username);
    });
}

// This function offers the Password Authentication flow
function logInWithPassword(req, res){
    debug('logInWithPassword')
    const email = req.body.email;
    const password = req.body.password;

      oa.getOAuthPasswordCredentials(email, password, (error, results) =>{
        if(error){
            debug(error);
            req.flash('error', 'Access Denied');
            return res.redirect('/');
        }
        debug('Access Token is ' + results.access_token);
        
        return getUserFromAccessToken(res,req, results.access_token, (username)=>{
            debug('The user is ' + username);
            req.flash('success', username + ' logged in with Password');
            res.redirect('/');});
    });
}


// Handles requests from IDM with the access code
function logInWithAuthCode(req, res){
    debug('logInWithAuthCode')
    // Using the access code goes again to the IDM to obtain the access_token
    oa.getOAuthAccessToken(req.query.code, (error, results) =>{
        if(error){
            debug(error);
            req.flash('error', 'Access Denied');
            return res.redirect('/');
        }
        debug('Access Token is ' + results.access_token);
       
        return getUserFromAccessToken(res,req, results.access_token, (username)=>{
            debug('The user is ' +  username);
            req.flash('success', username + ' logged in with Authcode');
            res.redirect('/');
        });
    });
}

// Redirection to IDM authentication portal
function auth(req, res){
    debug('auth')
    const path = oa.getAuthorizeUrl(responseType);
    res.redirect(path);
}



// Handles logout requests to remove access_token from the session cookie
function logOut(req, res){
    debug('logOut')
    req.flash('success', req.session.username + ' logged Out');
    req.session.access_token = undefined;
    req.session.username = undefined;
    res.redirect('/');
}

module.exports = {
    logInWithAuthCode,
    logInWithPassword,
    auth,
    logOut
};




