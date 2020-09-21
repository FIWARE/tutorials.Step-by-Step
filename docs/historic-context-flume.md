[![FIWARE Core Context Management](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/core.svg)](https://github.com/FIWARE/catalogue/blob/master/core/README.md)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

**Description:** This tutorial is an introduction to [FIWARE Cygnus](https://fiware-cygnus.readthedocs.io/en/latest/) -
a generic enabler which is used to persist context data into third-party databases using
[Apache Flume](https://flume.apache.org) creating a historical view of the context. The tutorial activates the IoT
sensors connected in the [previous tutorial](iot-agent.md) and persists measurements
from those sensors into a database for further analysis.

The tutorial uses [cUrl](https://ec.haxx.se/) commands throughout, but is also available as
[Postman documentation](https://fiware.github.io/tutorials.Historic-Context-Flume/)

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/4824d3171f823935dcab)

<hr class="core"/>

# Data Persistence using Apache Flume

> "History will be kind to me for I intend to write it."
>
> — Winston Churchill

Previous tutorials have introduced a set of IoT Sensors (providing measurements of the state of the real world), and two
FIWARE Components - the **Orion Context Broker** and an **IoT Agent**. This tutorial will introduce a new data
persistence component - FIWARE **Cygnus**.

The system so far has been built up to handle the current context, in other words it holds the data entities defining
the state of the real-world objects at a given moment in time.

From this definition you can see - context is only interested in the **current** state of the system It is not the
responsibility of any of the existing components to report on the historical state of the system, the context is based
on the last measurement each sensor has sent to the context broker.

In order to do this, we will need to extend the existing architecture to persist changes of state into a database
whenever the context is updated.

Persisting historical context data is useful for big data analysis - it can be used to discover trends, or data can be
sampled and aggregated to remove the influence of outlying data measurements. However within each Smart Solution, the
significance of each entity type will differ and entities and attributes may need to be sampled at different rates.

Since the business requirements for using context data differ from application to application, there is no one standard
use case for historical data persistence - each situation is unique - it is not the case that one size fits all.
Therefore rather than overloading the context broker with the job of historical context data persistence, this role has
been separated out into a separate, highly configurable component - **Cygnus**.

As you would expect, **Cygnus**, as part of an Open Source platform, is technology agnostic regarding the database to be
used for data persistence. The database you choose to use will depend upon your own business needs.

However there is a cost to offering this flexibility - each part of the system must be separately configured and
notifications must be set up to only pass the minimal data required as necessary.

<h4>Device Monitor</h4>

For the purpose of this tutorial, a series of dummy IoT devices have been created, which will be attached to the context
broker. Details of the architecture and protocol used can be found in the [IoT Sensors tutorial](iot-sensors.md). The
state of each device can be seen on the UltraLight device monitor web page found at:
`http://localhost:3000/device/monitor`

![FIWARE Monitor](https://fiware.github.io/tutorials.Historic-Context-Flume/img/device-monitor.png)

---

# Architecture

This application builds on the components and dummy IoT devices created in [previous tutorials](iot-agent.md). It will
make use of three FIWARE components - the [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/), the
[IoT Agent for Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) and introduce the
[Cygnus Generic Enabler](https://fiware-cygnus.readthedocs.io/en/latest/) for persisting context data to a database.
Additional databases are now involved - both the Orion Context Broker and the IoT Agent rely on
[MongoDB](https://www.mongodb.com/) technology to keep persistence of the information they hold, and we will be
persisting our historical context data another database - either **MySQL** , **PostgreSQL** or **MongoDB** database.

Therefore the overall architecture will consist of the following elements:

-   Three **FIWARE Generic Enablers**:
    -   The FIWARE [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests
        using [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
    -   The FIWARE [IoT Agent for Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) which will
        receive northbound measurements from the dummy IoT devices in
        [Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
        format and convert them to [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2) requests for the
        context broker to alter the state of the context entities
    -   FIWARE [Cygnus](https://fiware-cygnus.readthedocs.io/en/latest/) which will subscribe to context changes and
        persist them into a database (**MySQL** , **PostgreSQL** or **MongoDB**)
-   One, two or three of the following **Databases**:
    -   The underlying [MongoDB](https://www.mongodb.com/) database :
        -   Used by the **Orion Context Broker** to hold context data information such as data entities, subscriptions
            and registrations
        -   Used by the **IoT Agent** to hold device information such as device URLs and Keys
        -   Potentially used as a data sink to hold historical context data.
    -   An additional [PostgreSQL](https://www.postgresql.org/) database :
        -   Potentially used as a data sink to hold historical context data.
    -   An additional [MySQL](https://www.mysql.com/) database :
        -   Potentially used as a data sink to hold historical context data.
-   Three **Context Providers**:
    -   The **Stock Management Frontend** is not used in this tutorial. It does the following:
        -   Display store information and allow users to interact with the dummy IoT devices
        -   Show which products can be bought at each store
        -   Allow users to "buy" products and reduce the stock count.
    -   A webserver acting as set of [dummy IoT devices](iot-sensors.md) using the
        [Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
        protocol running over HTTP.
    -   The **Context Provider NGSI** proxy is not used in this tutorial. It does the following:
        -   receive requests using [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
        -   makes requests to publicly available data sources using their own APIs in a proprietary format
        -   returns context data back to the Orion Context Broker in
            [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2) format.

Since all interactions between the services are initiated by HTTP requests, the services can be containerized and run
from exposed ports.

The specific architecture of each section of the tutorial is discussed below.

# Start Up

Before you start you should ensure that you have obtained or built the necessary Docker images locally. Please clone the
repository and create the necessary images by running the commands as shown:

```bash
git clone https://github.com/FIWARE/tutorials.Historic-Context-Flume.git
cd tutorials.Historic-Context-Flume

./services create
```

Thereafter, all services can be initialized from the command-line by running the
[services](https://github.com/FIWARE/tutorials.Historic-Context-Flume/blob/master/services) Bash script provided within
the repository:

```bash
./services <command>
```

Where `<command>` will vary depending upon the databases we wish to activate. This command will also import seed data
from the previous tutorials and provision the dummy IoT sensors on startup.

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

---

# MongoDB - Persisting Context Data into a Database

Persisting historic context data using MongoDB technology is relatively simple to configure since we are already using a
MongoDB instance to hold data related to the Orion Context Broker and the IoT Agent. The MongoDB instance is listening
on the standard `27017` port and the overall architecture can be seen below:

![](https://fiware.github.io/tutorials.Historic-Context-Flume/img/cygnus-mongo.png)

<h3>MongoDB - Database Server Configuration</h3>

```yaml
mongo-db:
    image: mongo:3.6
    hostname: mongo-db
    container_name: db-mongo
    ports:
        - "27017:27017"
    networks:
        - default
    command: --bind_ip_all --smallfiles
```

<h3>MongoDB - Cygnus Configuration</h3>

```yaml
cygnus:
    image: fiware/cygnus-ngsi:latest
    hostname: cygnus
    container_name: fiware-cygnus
    depends_on:
        - mongo-db
    networks:
        - default
    expose:
        - "5080"
    ports:
        - "5051:5051"
        - "5080:5080"
    environment:
        - "CYGNUS_MONGO_HOSTS=mongo-db:27017"
        - "CYGNUS_MONGO_SERVICE_PORT=5051"
        - "CYGNUS_LOG_LEVEL=DEBUG"
        - "CYGNUS_API_PORT=5080"
        - "CYGNUS_SERVICE_PORT=5051"
```

The `cygnus` container is listening on two ports:

-   The Subscription Port for Cygnus - `5051` is where the service will be listening for notifications from the Orion
    context broker
-   The Management Port for Cygnus - `5080` is exposed purely for tutorial access - so that cUrl or Postman can make
    provisioning commands without being part of the same network.

The `cygnus` container is driven by environment variables as shown:

| Key                 | Value            | Description                                                                                          |
| ------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| CYGNUS_MONGO_HOSTS  | `mongo-db:27017` | Comma separated list of MongoDB servers which Cygnus will contact to persist historical context data |
| CYGNUS_LOG_LEVEL    | `DEBUG`          | The logging level for Cygnus                                                                         |
| CYGNUS_SERVICE_PORT | `5051`           | Notification Port that Cygnus listens when subscribing to context data changes                       |
| CYGNUS_API_PORT     | `5080`           | Port that Cygnus listens on for operational reasons                                                  |

## MongoDB - Start up

To start the system with a **MongoDB** database only, run the following command:

```bash
./services mongodb
```

### Checking the Cygnus Service Health

Once Cygnus is running, you can check the status by making an HTTP request to the exposed `CYGNUS_API_PORT` port. If the
response is blank, this is usually because Cygnus is not running or is listening on another port.

#### 1 Request:

```bash
curl -X GET \
  'http://localhost:5080/v1/version'
```

#### Response:

The response will look similar to the following:

```json
{
    "success": "true",
    "version": "1.18.0_SNAPSHOT.etc"
}
```

> **Troubleshooting:** What if the response is blank ?
>
> -   To check that a docker container is running try
>
> ```
> docker ps
> ```
>
> You should see several containers running. If `cygnus` is not running, you can restart the containers as necessary.

### Generating Context Data

For the purpose of this tutorial, we must be monitoring a system where the context is periodically being updated. The
dummy IoT Sensors can be used to do this. Open the device monitor page at `http://localhost:3000/device/monitor` and
unlock a **Smart Door** and switch on a **Smart Lamp**. This can be done by selecting an appropriate the command from
the drop down list and pressing the `send` button. The stream of measurements coming from the devices can then be seen
on the same page:

![](https://fiware.github.io/tutorials.Historic-Context-Flume/img/door-open.gif)

### Subscribing to Context Changes

Once a dynamic context system is up and running, we need to inform **Cygnus** of changes in context.

This is done by making a POST request to the `/v2/subscription` endpoint of the Orion Context Broker.

-   The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to
    measurements from the attached IoT Sensors, since they had been provisioned using these settings
-   The `idPattern` in the request body ensures that Cygnus will be informed of all context data changes.
-   The notification `url` must match the configured `CYGNUS_MONGO_SERVICE_PORT`
-   The `throttling` value defines the rate that changes are sampled.

#### 2 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/subscriptions' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify Cygnus (Mongo-DB) of all context changes",
  "subject": {
    "entities": [
      {
        "idPattern": ".*"
      }
    ]
  },
  "notification": {
    "http": {
      "url": "http://cygnus:5051/notify"
    }
  },
  "throttling": 5
}'
```

As you can see, the database used to persist context data has no impact on the details of the subscription. It is the
same for each database. The response will be **201 - Created**

> **Note:** if you see errors of the following form within the **Cygnus** log:
>
> ```
> Received bad request from client.
> cygnus         | org.apache.flume.source.http.HTTPBadRequestException: 'fiware-servicepath' header
> value does not match the number of notified context responses
> ```
>
> For versions of Cygnus prior to 1.18.0 an additional `attrsFormat=legacy` attribute was required in the subscription
> since Cygnus currently only accepted notifications in the older NGSI v1 format.

If a subscription has been created, you can check to see if it is firing by making a GET request to the
`/v2/subscriptions` endpoint.

#### 3 Request:

```bash
curl -X GET \
  'http://localhost:1026/v2/subscriptions/' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

#### Response:

```json
[
    {
        "id": "5b39d7c866df40ed84284174",
        "description": "Notify Cygnus (Mongo-DB) of all context changes",
        "status": "active",
        "subject": {
            "entities": [
                {
                    "idPattern": ".*"
                }
            ],
            "condition": {
                "attrs": []
            }
        },
        "notification": {
            "timesSent": 158,
            "lastNotification": "2018-07-02T07:59:21.00Z",
            "attrs": [],
            "http": {
                "url": "http://cygnus:5050/notify"
            },
            "lastSuccess": "2018-07-02T07:59:21.00Z"
        },
        "throttling": 5
    }
]
```

Within the `notification` section of the response, you can see several additional `attributes` which describe the health
of the subscription

If the criteria of the subscription have been met, `timesSent` should be greater than `0`. A zero value would indicate
that the `subject` of the subscription is incorrect or the subscription has created with the wrong `fiware-service-path`
or `fiware-service` header

The `lastNotification` should be a recent timestamp - if this is not the case, then the devices are not regularly
sending data. Remember to unlock the **Smart Door** and switch on the **Smart Lamp**

The `lastSuccess` should match the `lastNotification` date - if this is not the case then **Cygnus** is not receiving
the subscription properly. Check that the hostname and port are correct.

Finally, check that the `status` of the subscription is `active` - an expired subscription will not fire.

## MongoDB - Reading Data from a database

To read MongoDB data from the command-line, we will need access to the `mongo` tool run an interactive instance of the
`mongo` image as shown to obtain a command-line prompt:

```bash
docker run -it --network fiware_default  --entrypoint /bin/bash mongo
```

You can then log into to the running `mongo-db` database by using the command-line as shown:

```bash
mongo --host mongo-db
```

### Show Available Databases on the MongoDB server

To show the list of available databases, run the statement as shown:

#### Query:

```sql
show dbs
```

#### Result:

```text
admin          0.000GB
iotagentul     0.000GB
local          0.000GB
orion          0.000GB
orion-openiot  0.000GB
sth_openiot    0.000GB
```

The result include two databases `admin` and `local` which are set up by default by **MongoDB**, along with four
databases created by the FIWARE platform. The Orion Context Broker has created two separate database instance for each
`fiware-service`

-   The Store entities were created without defining a `fiware-service` and therefore are held within the `orion`
    database, whereas the IoT device entities were created using the `openiot` `fiware-service` header and are held
    separately. The IoT Agent was initialized to hold the IoT sensor data in a separate **MongoDB** database called
    `iotagentul`.

As a result of the subscription of Cygnus to Orion Context Broker, a new database has been created called `sth_openiot`.
The default value for a **Mongo DB** database holding historic context consists of the `sth_` prefix followed by the
`fiware-service` header - therefore `sth_openiot` holds the historic context of the IoT devices.

### Read Historical Context from the server

#### Query:

```sql
use sth_openiot
show collections
```

#### Result:

```text
switched to db sth_openiot

sth_/_Door:001_Door
sth_/_Door:001_Door.aggr
sth_/_Lamp:001_Lamp
sth_/_Lamp:001_Lamp.aggr
sth_/_Motion:001_Motion
sth_/_Motion:001_Motion.aggr
```

Looking within the `sth_openiot` you will see that a series of tables have been created. The names of each table consist
of the `sth_` prefix followed by the `fiware-servicepath` header followed by the entity ID. Two table are created for
each entity - the `.aggr` table holds some aggregated data which will be accessed in a later tutorial. The raw data can
be seen in the tables without the `.aggr` suffix.

The historical data can be seen by looking at the data within each table, by default each row will contain the sampled
value of a single attribute.

#### Query:

```javascript
db["sth_/_Door:001_Door"].find().limit(10);
```

#### Result:

```text
{ "_id" : ObjectId("5b1fa48630c49e0012f7635d"), "recvTime" : ISODate("2018-06-12T10:46:30.897Z"), "attrName" : "TimeInstant", "attrType" : "ISO8601", "attrValue" : "2018-06-12T10:46:30.836Z" }
{ "_id" : ObjectId("5b1fa48630c49e0012f7635e"), "recvTime" : ISODate("2018-06-12T10:46:30.897Z"), "attrName" : "close_status", "attrType" : "commandStatus", "attrValue" : "UNKNOWN" }
{ "_id" : ObjectId("5b1fa48630c49e0012f7635f"), "recvTime" : ISODate("2018-06-12T10:46:30.897Z"), "attrName" : "lock_status", "attrType" : "commandStatus", "attrValue" : "UNKNOWN" }
{ "_id" : ObjectId("5b1fa48630c49e0012f76360"), "recvTime" : ISODate("2018-06-12T10:46:30.897Z"), "attrName" : "open_status", "attrType" : "commandStatus", "attrValue" : "UNKNOWN" }
{ "_id" : ObjectId("5b1fa48630c49e0012f76361"), "recvTime" : ISODate("2018-06-12T10:46:30.836Z"), "attrName" : "refStore", "attrType" : "Relationship", "attrValue" : "Store:001" }
{ "_id" : ObjectId("5b1fa48630c49e0012f76362"), "recvTime" : ISODate("2018-06-12T10:46:30.836Z"), "attrName" : "state", "attrType" : "Text", "attrValue" : "CLOSED" }
{ "_id" : ObjectId("5b1fa48630c49e0012f76363"), "recvTime" : ISODate("2018-06-12T10:45:26.368Z"), "attrName" : "unlock_info", "attrType" : "commandResult", "attrValue" : " unlock OK" }
{ "_id" : ObjectId("5b1fa48630c49e0012f76364"), "recvTime" : ISODate("2018-06-12T10:45:26.368Z"), "attrName" : "unlock_status", "attrType" : "commandStatus", "attrValue" : "OK" }
{ "_id" : ObjectId("5b1fa4c030c49e0012f76385"), "recvTime" : ISODate("2018-06-12T10:47:28.081Z"), "attrName" : "TimeInstant", "attrType" : "ISO8601", "attrValue" : "2018-06-12T10:47:28.038Z" }
{ "_id" : ObjectId("5b1fa4c030c49e0012f76386"), "recvTime" : ISODate("2018-06-12T10:47:28.081Z"), "attrName" : "close_status", "attrType" : "commandStatus", "attrValue" : "UNKNOWN" }
```

The usual **MongoDB** query syntax can be used to filter appropriate fields and values. For example to read the rate at
which the **Motion Sensor** with the `id=Motion:001_Motion` is accumulating, you would make a query as follows:

#### Query:

```javascript
db["sth_/_Motion:001_Motion"].find({ attrName: "count" }, { _id: 0, attrType: 0, attrName: 0 }).limit(10);
```

#### Result:

```text
{ "recvTime" : ISODate("2018-06-12T10:46:18.756Z"), "attrValue" : "8" }
{ "recvTime" : ISODate("2018-06-12T10:46:36.881Z"), "attrValue" : "10" }
{ "recvTime" : ISODate("2018-06-12T10:46:42.947Z"), "attrValue" : "11" }
{ "recvTime" : ISODate("2018-06-12T10:46:54.893Z"), "attrValue" : "13" }
{ "recvTime" : ISODate("2018-06-12T10:47:00.929Z"), "attrValue" : "15" }
{ "recvTime" : ISODate("2018-06-12T10:47:06.954Z"), "attrValue" : "17" }
{ "recvTime" : ISODate("2018-06-12T10:47:15.983Z"), "attrValue" : "19" }
{ "recvTime" : ISODate("2018-06-12T10:47:49.090Z"), "attrValue" : "23" }
{ "recvTime" : ISODate("2018-06-12T10:47:58.112Z"), "attrValue" : "25" }
{ "recvTime" : ISODate("2018-06-12T10:48:28.218Z"), "attrValue" : "29" }
```

To leave the MongoDB client and leave interactive mode, run the following:

```bash
exit
```

```bash
exit
```

# PostgreSQL - Persisting Context Data into a Database

To persist historic context data into an alternative database such as **PostgreSQL**, we will need an additional
container which hosts the PostgreSQL server - the default Docker image for this data can be used. The PostgreSQL
instance is listening on the standard `5432` port and the overall architecture can be seen below:

![](https://fiware.github.io/tutorials.Historic-Context-Flume/img/cygnus-postgres.png)

We now have a system with two databases, since the MongoDB container is still required to hold data related to the Orion
Context Broker and the IoT Agent.

<h3>PostgreSQL - Database Server Configuration</h3>

```yaml
postgres-db:
    image: postgres:latest
    hostname: postgres-db
    container_name: db-postgres
    expose:
        - "5432"
    ports:
        - "5432:5432"
    networks:
        - default
    environment:
        - "POSTGRES_PASSWORD=password"
        - "POSTGRES_USER=postgres"
        - "POSTGRES_DB=postgres"
```

The `postgres-db` container is listening on a single port:

-   Port `5432` is the default port for a PostgreSQL server. It has been exposed so you can also run the `pgAdmin4` tool
    to display database data if you wish

The `postgres-db` container is driven by environment variables as shown:

| Key               | Value.     | Description                               |
| ----------------- | ---------- | ----------------------------------------- |
| POSTGRES_PASSWORD | `password` | Password for the PostgreSQL database user |
| POSTGRES_USER     | `postgres` | Username for the PostgreSQL database user |
| POSTGRES_DB       | `postgres` | The name of the PostgreSQL database       |

> **Note:** Passing the Username and Password in plain text environment variables like this is a security risk. Whereas
> this is acceptable practice in a tutorial, for a production environment, you can avoid this risk by applying
> [Docker Secrets](https://blog.docker.com/2017/02/docker-secrets-management/)

<h3>PostgreSQL - Cygnus Configuration</h3>

```yaml
cygnus:
    image: fiware/cygnus-ngsi:latest
    hostname: cygnus
    container_name: fiware-cygnus
    networks:
        - default
    depends_on:
        - postgres-db
    expose:
        - "5080"
    ports:
        - "5055:5055"
        - "5080:5080"
    environment:
        - "CYGNUS_POSTGRESQL_HOST=postgres-db"
        - "CYGNUS_POSTGRESQL_PORT=5432"
        - "CYGNUS_POSTGRESQL_USER=postgres"
        - "CYGNUS_POSTGRESQL_PASS=password"
        - "CYGNUS_POSTGRESQL_ENABLE_CACHE=true"
        - "CYGNUS_POSTGRESQL_SERVICE_PORT=5055"
        - "CYGNUS_LOG_LEVEL=DEBUG"
        - "CYGNUS_API_PORT=5080"
        - "CYGNUS_SERVICE_PORT=5055"
```

The `cygnus` container is listening on two ports:

-   The Subscription Port for Cygnus - `5055` is where the service will be listening for notifications from the Orion
    context broker
-   The Management Port for Cygnus - `5080` is exposed purely for tutorial access - so that cUrl or Postman can make
    provisioning commands without being part of the same network.

The `cygnus` container is driven by environment variables as shown:

| Key                            | Value         | Description                                                                    |
| ------------------------------ | ------------- | ------------------------------------------------------------------------------ |
| CYGNUS_POSTGRESQL_HOST         | `postgres-db` | Hostname of the PostgreSQL server used to persist historical context data      |
| CYGNUS_POSTGRESQL_PORT         | `5432`        | Port that the PostgreSQL server uses to listen to commands                     |
| CYGNUS_POSTGRESQL_USER         | `postgres`    | Username for the PostgreSQL database user                                      |
| CYGNUS_POSTGRESQL_PASS         | `password`    | Password for the PostgreSQL database user                                      |
| CYGNUS_LOG_LEVEL               | `DEBUG`       | The logging level for Cygnus                                                   |
| CYGNUS_SERVICE_PORT            | `5050`        | Notification Port that Cygnus listens when subscribing to context data changes |
| CYGNUS_API_PORT                | `5080`        | Port that Cygnus listens on for operational reasons                            |
| CYGNUS_POSTGRESQL_ENABLE_CACHE | `true`        | Switch to enable caching within the PostgreSQL configuration                   |

> **Note:** Passing the Username and Password in plain text environment variables like this is a security risk. Whereas
> this is acceptable practice in a tutorial, for a production environment, `CYGNUS_POSTGRESQL_USER` and
> `CYGNUS_POSTGRESQL_PASS` should be injected using
> [Docker Secrets](https://blog.docker.com/2017/02/docker-secrets-management/)

## PostgreSQL - Start up

To start the system with a **PostgreSQL** database run the following command:

```bash
./services postgres
```

### Checking the Cygnus Service Health

Once Cygnus is running, you can check the status by making an HTTP request to the exposed `CYGNUS_API_PORT` port. If the
response is blank, this is usually because Cygnus is not running or is listening on another port.

#### 4 Request:

```bash
curl -X GET \
  'http://localhost:5080/v1/version'
```

#### Response:

The response will look similar to the following:

```json
{
    "success": "true",
    "version": "1.18.0_SNAPSHOT.etc"
}
```

> **Troubleshooting:** What if the response is blank ?
>
> -   To check that a docker container is running try
>
> ```bash
> docker ps
> ```
>
> You should see several containers running. If `cygnus` is not running, you can restart the containers as necessary.

### Generating Context Data

For the purpose of this tutorial, we must be monitoring a system where the context is periodically being updated. The
dummy IoT Sensors can be used to do this. Open the device monitor page at `http://localhost:3000/device/monitor` and
unlock a **Smart Door** and switch on a **Smart Lamp**. This can be done by selecting an appropriate the command from
the drop down list and pressing the `send` button. The stream of measurements coming from the devices can then be seen
on the same page:

![](https://fiware.github.io/tutorials.Historic-Context-Flume/img/door-open.gif)

### Subscribing to Context Changes

Once a dynamic context system is up and running, we need to inform **Cygnus** of changes in context.

This is done by making a POST request to the `/v2/subscription` endpoint of the Orion Context Broker.

-   The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to
    measurements from the attached IoT Sensors, since they had been provisioned using these settings
-   The `idPattern` in the request body ensures that Cygnus will be informed of all context data changes.
-   The notification `url` must match the configured `CYGNUS_POSTGRESQL_SERVICE_PORT`
-   The `throttling` value defines the rate that changes are sampled.

#### 5 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/subscriptions' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify Cygnus (Postgres) of all context changes",
  "subject": {
    "entities": [
      {
        "idPattern": ".*"
      }
    ]
  },
  "notification": {
    "http": {
      "url": "http://cygnus:5055/notify"
    }
  },
  "throttling": 5
}'
```

As you can see, the database used to persist context data has no impact on the details of the subscription. It is the
same for each database. The response will be **201 - Created**

## PostgreSQL - Reading Data from a database

To read PostgreSQL data from the command-line, we will need access to the `postgres` client, to do this, run an
interactive instance of the `postgresql-client` image supplying the connection string as shown to obtain a command-line
prompt:

```bash
docker run -it --rm  --network fiware_default jbergknoff/postgresql-client \
   postgresql://postgres:password@postgres-db:5432/postgres
```

### Show Available Databases on the PostgreSQL server

To show the list of available databases, run the statement as shown:

#### Query:

```text
\list
```

#### Result:

```text
   Name    |  Owner   | Encoding |  Collate   |   Ctype    |   Access privileges
-----------+----------+----------+------------+------------+-----------------------
 postgres  | postgres | UTF8     | en_US.utf8 | en_US.utf8 |
 template0 | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
           |          |          |            |            | postgres=CTc/postgres
 template1 | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
           |          |          |            |            | postgres=CTc/postgres
(3 rows)
```

The result include two template databases `template0` and `template1` as well as the `postgres` database setup when the
docker container was started.

To show the list of available schemas, run the statement as shown:

#### Query:

```text
\dn
```

#### Result:

```text
  List of schemas
  Name   |  Owner
---------+----------
 openiot | postgres
 public  | postgres
(2 rows)
```

As a result of the subscription of Cygnus to Orion Context Broker, a new schema has been created called `openiot`. The
name of the schema matches the `fiware-service` header - therefore `openiot` holds the historic context of the IoT
devices.

### Read Historical Context from the PostgreSQL server

Once running a docker container within the network, it is possible to obtain information about the running database.

#### Query:

```sql
SELECT table_schema,table_name
FROM information_schema.tables
WHERE table_schema ='openiot'
ORDER BY table_schema,table_name;
```

#### Result:

```text
 table_schema |    table_name
--------------+-------------------
 openiot      | door_001_door
 openiot      | lamp_001_lamp
 openiot      | motion_001_motion
(3 rows)
```

The `table_schema` matches the `fiware-service` header supplied with the context data:

To read the data within a table, run a select statement as shown:

#### Query:

```sql
SELECT * FROM openiot.motion_001_motion limit 10;
```

#### Result:

```text
  recvtimets   |         recvtime         | fiwareservicepath |  entityid  | entitytype |  attrname   |   attrtype   |        attrvalue         |                                    attrmd
---------------+--------------------------+-------------------+------------+------------+-------------+--------------+--------------------------+------------------------------------------------------------------------------
 1528803005491 | 2018-06-12T11:30:05.491Z | /                 | Motion:001 | Motion     | TimeInstant | ISO8601      | 2018-06-12T11:30:05.423Z | []
 1528803005491 | 2018-06-12T11:30:05.491Z | /                 | Motion:001 | Motion     | count       | Integer      | 7                        | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:30:05.423Z"}]
 1528803005491 | 2018-06-12T11:30:05.491Z | /                 | Motion:001 | Motion     | refStore    | Relationship | Store:001                | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:30:05.423Z"}]
 1528803035501 | 2018-06-12T11:30:35.501Z | /                 | Motion:001 | Motion     | TimeInstant | ISO8601      | 2018-06-12T11:30:35.480Z | []
 1528803035501 | 2018-06-12T11:30:35.501Z | /                 | Motion:001 | Motion     | count       | Integer      | 10                       | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:30:35.480Z"}]
 1528803035501 | 2018-06-12T11:30:35.501Z | /                 | Motion:001 | Motion     | refStore    | Relationship | Store:001                | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:30:35.480Z"}]
 1528803041563 | 2018-06-12T11:30:41.563Z | /                 | Motion:001 | Motion     | TimeInstant | ISO8601      | 2018-06-12T11:30:41.520Z | []
 1528803041563 | 2018-06-12T11:30:41.563Z | /                 | Motion:001 | Motion     | count       | Integer      | 12                       | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:30:41.520Z"}]
 1528803041563 | 2018-06-12T11:30:41.563Z | /                 | Motion:001 | Motion     | refStore    | Relationship | Store:001                | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:30:41.520Z"}]
 1528803047545 | 2018-06-12T11:30:47.545Z | /
```

The usual **PostgreSQL** query syntax can be used to filter appropriate fields and values. For example to read the rate
at which the **Motion Sensor** with the `id=Motion:001_Motion` is accumulating, you would make a query as follows:

#### Query:

```sql
SELECT recvtime, attrvalue FROM openiot.motion_001_motion WHERE attrname ='count'  limit 10;
```

#### Result:

```text
         recvtime         | attrvalue
--------------------------+-----------
 2018-06-12T11:30:05.491Z | 7
 2018-06-12T11:30:35.501Z | 10
 2018-06-12T11:30:41.563Z | 12
 2018-06-12T11:30:47.545Z | 13
 2018-06-12T11:31:02.617Z | 15
 2018-06-12T11:31:32.718Z | 20
 2018-06-12T11:31:38.733Z | 22
 2018-06-12T11:31:50.780Z | 24
 2018-06-12T11:31:56.825Z | 25
 2018-06-12T11:31:59.790Z | 26
(10 rows)
```

To leave the Postgres client and leave interactive mode, run the following:

```bash
\q
```

You will then return to the command-line.

# MySQL - Persisting Context Data into a Database

Similarly, to persisting historic context data into **MySQL**, we will again need an additional container which hosts
the MySQL server, once again the default Docker image for this data can be used. The MySQL instance is listening on the
standard `3306` port and the overall architecture can be seen below:

![](https://fiware.github.io/tutorials.Historic-Context-Flume/img/cygnus-mysql.png)

Once again we have a system with two databases, since the MongoDB container is still required to hold data related to
the Orion Context Broker and the IoT Agent.

<h3>MySQL - Database Server Configuration</h3>

```yaml
mysql-db:
    restart: always
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
        - "MYSQL_ROOT_PASSWORD=123"
        - "MYSQL_ROOT_HOST=%"
```

The `mysql-db` container is listening on a single port:

-   Port `3306` is the default port for a MySQL server. It has been exposed so you can also run other database tools to
    display data if you wish

The `mysql-db` container is driven by environment variables as shown:

| Key                 | Value.     | Description                                                                                                                                                                                           |
| ------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MYSQL_ROOT_PASSWORD | `123`.     | specifies a password that is set for the MySQL `root` account.                                                                                                                                        |
| MYSQL_ROOT_HOST     | `%` | By default, MySQL creates the `root'@'localhost` account. This account can only be connected to from inside the container. Setting this environment variable allows root connections from other hosts |

> **Note:** Using the default `root` user and displaying the password in an environment variables like this is a
> security risk. Whereas this is acceptable practice in a tutorial, for a production environment, you can avoid this
> risk by setting up another user and applying
> [Docker Secrets](https://blog.docker.com/2017/02/docker-secrets-management/)

<h3>MySQL - Cygnus Configuration</h3>

```yaml
cygnus:
    image: fiware/cygnus-ngsi:latest
    hostname: cygnus
    container_name: fiware-cygnus
    networks:
        - default
    depends_on:
        - mysql-db
    expose:
        - "5080"
    ports:
        - "5050:5050"
        - "5080:5080"
    environment:
        - "CYGNUS_MYSQL_HOST=mysql-db"
        - "CYGNUS_MYSQL_PORT=3306"
        - "CYGNUS_MYSQL_USER=root"
        - "CYGNUS_MYSQL_PASS=123"
        - "CYGNUS_MYSQL_SERVICE_PORT=5050"
        - "CYGNUS_LOG_LEVEL=DEBUG"
        - "CYGNUS_API_PORT=5080"
        - "CYGNUS_SERVICE_PORT=5050"
```

> **Note:** Passing the Username and Password in plain text environment variables like this is a security risk. Whereas
> this is acceptable practice in a tutorial, for a production environment, `CYGNUS_MYSQL_USER` and `CYGNUS_MYSQL_PASS`
> should be injected using [Docker Secrets](https://blog.docker.com/2017/02/docker-secrets-management/)

The `cygnus` container is listening on two ports:

-   The Subscription Port for Cygnus - `5050` is where the service will be listening for notifications from the Orion
    context broker
-   The Management Port for Cygnus - `5080` is exposed purely for tutorial access - so that cUrl or Postman can make
    provisioning commands without being part of the same network.

The `cygnus` container is driven by environment variables as shown:

| Key                 | Value      | Description                                                                    |
| ------------------- | ---------- | ------------------------------------------------------------------------------ |
| CYGNUS_MYSQL_HOST   | `mysql-db` | Hostname of the MySQL server used to persist historical context data           |
| CYGNUS_MYSQL_PORT   | `3306`     | Port that the MySQL server uses to listen to commands                          |
| CYGNUS_MYSQL_USER   | `root`     | Username for the MySQL database user                                           |
| CYGNUS_MYSQL_PASS   | `123`      | Password for the MySQL database user                                           |
| CYGNUS_LOG_LEVEL    | `DEBUG`    | The logging level for Cygnus                                                   |
| CYGNUS_SERVICE_PORT | `5050`     | Notification Port that Cygnus listens when subscribing to context data changes |
| CYGNUS_API_PORT     | `5080`     | Port that Cygnus listens on for operational reasons                            |

## MySQL - Start up

To start the system with a **MySQL** database run the following command:

```bash
./services mysql
```

### Checking the Cygnus Service Health

Once Cygnus is running, you can check the status by making an HTTP request to the exposed `CYGNUS_API_PORT` port. If the
response is blank, this is usually because Cygnus is not running or is listening on another port.

#### 6 Request:

```bash
curl -X GET \
  'http://localhost:5080/v1/version'
```

#### Response:

The response will look similar to the following:

```json
{
    "success": "true",
    "version": "1.18.0_SNAPSHOT.etc"
}
```

> **Troubleshooting:** What if the response is blank ?
>
> -   To check that a docker container is running try
>
> ```
> docker ps
> ```
>
> You should see several containers running. If `cygnus` is not running, you can restart the containers as necessary.

### Generating Context Data

For the purpose of this tutorial, we must be monitoring a system where the context is periodically being updated. The
dummy IoT Sensors can be used to do this. Open the device monitor page at `http://localhost:3000/device/monitor` and
unlock a **Smart Door** and switch on a **Smart Lamp**. This can be done by selecting an appropriate the command from
the drop down list and pressing the `send` button. The stream of measurements coming from the devices can then be seen
on the same page:

![](https://fiware.github.io/tutorials.Historic-Context-Flume/img/door-open.gif)

### Subscribing to Context Changes

Once a dynamic context system is up and running, we need to inform **Cygnus** of changes in context.

This is done by making a POST request to the `/v2/subscription` endpoint of the Orion Context Broker.

-   The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to
    measurements from the attached IoT Sensors, since they had been provisioned using these settings
-   The `idPattern` in the request body ensures that Cygnus will be informed of all context data changes.
-   The notification `url` must match the configured `CYGNUS_MYSQL_SERVICE_PORT`
-   The `throttling` value defines the rate that changes are sampled.

#### 7 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/subscriptions' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify Cygnus (MySQL) of all context changes",
  "subject": {
    "entities": [
      {
        "idPattern": ".*"
      }
    ]
  },
  "notification": {
    "http": {
      "url": "http://cygnus:5050/notify"
    }
  },
  "throttling": 5
}'
```

As you can see, the database used to persist context data has no impact on the details of the subscription. It is the
same for each database. The response will be **201 - Created**

## MySQL - Reading Data from a database

To read MySQL data from the command-line, we will need access to the `mysql` client, to do this, run an interactive
instance of the `mysql` image supplying the connection string as shown to obtain a command-line prompt:

```bash
docker exec -it  db-mysql mysql -h mysql-db -P 3306  -u root -p123
```

### Show Available Databases on the MySQL server

To show the list of available databases, run the statement as shown:

#### Query:

```sql
SHOW DATABASES;
```

#### Result:

```text
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| openiot            |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.00 sec)
```

To show the list of available schemas, run the statement as shown:

#### Query:

```sql
SHOW SCHEMAS;
```

#### Result:

```text
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| openiot            |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.00 sec)
```

As a result of the subscription of Cygnus to Orion Context Broker, a new schema has been created called `openiot`. The
name of the schema matches the `fiware-service` header - therefore `openiot` holds the historic context of the IoT
devices.

### Read Historical Context from the MySQL server

Once running a docker container within the network, it is possible to obtain information about the running database.

#### Query:

```sql
SHOW tables FROM openiot;
```

#### Result:

```text
 table_schema |    table_name
--------------+-------------------
 openiot      | door_001_door
 openiot      | lamp_001_lamp
 openiot      | motion_001_motion
(3 rows)
```

The `table_schema` matches the `fiware-service` header supplied with the context data:

To read the data within a table, run a select statement as shown:

#### Query:

```sql
SELECT * FROM openiot.Motion_001_Motion limit 10;
```

#### Result:

```text
+---------------+-------------------------+-------------------+------------+------------+-------------+--------------+--------------------------+------------------------------------------------------------------------------+
| recvTimeTs    | recvTime                | fiwareServicePath | entityId   | entityType | attrName    | attrType     | attrValue                | attrMd                                                                       |
+---------------+-------------------------+-------------------+------------+------------+-------------+--------------+--------------------------+------------------------------------------------------------------------------+
| 1528804397955 | 2018-06-12T11:53:17.955 | /                 | Motion:001 | Motion     | TimeInstant | ISO8601      | 2018-06-12T11:53:17.923Z | []                                                                           |
| 1528804397955 | 2018-06-12T11:53:17.955 | /                 | Motion:001 | Motion     | count       | Integer      | 3                        | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:53:17.923Z"}] |
| 1528804397955 | 2018-06-12T11:53:17.955 | /                 | Motion:001 | Motion     | refStore    | Relationship | Store:001                | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:53:17.923Z"}] |
| 1528804403954 | 2018-06-12T11:53:23.954 | /                 | Motion:001 | Motion     | TimeInstant | ISO8601      | 2018-06-12T11:53:23.928Z | []                                                                           |
| 1528804403954 | 2018-06-12T11:53:23.954 | /                 | Motion:001 | Motion     | count       | Integer      | 5                        | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:53:23.928Z"}] |
| 1528804403954 | 2018-06-12T11:53:23.954 | /                 | Motion:001 | Motion     | refStore    | Relationship | Store:001                | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:53:23.928Z"}] |
| 1528804409970 | 2018-06-12T11:53:29.970 | /                 | Motion:001 | Motion     | TimeInstant | ISO8601      | 2018-06-12T11:53:29.948Z | []                                                                           |
| 1528804409970 | 2018-06-12T11:53:29.970 | /                 | Motion:001 | Motion     | count       | Integer      | 7                        | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:53:29.948Z"}] |
| 1528804409970 | 2018-06-12T11:53:29.970 | /                 | Motion:001 | Motion     | refStore    | Relationship | Store:001                | [{"name":"TimeInstant","type":"ISO8601","value":"2018-06-12T11:53:29.948Z"}] |
| 1528804446083 | 2018-06-12T11:54:06.83  | /                 | Motion:001 | Motion     | TimeInstant | ISO8601      | 2018-06-12T11:54:06.062Z | []                                                                           |
+---------------+-------------------------+-------------------+------------+------------+-------------+--------------+--------------------------+------------------------------------------------------------------------------+
```

The usual **MySQL** query syntax can be used to filter appropriate fields and values. For example to read the rate at
which the **Motion Sensor** with the `id=Motion:001_Motion` is accumulating, you would make a query as follows:

#### Query:

```sql
SELECT recvtime, attrvalue FROM openiot.Motion_001_Motion WHERE attrname ='count' LIMIT 10;
```

#### Result:

```text
+-------------------------+-----------+
| recvtime                | attrvalue |
+-------------------------+-----------+
| 2018-06-12T11:53:17.955 | 3         |
| 2018-06-12T11:53:23.954 | 5         |
| 2018-06-12T11:53:29.970 | 7         |
| 2018-06-12T11:54:06.83  | 12        |
| 2018-06-12T11:54:12.132 | 13        |
| 2018-06-12T11:54:24.177 | 14        |
| 2018-06-12T11:54:36.196 | 16        |
| 2018-06-12T11:54:42.195 | 18        |
| 2018-06-12T11:55:24.300 | 23        |
| 2018-06-12T11:55:30.350 | 25        |
+-------------------------+-----------+
10 rows in set (0.00 sec)
```

To leave the MySQL client and leave interactive mode, run the following:

```bash
\q
```

You will then return to the command-line.

# Multi-Agent - Persisting Context Data into a multiple Databases

It is also possible to configure Cygnus to populate multiple databases simultaneously. We can combine the architecture
from the three previous examples and configure cygnus to listen on multiple ports

![](https://fiware.github.io/tutorials.Historic-Context-Flume/img/cygnus-all-three.png)

We now have a system with three databases, PostgreSQL and MySQL for data persistence and MongoDB for both data
persistence and holding data related to the Orion Context Broker and the IoT Agent.

<h3>Multi-Agent - Cygnus Configuration for Multiple Databases</h3>

```yaml
cygnus:
    image: fiware/cygnus-ngsi:latest
    hostname: cygnus
    container_name: fiware-cygnus
    depends_on:
        - mongo-db
        - mysql-db
        - postgres-db
    networks:
        - default
    expose:
        - "5080"
        - "5081"
        - "5084"
    ports:
        - "5050:5050"
        - "5051:5051"
        - "5054:5054"
        - "5080:5080"
        - "5081:5081"
        - "5084:5084"
    environment:
        - "CYGNUS_MULTIAGENT=true"
        - "CYGNUS_POSTGRESQL_HOST=postgres-sb"
        - "CYGNUS_POSTGRESQL_PORT=5432"
        - "CYGNUS_POSTGRESQL_USER=postgres"
        - "CYGNUS_POSTGRESQL_PASS=password"
        - "CYGNUS_POSTGRESQL_ENABLE_CACHE=true"
        - "CYGNUS_MYSQL_HOST=mysql-db"
        - "CYGNUS_MYSQL_PORT=3306"
        - "CYGNUS_MYSQL_USER=root"
        - "CYGNUS_MYSQL_PASS=123"
        - "CYGNUS_LOG_LEVEL=DEBUG"
```

In multi-agent mode, the `cygnus` container is listening on multiple ports:

-   The service will be listening on ports `5050-5055` for notifications from the Orion context broker
-   The Management Ports `5080-5085` are exposed purely for tutorial access - so that cUrl or Postman can make
    provisioning commands without being part of the same network.

The default port mapping can be seen below:

|       sink | port | admin_port |
| ---------: | ---: | ---------: |
|      mysql | 5050 |       5080 |
|      mongo | 5051 |       5081 |
|       ckan | 5052 |       5082 |
|       hdfs | 5053 |       5083 |
| postgresql | 5054 |       5084 |
|    cartodb | 5055 |       5085 |

Since we are not persisting CKAN, HDFS or CartoDB data, there is no need to open those ports.

The `cygnus` container is driven by environment variables as shown:

| Key                    | Value            | Description                                                                                          |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| CYGNUS_MULTIAGENT      | `true`           | Whether to persist data into multiple databases.                                                     |
| CYGNUS_MONGO_HOSTS     | `mongo-db:27017` | Comma separated list of MongoDB servers which Cygnus will contact to persist historical context data |
| CYGNUS_POSTGRESQL_HOST | `postgres-db`    | Hostname of the PostgreSQL server used to persist historical context data                            |
| CYGNUS_POSTGRESQL_PORT | `5432`           | Port that the PostgreSQL server uses to listen to commands                                           |
| CYGNUS_POSTGRESQL_USER | `postgres`       | Username for the PostgreSQL database user                                                            |
| CYGNUS_POSTGRESQL_PASS | `password`       | Password for the PostgreSQL database user                                                            |
| CYGNUS_MYSQL_HOST      | `mysql-db`       | Hostname of the MySQL server used to persist historical context data                                 |
| CYGNUS_MYSQL_PORT      | `3306`           | Port that the MySQL server uses to listen to commands                                                |
| CYGNUS_MYSQL_USER      | `root`           | Username for the MySQL database user                                                                 |
| CYGNUS_MYSQL_PASS      | `123`            | Password for the MySQL database user                                                                 |
| CYGNUS_LOG_LEVEL       | `DEBUG`          | The logging level for Cygnus                                                                         |

## Multi-Agent - Start up

To start the system with **multiple** databases run the following command:

```bash
./services multiple
```

### Checking the Cygnus Service Health

Once Cygnus is running, you can check the status by making an HTTP request to the exposed `CYGNUS_API_PORT` port. If the
response is blank, this is usually because Cygnus is not running or is listening on another port.

#### 8 Request:

```bash
curl -X GET \
  'http://localhost:5080/v1/version'
```

#### Response:

The response will look similar to the following:

```json
{
    "success": "true",
    "version": "1.18.0_SNAPSHOT.etc"
}
```

> **Troubleshooting:** What if the response is blank ?
>
> -   To check that a docker container is running try
>
> ```
> docker ps
> ```
>
> You should see several containers running. If `cygnus` is not running, you can restart the containers as necessary.

### Generating Context Data

For the purpose of this tutorial, we must be monitoring a system where the context is periodically being updated. The
dummy IoT Sensors can be used to do this. Open the device monitor page at `http://localhost:3000/device/monitor` and
unlock a **Smart Door** and switch on a **Smart Lamp**. This can be done by selecting an appropriate the command from
the drop down list and pressing the `send` button. The stream of measurements coming from the devices can then be seen
on the same page:

![](https://fiware.github.io/tutorials.Historic-Context-Flume/img/door-open.gif)

### Subscribing to Context Changes

Once a dynamic context system is up and running, we need to inform **Cygnus** of changes in context.

This is done by making a POST request to the `/v2/subscription` endpoint of the Orion Context Broker.

-   The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to
    measurements from the attached IoT Sensors
-   The `idPattern` in the request body ensures that Cygnus will be informed of all context data changes.
-   The `throttling` value defines the rate that changes are sampled.

When running in **multi-agent** mode, the notification `url` for each subscription must match the defaults for the given
database.

The default port mapping can be seen below:

|       sink | port |
| ---------: | ---: |
|      mysql | 5050 |
|      mongo | 5051 |
|       ckan | 5052 |
|       hdfs | 5053 |
| postgresql | 5054 |
|    cartodb | 5055 |

Since this subscription is using port `5050` the context data will eventually be persisted to the _MySQL_ database.

#### 9 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/subscriptions' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify Cygnus of all context changes for MySQL on port 5050",
  "subject": {
    "entities": [
      {
        "idPattern": ".*"
      }
    ]
  },
  "notification": {
    "http": {
      "url": "http://cygnus:5050/notify"
    }
  },
  "throttling": 5
}'
```

As you can see, the database used to persist context data has no impact on the details of the subscription. It is the
same for each database. The response will be **201 - Created**

## Multi-Agent - Reading Persisted Data

To read persisted data from the attached databases, please refer to the previous sections of this tutorial.
