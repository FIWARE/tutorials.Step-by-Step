[![FIWARE Security](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/security.svg)](https://github.com/FIWARE/catalogue/blob/master/security/README.md)

**Description:** This tutorial secures access to a FIWARE application using the entities created in the
[previous tutorial](roles-permissions.md). The tutorial explains appropriate use of the various OAuth2 grant flows, and
how to use the **Keyrock** generic enabler as an Authorization Server to identify users. **Keyrock** is also used as a
Policy Decision Point (PDP) to restrict access.

The tutorial discusses code showing how to integrate Keyrock within a web application and demonstrates examples of
Authorization Server interactions using the **Keyrock** GUI. Some [cUrl](https://ec.haxx.se/) commands are also used to
access the **Keyrock** REST API - [Postman documentation](https://fiware.github.io/tutorials.Securing-Access/) is also
available.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/66d8ba3abaf7319941b1)

<hr class="security"/>

# Securing Access

> "When a person or party approaches your post, you should challenge them at a distance that is sufficient for you to
> react if they turn out to have hostile intentions. You should say in a firm voice, loud enough to be easily heard,
> _"Halt! Who goes there?"_ (or _"Who is there?"_). Once the person answers, you should then say _"Advance to be
> recognized."_ ... If you have identified the person or persons approaching, permit them to pass. If you are not
> satisfied with that person's identification, you must detain the person and call the petty officer of the watch."
>
> — 11th General Order of the US Marine Corps

In order to secure access to application resources, it is necessary to know two things. Firstly, who is making the
request and secondly is the requestor permitted to access the resource? The FIWARE **Keyrock** generic enabler uses
[OAuth2](https://oauth.net/2/) to enable third-party applications to obtain limited access to services. **OAuth2** is
the open standard for access delegation to grant access rights. It allows notifying a resource provider (e.g. the
Knowage Generic Enabler) that the resource owner (e.g. you) grants permission to a third-party (e.g. a Knowage
Application) access to their information (e.g. the list of entities).

<!-- textlint-disable -->

There are several common OAuth 2.0 grant flows, the details of which can be found below:

<!-- textlint-enable -->

-   [Authorization Code](https://oauth.net/2/grant-types/authorization-code)
-   [Implicit](https://oauth.net/2/grant-types/implicit)
-   [Password](https://oauth.net/2/grant-types/password)
-   [Client Credentials](https://oauth.net/2/grant-types/client-credentials)
-   [Device Code](https://oauth.net/2/grant-types/device-code)
-   [Refresh Token](https://oauth.net/2/grant-types/refresh-token)

The primary concept is that both **Users** and **Applications** must first identify themselves using a standard OAuth2
Challenge-Response mechanism. Thereafter a user is assigned a token which they append to every subsequent request. This
token identifies the user, the application and the rights the user is able to exercise. **Keyrock** can then be used
with other enablers can be used to limit and lock-down access. The details of the access flows are discussed below and
in subsequent tutorials.

The reasoning behind OAuth2 is that you never need to expose your own username and password to a third party to give
them full access - you merely permit the relevant access which can be either Read-Only or Read-Write and such access can
be defined down to a granular level. Furthermore there is provision for revoking access at any time, leaving the
resource owner in control of who can access what.

Once the application is able to authenticate users, it is also possible to lock down access using access control
mechanisms. Access control requires having an access policy - in other words defining who can do what. We have already
defined roles and permisions within the [previous tutorial](roles-permissions.md), and now need to programatically
enforce this policy by adding in a simple Policy Decision Point (PDP) – which evaluates and issues authorization
decisions, and then secure access by enforcing the decision using a Policy Enforcement Point (PEP).

## Standard Concepts of Identity Management

The following common objects are found with the **Keyrock** Identity Management database:

-   **User** - Any signed up user able to identify themselves with an eMail and password. Users can be assigned rights
    individually or as a group
-   **Application** - Any securable FIWARE application consisting of a series of microservices
-   **Organization** - A group of users who can be assigned a series of rights. Altering the rights of the organization
    effects the access of all users of that organization
-   **OrganizationRole** - Users can either be members or admins of an organization - Admins are able to add and remove
    users from their organization, members merely gain the roles and permissions of an organization. This allows each
    organization to be responsible for their members and removes the need for a super-admin to administer all rights
-   **Role** - A role is a descriptive bucket for a set of permissions. A role can be assigned to either a single user
    or an organization. A signed-in user gains all the permissions from all of their own roles plus all of the roles
    associated to their organization
-   **Permission** - An ability to do something on a resource within the system

Additionally two further non-human application objects can be secured within a FIWARE application:

-   **IoTAgent** - a proxy between IoT Sensors and the Context Broker
-   **PEPProxy** - a middleware for use between generic enablers challenging the rights of a user.

The relationship between the objects can be seen below - the entities marked in red are used directly within this
tutorial:

![](https://fiware.github.io/tutorials.Securing-Access/img/entities.png)

---

# Architecture

This application adds OAuth2-driven security into the existing Stock Management and Sensors-based application created in
[previous tutorials](https://github.com/FIWARE/tutorials.IoT-Agent/) by using the data created in the first
[security tutorial](https://github.com/FIWARE/tutorials.Identity-Management/) and reading it programatically. It will
make use of three FIWARE components - the [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/),the
[IoT Agent for UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) and integrates the use of the
[Keyrock](https://fiware-idm.readthedocs.io/en/latest/) Generic enabler. Usage of the Orion Context Broker is sufficient
for an application to qualify as _“Powered by FIWARE”_.

Both the Orion Context Broker and the IoT Agent rely on open source [MongoDB](https://www.mongodb.com/) technology to
keep persistence of the information they hold. We will also be using the dummy IoT devices created in the
[previous tutorial](iot-sensors.md). **Keyrock** uses its own [MySQL](https://www.mysql.com/) database.

Therefore the overall architecture will consist of the following elements:

-   The FIWARE [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using
    [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
-   The FIWARE [IoT Agent for UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) which will receive
    southbound requests using [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) and convert them to
    [UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
    commands for the devices
-   FIWARE [Keyrock](https://fiware-idm.readthedocs.io/en/latest/) offer a complement Identity Management System
    including:
    -   An OAuth2 authentication system for Applications and Users
    -   A site graphical frontend for Identity Management Administration
    -   An equivalent REST API for Identity Management via HTTP requests
-   The underlying [MongoDB](https://www.mongodb.com/) database :
    -   Used by the **Orion Context Broker** to hold context data information such as data entities, subscriptions and
        registrations
    -   Used by the **IoT Agent** to hold device information such as device URLs and Keys
-   A [MySQL](https://www.mysql.com/) database :
    -   Used to persist user identities, applications, roles and permissions
-   The **Stock Management Frontend** does the following:
    -   Displays store information
    -   Shows which products can be bought at each store
    -   Allows users to "buy" products and reduce the stock count.
    -   Allows authorized users into restricted areas
-   A webserver acting as set of [dummy IoT devices](https://github.com/FIWARE/tutorials.IoT-Sensors) using the
    [UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
    protocol running over HTTP - access to certain resources is restricted.

Since all interactions between the elements are initiated by HTTP requests, the elements can be containerized and run
from exposed ports.

![](https://fiware.github.io/tutorials.Securing-Access/img/architecture.png)

The necessary configuration information for adding security to the **Stock Management Frontend** can be found in the
`context-provider` section of the associated `docker-compose.yml` file - only the relevant variables are shown below:

<h3>Tutorial Security Configuration</h3>

```yaml
tutorial:
    image: fiware/tutorials.context-provider
    hostname: tutorial
    container_name: fiware-tutorial
    networks:
        default:
            ipv4_address: 172.18.1.7
    expose:
        - "3000"
        - "3001"
    ports:
        - "3000:3000"
        - "3001:3001"
    environment:
        - "DEBUG=tutorial:*"
        - "WEB_APP_PORT=3000"
        - "KEYROCK_URL=http://localhost"
        - "KEYROCK_IP_ADDRESS=http://172.18.1.5"
        - "KEYROCK_PORT=3005"
        - "KEYROCK_CLIENT_ID=tutorial-dckr-site-0000-xpresswebapp"
        - "KEYROCK_CLIENT_SECRET=tutorial-dckr-site-0000-clientsecret"
        - "CALLBACK_URL=http://localhost:3000/login"
```

The `tutorial` container is listening on two ports:

-   Port `3000` is exposed so we can see the web page displaying the Dummy IoT devices.
-   Port `3001` is exposed purely for tutorial access - so that cUrl or Postman can make UltraLight commands without
    being part of the same network.

The `tutorial` container is driven by environment variables as shown:

| Key                   | Value                                  | Description                                                                                    |
| --------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| DEBUG                 | `tutorial:*`                           | Debug flag used for logging                                                                    |
| WEB_APP_PORT          | `3000`                                 | Port used by web-app which displays the login screen & etc.                                    |
| KEYROCK_URL           | `http://localhost`                     | This is URL of the **Keyrock** Web frontend itself, used for redirection when forwarding users |
| KEYROCK_IP_ADDRESS    | `http://172.18.1.5`                    | This is URL of the **Keyrock** OAuth Communications                                            |
| KEYROCK_PORT          | `3005`                                 | This is the port that **Keyrock** is listening on.                                             |
| KEYROCK_CLIENT_ID     | `tutorial-dckr-site-0000-xpresswebapp` | The Client ID defined by Keyrock for this application                                          |
| KEYROCK_CLIENT_SECRET | `tutorial-dckr-site-0000-clientsecret` | The Client Secret defined by Keyrock for this application                                      |
| CALLBACK_URL          | `http://localhost:3000/login`          | The callback URL used by Keyrock when a challenge has succeeded.                               |

The other `tutorial` container configuration values described in the YAML file have been described in previous tutorials

The separate `KEYROCK_URL` and `KEYROCK_IP_ADDRESS` are only necessary because of the simplified Docker containerization
used within the tutorial. The `KEYROCK_URL` variable with the value `localhost` is referring to the location externally
exposed by the container, the `KEYROCK_IP_ADDRESS` variable refers to the same location but accessed from within the
Docker network. Similarly the `CALLBACK_URL` contains `localhost` as it is assumed that the browser will be accessed
from the same machine. All of these values should be replaced with appropriate proxies and DNS settings for a production
environment, but production deployment is beyond the scope of this tutorial.

# Start Up

To start the installation, do the following:

```bash
git clone git@github.com:FIWARE/tutorials.Securing-Access.git
cd tutorials.Securing-Access

./services create
```

> **Note** The initial creation of Docker images can take up to three minutes

Thereafter, all services can be initialized from the command-line by running the
[services](https://github.com/FIWARE/tutorials.Securing-Access/blob/master/services) Bash script provided within the
repository:

```bash
./services <command>
```

Where `<command>` will vary depending upon the exercise we wish to activate.

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

<h3>Dramatis Personae</h3>

The following people at `test.com` legitimately have accounts within the Application

-   Alice, she will be the Administrator of the **Keyrock** Application
-   Bob, the Regional Manager of the supermarket chain - he has several store managers under him:
    -   Manager1
    -   Manager2
-   Charlie, the Head of Security of the supermarket chain - he has several store detectives under him:
    -   Detective1
    -   Detective2

| Name       | eMail                     | Password |
| ---------- | ------------------------- | -------- |
| alice      | alice-the-admin@test.com  | `test`   |
| bob        | bob-the-manager@test.com  | `test`   |
| charlie    | charlie-security@test.com | `test`   |
| manager1   | manager1@test.com         | `test`   |
| manager2   | manager2@test.com         | `test`   |
| detective1 | detective1@test.com       | `test`   |
| detective2 | detective2@test.com       | `test`   |

The following people at `example.com` have signed up for accounts, but have no reason to be granted access

-   Eve - Eve the Eavesdropper
-   Mallory - Mallory the malicious attacker
-   Rob - Rob the Robber

| Name    | eMail               | Password |
| ------- | ------------------- | -------- |
| eve     | eve@example.com     | `test`   |
| mallory | mallory@example.com | `test`   |
| rob     | rob@example.com     | `test`   |

Two organizations have also been set up by Alice:

| Name       | Description                         | UUID                                   |
| ---------- | ----------------------------------- | -------------------------------------- |
| Security   | Security Group for Store Detectives | `security-team-0000-0000-000000000000` |
| Management | Management Group for Store Managers | `managers-team-0000-0000-000000000000` |

One application, with appropriate roles and permissions has also been created:

| Key           | Value                                  |
| ------------- | -------------------------------------- |
| Client ID     | `tutorial-dckr-site-0000-xpresswebapp` |
| Client Secret | `tutorial-dckr-site-0000-clientsecret` |
| URL           | `http://localhost:3000`                |
| RedirectURL   | `http://localhost:3000/login`          |

To save time, the data creating users and organizations from the [previous tutorial](roles-permissions.md) has been
downloaded and is automatically persisted to the MySQL database on start-up so the assigned UUIDs do not change and the
data does not need to be entered again.

The **Keyrock** MySQL database deals with all aspects of application security including storing users, passwords etc;
defining access rights and dealing with OAuth2 authorization protocols. The complete database relationship diagram can
be found [here](https://fiware.github.io/tutorials.Securing-Access/img/keyrock-db.png)

To refresh your memory about how to create users and organizations and applications, you can log in at
`http://localhost:3005/idm` using the account `alice-the-admin@test.com` with a password of `test`.

![](https://fiware.github.io/tutorials.Securing-Access/img/keyrock-log-in.png)

and look around.

# OAuth2 Grant Flows

As noted in the documentation, FIWARE **Keyrock** complies with the OAuth2 standard described in
[RFC 6749](http://tools.ietf.org/html/rfc6749) and supports all four standard grant types defined there.

When making requests the `Authorization` header is built by combining the application Client ID and Client Secret
credentials provided by the **Keyrock** separated by a `:` and base-64encoded. The value can be generated as shown:

```bash
echo tutorial-dckr-site-0000-xpresswebapp:tutorial-dckr-site-0000-clientsecret | base64
```

```
dHV0b3JpYWwtZGNrci1zaXRlLTAwMDAteHByZXNzd2ViYXBwOnR1dG9yaWFsLWRja3Itc2l0ZS0wMDAwLWNsaWVudHNlY3JldAo=
```

All four major grant flows can be demonstrated within the tutorial application, the actual flow to pick will depend on
your own use case.

## User Credentials Grant

The [User Credentials](https://tools.ietf.org/html/rfc6749#section-1.3.3) grant flow, also known as the _resource owner
password credentials grant_ or password grant should only be used when:

-   A User wants to log into an application via a web-app client
-   The web-app client is absolutely trusted

![](https://fiware.github.io/tutorials.Securing-Access/img/user-credentials.png)

This is the most appropriate usage within the Supermarket Tutorial Application, as the Web-App has been written by us
and we can trust it to pass on credentials to an instance of **Keyrock** also owned by us. As you can see from the
diagram, the user must type their own password into the web-app client itself

### Logging-in with a Password

#### 1 Request

To log in using the user-credentials flow send a POST request to the `oauth2/token` endpoint with the
`grant_type=password`

```bash
curl -iX POST \
  'http://localhost:3005/oauth2/token' \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic dHV0b3JpYWwtZGNrci1zaXRlLTAwMDAteHByZXNzd2ViYXBwOnR1dG9yaWFsLWRja3Itc2l0ZS0wMDAwLWNsaWVudHNlY3JldA==' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data "username=alice-the-admin@test.com&password=test&grant_type=password"
```

#### Response

The response returns an access code to identify the user:

```json
{
    "access_token": "a7e22dfe2bd7d883c8621b9eb50797a7f126eeab",
    "token_type": "Bearer",
    "expires_in": 3599,
    "refresh_token": "05e386edd9f95ed0e599c5004db8573e86dff874"
}
```

### Retrieving User Details from an Access Token

The access code can then be used with a GET request to the `/user` endpoint to obtain user details, for example, taking
the `access_token` from the response above

#### 2 Request

```bash
curl -X GET \
  'http://localhost:3005/user?access_token=a7e22dfe2bd7d883c8621b9eb50797a7f126eeab'
```

#### Response:

The username (Alice) is returned as shown:

```json
{
    "organizations": [],
    "displayName": "",
    "roles": [],
    "app_id": "tutorial-dckr-site-0000-xpresswebapp",
    "trusted_apps": [],
    "isGravatarEnabled": false,
    "email": "alice-the-admin@test.com",
    "id": "aaaaaaaa-good-0000-0000-000000000000",
    "app_azf_domain": "",
    "username": "alice",
    "trusted_applications": []
}
```

### User Credentials - Sample Code

The code delegates all the OAuth2 calls to a separate library
[oauth2,js](https://github.com/FIWARE/tutorials.Step-by-Step/blob/master/context-provider/lib/oauth2.js). Every request
includes the standard OAuth2 header and each request is wrapped in a promise to simplify the application code. The User
Credentials flow is invoked using the `oa.getOAuthPasswordCredentials()` function - once an `access_token` is received,
the user details are retrieved using a separate `oa.get()` call as shown:

```javascript
function userCredentialGrant(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    oa.getOAuthPasswordCredentials(email, password)
        .then(results => {
            logAccessToken(req, results.access_token);
            return getUserFromAccessToken(req, results.access_token);
        })
        .then(user => {
            // Store User and return
        });
}
```

```javascript
function getUserFromAccessToken(req, accessToken) {
    return new Promise(function(resolve, reject) {
        oa.get(keyrockIPAddress + "/user", accessToken)
            .then(response => {
                const user = JSON.parse(response);
                return resolve(user);
            })
            .catch(error => {
                req.flash("error", "User not found");
                return reject(error);
            });
    });
}
```

### User Credentials - Running the Example

It is possible to invoke the User Credentials grant flow programmatically, by bringing up the page
`http://localhost:3000/` and filling out the username and password form.

![](https://fiware.github.io/tutorials.Securing-Access/img/tutorial-log-in.png)

The response displays the user on the top right of the screen, details of the token are also flashed onto the screen:

![](https://fiware.github.io/tutorials.Securing-Access/img/tutorial-reponse.png)

## Authorization Code Grant

The [Authorization Code](https://tools.ietf.org/html/rfc6749#section-1.3.1) grant flow can be used where the client (in
our case the Tutorial Web-application) doesn't need access to any passwords directly - it just needs to know who the
user is. With the Authorization Code grant, the user is redirected to an Authorization Server such as **Keyrock**, logs
in there and permits access. The response returns an access-code which can be exchanged for an access-token which then
identifies the user.

![](https://fiware.github.io/tutorials.Securing-Access/img/authcode-flow.png)

This is an example of the sort of flow used when a third party (such as Travis-CI) asks you to log in using your GitHub
account. Travis never gains access to your password, but does receive details that you are who you claim to be from
GitHub.

### Authorization Code - Sample Code

A user must first be redirected to **Keyrock**, requesting a `code`, `oa.getAuthorizeUrl()` is returning a URL of the
form `/oauth/authorize?response_type=code&client_id={{client-id}}&state=xyz&redirect_uri={{callback_url}}`

```javascript
function authCodeGrant(req, res) {
    const path = oa.getAuthorizeUrl("code");
    return res.redirect(path);
}
```

The after the User authorizes access, the response is received by the `redirect_uri` and is handled in the code below, a
interim access code is received from **Keyrock** and second request must be made to obtain a usable `access_token`.

```javascript
function authCodeGrantCallback(req, res) {
    return oa
        .getOAuthAccessToken(req.query.code)
        .then(results => {
            return getUserFromAccessToken(req, results.access_token);
        })
        .then(user => {
            // Store User and return
        });
}
```

### Authorization Code - Running the Example

It is possible to invoke the User Credentials grant flow programmatically, by bringing up the page
`http://localhost:3000/` and clicking on the Authorization Code Button

The user is initially redirected to **Keyrock**, and must log in

![](https://fiware.github.io/tutorials.Securing-Access/img/keyrock-log-in.png)

The user must then authorize the request

![](https://fiware.github.io/tutorials.Securing-Access/img/keyrock-authorize.png)

The response displays the user on the top right of the screen, details of the token are also flashed onto the screen.

> **Note** Unless you deliberately log out of **Keyrock** > `http://localhost:3005`, the existing **Keyrock** session
> which has already permitted access will be used for subsequent authorization requests, so the **Keyrock** login screen
> will not be shown again.

## Implicit Grant

The [Implicit](https://tools.ietf.org/html/rfc6749#section-1.3.2) grant flow is a simplified form of the Authorization
grant flow where **Keyrock** returns an `access_token` directly rather than returning an interim access-code. This is
less secure than the Authcode flow but can be used in some client-side applications

![](https://fiware.github.io/tutorials.Securing-Access/img/implicit-flow.png)

### Implicit Grant - Sample Code

A user must first be redirected to **Keyrock**, requesting a `token`, `oa.getAuthorizeUrl()` is returning a URL of the
form `/oauth/authorize?response_type=token&client_id={{client-id}}&state=xyz&redirect_uri={{callback_url}}`

```javascript
function implicitGrant(req, res) {
    const path = oa.getAuthorizeUrl("token");
    return res.redirect(path);
}
```

The after the User authorizes access, the response is received by the `redirect_uri` and is handled in the code below, a
usable access token is received from **Keyrock**

```javascript
function implicitGrantCallback(req, res) {
    return getUserFromAccessToken(req, req.query.token).then(user => {
        // Store User and return
    });
}
```

### Implicit Grant - Running the Example

It is possible to invoke the Implicit grant flow programmatically, by bringing up the page `http://localhost:3000/` and
clicking on the Implicit Grant Button

The user is initially redirected to **Keyrock**, and must log in

![](https://fiware.github.io/tutorials.Securing-Access/img/keyrock-log-in.png)

The user must then authorize the request

![](https://fiware.github.io/tutorials.Securing-Access/img/keyrock-authorize.png)

The response displays the user on the top right of the screen, details of the token are also flashed onto the screen.

> **Note** Unless you deliberately log out of **Keyrock** > `http://localhost:3005`, the existing **Keyrock** session
> which has already permitted access will be used for subsequent authorization request.

## Client Credentials Grant

The final grant flow - the [Client Credentials](https://tools.ietf.org/html/rfc6749#section-1.3.4) grant, does not need
a user. It is sometimes necessary for an application to identify itself so that the application (rather than the user)
is granted access to resources. There are no resources secured in such a manner within this tutorial, but the flow has
been included for completeness.

![](https://fiware.github.io/tutorials.Securing-Access/img/client-credentials.png)

### Logging in as an Application

To log in using the client credentials flow send a POST request to the `oauth2/token` endpoint with the
`grant_type=client_credentials`

#### 3 Request:

```bash
curl -iX POST \
  'http://localhost:3005/oauth2/token' \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic dHV0b3JpYWwtZGNrci1zaXRlLTAwMDAteHByZXNzd2ViYXBwOnR1dG9yaWFsLWRja3Itc2l0ZS0wMDAwLWNsaWVudHNlY3JldA==' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data "grant_type=client_credentials"
```

#### Response:

The response returns an access code to identify the application itself.

```json
{
    "access_token": "3816cf24b2d233546ae9244f6f6fdc327bfba69f",
    "token_type": "Bearer",
    "expires_in": 3599
}
```

### Client Credentials Grant - Sample Code

The code is similar to the User Credential Grant, but without an explicit username or password.

```javascript
function clientCredentialGrant(req, res) {
    oa.getOAuthClientCredentials().then(results => {
        // Store Access token
    });
}
```

### Client Credentials Grant - Running the Example

It is possible to invoke the Client Credentials grant flow programmatically, by bringing up the page
`http://localhost:3000/` and clicking on the Client Credentials Button

The response displays the details of the token. No User is involved.

## Refresh Token

Once a User has identified themselves (using any appropriate grant type), they should not need to log-in again, even
though the `access_token` they are using is time-limited. To provide continued access, an addition
[Refresh Token](https://tools.ietf.org/html/rfc6749#section-1.5) flow has been defined, allowing a User to exchange an
expired token for a new one. Offering this exchange is not mandatory for OAuth2 Authorization Servers, and is not
appropriate for all grant types.

### Availability Check

#### 4 Request

Check to see if Refresh Token flow is available, merely log in using one of the other grant types, for example to log in
using the user-credentials flow send a POST request to the `oauth2/token` endpoint with the `grant_type=password`

```bash
curl -iX POST \
  'http://localhost:3005/oauth2/token' \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic dHV0b3JpYWwtZGNrci1zaXRlLTAwMDAteHByZXNzd2ViYXBwOnR1dG9yaWFsLWRja3Itc2l0ZS0wMDAwLWNsaWVudHNlY3JldA==' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data "username=alice-the-admin@test.com&password=test&grant_type=password"
```

#### Response

Along with the `access_token` identifying the user, the response returns an `refresh_token`

```json
{
    "access_token": "a7e22dfe2bd7d883c8621b9eb50797a7f126eeab",
    "token_type": "Bearer",
    "expires_in": 3599,
    "refresh_token": "05e386edd9f95ed0e599c5004db8573e86dff874"
}
```

### Refresh Access Token

The `refresh_token=05e386edd9f95ed0e599c5004db8573e86dff874` from the response above is stored for later use. To obtain
a new `access_token` (for example once the previous one has expired) the `refresh_token` is used in the OAuth2 refresh
token flow and a `grant_type=refresh_token`

#### 5 Request

```bash
curl -iX POST \
  'http://localhost:3005/oauth2/token' \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic dHV0b3JpYWwtZGNrci1zaXRlLTAwMDAteHByZXNzd2ViYXBwOnR1dG9yaWFsLWRja3Itc2l0ZS0wMDAwLWNsaWVudHNlY3JldA==' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data "refresh_token=05e386edd9f95ed0e599c5004db8573e86dff874&grant_type=refresh_token"
```

#### Response

The response is similar to the previous response, but the `access_token` and `refresh_token` have been updated and the
expiry window has been moved forward.

```json
{
    "access_token": "298717d478980a2f0c3d2e9f9e222f1bb73e1c69",
    "token_type": "Bearer",
    "expires_in": 3599,
    "refresh_token": "4611e3ab68b5b606eb7a43db6835de646bb7d11d"
}
```

### Refresh Token - Sample Code

The code delegates all the OAuth2 calls to a separate library
[oauth2.js](https://github.com/FIWARE/tutorials.Step-by-Step/blob/master/context-provider/lib/oauth2.js). Every request
includes the standard OAuth2 header and each request is wrapped in a promise to simplify the application code. The
Request Token flow is invoked using the `oa.getOAuthRefreshToken()` function - the previously received `refresh_token`
used to receive a new `access_token` once the previous token has expired.

```javascript
function refreshTokenGrant(req, res) {
    return oa.getOAuthRefreshToken(req.session.refresh_token).then(results => {
        // Store new Access Token
    });
}
```

### Refresh Token - Running the Example

It is possible to invoke the Token Refresh flow programmatically, by bringing up the page `http://localhost:3000/` and
filling out the username and password form.

![](https://fiware.github.io/tutorials.Securing-Access/img/tutorial-log-in.png)

The response displays the user on the top right of the screen, details of the token are also flashed onto the screen:

![](https://fiware.github.io/tutorials.Securing-Access/img/tutorial-reponse.png)

Pressing the **Refresh Token** button invokes returns a new `access_token` and `refresh_token` for the logged in user.

## PDP - Access Control

There are three Levels of PDP Access Control:

-   Level 1: Authentication Access - Allow all actions to every signed in user and no actions to an anonymous user.
-   Level 2: Basic Authorization - Check which resources and verbs the currently logged in user should have access to
-   Level 3: Advanced Authorization - Fine grained control through [XACML](https://en.wikipedia.org/wiki/XACML)

**Keyrock** can be used to offer a simple Level 1 and 2 PDP on its own, and can offer level 3 combined with additional
generic enablers. This tutorial will only be concerned with the logged in site itself. Securing other services in
conjunction with a [PEP Proxy](https://fiware-pep-proxy.readthedocs.io/en/latest) will be dealt with in a later tutorial

### Authentication Access

If **Keyrock** (or any other OAuth2 provider) has successfully logged in, an `access_token` has been provided saying
that the user exists. This information is sufficient to **authenticate** a User

Level 1 PDP can be used in conjunction with any OAuth2 provider using any flow.

If a user has authenticated using **Keyrock**, the freshness of the access token can be checked by making a GET request
to the `/user` endpoint.

#### 6 Request

```bash
 curl -X GET \
  'http://localhost:3005/user?access_token={{access-token}}&app_id={{app-id}}'
```

A successful response indicates a valid `access_token`.

### Authentication Access - Sample Code

To check that a user has logged in, just store the `access_token` into session when they log in, and check for its
existence:

```javascript
function pdpAuthentication(req, res, next) {
    res.locals.authorized = req.session.access_token ? true : false;
    return next();
}
```

To check whether a **Keyrock** `access_token` has expired, you can try to retrieve the current user details on request:

```javascript
function pdpAuthentication(req, res, next) {
    const keyrockUserUrl =
        keyrockIPAddress + "/user" + "?access_token=" + req.session.access_token + "&app_id=" + clientId;
    return oa
        .get(keyrockUserUrl)
        .then(response => {
            res.locals.authorized = true;
            return next();
        })
        .catch(error => {
            debug(error);
            res.locals.authorized = false;
            return next();
        });
}
```

### Basic Authorization

Level 2 PDP can only be used with our own trusted instance of **Keyrock**, usually via the Password Grant flow.

If we are using our own trusted instance of **Keyrock**, once a user has signed in and obtained an `access_token`, the
`access_token` can be stored in session and used to retrieve user details on demand. The request for user details may be
extended to include resource permissions. Using this information it is possible to permit or deny access to individual
resources.

As a reminder, **Keyrock** permissions are based on `resource` (e.g. URL) and `action` (which can be mapped to an HTTP
verb). We can retrieve extended user details including access permisions by adding additional parameters to a `/user`
GET request

#### 7 Request

```bash
 curl -X GET \
  'http://localhost:3005/user?access_token={{access-token}}&action={{action}}&resource={{resource}}&app_id={{app-id}}'
```

Where :

-   `{{access-token}}` is the current access token of a logged in user e.g. `6c1f1ac938f644c655b9c46c67d9f8b068345e89`
-   `{{action}}` is an HTTP Verb e.g. `GET`
-   `{{resource}}` is a secured endpoint e.g. `/app/price-change`
-   `{{app-id}}`

#### Response

The response include an `authorization_decision` attribute which permits or denies access.

In the example below the access token used belonged to Bob the manager, and he has been granted access to the
`/app/price-change` endpoint within the `tutorial-dckr-site-0000-xpresswebapp`

```json
{
    "organizations": [],
    "displayName": "",
    "roles": [
        {
            "id": "managers-role-0000-0000-000000000000",
            "name": "Management"
        }
    ],
    "app_id": "tutorial-dckr-site-0000-xpresswebapp",
    "trusted_apps": [],
    "isGravatarEnabled": false,
    "email": "bob-the-manager@test.com",
    "id": "bbbbbbbb-good-0000-0000-000000000000",
    "authorization_decision": "Permit",
    "app_azf_domain": "",
    "username": "bob",
    "trusted_applications": []
}
```

### Basic Authorization - Sample Code

Keyrock can therefore be used as a PDP on its own, we merely need to check if the user has access to the resource and
set a flag:

```javascript
function pdpBasicAuthorization(req, res, next, url = req.url) {
    const keyrockUserUrl =
        keyrockIPAddress +
        "/user" +
        "?access_token=" +
        req.session.access_token +
        "&action=" +
        req.method +
        "&resource=" +
        url +
        "&app_id=" +
        clientId;
    return oa
        .get(keyrockUserUrl)
        .then(response => {
            const user = JSON.parse(response);
            res.locals.authorized = user.authorization_decision === "Permit";
            return next();
        })
        .catch(error => {
            debug(error);
            res.locals.authorized = false;
            return next();
        });
}
```

A secured Web Page needs to check if the `authorized` flag has been set, and redirect the user if disallowed. This is an
example of a Policy Enforcement Point (PEP):

```javascript
function priceChange(req, res) {
    if (!res.locals.authorized) {
        req.flash("error", "Access Denied");
        return res.redirect("/");
    }
    /// Continue with the normal flow of execution...
}
```

Similarly a secured command can fail fast and return an error code if the user is not authorized, this is another
example of a Policy Enforcement Point (PEP):

```javascript
function sendCommand(req, res) {
    if (!res.locals.authorized) {
        res.setHeader("Content-Type", "application/json");
        return res.status(403).send({ message: "Forbidden" });
    }
    /// Continue with the normal flow of execution...
}
```

### PDP Access Control - Running the Example

> **Note** Only four resources have been secured at level 2:
>
> -   sending the unlock door command
> -   sending the ring bell command
> -   access to the price-change area
> -   access to the order-stock area

#### Anonymous Access

-   Ensure that you are not signed in as any user.

##### Level 1 : Authentication Access

-   Click on any store page - access is **denied** for anonymous access
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Switch on the lamp - access is **denied** for anonymous access

##### Level 2 : Authorization Access

-   Click on the restricted access links at `http://localhost:3000` - access is **denied**
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Unlock a door - access is **denied**
    -   Ring a bell - access is **denied**

#### Eve the Eavesdropper

Eve has an account, but no roles in the application.

> **Note** As Eve has a recognized account, she gains full authentication access, even though her account has no roles
> attached.

-   From `http://localhost:3000`, log in as `eve@example.com` with the password `test`

##### Level 1 : Authentication Access

-   Click on any store page - access is **permitted** for any logged in users
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Switch on the lamp - access is **permitted** for any logged in users

##### Level 2 : Authorization Access

-   Click on the restricted access links at `http://localhost:3000` - access is **denied**
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Unlock a door - access is **denied**
    -   Ring a bell - access is **denied**

#### Bob The Regional Manager

Bob has the **management** role

-   From `http://localhost:3000`, log in as `bob-the-manager@test.com` with the password `test`

##### Level 1 : Authentication Access

-   Click on any store page - access is **permitted** for any logged in users
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Switch on the lamp - access is **permitted** for any logged in users

##### Level 2 : Authorization Access

-   Click on the restricted access links at `http://localhost:3000` - access is **permitted** - This is a management
    only permission
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Unlock a door - access is **denied**. - This is a security only permission
    -   Ring a bell - access is **permitted** - This is permitted to management users

#### Charlie the Security Manager

Charlie has the **security** role

-   From `http://localhost:3000`, log in as `charlie-security@test.com` with the password `test`

##### Level 1 : Authentication Access

-   Click on any store page - access is **permitted** for any logged in users
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Switch on the lamp - access is **permitted** for any logged in users

##### Level 2: Authorization Access

-   Click on the restricted access links at `http://localhost:3000` - access is **denied** - This is a management only
    permission
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Unlock a door - access is **permitted** - This is a security only permission
    -   Ring a bell - access is **permitted** - This is permitted to security users
