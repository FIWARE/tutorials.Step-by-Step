[![FIWARE Banner](https://fiware.github.io/tutorials.Identity-Management/img/fiware.png)](https://www.fiware.org/developers)

[![FIWARE Security](https://img.shields.io/badge/FIWARE-Security-ff7059.svg)](https://www.fiware.org/developers/catalogue/)
[![Documentation](https://readthedocs.org/projects/fiware-tutorials/badge/?version=latest)](https://fiware-tutorials.readthedocs.io/en/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)



# Contents

....

# Introduction to Identity Management

> "If one meets a powerful person — ask them five questions: ‘What power have you got?
> Where did you get it from? In whose interests do you exercise it? To whom are you
> accountable? And how can we get rid of you?’"
>
> — Anthony Wedgwood Benn (The Five Essential Questions of Democracy)



Identity management, also known as identity and access management (IAM) is, in computer security, the security and business discipline that "enables the right individuals to access the right resources at the right times and for the right reasons". It addresses the need to ensure appropriate access to resources across increasingly heterogeneous technology environments and to meet increasingly rigorous compliance requirements.[1]

The terms "identity management" (IdM) and "identity and access management" are used[by whom?] interchangeably in the area of Identity access management.[2] "Identity management" comes under the umbrella of IT security.[3][need quotation to verify]

Identity-management systems, products, applications and platforms manage identifying and ancillary data about entities that include individuals, computer-related hardware, and software applications.

IdM covers issues such as how users gain an identity, the protection of that identity and the technologies supporting that protection (e.g., network protocols, digital certificates, passwords, etc.).




## Standard Identity Management Concepts

**Keyrock** sets up all of the common characteristics of an Identity Management System out-of-the-box.
The primary concept is that both **Users**  and **Applications** must first identify themselves using
a standard OAuth2 Challenge-Response mechanism. Thereafter a user is assigned a token which they
append to every subsequent request. This token identifies the user, the application and the rights the
user is able to exercise.  **Keyrock** can then be used with other enablers can be used to limit and
lock-down access.

The following common objects are found with the **Keyrock** Identity Management database:

* **User** - Any signed up user able to identify themselves with an eMail and password. Users can be assigned
 rights individually or as a group
* **Application** -  Any securable FIWARE application consisting of a series of microservices
* **Organization** - A group of users who can be assigned a series of rights. Altering the rights of the organization
 effects the access of all users of that organization
* **OrganizationRole** - Users can either be members or admins of an organization - Admins are able to add and remove users
 from their organization, members merely gain the roles and permissions of an organiation. This allows each organization
 to be responisible for their members and removes the need for a super-admin to administer all rights
* **Role** - A role is a descriptive bucket for a set of permissions. A role can be assigned to either a single user
 or an organization. A signed-in user gains all the permissions from all of their own roles plus all of the roles associated
 to their organization
* **Permission** - An ability to do something on a resource within the system

Additionally two further non-human application objects can be secured within a FIWARE application
* **IoTAgent** - a proxy betwen IoT Sensors and  the Context Broker
* **PEPProxy** - a middleware for use between generic enablers challenging the rights of a user.


 The relationship between the objects can be seen below:

![](https://fiware.github.io/tutorials.Identity-Management/img/entities.png)



# Prerequisites

## Docker

To keep things simple both components will be run using [Docker](https://www.docker.com). **Docker** is a
container technology which allows to different components isolated into their respective environments.

* To install Docker on Windows follow the instructions [here](https://docs.docker.com/docker-for-windows/)
* To install Docker on Mac follow the instructions [here](https://docs.docker.com/docker-for-mac/)
* To install Docker on Linux follow the instructions [here](https://docs.docker.com/install/)

**Docker Compose** is a tool for defining and running multi-container Docker applications. A
[YAML file](https://raw.githubusercontent.com/Fiware/tutorials.Entity-Relationships/master/docker-compose.yml) is used
configure the required services for the application. This means all container services can be brought up in a single
command. Docker Compose is installed by default as part of Docker for Windows and  Docker for Mac, however Linux users
will need to follow the instructions found  [here](https://docs.docker.com/compose/install/)

## Cygwin

We will start up our services using a simple bash script. Windows users should download [cygwin](http://www.cygwin.com/) to provide a
command line functionality similar to a Linux distribution on Windows.


# Start Up

To start the installation, do the following:

```console
git clone git@github.com:Fiware/tutorials.Identity-Management.git
cd tutorials.Identity-Management

./services create
```

>**Note** The initial creation of Docker images can take up to three minutes


Thereafter, all services can be initialized from the command line by running the [services](https://github.com/Fiware/tutorials.Identity-Management/blob/master/services) Bash script provided within the repository:

```console
./services <command>
```

Where `<command>` will vary depending upon the exercise we wish to activate.

>:information_source: **Note:** If you want to clean up and start over again you can do so with the following command:
>
>```console
>./services stop
>```
>
# Architecture

This introduction will only make use of one FIWARE component - the [Keyrock](http://fiware-idm.readthedocs.io/)
Identity Management Generic Enabler. Usage of **Keyrock** alone alone is insufficient for an application to qualify
 as *“Powered by FIWARE”*.  Additionally will be persisting user data in a **MySQL**  database.


The overall architecture will consist of the following elements:

* One **FIWARE Generic Enabler**:
    * FIWARE [Keyrock](http://fiware-idm.readthedocs.io/) offer a complement Identity Management System including:
        * An OAuth2 authentication system for Apllications and Users
        * A website graphical front-end for Identity Management Administration
        * An equivalent REST API for Identity Management via HTTP requests

* One [MySQL](https://www.mysql.com/) database :
    * Used to persist user identities, applications, roles and permsissions


Since all interactions between the elements are initiated by HTTP requests, the entities can be containerized and run from exposed ports.


![](https://fiware.github.io/tutorials.Identity-Management/img/architecture.png)

The specific architecture of each section of the tutorial is discussed below.

## Keyrock Configuration

```yaml
  idm:
    image: fiware-idm
    container_name: idm
    hostname: idm
    depends_on:
      - mysql-db
    ports:
      - "3005:3005"
    networks:
      default:
    environment:
      - DATABASE_HOST=mysql-db
      - IDM_DB_PASS_FILE=/run/secrets/my_secret_data
      - IDM_DB_USER=root
      - IDM_HOST=http://localhost:3005
      - IDM_PORT=3005
    secrets:
      - my_secret_data
```

The `idm` container is a web app server listening on a single port:

* Port `3005` has been  exposed for HTTP traffic so we can display the webpage and interact with the REST API.

> **Note** The HTTP protocols is being used for demonstration purposes only.
> In a production environment, all OAuth2 Authentication should occur over HTTPS, to avoid sending
> any sensitive information using plain-text.

The `idm` container is driven by environment variables as shown:

| Key |Value|Description|
|-----|-----|-----------|
|IDM_DB_PASS|`idm`| Password of the attached MySQL Database - secured by **Docker Secrets** (see below) |
|IDM_DB_USER|`root`|Username of the default MySQL user - left in plain-text |
|IDM_HOST|`http://localhost:3005`| Hostname of the **Keyrock**  App Server - used in activation eMails when signing up users|
|IDM_PORT|`3005`| Port used by the **Keyrock** App Server  - this has been altered from the default 3000 port to avoid clashes |


> :information_source: **Note** that this example has secured the MySQL password using **Docker Secrets**
> By using `IDM_DB_PASS` with the `_FILE` suffix and referring to a secrets file location.
> This avoids exposing the password as an `ENV` variable in plain-text - either in the `Dockerfile` Image or
> as an injected variable which could be read using `docker inspect`.
>
> The following list of variables (where used) should be set via secrets with the  `_FILE` suffix  in a Production System:
>
> * `IDM_SESSION_SECRET`
> * `IDM_ENCRYPTION_KEY`
> * `IDM_DB_PASS`
> * `IDM_DB_USER`
> * `IDM_ADMIN_ID`
> * `IDM_ADMIN_USER`
> * `IDM_ADMIN_EMAIL`
> * `IDM_ADMIN_PASS`
> * `IDM_EX_AUTH_DB_USER`
> * `IDM_EX_AUTH_DB_PASS`



## MySQL Configuration

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
      default:
    environment:
      - "MYSQL_ROOT_PASSWORD_FILE=/run/secrets/my_secret_data"
      - "MYSQL_ROOT_HOST=172.18.1.5"
    volumes:
      - mysql-db:/var/lib/mysql
    secrets:
      - my_secret_data
```


The `mysql-db` container is listening on a single port:

* Port `3306` is the default port for a MySQL server. It has been exposed so you can also run other database tools to display data if you wish

The `mysql-db` container is driven by environment variables as shown:

| Key               |Value.    |Description                               |
|-------------------|----------|------------------------------------------|
|MYSQL_ROOT_PASSWORD|`123`.    | specifies a password that is set for the MySQL `root` account - secured by **Docker Secrets** (see below)|
|MYSQL_ROOT_HOST    |`root`| By default, MySQL creates the `root'@'localhost` account. This account can only be connected to from inside the container. Setting this environment variable allows root connections from other hosts |




```console
docker exec -it db-mysql bash
```

```console
mysql -u root -pidmx idm
```

```sql
INSERT into idm.oauth_client (id, name, description secret, grant_type) VALUES ('context-provider','App', '', 'secret', 'password')
INSERT into idm.role_assignment (id, oauth_client_id, role_id, user_id) VALUES ('1','context-provider', 'provider', 'admin')
```


```

```








