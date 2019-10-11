[![FIWARE Security](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/security.svg)](https://github.com/FIWARE/catalogue/blob/master/security/README.md)

**Description:** This tutorial is an introduction to [FIWARE Keyrock](https://fiware-idm.readthedocs.io/en/latest/) - a
generic enabler which introduces **Identity Management** into FIWARE services. The tutorial explains how to create users
and organizations in preparation to assign roles and permissions to them in a later tutorial.

The tutorial demonstrates examples of interactions using the **Keyrock** GUI, as well [cUrl](https://ec.haxx.se/)
commands used to access the **Keyrock** REST API -
[Postman documentation](https://fiware.github.io/tutorials.Identity-Management/) is also available.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/2150531e68299d46f937)

<hr class="security"/>

# Identity Management

> "If one meets a powerful person — ask them five questions: ‘What power have you got? Where did you get it from? In
> whose interests do you exercise it? To whom are you accountable? And how can we get rid of you?’"
>
> — Anthony Wedgwood Benn (The Five Essential Questions of Democracy)

In computer security terminology, Identity management is the security and business discipline that "enables the right
individuals to access the right resources at the right times and for the right reasons". It addresses the need to ensure
appropriate access to resources across disparate systems.

The FIWARE framework consists of a series of separate components, and the security chapter aims to implement the common
needs of these components regarding who (or what) gets to access which resources within the system, but before access to
resources can be locked down, the identity of the person (or service) making the request needs to be known. The FIWARE
**Keyrock** Generic Enabler sets up all of the common characteristics of an Identity Management System out-of-the-box,
so that other components are able to use standard authentication mechanisms to accept or reject requests based on
industry standard protocols.

Identity Management therefore covers the issues of how to gain an identity within the system, the protection of that
identity and the surrounding technologies such as passwords and network protocols.

<h3>Standard Concepts of Identity Management</h3>

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

![](https://fiware.github.io/tutorials.Identity-Management/img/entities.png)

<h3>Video : Introduction to Keyrock</h3>

[![](http://img.youtube.com/vi/dHyVTan6bUY/0.jpg)](https://www.youtube.com/watch?v=dHyVTan6bUY "Introduction")

Click on the image above to watch an introductory video

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
    -   Used to persist user identities, applications, roles and permissions

Since all interactions between the services are initiated by HTTP requests, the services can be containerized and run
from exposed ports.

![](https://fiware.github.io/tutorials.Identity-Management/img/architecture.png)

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
        - DATABASE_HOST=mysql-db
        - IDM_DB_PASS_FILE=/run/secrets/my_secret_data
        - IDM_DB_USER=root
        - IDM_HOST=http://localhost:3005
        - IDM_PORT=3005
        - IDM_HTTPS_ENABLED=true
        - IDM_HTTPS_PORT=3443
        - IDM_ADMIN_USER=admin
        - IDM_ADMIN_EMAIL=admin@test.com
        - IDM_ADMIN_PASS=1234
    secrets:
        - my_secret_data
```

The `idm` container is a web application server listening on two ports:

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

The `idm` container is driven by environment variables as shown:

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
git clone git@github.com:FIWARE/tutorials.Identity-Management.git
cd tutorials.Identity-Management

./services create
```

> **Note** The initial creation of Docker images can take up to three minutes

Thereafter, all services can be initialized from the command-line by running the
[services](https://github.com/FIWARE/tutorials.Identity-Management/blob/master/services) Bash script provided within the
repository:

```bash
./services <command>
```

Where `<command>` will vary depending upon the exercise we wish to activate.

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> `./services stop`

<h3>Reading directly from the Keyrock MySQL Database</h3>

All Identify Management records and relationships are held within the attached MySQL database. This can be accessed by
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
be found [here](https://fiware.github.io/tutorials.Identity-Management/img/keyrock-db.png)

<h3>UUIDs within Keyrock</h3>

All IDs and tokens within **Keyrock** are subject to change. The following values will need to be amended when querying
for records. Record IDs use Universally Unique Identifiers - UUIDs.

| Key                    | Description                                                                                                                        | Sample Value                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `keyrock`              | URL for the location of the **Keyrock** service                                                                                    | `localhost:3005` for HTTP or `localhost:3443` for HTTPS |
| `X-Auth-token`         | Token received in the Header when logging in as a user - in other words _"Who am I?"_                                              | `51f2e380-c959-4dee-a0af-380f730137c3`                  |
| `X-Subject-token`      | Token added to requests to define _"Who do I want to inquire about?"_ - This can also be a repeat the `X-Auth-token` defined above | `51f2e380-c959-4dee-a0af-380f730137c3`                  |
| `user-id`              | ID of an existing user, found with the `user` table                                                                                | `96154659-cb3b-4d2d-afef-18d6aec0518e`                  |
| `organization-id`      | ID of an existing organization, found with the `organization` table                                                                | `e424ed98-c966-46e3-b161-a165fd31bc01`                  |
| `organization-role-id` | type of role a user has within an organization either `owner` or `member`                                                          | `member`                                                |

Tokens are designed to expire after a set period. If the `X-Auth-token` value you are using has expired, log-in again to
obtain a new token.

---

# Authentication

<h3>Video : Creating User Accounts with the Keyrock GUI</h3>

[![](http://img.youtube.com/vi/dtKsjGbJ7Xc/0.jpg)](https://www.youtube.com/watch?v=dtKsjGbJ7Xc "Creating User Accounts")

Click on the image above to watch a video demonstrating how to create users with the **Keyrock** GUI

## Logging in to Keyrock

The Log-in Screen allows an existing user to identify themselves and obtain a token for further operations. It is the
initial start-up screen of the **Keyrock** GUI - `http://localhost:3005/idm` (or `https://localhost:3443/idm` and accept
the warnings)

![](https://fiware.github.io/tutorials.Identity-Management/img/log-in.png)

Enter a username and password to enter the **Keyrock** application. The default super-user has the values
`admin@test.com` and `1234`.

### Create Token with Password

The following example logs in using the super-admin user - it is the equivalent of using the log-in screen of the GUI.
The URL `https://localhost:3443/v1/auth/tokens` should also work in a secure system.

#### 1 Request:

```bash
curl -iX POST \
  'http://localhost:3005/v1/auth/tokens' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "admin@test.com",
  "password": "1234"
}'
```

#### Response:

The response header returns an `X-Subject-token` which identifies who has logged on the application. This token is
required in all subsequent requests to gain access

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

### Get User Information via a Token

Once a user has logged in, the presence of a (time-limited) token is sufficient to find out more information about the
user.

`{{X-Auth-token}}` and `{{X-Subject-token}}` should be taken from the previous request, in the case of the response
above, both variables should be set to `d848eb12-889f-433b-9811-6a4fbf0b86ca` - this indicates that _the user authorized
with the token `{{X-Auth-token}}` is enquiring about the user holding the token `{{X-Subject-token}}`_ - in this case we
only have one user within the **Keyrock** application, and that user is enquiring about himself.

#### 2 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/auth/tokens' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -H 'X-Subject-token: {{X-Subject-token}}'
```

#### Response:

The response will return the details of the associated user

```json
{
    "access_token": "51f2e380-c959-4dee-a0af-380f730137c3",
    "expires": "2018-07-30T13:02:37.000Z",
    "valid": true,
    "User": {
        "id": "admin",
        "username": "admin",
        "email": "admin@test.com",
        "date_password": "2018-07-30T09:55:38.000Z",
        "enabled": true,
        "admin": true
    }
}
```

### Refresh Token

Tokens are time limited - it is no longer possible to gain access once a token has expired. However it is possible to
refresh a token for a newer one prior to expiry.

Most applications use this endpoint to avoid timing out a user whilst they are interacting with the application.

The `token` value, `d848eb12-889f-433b-9811-6a4fbf0b86ca` was acquired when the user logged on for the first time

#### 3 Request:

```bash
curl -iX POST \
  'http://localhost:3005/v1/auth/tokens' \
  -H 'Content-Type: application/json' \
  -d '{
  "token": "d848eb12-889f-433b-9811-6a4fbf0b86ca"
}'
```

#### Response:

A new token is returned in the `X-Subject-Token` header

```text
HTTP/1.1 201 Created
X-Subject-Token: a5b83d68-ebad-4514-9d3a-dd892f6e6174
Content-Type: application/json; charset=utf-8
Content-Length: 135
ETag: W/"87-nPb+4XRSsW5Szsf2JJC6UYab4GM"
Date: Mon, 30 Jul 2018 12:41:47 GMT
Connection: keep-alive
```

```json
{
    "token": {
        "methods": ["token"],
        "expires_at": "2018-07-30T13:13:20.567Z"
    },
    "idm_authorization_config": {
        "level": "basic",
        "authzforce": false
    }
}
```

# Administrating User Accounts

Users accounts are at the heart of any identity management system. The essential fields of every account hold a unique
username and email address to identify the user, along with a password for authentication. The other optional fields add
more information about the user such as a user website, description or avatar.

As the default super-admin user `admin@test.com` with a password of `1234`, we will set up a series of user accounts and
assign them to relevant organizations within the system.

<h3>Dramatis Personae</h3>

The following people legitimately have accounts within the Application

-   Alice, she will be the Administrator of the **Keyrock** Application
-   Bob, the Regional Manager of the supermarket chain - he has several store managers under him:
    -   Manager1
    -   Manager2
-   Charlie, the Head of Security of the supermarket chain - he has several store detectives under him:
    -   Detective1
    -   Detective2

## User CRUD Actions

#### GUI

Users are able to sign-up for themselves using the GUI. The only requirement is an email address and a password.

![](https://fiware.github.io/tutorials.Identity-Management/img/sign-up.png)

Once an account is created, the user is sent an eMail to confirm their existence and activate their account.

![](https://fiware.github.io/tutorials.Identity-Management/img/email.png)

#### REST API

The REST API is also able to create and amend users without their own interaction - this could be useful for bulk CRUD
actions for example.

> **Note** - an eMail server must be configured to send out invites properly, otherwise the invitation may be deleted as
> spam. For testing purposes, it is easier to update the users table directly: `update user set enabled = 1;`

All the CRUD actions for Users require an `X-Auth-token` header from a previously logged in administrative user to be
able to read or modify other user accounts. The standard CRUD actions are assigned to the appropriate HTTP verbs (POST,
GET, PATCH and DELETE) under the `/v1/users` endpoint.

### Creating Users

To create a new user, send a POST request to the `/v1/users` endpoint containing the `username`,`email` and `password`
along with the `X-Auth-token` header from a previously logged in administrative user.

#### 4 Request:

```bash
curl -iX POST \
  'http://localhost:3005/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "user": {
    "username": "alice",
    "email": "alice@test.com",
    "password": "test"
  }
}'
```

#### Response:

The response returns the details of the created user

```json
{
    "user": {
        "id": "3b3a5ad5-afd3-4baa-a538-25c7fe7cbf6a",
        "image": "default",
        "gravatar": false,
        "enabled": true,
        "admin": false,
        "starters_tour_ended": false,
        "username": "alice",
        "email": "alice@test.com",
        "date_password": "2018-07-30T12:51:26.813Z"
    }
}
```

To grant super-admin power to a newly created user account, the database can be altered directly:

```sql
update user set admin = 1 where username='alice';
```

Additional users can be added by making repeated POST requests.

For example to create additional accounts for Bob, the Regional Manager, Charlie, the Head of Security and their direct
reports

```bash
curl -iX POST \
  'http://localhost:3005/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "user": {
    "username": "bob",
    "email": "bob-the-manager@test.com",
    "password": "test"
  }
}'
```

```bash
curl -iX POST \
  'http://localhost:3005/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "user": {
    "username": "charlie",
    "email": "charlie-security@test.com",
    "password": "test"
  }
}'
```

```bash
curl -iX POST \
  'http://localhost:3005/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "user": {
    "username": "manager1",
    "email": "manager1@test.com",
    "password": "test"
  }
}'
```

```bash
curl -iX POST \
  'http://localhost:3005/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "user": {
    "username": "manager1",
    "email": "manager1@test.com",
    "password": "test"
  }
}'
```

```bash
curl -iX POST \
  'http://localhost:3005/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "user": {
    "username": "detective1",
    "email": "detective1@test.com",
    "password": "test"
  }
}'
```

```bash
curl -iX POST \
  'http://localhost:3005/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "user": {
    "username": "detective1",
    "email": "detective1@test.com",
    "password": "test"
  }
}'
```

### Read Information About a User

Making a GET request to a resource under the `/v1/users/{{user-id}}` endpoint will return the user listed under that ID.
The `X-Auth-token` must be supplied in the headers.

#### 5 Request:

To request

```bash
curl -X GET \
  'http://localhost:3005/v1/users/{{user-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response contains basic details of the account in question:

```json
{
    "user": {
        "id": "96154659-cb3b-4d2d-afef-18d6aec0518e",
        "username": "alice",
        "email": "alice-the-admin@test.com",
        "enabled": true,
        "admin": false,
        "image": "default",
        "gravatar": false,
        "date_password": "2018-07-30T09:56:37.000Z",
        "description": null,
        "website": null
    }
}
```

### List all Users

Obtaining a complete list of all users is a super-admin permission requiring the `X-Auth-token` - most users will only
be permitted to return users within their own organization. Listing users can be done by making a GET request to the
`/v1/users` endpoint

#### 6 Request:

#### Response:

```json
{
    "users": [
        {
            "id": "06a2140f-ccc3-49e5-82a5-76bae48b38ba",
            "username": "alice",
            "email": "alice-the-admin@test.com",
            "enabled": true,
            "gravatar": false,
            "date_password": "2018-07-30T11:41:14.000Z",
            "description": null,
            "website": null
        },
        {
            "id": "27e6ae58-adc1-4aaf-a6a2-f207946ba57e",
            "username": "bob",
            "email": "bob-the-manager@test.com",
            "enabled": true,
            "gravatar": false,
            "date_password": "2018-07-30T10:01:12.000Z",
            "description": null,
            "website": null
        },
        ...etc
    ]
}
```

### Update a User

Within the GUI, users can be updated from the settings page. This can also be done from the command-line by making PATCH
request to `/v1/users/<user-id>` endpoint when the user ID is known. The `X-Auth-token` header must also be set.

#### 7 Request:

```bash
curl -iX PATCH \
  'http://localhost:3005/v1/users/{{user-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "user": {
      "username": "alice",
      "email": "alice-the-admin@test.com",
      "enabled": true,
      "gravatar": false,
      "date_password": "2018-07-26T15:25:14.000Z",
      "description": "Alice works for FIWARE",
      "website": "http://www.fiware.org"
  }
}'
```

#### Response:

The response lists the fields which have been updated:

```json
{
    "values_updated": {
        "description": "Alice works for FIWARE",
        "website": "http://www.fiware.org"
    }
}
```

### Delete a User

Within the GUI, users can delete their account from the settings page, selecting the **Cancel Account** Option, once
again a super-admin user can do this from the command-line by sending a DELETE request to the `/v1/users/{{user-id}}`
endpoint. The `X-Auth-token` header must also be set.

#### 8 Request:

```bash
curl -iX DELETE \
  'http://localhost:3005/v1/users/{{user-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

---

# Grouping User Accounts under Organizations

For any identity management system of a reasonable size, it is useful to be able to assign roles to groups of users,
rather than setting them up individually. Since user administration is a time consuming business, it is also necessary
to be able to delegate the responsibility of managing these group of users down to other accounts with a lower level of
access.

Consider our supermarket chain for example, there could be a group of users (Managers) who can change the prices of
products within the store, and another group of users (Store Detectives) who can lock and unlock door after closing
time. Rather than give access to each individual account, it would be easier to assign the rights to an organization and
then add users to the groups.

Furthermore, Alice, the **Keyrock** administrator does not need to explicitly add additional user accounts to each
organization herself - she could delegate that right to an owner within each organization. For example Bob the Regional
Manager would be made the owner of the _management_ organization and could add and remove addition manager accounts
(such as `manager1` and `manager2`) to that organization whereas Charlie the Head of Security could be handed an
ownership role in the _security_ organization and add additional store detectives to that organization.

Note that Bob does not have the rights to alter the membership list of the _security_ organization and Charlie does not
have the rights to alter the membership list of the _management_ organization. Furthermore neither Bob nor Charlie would
be able to alter the permissions of the application themselves, merely add and remove existing user accounts to the
organization they control.

Creating an application and setting-up the permissions is not covered here as it is the subject of the next tutorial.

## Organization CRUD Actions

#### GUI

Once signed-in, users are able to create and update organizations for themselves.

![](https://fiware.github.io/tutorials.Identity-Management/img/create-org.png)

#### REST API

Alternatively, the standard CRUD actions are assigned to the appropriate HTTP verbs (POST, GET, PATCH and DELETE) under
the `/v1/organizations` endpoint.

### Create an Organization

To create a new organization, send a POST request to the `/v1/organizations` endpoint containing the `name` and
`description` along with the `X-Auth-token` header from a previously logged in user.

#### 9 Request:

```bash
curl -iX POST \
  'http://localhost:3005/v1/organizations' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
  "organization": {
    "name": "Security",
    "description": "This group is for the store detectives"
  }
}'
```

#### Response:

The Organization is created and the user who created it is automatically assigned as a user. The response returns UUID
to identify the new organization.

```json
{
    "organization": {
        "id": "18deea43-e12a-4018-a45a-664c3158780d",
        "image": "default",
        "name": "Security",
        "description": "This group is for the store detectives"
    }
}
```

### Read Organization Details

Making a GET request to a resource under the `/v1/organizations/{{organization-id}}` endpoint will return the
organization listed under that ID. The `X-Auth-token` must be supplied in the headers as only permitted organizations
will be shown.

#### 10 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/organizations/{{organization-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns the details of the organization.

```json
{
    "organization": {
        "id": "18deea43-e12a-4018-a45a-664c3158780d",
        "name": "Security",
        "description": "This group is for the store detectives",
        "website": null,
        "image": "default"
    }
}
```

### List all Organizations

Obtaining a complete list of all users is a super-admin permission requiring the `X-Auth-token` - most users will only
be permitted to return users within their own organization. Listing users can be done by making a GET request to the
`/v1/organizations` endpoint

#### 11 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/organizations' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns the details of the visible organizations.

```json
{
    "organizations": [
        {
            "role": "owner",
            "Organization": {
                "id": "18deea43-e12a-4018-a45a-664c3158780d",
                "name": "Security",
                "description": "This group is for the store detectives",
                "image": "default",
                "website": null
            }
        },
        {
            "role": "owner",
            "Organization": {
                "id": "a45f9b5a-dd23-4d0f-a0d4-e97e2d7431a3",
                "name": "Management",
                "description": "This group is for the store manangers",
                "image": "default",
                "website": null
            }
        }
    ]
}
```

### Update an Organization

To amend the details of an existing organization, a PATCH request is send to the `/v1/organizations/{{organization-id}}`
endpoint.

#### 12 Request:

```bash
curl -iX PATCH \
  'http://localhost:3005/v1/organizations/{{organization-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}' \
  -d '{
    "organization": {
        "name": "FIWARE Security",
        "description": "The FIWARE Foundation is the legal independent body promoting, augmenting open-source FIWARE technologies",
        "website": "https://fiware.org"
    }
}'
```

#### Response:

The response contains a list of the fields which have been amended.

```json
{
    "values_updated": {
        "name": "FIWARE Security",
        "description": "The FIWARE Foundation is the legal independent body promoting, augmenting open-source FIWARE technologies",
        "website": "https://fiware.org"
    }
}
```

### Delete an Organization

#### 13 Request:

```bash
curl -iX DELETE \
  'http://localhost:3005/v1/organizations/{{organization-id}}' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

## Administrating Users within an Organization

Users within an Organization are assigned to one of types - `owner` or `member`. The members of an organization inherit
all of the roles and permissions assigned to the organization itself. In addition, owners of an organization are able to
add an remove other members and owners.

### Add a User as a Member of an Organization

To add a user to an organization using the GUI, first click on the existing organization, then click on the **Manage**
button:

![](https://fiware.github.io/tutorials.Identity-Management/img/add-user-to-org.png)

To add a user as a member of an organization, an owner must make a PUT request as shown, including the
`<organization-id>` and `<user-id>` in the URL path and identifying themselves using an `X-Auth-Token` in the header.

#### 14 Request:

```bash
curl -iX PUT \
  'http://localhost:3005/v1/organizations/{{organization-id}}/users/{{user-id}}/organization_roles/member' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response lists the user's current role within the organization (i.e. `member`)

```json
{
    "user_organization_assignments": {
        "role": "member",
        "organization_id": "18deea43-e12a-4018-a45a-664c3158780d",
        "user_id": "5e482345-2c48-410e-ae03-203d67a43cea"
    }
}
```

### Add a User as an Owner of an Organization

An owner can also create new owners by making a PUT request as shown, including the `<organization-id>` and `<user-id>`
in the URL path and identifying themselves using an `X-Auth-Token` in the header.

#### 15 Request:

```bash
curl -iX PUT \
  'http://localhost:3005/v1/organizations/{{organization-id}}/users/{{user-id}}/organization_roles/owner' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response lists the user's current role within the organization (i.e. `owner`)

```json
{
    "user_organization_assignments": {
        "role": "owner",
        "user_id": "5e482345-2c48-410e-ae03-203d67a43cea",
        "organization_id": "18deea43-e12a-4018-a45a-664c3158780d"
    }
}
```

### List Users within an Organization

To list the users of an organization using the GUI, just click on the existing organization:

![](https://fiware.github.io/tutorials.Identity-Management/img/org-with-users.png)

Listing users within an organization is an `owner` or super-admin permission requiring the `X-Auth-token` Listing users
can be done by making a GET request to the `/v1/organizations/{{organization-id}}/users` endpoint.

#### 16 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/organizations/{{organization-id}}/users' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response contains the users list.

```json
{
    "organization_users": [
        {
            "user_id": "admin",
            "organization_id": "18deea43-e12a-4018-a45a-664c3158780d",
            "role": "owner"
        },
        {
            "user_id": "5e482345-2c48-410e-ae03-203d67a43cea",
            "organization_id": "18deea43-e12a-4018-a45a-664c3158780d",
            "role": "member"
        }
    ]
}
```

### Read User Roles within an Organization

To find the role of a user within an organization, send a GET request to the
`/v1/organizations/{{organization-id}}/users/{{user-id}}/organization_roles` endpoint.

#### 17 Request:

```bash
curl -X GET \
  'http://localhost:3005/v1/organizations/{{organization-id}}/users/{{user-id}}/organization_roles' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```

#### Response:

The response returns the role of the given `<user-id>`

```json
{
    "organization_user": {
        "user_id": "5e482345-2c48-410e-ae03-203d67a43cea",
        "organization_id": "18deea43-e12a-4018-a45a-664c3158780d",
        "role": "member"
    }
}
```

### Remove a User from an Organization

Owners and Super-Admins can remove a user from and organization by making a delete request.

#### 18 Request:

```bash
curl -X DELETE \
  'http://localhost:3005/v1/organizations/{{organization-id}}/users/{{user-id}}/organization_roles/member' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: {{X-Auth-token}}'
```
