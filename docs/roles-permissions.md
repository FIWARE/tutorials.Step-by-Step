[![FIWARE Security](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/security.svg)](https://github.com/FIWARE/catalogue/blob/master/security/README.md)

**Description:** The tutorial explains how to create applications, and how to assign roles and permissions to them. It
takes the users and organizations created in the [previous tutorial](identity-management.md) and ensures that only
legitimate users will have access to resources.

The tutorial demonstrates examples of interactions using the **Keyrock** GUI, as well [cUrl](https://ec.haxx.se/)
commands used to access the **Keyrock** REST API -
[Postman documentation](https://fiware.github.io/tutorials.Roles-Permissions/) is also available.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/2febc0452a8977734480)

<hr class="security"/>

# What is Authorization?

> "No matter what he does, every person on earth plays a central role in the history of the world. And normally he
> doesn't know it"
>
> — Paulo Coelho (The Alchemist)

Authorization is the function of specifying access rights/privileges to resources related to information security. More
formally, "to authorize" is to define an access policy. With identity management controlled via the FIWARE **Keyrock**
Generic Enabler, User access is granted based on permissions assigned to a role.

Every application secured by the **Keyrock** generic enabler can define a set of permissions - i.e. a set of things that
can be done within the application. For example within the application, the ability to send a commmand to unlock a Smart
Door could be secured behind a `Unlock Door` permission. Similarly the ability to send a commmand to ring the alarm bell
could be secured behind a `Ring Bell` permission, and the ability to alter prices could be secured behind a
`Price Change` permission

These permissions are grouped together in a series of roles - for example `Unlock Door` and `Ring Bell` could both be
assigned to the Security role, meaning that Users who are subsequently given that role would gain both permissions.

Permissions can overlap and be assigned to multiple roles - maybe `Ring Bell` is also assigned to the management role
along with `Price Change` and `Order Stock`.

In turn users or organizations will be assigned to one of more roles - each user will gain the sum of all the
permissions for each role they have. For example if Alice is assigned to both management and security roles, she will
gain all four permissions `Unlock Door`, `Ring Bell`, `Price Change` and `Order Stock`.

The concept of a role is unknown to a user - they only know the list of permissions they have been granted, not how the
permissions are split up within the application.

In summary, permissions are all the possible actions that can be done to resources within an application, whereas roles
are groups of actions which can be done by a type of user of that application.

<h3>Standard Concepts of Identity Management</h3>

The following common objects are found with the **Keyrock** Identity Management database:

-   **User** - Any signed up user able to identify themselves with an eMail and password. Users can be assigned rights
    individually or as a group
-   **Application** - Any securable FIWARE application consisting of a series of microservices
-   **Organization** - A group of users who can be assigned a series of rights. Altering the rights of the organization
    effects the access of all users of that organization
-   **OrganizationRole** - Users can either be members or admins of an organization - Admins are able to add and remove
    users from their organization, members merely gain the roles and permissions of an organiation. This allows each
    organization to be responisible for their members and removes the need for a super-admin to administer all rights
-   **Role** - A role is a descriptive bucket for a set of permissions. A role can be assigned to either a single user
    or an organization. A signed-in user gains all the permissions from all of their own roles plus all of the roles
    associated to their organization
-   **Permission** - An ability to do something on a resource within the system

Additionally two further non-human application objects can be secured within a FIWARE application:

-   **IoTAgent** - a proxy between IoT Sensors and the Context Broker
-   **PEPProxy** - a middleware for use between generic enablers challenging the rights of a user.

The relationship between the objects can be seen below - the entities marked in red are used directly within this
tutorial:

![](https://fiware.github.io/tutorials.Roles-Permissions/img/entities.png)

---

# Architecture

This introduction will only make use of one FIWARE component - the
[Keyrock](https://fiware-idm.readthedocs.io/en/latest/) Identity Management Generic Enabler. Usage of **Keyrock** alone
is insufficient for an application to qualify as _“Powered by FIWARE”_. Additionally will be persisting user data in a
**MySQL** database.

The overall architecture will consist of the following elements:

-   One **FIWARE Generic Enabler**:

    -   FIWARE [Keyrock](https://fiware-idm.readthedocs.io/en/latest/) offer a complement Identity Management System
        including:
        -   An OAuth2 authentication system for Applications and Users
        -   A site graphical frontend for Identity Management Administration
        -   An equivalent REST API for Identity Management via HTTP requests

-   One [MySQL](https://www.mysql.com/) database :
    -   Used to persist user identities, applications, roles and permsissions

Since all interactions between the services are initiated by HTTP requests, the services can be containerized and run
from exposed ports.

![](https://fiware.github.io/tutorials.Roles-Permissions/img/architecture.png)

The specific architecture of each section of the tutorial is discussed below.

<h3>Keyrock Configuration</h3>

```yaml
keyrock:
    image: fiware/idm
    container_name: fiware-keyrock
    hostname: keyrock
    depends_on:
        - mysql-db
    ports:
        - "3005:3005"
        - "3443:3443"
    environment:
        - DEBUG=idm:*
        - DATABASE_HOST=mysql-db
        - IDM_DB_PASS_FILE=/run/secrets/my_secret_data
        - IDM_DB_USER=root
        - IDM_HOST=http://localhost:3005
        - IDM_PORT=3005
        - IDM_HTTPS_ENABLED=true
        - IDM_HTTPS_PORT=3443
        - IDM_ADMIN_USER=alice
        - IDM_ADMIN_EMAIL=alice-the-admin@test.com
        - IDM_ADMIN_PASS=test
    secrets:
        - my_secret_data
```

The `keyrock` container is a web application server listening on two ports:

-   Port `3005` has been exposed for HTTP traffic so we can display the web page and interact with the REST API.
-   Port `3443` has been exposed for secure HTTPS traffic for the site and REST API

> **Note** HTTPS should be used throughout for any secured application, but to do this properly, **Keyrock** requires a
> trusted SSL certificate - the default certificate is self-certified and available for testing purposes. The
> certificates can be overridden by attaching a volume to replace the files under `/opt/fiware-idm/certs`.
>
> In a production environment, all access should occur over HTTPS, to avoid sending any sensitive information using
> plain-text. Alternatively HTTP can be used within a private network behind a configured HTTPS Reverse Proxy
>
> The port `3005` offering the HTTP protocol is being exposed for demonstration purposes only and to simplify the
> interactions within this tutorial - you may also use HTTPS on port `3443` with certain caveats.
>
> If you want to use HTTPS to access the REST API when you are using Postman, ensure that SSL certificate verfication is
> OFF. If you want to use HTTPS to access the web front-end, please accept any security warnings issued.

The `keyrock` container is driven by environment variables as shown:

| Key               | Value                   | Description                                                                                                                  |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| IDM_DB_PASS       | `idm`                   | Password of the attached MySQL Database - secured by **Docker Secrets** (see below)                                          |
| IDM_DB_USER       | `root`                  | Username of the default MySQL user - left in plain-text                                                                      |
| IDM_HOST          | `http://localhost:3005` | Hostname of the **Keyrock** App Server - used in activation eMails when signing up users                                     |
| IDM_PORT          | `3005`                  | Port used by the **Keyrock** App Server for HTTP traffic - this has been altered from the default 3000 port to avoid clashes |
| IDM_HTTPS_ENABLED | `true`                  | Whether to offer HTTPS Support - this will use the self-signed certs unless overridden                                       |
| IDM_HTTPS_PORT    | `3443`                  | Port used by the **Keyrock** App Server for HTTP traffic this has been altered from the default 443                          |

> **Note** that this example has secured the MySQL password using **Docker Secrets** By using `IDM_DB_PASS` with the
> `_FILE` suffix and referring to a secrets file location. This avoids exposing the password as an `ENV` variable in
> plain-text - either in the `Dockerfile` Image or as an injected variable which could be read using `docker inspect`.
>
> The following list of variables (where used) should be set via secrets with the `_FILE` suffix in a Production System:
>
> -   `IDM_SESSION_SECRET`
> -   `IDM_ENCRYPTION_KEY`
> -   `IDM_DB_PASS`
> -   `IDM_DB_USER`
> -   `IDM_ADMIN_ID`
> -   `IDM_ADMIN_USER`
> -   `IDM_ADMIN_EMAIL`
> -   `IDM_ADMIN_PASS`
> -   `IDM_EX_AUTH_DB_USER`
> -   `IDM_EX_AUTH_DB_PASS`

<h3>MySQL Configuration</h3>

```yaml
mysql-db:
    image: mysql:5.7
    hostname: mysql-db
    container_name: db-mysql
    expose:
        - "3306"
    ports:
        - "3306:3306"
    networks:
        - default
    environment:
        - "MYSQL_ROOT_PASSWORD_FILE=/run/secrets/my_secret_data"
        - "MYSQL_ROOT_HOST=172.18.1.5"
    volumes:
        - mysql-db:/var/lib/mysql
    secrets:
        - my_secret_data
```

The `mysql-db` container is listening on a single port:

-   Port `3306` is the default port for a MySQL server. It has been exposed so you can also run other database tools to
    display data if you wish

The `mysql-db` container is driven by environment variables as shown:

| Key                 | Value. | Description                                                                                                                                                                                           |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MYSQL_ROOT_PASSWORD | `123`. | specifies a password that is set for the MySQL `root` account - secured by **Docker Secrets** (see below)                                                                                             |
| MYSQL_ROOT_HOST     | `root` | By default, MySQL creates the `root'@'localhost` account. This account can only be connected to from inside the container. Setting this environment variable allows root connections from other hosts |

# Start Up

To start the installation, do the following:

```bash
git clone https://github.com/FIWARE/tutorials.Roles-Permissions.git
cd tutorials.Roles-Permissions

./services create
```

> **Note** The initial creation of Docker images can take up to three minutes

Thereafter, all services can be initialized from the command-line by running the
[services](https://github.com/FIWARE/tutorials.Roles-Permissions/blob/master/services) Bash script provided within the
repository:

```bash
./services <command>
```

Where `<command>` will vary depending upon the exercise we wish to activate.

**Note:** If you want to clean up and start over again you can do so with the following command:

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

The following people at `example.com` have signed up for accounts, but have no reason to be granted access

-   Eve - Eve the Eavesdropper
-   Mallory - Mallory the malicious attacker
-   Rob - Rob the Robber

| Name       | eMail                     | Password | UUID                                   |
| ---------- | ------------------------- | -------- | -------------------------------------- |
| alice      | alice-the-admin@test.com  | `test`   | `aaaaaaaa-good-0000-0000-000000000000` |
| bob        | bob-the-manager@test.com  | `test`   | `bbbbbbbb-good-0000-0000-000000000000` |
| charlie    | charlie-security@test.com | `test`   | `cccccccc-good-0000-0000-000000000000` |
| manager1   | manager1@test.com         | `test`   | `manager1-good-0000-0000-000000000000` |
| manager2   | manager2@test.com         | `test`   | `manager2-good-0000-0000-000000000000` |
| detective1 | detective1@test.com       | `test`   | `secure01-good-0000-0000-000000000000` |
| detective2 | detective2@test.com       | `test`   | `secure02-good-0000-0000-000000000000` |
| eve        | eve@example.com           | `test`   | `eeeeeeee-evil-0000-0000-000000000000` |
| mallory    | mallory@example.com       | `test`   | `mmmmmmmm-evil-0000-0000-000000000000` |
| rob        | rob@example.com           | `test`   | `rrrrrrrr-evil-0000-0000-000000000000` |

Two organizations have also been set up by Alice:

| Name       | Description                         | UUID                                   |
| ---------- | ----------------------------------- | -------------------------------------- |
| Security   | Security Group for Store Detectives | `security-team-0000-0000-000000000000` |
| Management | Management Group for Store Managers | `managers-team-0000-0000-000000000000` |

To save time, the data creating users and organizations from the [previous tutorial](identity-management.md) has been
downloaded and is automatically persisted to the MySQL database on start-up so the asigned UUIDs do not change and the
data does not need to be entered again

To refresh your memory about how to create users and organizations, you can log in at `http://localhost:3005/idm` using
the account `alice-the-admin@test.com` with a password of `test`.

![](https://fiware.github.io/tutorials.Roles-Permissions/img/log-in.png)

and look at the organizations list.

<h3>Reading directly from the Keyrock MySQL Database</h3>

All Identify Management records and releationships are held within the attached MySQL database. This can be accessed by
entering the running Docker container as shown:

```bash
docker exec -it db-mysql bash
```

```bash
mysql -u <user> -p<password> idm
```

Where `<user>` and `<password>` match the values defined in the `docker-compose` file for `MYSQL_ROOT_PASSWORD` and
`MYSQL_ROOT_USER`. The default values for the tutorial are usually `root` and `secret`.

SQL commands can then be entered from the command-line. e.g.:

```SQL
select id, username, email, password from user;
```

The **Keyrock** MySQL database deals with all aspects of application security including storing users, passwords etc;
defining access rights and dealing with OAuth2 authorization protocols. The complete database relationship diagram can
be found [here](https://fiware.github.io/tutorials.Roles-Permissions/img/keyrock-db.png)

<h3>UUIDs within Keyrock</h3>

All IDs and tokens within **Keyrock** are subject to change. The following values will need to be amended when querying
for records .Record IDs use Universally Unique Identifiers - UUIDs.

| Key                    | Description                                                                    | Sample Value                                              |
| ---------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `keyrock`              | URL for the location of the **Keyrock** service                                | `localhost:3005` for HTTP, `localhost:3443` for HTTPS     |
| `X-Auth-token`         | Token received in the Header when logging in as a user                         | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` = I am Alice       |
| `X-Subject-token`      | Token to pass when asking about a subject, alternatively repeat the user token | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` = Asking about Bob |
| `user-id`              | ID of an existing user, found with the `user` table                            | `bbbbbbbb-good-0000-0000-000000000000` - Bob's User ID    |
| `application-id`       | ID of an existing application, found with the `oauth_client` table             | `c978218d-ad63-4427-b12b-542b81299cfb`                    |
| `role-id`              | ID of an existing role, found with the `role` table                            | `d28baa00-839e-4b45-a6b2-1cec563942ee`                    |
| `permission-id`        | ID of an existing permission, found with the `permission` table                | `6b6cd19c-9398-4834-9ba1-1616c57139c0`                    |
| `organization-id`      | ID of an existing organization, found with the `organization` table            | `e424ed98-c966-46e3-b161-a165fd31bc01`                    |
| `organization-role-id` | type of role a user has within an organization either `owner` or `member`      | `member`                                                  |
| `iot-agent-id`         | ID of an existing IoT Agent, found with the `iot` table                        | `iot_sensor_f3d0245b-3330-4e64-a513-81bf4b0dae64`         |
| `pep-proxy-id`         | ID of an existing PEP Proxy, found with the `pep_proxy` table                  | `iot_sensor_f3d0245b-3330-4e64-a513-81bf4b0dae64`         |

Tokens are designed to expire after a set period. If the `X-Auth-token` value you are using has expired, log-in again to
obtain a new token. For this tutorial, a long lasting set of tokens has been created for each user and persisted into
the database, so there is usually no need to refresh tokens.

## Logging In via REST API calls

Enter a username and password to enter the application. The default super-user has the values `alice-the-admin@test.com`
and `test`. The URL `https://localhost:3443/v1/auth/tokens` should also work in a secure system.

### Create Token with Password

The following example logs in using the Admin Super-User:

#### 1 Request:

```bash
curl -iX POST \
  'http://localhost:3005/v1/auth/tokens' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "alice-the-admin@test.com",
  "password": "test"
}'
```

#### Response:

```text
HTTP/1.1 201 Created
X-Subject-Token: d848eb12-889f-433b-9811-6a4fbf0b86ca
Content-Type: application/json; charset=utf-8
Content-Length: 138
ETag: W/"8a-TVwlWNKBsa7cskJw55uE/wZl6L8"
Date: Mon, 30 Jul 2018 12:07:54 GMT
Connection: keep-alive
```

```json
{
    "token": {
        "methods": ["password"],
        "expires_at": "2018-07-30T13:02:37.116Z"
    },
    "idm_authorization_config": {
        "level": "basic",
        "authzforce": false
    }
}
```

### Get Token Info

You can use the long-lasting `X-Auth-token=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` to pretend to be Alice throughout this
tutorial.

The presence of a (time-limited) token is sufficient to find out more information about the user. To find information
about Bob, use the long-lasting token `X-Subject-token=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`

This request indicates that _the user authorized with the token `{{X-Auth-token}}` (i.e Alice) is enquiring about the
user holding the token `{{X-Subject-token}}` (i.e Bob)_

#### 2 Request:

```bash
curl -iX GET \
  'http://localhost:3005/v1/auth/tokens' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \
  -H 'X-Subject-token: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
```

#### Response:

The response will return the details of the associated user. As you can see Bob holds a long-lasting token until 2026.

```json
{
    "access_token":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "expires":"2026-07-30T12:38:13.000Z",
    "valid":true,
    "User":{
        "id":"bbbbbbbb-good-0000-0000-000000000000",
        "username":"bob",
        "email":"bob-the-manager@test.com",
        "date_password":"2018-07-30T11:41:14.000Z",
        "enabled":true,
        "admin":false
    }
```

# Managing Applications

Any FIWARE application can be broken down into a collection of microservices. These microservices connect together to
read and alter the state of the real world. Security can be added to these services by restricting actions on these
resources down to users how have appropriate permissions. It is therefore necessary to define an application to offer a
set of permissible actions and to hold a list of permitted users (or groups of users i.e. an Organization)

Applications are therefore a conceptual bucket holding who can do what on which resource.

<h3>Video : Creating Applications with the Keyrock GUI</h3>

[![](https://fiware.github.io/tutorials.Step-by-Step/img/video-logo.png)](https://www.youtube.com/watch?v=pjsl0eHpFww&t=470 "Creating Applications")

Click on the image above to watch a video demonstrating how to create applications using the **Keyrock** GUI

## Application CRUD Actions

The standard CRUD actions are assigned to the appropriate HTTP verbs (POST, GET, PATCH and DELETE) under the
`/v1/applications` endpoint.

### Create an Application

Once logged in, a user is presented with a home-screen

![](https://fiware.github.io/tutorials.Roles-Permissions/img/apps-and-orgs.png)

From the homepage of the GUI, a new application can be created by clicking the **Register** button.

![](https://fiware.github.io/tutorials.Roles-Permissions/img/create-app.png)

To create a new application via the REST API, send a POST request to the `/v1/application` endpoint containing details
of the application such as `name` and `description`, along with OAuth information fields such as the `url` of the
webservice to be protected, and `redirect_uri` (where a user will be challenged for their credentials). The
`grant_types` are chosen from the available list of OAuth2 grant flows. The headers include the `X-Auth-token` from a
previously logged in user will automatically be granted a provider role over the application.

#### 3 Request:

In the example below, Alice (who holds `X-Auth-token=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`) is creating a new
application which accepts three different grant types

```bash
curl -iX POST \
  'http://localhost:3005/v1/applications' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \
  -d '{
  "application": {
    "name": "Tutorial Application",
    "description": "FIWARE Application protected by OAuth2 and Keyrock",
    "redirect_uri": "http://tutorial/login",
    "url": "http://tutorial",
    "grant_type": [
      "authorization_code",
      "implicit",
      "password"
    ]
  }
}'
```

#### Response:

The response includes a Client ID and Secret which can be used to secure the application.

```json
{
    "application": {
        "id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482",
        "secret": "aa2d0845-0a8e-4ae8-addf-3c87bcab19e1",
        "image": "default",
        "name": "Tutorial Application",
        "description": "FIWARE Application protected by OAuth2 and Keyrock",
        "redirect_uri": "http://tutorial/login",
        "url": "http://tutorial",
        "grant_type": "password,authorization_code,implicit",
        "response_type": "code,token"
    }
}
```

Copy the Application Client ID to be used for all other application requests - in the case above the ID is
`3782c5e3-88f9-481a-9b3c-2f2d6f604482`

### Read Application Details

Making a GET request to a resource under the `/v1/applications/{{application-id}}` endpoint will return the application
listed under that ID. The `X-Auth-token` must be supplied in the headers.

![](https://fiware.github.io/tutorials.Roles-Permissions/img/app-with-oauth.png)

#### 4 Request

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

```json
{
    "application": {
        "id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482",
        "name": "Tutorial Application",
        "description": "FIWARE Application protected by OAuth2 and Keyrock",
        "secret": "aa2d0845-0a8e-4ae8-addf-3c87bcab19e1",
        "url": "http://tutorial",
        "redirect_uri": "http://tutorial/login",
        "image": "default",
        "grant_type": "password,authorization_code,implicit",
        "response_type": "code,token",
        "client_type": null,
        "scope": null,
        "extra": null
    }
}
```

### List all Applications

Users will only be permitted to return applications they are associated with. Listing applications can be done by making
a GET request to the `/v1/applications` endpoint and supplying the `X-Auth-token` Header

#### 5 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

```json
{
    "applications": [
        {
            "id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482",
            "name": "Tutorial Application",
            "description": "FIWARE Application protected by OAuth2 and Keyrock",
            "image": "default",
            "url": "http://tutorial",
            "redirect_uri": "http://tutorial/login",
            "grant_type": "password,authorization_code,implicit",
            "response_type": "code,token",
            "client_type": null
        }
    ]
}
```

### Update an Application

Within the GUI, users can be updated by selecting an application and clicking on `edit`. This can also be done from the
command-line by making PATCH request to `/v1/applications/<applications-id>` endpoint when the applications ID is known.
The `X-Auth-token` header must also be set, since a User can only edit applications he is associated with.

#### 6 Request:

```bash
curl -X PATCH \
  'http://localhost:3005/v1/applications/{{application-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "application": {
    "name": "Tutorial New Name",
    "description": "This is a new description",
    "redirect_uri": "http://tutorial/login",
    "grant_type": [
      "authorization_code",
      "password"
    ]
  }
}'
```

#### Response:

The response lists the fields which have been updated, note that the `redirect_uri` defined above had already been set:

```json
{
    "values_updated": {
        "name": "Tutorial New Name",
        "description": "This is a new description",
        "grant_type": "password,authorization_code",
        "response_type": "code"
    }
}
```

### Delete an Application

Within the GUI, users can delete an application by selecting an application and clicking on `edit`, then scrolling to
the bottom of the page and selecting **Remove Application**. This can also be done from the command-line by sending a
DELETE request to the `/v1/applications/<applications-id>` endpoint. The `X-Auth-token` header must also be set.

#### 7 Request:

```bash
curl -iX DELETE \
  'http://localhost:3005/v1/applications/{{applications-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

## Permission CRUD Actions

An application permission is an allowable action on a resource within that application. Each resource is defined by a
URL (e.g. `/price-change`) and the action is any HTTP verb (e.g. GET)

-   the combination will be used to ensure only permitted users are able to access the `/price-change` resource.

Further advanced permission rules can be described using XACML - this is the subject of another tutorial.

It should be emphasized that permissions are always found bound to an application - abstract permissions do not exist on
their own. The standard permision CRUD actions are assigned to the appropriate HTTP verbs (POST, GET, PATCH and DELETE)
under the `/v1/applications/{{application-id}}/permissions` endpoint

-   as you can see the `<application-id>` itself is integral to the URL.

Permissions are usually defined once and set-up when the application is created. If the design of your use-case means
that you find you need to alter the permissions regularly, then the definition has probably been defined incorrectly or
in the wrong layer - complex access control rules should be pushed down into the XACML definitions or moved into the
business logic of the application - they should not be dealt with within **Keyrock**.

### Create a Permission

Within the GUI, a permission can be added to an application by selecting the application, clicking on **Manage Roles**
and then pressing the plus next to the Permissions label.

![](https://fiware.github.io/tutorials.Roles-Permissions/img/create-permission.png)

Just fill out the wizard and click save.

To create a new permission via the REST API, send a POST request to the `/applications/{{application-id}}/permissions`
endpoint containing the `action`and `resource` along with the `X-Auth-token` header from a previously logged in user.

#### 8 Request:

```bash
curl -iX POST \
  'http://localhost:3005/v1/applications/{{application-id}}/permissions' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "permission": {
    "name": "Access Price Changes",
    "action": "GET",
    "resource": "/price-change"
  }
}'
```

#### Response:

The response returns the details of the newly created permission.

```json
{
    "permission": {
        "id": "c8ace792-d058-4650-9958-59753215e1cc",
        "is_internal": false,
        "name": "Access Price Changes",
        "action": "GET",
        "resource": "/price-change",
        "oauth_client_id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482"
    }
}
```

### Read Permission Details

The `/applications/{{application-id}}/permissions/{permission-id}}` endpoint will return the permission listed under
that ID. The `X-Auth-token` must be supplied in the headers.

#### 9 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/permissions/{{permission-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns the details of the requested permission.

```json
{
    "permission": {
        "id": "c21983d5-58f9-4bcc-b2b0-f21819080ad0",
        "name": "Enable Alarm Bell",
        "description": null,
        "is_internal": false,
        "action": "POST",
        "resource": "/ring",
        "xml": null,
        "oauth_client_id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482"
    }
}
```

### List Permissions

Listing the permissions with an application can be done by making a GET request to the
`/v1/applications/{{application-id}}/permissions/` endpoint

#### 10 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/permissions' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The complete list of permissions includes any custom permissions created previously plus all the standard permissions
which are avaiable by default

```json
{
    "permissions": [
        {
            "id": "c8ace792-d058-4650-9958-59753215e1cc",
            "name": "Access Price Changes",
            "description": null,
            "action": "GET",
            "resource": "/price-change",
            "xml": null
        },
        {
            "id": "c21983d5-58f9-4bcc-b2b0-f21819080ad0",
            "name": "Enable Alarm Bell",
            "description": null,
            "action": "POST",
            "resource": "/ring",
            "xml": null
        },
        ...etc
        {
            "id": "2",
            "name": "Manage the application",
            "description": null,
            "action": null,
            "resource": null,
            "xml": null
        },
        {
            "id": "1",
            "name": "Get and assign all internal application roles",
            "description": null,
            "action": null,
            "resource": null,
            "xml": null
        }
    ]
}
```

### Update a Permission

To amend the details of an existing permission, a PATCH request is send to the
`/applications/{{application-id}}/permissions/{permission-id}}` endpoint.

#### 11 Request:

```bash
curl -X PATCH \
  'http://localhost:3005/v1/applications/{{application-id}}/permissions/{{permission-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "permission": {
    "name": "Ring Alarm Bell",
    "action": "POST",
    "resource": "/ring"
  }
}'
```

#### Response:

The response contains a list of the fields which have been amended.

```json
{
    "values_updated": {
        "name": "Ring Alarm Bell"
    }
}
```

### Delete an Permission

Deleting a permission from an application automatically removes that permission from any associated roles.

#### 12 Request:

```bash
curl -X DELETE \
  'http://keyrock/v1/applications/{{application_id}}/permissions/{{permission_id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

## Role CRUD Actions

A permission is an allowable action on a resource, as noted above. A role consists of a group of permissions, in other
words a series of permitted actions over a group of resources. Roles are usually given a description with a broad scope
so that they can be assigned to a wide range of users or organizations for example a _Reader_ role could be able to
access but not update a series of devices.

There are two predefined roles with **Keyrock** :

-   a _Purchaser_ who can
    -   Get and assign all public application roles
-   a _Provider_ who can:
    -   Get and assign only public owned roles
    -   Get and assign all public application roles
    -   Manage authorizations
    -   Manage roles
    -   Manage the application
    -   Get and assign all internal application roles

Using our Supermarket Store Example, Alice the admin would be assigned the _Provider_ role, she could then create any
additional application-specific roles needed (such as _Management_ or _Security_)

Once again, roles are always directly bound to an application - abstract roles do not exist on their own. The standard
CRUD actions are assigned to the appropriate HTTP verbs (POST, GET, PATCH and DELETE) under the
`/v1/applications/{{application-id}}/roles` endpoint.

### Create a Role

Within the GUI, a role can be added to an application by selecting the application, clicking on **Manage Roles** and
then pressing the plus next to the Role label.

![](https://fiware.github.io/tutorials.Roles-Permissions/img/create-role.png)

Just fill out the wizard and click save.

To create a new role via the REST API, send a POST request to the `/applications/{{application-id}}/roles` endpoint
containing the `name` of the new role, with the `X-Auth-token` header from a previously logged in user.

#### 13 Request:

```bash
curl -X POST \
  'http://localhost:3005/v1/applications/{{application-id}}/roles' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "role": {
    "name": "Management"
  }
}'
```

#### Response:

The details of the created role are returned

```json
{
    "role": {
        "id": "bc64fe78-f440-4ce0-815d-78b1d3d8b9a1",
        "is_internal": false,
        "name": "Management",
        "oauth_client_id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482"
    }
}
```

### Read Role Details

The `/applications/{{application-id}}/roles/{role-id}}` endpoint will return the role listed under that ID. The
`X-Auth-token` must be supplied in the headers.

#### 14 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/roles/{{role-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns the details of the requested role.

```json
{
    "role": {
        "id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c",
        "name": "Security",
        "is_internal": false,
        "oauth_client_id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482"
    }
}
```

### List Roles

Listing all the roles offered by an application can be done by making a GET request to the
`/v1/applications/{{application-id/roles` endpoint

#### 15 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/roles' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

A summary of all roles associated with the application is returned containing both standard roles and custom roles.

```json
{
    "roles": [
        {
            "id": "purchaser",
            "name": "Purchaser"
        },
        {
            "id": "provider",
            "name": "Provider"
        },
        {
            "id": "bc64fe78-f440-4ce0-815d-78b1d3d8b9a1",
            "name": "Management"
        },
        {
            "id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c",
            "name": "Security"
        }
    ]
}
```

### Update a Role

It is possible to amend the name of a role using a PATCH request is sent to the
`/applications/{{application-id}}/permissions/{permission-id}}` endpoint.

#### 16 Request:

```bash
curl -iX PATCH \
  'http://localhost:3005/v1/applications/{{application-id}}/roles/{{role-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "role": {
    "name": "Security Team"
  }
}'
```

#### Response:

The response contains a list of the fields which have been amended.

```json
{
    "values_updated": {
        "name": "Security Team"
    }
}
```

### Delete a Role

Application roles can also be deleted - this will also remove the role from any users.

#### 17 Request:

```bash
curl -iX DELETE \
  'http://localhost:3005/v1/applications/{{application-id}}/roles/{{role-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

## Assigning Permissions to each Role

Having created a set of application permissions, and a series of application roles, the next step is to assign the
relevant permissions to each role - in other words defining _Who can do What_.

### Add a Permission to a Role

Within the GUI, select the role and check permissions from the list before saving.

![](https://fiware.github.io/tutorials.Roles-Permissions/img/add-permission-to-role.png)

To add a permission using the REST API make a PUT request as shown, including the `<application-id>`, `<role-id>` and
`<permission-id>` in the URL path and identifying themselves using an `X-Auth-Token` in the header.

#### 18 Request:

```bash
curl -iX PUT \
  'http://localhost:3005/v1/applications/{{application-id}}/roles/{{role-id}}/permissions/{{permission-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns the permissions for the role

```json
{
    "role_permission_assignments": {
        "role_id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c",
        "permission_id": "c21983d5-58f9-4bcc-b2b0-f21819080ad0"
    }
}
```

### List Permissions of a Role

A full list of all permissions assigned to an application role can be retrieved by making a GET request to the
`/v1/applications/{{application-id}}/roles/{{role-id}}/permissions` endpoint

#### 19 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/roles/{{role-id}}/permissions' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

```json
{
    "role_permission_assignments": [
        {
            "id": "c21983d5-58f9-4bcc-b2b0-f21819080ad0",
            "is_internal": false,
            "name": "Ring Alarm Bell",
            "description": null,
            "action": "POST",
            "resource": "/ring",
            "xml": null
        },
        {
            "id": "2d611223-0b9e-4ffb-83b4-518e236890b6",
            "is_internal": false,
            "name": "Unlock",
            "description": "Unlock main entrance",
            "action": "POST",
            "resource": "/door/unlock",
            "xml": null
        }
    ]
}
```

### Remove a Permission from a Role

To remove a permission using the REST API make a DELETE request as shown, including the `<application-id>`, `<role-id>`
and `<permission-id>` in the URL path and identifying themselves using an `X-Auth-Token` in the header.

#### 20 Request:

```bash
curl -X DELETE \
  'http://keyrock/v1/applications/{{application_id}}/roles/{{role_id}}/permissions/{{permission_id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

# Authorizing Application Access

In the end, a user logs into an application , identifies himself and then is granted a list of permissions that the user
is able to do. However it should be emphasized that it is the application, not the user that holds and offers the
permissions, and the user is merely associated with a aggregated list of permissions via the role(s) they have been
granted.

The application can grant roles to either Users or Organizations - the latter should always be preferred, as it allows
the owners of the organization to add new users - delegating the responsibility for user maintenance to a wider group.

For example, imagine the supermarket gains another store detective. Alice has already created role called Security and
assigned it to the Security team. Charlie is the owner of the Security team organization, and is able to add the new
`detective3` user to his team. `detective3` can then inherit all the rights of his team without further input from
Alice.

Granting roles to individual Users should be restricted to special cases - some roles may be very specialized an only
contain one member so there is no need to create an organization. This reduced the administrative burden when setting up
the application, but any further changes (such as removing access rights when someone leaves) will need to be done by
Alice herself - no delegation is possible.

## Authorizing Organizations

A role cannot be granted to an organization unless the role has already been defined within the application itself. The
organization must also have be created as was demonstrated in the previous tutorial.

### Grant a Role to an Organization

To grant an organization access to an application, click on the appliation to get to the details page and scroll to the
bottom of the page, click the **Authorize** button and select the relevant organization.

![](https://fiware.github.io/tutorials.Roles-Permissions/img/add-role-to-org.png)

A Role can be granted to either `members` or `owners` of an Organization. Using the REST API, the role can be granted
making a PUT request as shown, including the `<application-id>`, `<role-id>` and `<organzation-id>` in the URL path and
identifying themselves using an `X-Auth-Token` in the header.

#### 21 Request:

This example adds the role to all members of the organization

```bash
curl -iX PUT \
  'http://localhost:3005/v1/applications/{{application-id}}/organizations/{{organization-id}}/roles/{{role-id}}/organization_roles/member' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response lists the role assignment as shown:

```json
{
    "role_organization_assignments": {
        "role_id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c",
        "organization_id": "security-0000-0000-0000-000000000000",
        "oauth_client_id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482",
        "role_organization": "member"
    }
}
```

### List Granted Organization Roles

A full list of roles granted to an organization can be retrieved by making a GET request to the
`/v1/applications/{{application-id}}/organizations/{{organization-id}}/roles` endpoint

#### 22 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/organizations/{{organization-id}}/roles' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response shows all roles assigned to the organization

```json
{
    "role_organization_assignments": [
        {
            "organization_id": "security-0000-0000-0000-000000000000",
            "role_id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c"
        }
    ]
}
```

### Revoke a Role from an Organization

To revoke a role using the REST API make a DELETE request as shown, including the `<application-id>`,
`<organization-id>` and `<role-id>` in the URL path and identifying themselves using an `X-Auth-Token` in the header.

The following example revokes a role to `members` of the organization.

#### 23 Request:

```bash
curl -iX DELETE \
  'http://localhost:3005/v1/applications/{{application-id}}/organizations/{{organization-id}}/roles/{{role-id}}/organization_roles/member' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

## Authorizing Individual User Accounts

A defined role cannot be granted to a user unless the role has already been associated to an application

### Grant a Role to a User

Granting User access via the GUI can be done in the same manner as for organizations.

A Role can be granted to either `members` or `owners` of an Organization. Using the REST API, the role can be granted
making a PUT request as shown, including the `<application-id>`, `<role-id>` and `<user-id>` in the URL path and
identifying themselves using an `X-Auth-Token` in the header.

#### 24 Request:

```bash
curl -iX PUT \
  'http://localhost:3005/v1/applications/{{application-id}}/users/{{user-id}}/roles/{{role-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

```json
{
    "role_user_assignments": {
        "role_id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c",
        "user_id": "bbbbbbbb-good-0000-0000-000000000000",
        "oauth_client_id": "3782c5e3-88f9-481a-9b3c-2f2d6f604482"
    }
}
```

### List Granted User Roles

To list the roles granted to an Individual user, make a GET request to the
`v1/applications/{{application-id}}/users/{{user-id}}/roles` endpoint

#### 25 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/users/{{user-id}}/roles' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns all roles assigned to the user

```json
{
    "role_user_assignments": [
        {
            "user_id": "bbbbbbbb-good-0000-0000-000000000000",
            "role_id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c"
        }
    ]
}
```

### Revoke a Role from a User

In a similar manner to organizations, to revoke a user role using the REST API make a DELETE request as shown, including
the `<application-id>`, `<user-id>` and `<role-id>` in the URL path and identifying themselves using an `X-Auth-Token`
in the header.

#### 26 Request:

```bash
curl -iX DELETE \
  'http://localhost:3005/v1/applications/{{application-id}}/users/{{user-id}}/roles/{{role-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

## List Application Grantees

By creating a series of roles and granting them to Users and Organizations, we have made an association between them.
The REST API offers two convienience methods exist to list all the grantees of an application

### List Authorized Organizations

To list all organizations which are authorized to use an application, make a GET request to the
`/v1/applications/{{application-id}}/organizations` endpoint.

#### 27 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/organizations/{{organizations-id}}/roles' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns all organizations which can access the application and the roles they have been assigned.
Individual members are not listed.

```json
{
    "role_organization_assignments": [
        {
            "organization_id": "security-0000-0000-0000-000000000000",
            "role_organization": "member",
            "role_id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c"
        }
    ]
}
```

### List Authorized Users

To list all individual users who are authorized to use an application, make a GET request to the
`/v1/applications/{{application-id}}/users` endpoint.

#### 28 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/applications/{{application-id}}/users/{{user-id}}/roles' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns all individual users who can access the application and the roles they have been assigned. Note
that users of an organization granted access are not listed.

```json
{
    "role_user_assignments": [
        {
            "user_id": "aaaaaaaa-good-0000-0000-000000000000",
            "role_id": "provider"
        },
        {
            "user_id": "bbbbbbbb-good-0000-0000-000000000000",
            "role_id": "64535f4d-04b6-4688-a9bb-81b8df7c4e2c"
        }
    ]
}
```
