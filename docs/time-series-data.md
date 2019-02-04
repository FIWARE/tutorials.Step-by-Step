[![FIWARE Core Context Management](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/core.svg)](https://www.fiware.org/developers/catalogue/)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-blue.svg)](https://fiware-ges.github.io/core.Orion/api/v2/stable/)

**Description:** This tutorial is an introduction to
[FIWARE QuantumLeap](https://smartsdk.github.io/ngsi-timeseries-api/) - a generic enabler which is used to persist
context data into a **CrateDB** database. The tutorial activates the IoT sensors connected in the
[previous tutorial](iot-agent.md) and persists measurements from those sensors into the database. To retrieve time-based
aggregations of such data, users can either use **QuantumLeap** query API or connect directly to the **CrateDB** HTTP
endpoint. Results are visualised on a graph or via the **Grafana** time series analytics tool.

The tutorial uses [cUrl](https://ec.haxx.se/) commands throughout, but is also available as
[Postman documentation](https://fiware.github.io/tutorials.Time-Series-Data/)

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/d24facc3c430bb5d5aaf)

---

# Persisting and Querying Time Series Data (CrateDB)

> "Forever is composed of nows."
>
> — Emily Dickinson

[Previous tutorials](https://github.com/Fiware/tutorials.Historic-Context) have shown how to persist historic context
data into a range of databases such as **MySQL** and **PostgreSQL**. Furthermore, the
[Short Term Historic](https://github.com/Fiware/tutorials.Short-Term-History) tutorial has introduced the
[STH-Comet](https://fiware-sth-comet.readthedocs.io/) generic enabler for persisting and querying historic context data
using a **MongoDB** database.

FIWARE [QuantumLeap](https://smartsdk.github.io/ngsi-timeseries-api/) is an alternative generic enabler created
specifically for data persistence into the **CrateDB** time-series database, and therefore offers an alternative to the
[STH-Comet](https://fiware-sth-comet.readthedocs.io/).

[CrateDB](https://crate.io/) is a distributed SQL DBMS designed for use with the internet of Things. It is capable of
ingesting a large number of data points per second and can be queried in real-time. The database is designed for the
execution of complex queries such as geospatial and time series data. Retrieval of this historic context data allows for
the creation of graphs and dashboards displaying trends over time.

A summary of the differences can be seen below:

| QuantumLeap                                                                                            | STH-Comet                                                                                          |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Offers an NGSI v2 interface for notifications                                                          | Offers an NGSI v1 interface for notifications                                                      |
| Persists Data to a CrateDB database                                                                    | Persists Data to MongoDB database                                                                  |
| Offers its own HTTP endpoint for queries, but you can also query CrateDB                               | Offers its own HTTP endpoint for queries - MongoDB database cannot be accessed directly            |
| QuantumLeap supports complex data queries (thanks to CrateDB)                                          | STH-Comet offers a limited set of queries                                                          |
| CrateDB is a distributed and scalable SQL DBMS built atop NoSQL storage                                | MongoDB is a document based NoSQL database                                                         |
| QuantumLeap's API is docummented in OpenAPI [here](https://app.swaggerhub.com/apis/smartsdk/ngsi-tsdb) | STH-Comet's API is explained in its docs [here](https://fiware-sth-comet.readthedocs.io/en/latest) |

Further details about the differences between the underlying database engines can be found
[here](https://db-engines.com/en/system/CrateDB%3BMongoDB).

## Analyzing time series data

The appropriate use of time series data analysis will depend on your use case and the reliability of the data
measurements you receive. Time series data analysis can be used to answer questions such as:

-   What was the maximum measurement of a device within a given time period?
-   What was the average measurement of a device within a given time period?
-   What was the sum of the measurements sent by a device within a given time period?

It can also be used to reduce the significance of each individual data point to exclude outliers by smoothing.

#### Grafana

[Grafana](https://grafana.com/) is an open source software for time series analytics tool which will be used during this
tutorial. It integrates with a variety of time-series databases including **CrateDB**. It is available licensed under
the Apache License 2.0. More information can be found at `https://grafana.com/`.

#### Device Monitor

For the purpose of this tutorial, a series of dummy IoT devices have been created, which will be attached to the context
broker. Details of the architecture and protocol used can be found in the
[IoT Sensors tutorial](https://github.com/Fiware/tutorials.IoT-Sensors). The state of each device can be seen on the
UltraLight device monitor web page found at: `http://localhost:3000/device/monitor`

![FIWARE Monitor](https://fiware.github.io/tutorials.Time-Series-Data/img/device-monitor.png)

#### Device History

Once **QuantumLeap** has started aggregating data, the historical state of each device can be seen on the device history
web page found at: `http://localhost:3000/device/history/urn:ngsi-ld:Store:001`

![](https://fiware.github.io/tutorials.Time-Series-Data/img/history-graphs.png)

---

# Architecture

This application builds on the components and dummy IoT devices created in
[previous tutorials](https://github.com/Fiware/tutorials.IoT-Agent/). It will use three FIWARE components: the
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/), the
[IoT Agent for Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/), and
[QuantumLeap](https://smartsdk.github.io/ngsi-timeseries-api/) .

Therefore the overall architecture will consist of the following elements:

-   The **FIWARE Generic Enablers**:

    -   The FIWARE [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests
        using [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
    -   The FIWARE [IoT Agent for Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) which will
        receive northbound measurements from the dummy IoT devices in
        [Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
        format and convert them to [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) requests for the
        context broker to alter the state of the context entities
    -   FIWARE [QuantumLeap](https://smartsdk.github.io/ngsi-timeseries-api/) subscribed to context changes and
        persisting them into a **CrateDB** database

-   A [MongoDB](https://www.mongodb.com/) database:

    -   Used by the **Orion Context Broker** to hold context data information such as data entities, subscriptions and
        registrations
    -   Used by the **IoT Agent** to hold device information such as device URLs and Keys

-   A [CrateDB](https://crate.io/) database:

    -   Used as a data sink to hold time-based historical context data
    -   offers an HTTP endpoint to interpret time-based data queries

-   A **Context Provider**: - A webserver acting as set of
    [dummy IoT devices](https://github.com/Fiware/tutorials.IoT-Sensors) using the
    [Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
    protocol running over HTTP. - Note the **Stock Management Frontend** and **Context Provider NGSI** proxy are not
    used in this tutorial.

Since all interactions between the elements are initiated by HTTP requests, the entities can be containerized and run
from exposed ports.

The overall architecture can be seen below:

![](https://fiware.github.io/tutorials.Time-Series-Data/img/architecture.png)

# Start Up

Before you start, you should ensure that you have obtained or built the necessary Docker images locally. Please clone
the repository and create the necessary images by running the commands as shown:

```bash
git clone git@github.com:Fiware/tutorials.Time-Series-Data.git
cd tutorials.Time-Series-Data

./services create
```

Thereafter, all services can be initialized from the command-line by running the
[services](https://github.com/Fiware/tutorials.Time-Series-Data/blob/master/services) Bash script provided within the
repository:

```bash
./services start
```

> :information_source: **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```bash
> ./services stop
> ```

---

# Connecting FIWARE to a CrateDB Database via QuantumLeap

In the configuration, **QuantumLeap** listens to NGSI v2 notifications on port `8868` and persists historic context data
to the **CrateDB**. **CrateDB** is accessible using port `4200` and can either be queried directly or attached to the
Grafana analytics tool. The rest of the system providing the context data has been described in previous tutorials

<h3>CrateDB Database Server Configuration</h3>

```yaml
cratedb:
    image: crate:2.3
    hostname: cratedb
    ports:
        - "4200:4200"
        - "4300:4300"
    command: -Ccluster.name=democluster -Chttp.cors.enabled=true -Chttp.cors.allow-origin="*"
```

<h3>QuantumLeap Configuration</h3>

```yaml
quantumleap:
    image: smartsdk/quantumleap
    hostname: quantumleap
    ports:
        - "8668:8668"
    depends_on:
        - cratedb
    environment:
        - CRATE_HOST=cratedb
```

<h3>Grafana Configuration</h3>

```yaml
grafana:
    image: grafana/grafana
    depends_on:
        - cratedb
    ports:
        - "3003:3000"
    environment:
        - GF_INSTALL_PLUGINS=crate-datasource,grafana-clock-panel,grafana-worldmap-panel
```

The `quantumleap` container is listening on one port:

-   The Operations for port for QuantumLeap - `8668` is where the service will be listening for notifications from the
    Orion context broker and where users can query data from.

The `CRATE_HOST` environment variable defines the location where the data will be persisted.

The `cratedb` container is listening on two ports:

-   The Admin UI is available on port `4200`
-   The transport protocol is available on `port 4300`

The `grafana` container has connected up port `3000` internally with port `3003` externally. This is because the Grafana
UI is usually available on port `3000`, but this port has already been taken by the dummy devices UI so it has been
shifted to another port. The Grafana Environment variables are described within their own
[documentation](http://docs.grafana.org/installation/configuration/). The configuration ensures we will be able to
connect to the **CrateDB** database later on in the tutorial

### Generating Context Data

For the purpose of this tutorial, we must be monitoring a system where the context is periodically being updated. The
dummy IoT Sensors can be used to do this. Open the device monitor page at `http://localhost:3000/device/monitor` and
unlock a **Smart Door** and switch on a **Smart Lamp**. This can be done by selecting an appropriate command from the
drop down list and pressing the `send` button. The stream of measurements coming from the devices can then be seen on
the same page:

![](https://fiware.github.io/tutorials.IoT-Sensors/img/door-open.gif)

## Setting up Subscriptions

Once a dynamic context system is up and running, we need to inform **Quantum Leap** directly of changes in context. As
expected this is done using the subscription mechanism of the **Orion Context Broker**. The `attrsFormat=legacy`
attribute is not required since **QuantumLeap** accepts NGSI v2 notifications directly.

Subscriptions will be covered in the next subsections. More details about subscriptions can be found in previous
tutorials or in the [subscriptions section](https://quantumleap.readthedocs.io/en/latest/user/#orion-subscription) of
QuantumLeap docs.

### Aggregate Motion Sensor Count Events

The rate of change of the **Motion Sensor** is driven by events in the real-world. We need to receive every event to be
able to aggregate the results.

This is done by making a POST request to the `/v2/subscription` endpoint of the **Orion Context Broker**.

-   The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to
    measurements from the attached IoT Sensors
-   The `idPattern` in the request body ensures that **QuantumLeap** will be informed of all **Motion Sensor** data
    changes.
-   The `notification` URL must match the exposed port.

The `metadata` attribute ensures that the `time_index` column within the **CrateDB** database will match the data found
within the **MongoDB** database used by the **Orion Context Broker** rather than using the creation time of the record
within the **CrateDB** itself.

#### 1 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/subscriptions/' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify QuantumLeap of count changes of any Motion Sensor",
  "subject": {
    "entities": [
      {
        "idPattern": "Motion.*"
      }
    ],
    "condition": {
      "attrs": [
        "count"
      ]
    }
  },
  "notification": {
    "http": {
      "url": "http://quantumleap:8668/v2/notify"
    },
    "attrs": [
      "count"
    ],
    "metadata": ["dateCreated", "dateModified"]
  },
  "throttling": 1
}'
```

### Sample Lamp Luminosity

The luminosity of the Smart Lamp is constantly changing, we only need to sample the values to be able to work out
relevant statistics such as minimum and maximum values and rates of change.

This is done by making a POST request to the `/v2/subscription` endpoint of the **Orion Context Broker** and including
the `throttling` attribute in the request body.

-   The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to
    measurements from the attached IoT Sensors
-   The `idPattern` in the request body ensures that **QuantumLeap** will be informed of all **Motion Sensor** data
    changes.
-   The `notification` URL must match the exposed port.
-   The `throttling` value defines the rate that changes are sampled.

The `metadata` attribute ensures that the `time_index` column within the **CrateDB** database will match the data found
within the **MongoDB** database used by the **Orion Context Broker** rather than using the creation time of the record
within the **CrateDB** itself.

#### 2 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/subscriptions/' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify QuantumLeap on luminosity changes on any Lamp",
  "subject": {
    "entities": [
      {
        "idPattern": "Lamp.*"
      }
    ],
    "condition": {
      "attrs": [
        "luminosity"
      ]
    }
  },
  "notification": {
    "http": {
      "url": "http://quantumleap:8668/v2/notify"
    },
    "attrs": [
      "luminosity", "location"
    ],
    "metadata": ["dateCreated", "dateModified"]
  },
  "throttling": 1
}'
```

### Checking Subscriptions for QuantumLeap

Before anything, check the subscriptions you created in steps :one: and :two: are working (i.e., at least one
notification for each was sent).

#### 3 Request:

```bash
curl -X GET \
  'http://localhost:1026/v2/subscriptions/' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
}'
```

#### Response:

```json
[
    {
        "id": "5be07427be9a2d09cf677f08",
        "description": "Notify QuantumLeap of count changes of any Motion Sensor",
        "status": "active",
        "subject": { ...ETC },
        "notification": {
            "timesSent": 6,
            "lastNotification": "2018-09-02T08:36:04.00Z",
            "attrs": ["count"],
            "attrsFormat": "normalized",
            "http": { "url": "http://quantumleap:8668/v2/notify" },
            "lastSuccess": "2018-09-02T08:36:04.00Z"
        },
        "throttling": 1
    },
    {
        "id": "5be07427be9a2d09cf677f09",
        "description": "Notify QuantumLeap on luminosity changes on any Lamp",
        "status": "active",
        "subject": { ...ETC },
        "notification": {
            "timesSent": 4,
            "lastNotification": "2018-09-02T08:36:00.00Z",
            "attrs": ["luminosity"],
            "attrsFormat": "normalized",
            "http": { "url": "http://quantumleap:8668/v2/notify" },
            "lastSuccess": "2018-09-02T08:36:01.00Z"
        },
        "throttling": 1
    }
]
```

## Time Series Data Queries (QuantumLeap API)

**QuantumLeap** offfers an API wrapping CrateDB backend so you can also perform multiple types of queries. The
documentation of the API is [here](https://app.swaggerhub.com/apis/smartsdk/ngsi-tsdb/). Mind the versions. If you have
access to your `quantumleap` container (e.g. it is running in `localhost` or port-forwarding to it), you can navigate
its API via `http://localhost:8668/v2/ui`.

### QuantumLeap API - List the first N Sampled Values

Now, to check QuantumLeap is persisting values, let's get started with our first query. This example shows the first 3
sampled `luminosity` values from `Lamp:001`.

Note the use of `Fiware-Service` and `Fiware-ServicePath` headers. These are required only when data are pushed to orion
using such headers (in multitenancy scenarios). Failing to align these headers will result in no data being returned.

#### 4 Request:

```bash
curl -X GET \
  'http://localhost:8668/v2/entities/Lamp:001/attrs/luminosity?=3&limit=3' \
  -H 'Accept: application/json' \
  -H 'Fiware-Service: openiot' \
  -H 'Fiware-ServicePath: /'
```

#### Response:

```json
{
    "data": {
        "attrName": "luminosity",
        "entityId": "Lamp:001",
        "index": ["2018-10-29T14:27:26", "2018-10-29T14:27:28", "2018-10-29T14:27:29"],
        "values": [2000, 1991, 1998]
    }
}
```

### QuantumLeap API - List N Sampled Values at an Offset

This example shows the fourth, fifth and sixth sampled `count` values of `Motion:001`.

#### 5 Request:

```bash
curl -X GET \
  'http://localhost:8668/v2/entities/Motion:001/attrs/count?offset=3&limit=3' \
  -H 'Accept: application/json' \
  -H 'Fiware-Service: openiot' \
  -H 'Fiware-ServicePath: /'
```

#### Response:

```json
{
    "data": {
        "attrName": "count",
        "entityId": "Motion:001",
        "index": ["2018-10-29T14:23:53.804000", "2018-10-29T14:23:54.812000", "2018-10-29T14:24:00.849000"],
        "values": [0, 1, 0]
    }
}
```

### QuantumLeap API - List the latest N Sampled Values

This example shows the latest three sampled `count` values from `Motion:001`.

#### 6 Request:

```bash
curl -X GET \
  'http://localhost:8668/v2/entities/Motion:001/attrs/count?lastN=3' \
  -H 'Accept: application/json' \
  -H 'Fiware-Service: openiot' \
  -H 'Fiware-ServicePath: /'
```

#### Response:

```json
{
    "data": {
        "attrName": "count",
        "entityId": "Motion:001",
        "index": ["2018-10-29T15:03:45.113000", "2018-10-29T15:03:46.118000", "2018-10-29T15:03:47.111000"],
        "values": [1, 0, 1]
    }
}
```

### QuantumLeap API - List the Sum of values grouped by a time period

This example shows last 3 total `count` values of `Motion:001` over each minute.

You need QuantumLeap **version >= 0.4.1**. You can check your version with a simple GET like:

```bash
curl -X GET \
  'http://localhost:8668/v2/version' \
  -H 'Accept: application/json'
```

#### 7 Request:

```bash
curl -X GET \
  'http://localhost:8668/v2/entities/Motion:001/attrs/count?aggrMethod=count&aggrPeriod=minute&lastN=3' \
  -H 'Accept: application/json' \
  -H 'Fiware-Service: openiot' \
  -H 'Fiware-ServicePath: /'
```

#### Response:

```json
{
    "data": {
        "attrName": "count",
        "entityId": "Motion:001",
        "index": ["2018-10-29T15:03:00.000000", "2018-10-29T15:04:00.000000", "2018-10-29T15:05:00.000000"],
        "values": [21, 10, 11]
    }
}
```

### QuantumLeap API - List the Minimum Values grouped by a Time Period

This example shows minimum `luminosity` values from `Lamp:001` over each minute.

<!--lint disable no-blockquote-without-marker-->

> You need QuantumLeap **version >= 0.4.1**. You can check your version with a simple GET like:

> ```
> curl -X GET \
>   'http://localhost:8668/v2/version' \
>   -H 'Accept: application/json'
> ```

<!--lint enable no-blockquote-without-marker-->

#### 8 Request:

```bash
curl -X GET \
  'http://localhost:8668/v2/entities/Lamp:001/attrs/luminosity?aggrMethod=min&aggrPeriod=minute&lastN=3' \
  -H 'Accept: application/json' \
  -H 'Fiware-Service: openiot' \
  -H 'Fiware-ServicePath: /'
```

#### Response:

```json
{
    "data": {
        "attrName": "count",
        "entityId": "Motion:001",
        "index": ["2018-10-29T15:03:00.000000", "2018-10-29T15:04:00.000000", "2018-10-29T15:05:00.000000"],
        "values": [1720, 1878, 1443]
    }
}
```

### QuantumLeap API - List the Maximum Value over a Time Period

This example shows maximum `luminosity` value of `Lamp:001` that occurred between from `2018-06-27T09:00:00` to
`2018-06-30T23:59:59`.

#### 9 Request:

```bash
curl -X GET \
  'http://localhost:8668/v2/entities/Lamp:001/attrs/luminosity?aggrMethod=max&fromDate=2018-06-27T09:00:00&toDate=2018-06-30T23:59:59' \
  -H 'Accept: application/json' \
  -H 'Fiware-Service: openiot' \
  -H 'Fiware-ServicePath: /'
```

#### Response:

```json
{
    "data": {
        "attrName": "luminosity",
        "entityId": "Lamp:001",
        "index": [],
        "values": [1753]
    }
}
```

### QuantumLeap API - List the latest N Sampled Values of Devices near a Point

This example shows the latest four sampled `luminosity` values of lamps that are within a 5 km radius from
`52°33'16.9"N 13°23'55.0"E` (Bornholmer Straße 65, Berlin, Germany). If you have turned on all the lamps available on
the device monitor page, you should be able to see data for `Lamp:001` and `Lamp:004`.

> **Note:** Geographical queries are only available starting from version `0.5` of QuantumLeap which implements the full
> set of queries detailed in the Geographical Queries section of the
> [NGSI v2 specification](http://fiware.github.io/specifications/ngsiv2/stable/).

#### 10 Request:

```console
curl -X GET \
  'http://localhost:8668/v2/types/Lamp/attrs/luminosity?lastN=4&georel=near;maxDistance:5000&geometry=point&coords=52.5547,13.3986' \
  -H 'Accept: application/json' \
  -H 'Fiware-Service: openiot' \
  -H 'Fiware-ServicePath: /'
```

#### Response:

```json
{
    "data": {
        "attrName": "luminosity",
        "entities": [
            {
                "entityId": "Lamp:001",
                "index": ["2018-12-13T16:35:58.284", "2018-12-13T16:36:58.216"],
                "values": [999, 999]
            },
            {
                "entityId": "Lamp:004",
                "index": ["2018-12-13T16:35:04.351", "2018-12-13T16:36:04.282"],
                "values": [948, 948]
            }
        ],
        "entityType": "Lamp"
    }
}
```

### QuantumLeap API - List the latest N Sampled Values of Devices in an Area

This example shows the latest four sampled `luminosity` values of lamps that are inside a square of side 200 m centred
at `52°33'16.9"N 13°23'55.0"E` (Bornholmer Straße 65, Berlin, Germany). Even if you have turned on all the lamps
available on the device monitor page, you should only see data for `Lamp:001`.

> **Note:** Geographical queries are only available starting from version `0.5` of QuantumLeap which implements the full
> set of queries detailed in the Geographical Queries section of the
> [NGSI v2 specification](http://fiware.github.io/specifications/ngsiv2/stable/).

#### 11 Request:

```console
curl -X GET \
  'http://localhost:8668/v2/types/Lamp/attrs/luminosity?lastN=4&georel=coveredBy&geometry=polygon&coords=52.5537,13.3996;52.5557,13.3996;52.5557,13.3976;52.5537,13.3976;52.5537,13.3996' \
  -H 'Accept: application/json' \
  -H 'Fiware-Service: openiot' \
  -H 'Fiware-ServicePath: /'
```

#### Response:

```json
{
    "data": {
        "attrName": "luminosity",
        "entities": [
            {
                "entityId": "Lamp:001",
                "index": [
                    "2018-12-13T17:08:56.041",
                    "2018-12-13T17:09:55.976",
                    "2018-12-13T17:10:55.907",
                    "2018-12-13T17:11:55.833"
                ],
                "values": [999, 999, 999, 999]
            }
        ],
        "entityType": "Lamp"
    }
}
```

## Time Series Data Queries (CrateDB API)

**CrateDB** offers an [HTTP Endpoint](https://crate.io/docs/crate/reference/en/latest/interfaces/http.html) that can be
used to submit SQL queries. The endpoint is accessible under `<servername:port>/_sql`.

SQL statements are sent as the body of POST requests in JSON format, where the SQL statement is the value of the `stmt`
attribute.

> When to query **CrateDB** and when **QuantumLeap**?. As a rule of thumb, prefer working always with **QuantumLeap**
> for the following reasons:
>
> -   Your experience will be closer to FIWARE NGSI APIs like Orion's.
> -   Your application will not be tied to CrateDB's specifics nor QuantumLeap's implementation details, which could
>     change and break your app.
> -   QuantumLeap can be easily extended to other backends and your app will get compatibility for free.
> -   If your deployment is distributed, you won't need to expose the ports of your database to the outside.

If your are certain your query is not supported by **QuantumLeap**, you may have to end up querying **CrateDB**
directly - in this case please also open an issue in
[QuantumLeap's GitHub repository](https://github.com/smartsdk/ngsi-timeseries-api/issues) to inform the team.

### CrateDB API - Checking Data persistence

Another way to see if data are being persisted is to check if a `table_schema` has been created. This can be done by
making a request to the **CrateDB** HTTP endpoint as shown:

#### 12 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SHOW SCHEMAS"}'
```

#### Response:

```json
{
    "cols": ["table_schema"],
    "rows": [["doc"], ["information_schema"], ["sys"], ["mtopeniot"], ["pg_catalog"]],
    "rowcount": 5,
    "duration": 10.5146
}
```

Schema names are formed with the `mt` prefix followed by `fiware-service` header in lower case. The IoT Agent is
forwarding measurements from the dummy IoT devices, with the `FIWARE-Service` header `openiot`. These are being
persisted under the `mtopeniot` schema.

If the `mtopeniot` does not exist, then the subscription to **QuantumLeap** has not been set up correctly. Check that
the subscription exists, and has been configured to send data to the correct location.

**QuantumLeap** will persist data into separate tables within the **CrateDB** database based on the entity type. Table
names are formed with the `et` prefix and the entity type name in lowercase.

#### 13 Request:

```bash
curl -X POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SHOW TABLES"}'
```

#### Response:

```json
{
    "cols": ["table_schema", "table_name"],
    "rows": [["mtopeniot", "etmotion"], ["mtopeniot", "etlamp"]],
    "rowcount": 2,
    "duration": 14.2762
}
```

The response shows that both **Motion Sensor** data and **Smart Lamp** data are being persisted in the database.

### CrateDB API - List the first N Sampled Values

The SQL statement uses `ORDER BY` and `LIMIT` clauses to sort the data. More details can be found under within the
**CrateDB** [documentation](https://crate.io/docs/crate/reference/en/latest/sql/statements/select.html)

#### 14 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT * FROM mtopeniot.etlamp WHERE entity_id = '\''Lamp:001'\'' ORDER BY time_index ASC LIMIT 3"}'
```

#### Response:

```json
{
    "cols": ["entity_id", "entity_type", "fiware_servicepath", "luminosity", "time_index"],
    "rows": [
        ["Lamp:001", "Lamp", "/", 1750, 1530262765000],
        ["Lamp:001", "Lamp", "/", 1507, 1530262770000],
        ["Lamp:001", "Lamp", "/", 1390, 1530262775000]
    ],
    "rowcount": 3,
    "duration": 21.8338
}
```

### CrateDB API - List N Sampled Values at an Offset

The SQL statement uses an `OFFSET` clause to retrieve the required rows. More details can be found under within the
**CrateDB** [documentation](https://crate.io/docs/crate/reference/en/latest/sql/statements/select.html).

#### 15 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT * FROM mtopeniot.etmotion WHERE entity_id = '\''Motion:001'\'' order by time_index ASC LIMIT 3 OFFSET 3"}'
```

#### Response:

```json
{
    "cols": ["count", "entity_id", "entity_type", "fiware_servicepath", "time_index"],
    "rows": [
        [0, "Motion:001", "Motion", "/", 1530262791452],
        [1, "Motion:001", "Motion", "/", 1530262792469],
        [0, "Motion:001", "Motion", "/", 1530262793472]
    ],
    "rowcount": 3,
    "duration": 54.215
}
```

### CrateDB API - List the latest N Sampled Values

The SQL statement uses an `ORDER BY ... DESC` clause combined with a `LIMIT` clause to retrieve the last N rows. More
details can be found under within the **CrateDB**
[documentation](https://crate.io/docs/crate/reference/en/latest/sql/statements/select.html).

#### 16 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT * FROM mtopeniot.etmotion WHERE entity_id = '\''Motion:001'\''  ORDER BY time_index DESC LIMIT 3"}'
```

#### Response:

```json
{
    "cols": ["count", "entity_id", "entity_type", "fiware_servicepath", "time_index"],
    "rows": [
        [0, "Motion:001", "Motion", "/", 1530263896550],
        [1, "Motion:001", "Motion", "/", 1530263894491],
        [0, "Motion:001", "Motion", "/", 1530263892483]
    ],
    "rowcount": 3,
    "duration": 18.591
}
```

### CrateDB API - List the Sum of values grouped by a time period

The SQL statement uses a `SUM` function and `GROUP BY` clause to retrieve the relevant data. **CrateDB** offers a range
of
[Date-Time Functions](https://crate.io/docs/crate/reference/en/latest/general/builtins/scalar.html#date-and-time-functions)
to truncate and convert the timestamps into data which can be grouped.

#### 17 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT DATE_FORMAT (DATE_TRUNC ('\''minute'\'', time_index)) AS minute, SUM (count) AS sum FROM mtopeniot.etmotion WHERE entity_id = '\''Motion:001'\'' GROUP BY minute LIMIT 3"}'
```

#### Response:

```json
{
    "cols": ["minute", "sum"],
    "rows": [
        ["2018-06-29T09:17:00.000000Z", 12],
        ["2018-06-29T09:34:00.000000Z", 10],
        ["2018-06-29T09:08:00.000000Z", 11],
        ["2018-06-29T09:40:00.000000Z", 3],
        ...etc
    ],
    "rowcount": 42,
    "duration": 22.9832
}
```

### CrateDB API - List the Minimum Values grouped by a Time Period

The SQL statement uses a `MIN` function and `GROUP BY` clause to retrieve the relevant data. **CrateDB** offers a range
of
[Date-Time Functions](https://crate.io/docs/crate/reference/en/latest/general/builtins/scalar.html#date-and-time-functions)
to truncate and convert the timestamps into data which can be grouped.

#### 18 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT DATE_FORMAT (DATE_TRUNC ('\''minute'\'', time_index)) AS minute, MIN (luminosity) AS min FROM mtopeniot.etlamp WHERE entity_id = '\''Lamp:001'\'' GROUP BY minute"}'
```

#### Response:

```json
{
    "cols": ["minute", "min"],
    "rows": [
        ["2018-06-29T09:34:00.000000Z", 1516],
        ["2018-06-29T09:17:00.000000Z", 1831],
        ["2018-06-29T09:40:00.000000Z", 1768],
        ["2018-06-29T09:08:00.000000Z", 1868],
        ...etc
    ],
    "rowcount": 40,
    "duration": 13.1854
}
```

### CrateDB API - List the Maximum Value over a Time Period

The SQL statement uses a `MAX` function and a `WHERE` clause to retrieve the relevant data. **CrateDB** offers a range
of [Aggregate Functions](https://crate.io/docs/crate/reference/en/latest/general/dql/selects.html#data-aggregation) to
aggregate data in different ways.

#### 19 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT MAX(luminosity) AS max FROM mtopeniot.etlamp WHERE entity_id = '\''Lamp:001'\'' and time_index >= '\''2018-06-27T09:00:00'\'' and time_index < '\''2018-06-30T23:59:59'\''"}'
```

#### Response:

```json
{
    "cols": ["max"],
    "rows": [[1753]],
    "rowcount": 1,
    "duration": 26.7215
}
```

# Accessing Time Series Data Programmatically

Once the JSON response for a specified time series has been retrieved, displaying the raw data is of little use to an
end user. It must be manipulated to be displayed in a bar chart, line graph or table listing. This is not within the
domain of **QuantumLeap** as it not a graphical tool, but can be delegated to a mashup or dashboard component such as
[Wirecloud](https://github.com/Fiware/catalogue/blob/master/processing/README.md#Wirecloud) or
[Knowage](https://github.com/Fiware/catalogue/blob/master/processing/README.md#Knowage)

It can also be retrieved and displayed using a third-party graphing tool appropriate to your coding environment - for
example [chartjs](http://www.chartjs.org/). An example of this can be found within the `history` controller in the
[Git Repository](https://github.com/Fiware/tutorials.Step-by-Step/blob/master/context-provider/controllers/history.js)

The basic processing consists of two-step - retrieval and attribute mapping, sample code can be seen below:

```javascript
function readCrateLampLuminosity(id, aggMethod) {
    return new Promise(function(resolve, reject) {
        const sqlStatement =
            "SELECT DATE_FORMAT (DATE_TRUNC ('minute', time_index)) AS minute, " +
            aggMethod +
            "(luminosity) AS " +
            aggMethod +
            " FROM mtopeniot.etlamp WHERE entity_id = 'Lamp:" +
            id +
            "' GROUP BY minute ORDER BY minute";
        const options = {
            method: "POST",
            url: crateUrl,
            headers: { "Content-Type": "application/json" },
            body: { stmt: sqlStatement },
            json: true
        };
        request(options, (error, response, body) => {
            return error ? reject(error) : resolve(body);
        });
    });
}
```

```javascript
function crateToTimeSeries(crateResponse, aggMethod, hexColor) {
    const data = [];
    const labels = [];
    const color = [];

    if (crateResponse && crateResponse.rows && crateResponse.rows.length > 0) {
        _.forEach(crateResponse.rows, element => {
            const date = moment(element[0]);
            data.push({ t: date, y: element[1] });
            labels.push(date.format("HH:mm"));
            color.push(hexColor);
        });
    }

    return {
        labels,
        data,
        color
    };
}
```

The modified data is then passed to the frontend to be processed by the third-party graphing tool. The result is shown
here: `http://localhost:3000/device/history/urn:ngsi-ld:Store:001`

## Displaying CrateDB data as a Grafana Dashboard

**CrateDB** has been chosen as the time-series data sink for QuantumLeap, because, among
[many other benefits](https://quantumleap.readthedocs.io/en/latest/), it integrates seamlessly with the
[Grafana](https://grafana.com/) time series analytics tool. Grafana can be used to display the aggregated sensor data -
a full tutorial on building dashboards can be found [here](https://www.youtube.com/watch?v=sKNZMtoSHN4). The simpified
instructions below summarize how to connect and display a graph of the Lamp `luminosity` data.

### Logging in

The `docker-compose` file has started an instance of the Grafana UI listening on port `3003`, so the login page can be
found at: `http://localhost:3003/login`. The default username is `admin` and the default password is `admin`

### Configuring a Data Source

After logging in, a datasource must be set up at `http://localhost:3003/datasources` with the following values

-   **Name** Lamp
-   **Type** Crate

-   **URL** `http://cratedb:4200`
-   **Access** Server (Default)

-   **Schema** mtopeniot
-   **Table** etlamp
-   **Time column** time_index

![](https://fiware.github.io/tutorials.Time-Series-Data/img/grafana-lamp-settings.png)

![](https://fiware.github.io/tutorials.Time-Series-Data/img/grafana-crate-connect.png)

Click on the Save and test button and the message _Data Source added_ will be returned

### Configuring a Dashboard

To display a new dashboard, you can either click the **+** button and select **New Dashboard** or go directly to
`http://localhost:3003/dashboard/new?orgId=1`. Thereafter select the **Graph** dashboard type.

To configure the dashboard click on Panel title and select edit from the dropdown list.

The following values in **bold text** need to be placed in the graphing wizard

-   Data Source **Lamp** (selected from the previously created Data Sources)
-   FROM **mtopeniot.etlamp** WHERE **entity_id** = **Lamp:001**
-   Select **Min** **luminosity**
-   Group By time Interval **Minute** Format as **Time Series**

![](https://fiware.github.io/tutorials.Time-Series-Data/img/grafana-lamp-graph.png)

The final result can be seen below:

![](https://fiware.github.io/tutorials.Time-Series-Data/img/grafana-result.png)
