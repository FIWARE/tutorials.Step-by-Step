**Description:** This tutorial is an introduction to [FIWARE Quantum Leap](https://smartsdk.github.io/ngsi-timeseries-api/) - a generic enabler which is used to perist context data into a **Crate-DB** database. The tutorial activates the IoT sensors connected in the [previous tutorial](iot-agent.md) and persists measurements from those sensors into the database.
The **Crate-DB** HTTP endpoint is then used to retrieve time-based aggregations of that data. The results are visualised on a graph or via the **Grafana** time series analytics tool.

The tutorial uses [cUrl](https://ec.haxx.se/) commands throughout, but is also available as [Postman documentation](http://fiware.github.io/tutorials.Time-Series-Data/)

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/d24facc3c430bb5d5aaf)

---

# Persisting and Querying Time Series Data (Crate-DB)

> "Forever is composed of nows."
>
> — Emily Dickinson

[Previous tutorials](historic-context.md) have shown how to persist historic 
context data into a range of databases such as **MySQL** and **PostgreSQL**. Furthermore, the [Short Term Historic](short-term-history.md) tutorial has introduced the [STH-Comet](http://fiware-sth-comet.readthedocs.io/) generic enabler for persisting and querying historic context data using
a **Mongo-DB** database.

FIWARE [Quantum Leap](https://smartsdk.github.io/ngsi-timeseries-api/) is an alternative generic enabler created
specifically for data persistence into the **Crate-DB** time-series database, and therefore offers an alternative to the
[STH-Comet](http://fiware-sth-comet.readthedocs.io/). 

[Crate-DB](https://crate.io/) is a distributed SQL DBMS designed for use with the Internet of Things. It is capable of ingesting a large number of data points per second and can be queried in real-time. The database is designed for the
execution of complex queries such as geospatial and time series data. Retrieval of this historic context data allows 
for the creation of graphs and dashboards displaying trends over time.
 

A summary of the differences can be seen below:


| Quantum Leap               | STH-Comet |
|----------------------------|-----------|
| Offers an NGSI v2 interface for notifications | Offers an NGSI v1 interface for notifiations |
| Persists Data to a Crate-DB database  | Persists Data to Mongo-DB database |
| Does not offer its own HTTP endpoint for queries, use the Crate-DB SQL endpoint | Offers its own HTTP endpoint for queries - Mongo-DB database cannot be accessed directly |
| The Crate-DB SQL endpoint is able to satisfy complex data queries using SQL | STH-Comet offers a limited set of queries |
| Crate-DB is a distributed SQL DBMS built atop NoSQL storage | Mongo-DB is a document based NoSQL database|

Further details about the differences between the the underlying database engines can be found [here](https://db-engines.com/en/system/CrateDB%3BMongoDB)


## Analyzing time series data

The appropriate use of time series data analysis will depend on your use case and the reliability of the data measurements you receive. Time series data analysis can be used to answer questions such as:

* What was the maximum measurement of a device within a given time period?
* What was the average measurement of a device within a given time period?
* What was the sum of the measurements sent by a device within a given time period?

It can also be used to reduce the significance of each individual data point to exclude outliers by smoothing.


#### Grafana

[Grafana](https://grafana.com/) is an open source software for time series analytics tool which will be used 
during this tutorial. It integrates with a variety of time-series databases including Crate-DB
It is available licensed under the Apache License 2.0. More information can be found at https://grafana.com/


#### Device Monitor

For the purpose of this tutorial, a series of dummy IoT devices have been created, which will be attached to the context broker. Details of the architecture and protocol used can be found in the [IoT Sensors tutorial](iot-sensors.md).
The state of each device can be seen on the UltraLight device monitor web-page found at: `http://localhost:3000/device/monitor`

![FIWARE Monitor](https://fiware.github.io/tutorials.Time-Series-Data/img/device-monitor.png)

#### Device History

Once **Quantum Leap** has started aggregating data, the historical state of each device can be seen on the device history web-page found at: `http://localhost:3000/device/history/urn:ngsi-ld:Store:001`

![](https://fiware.github.io/tutorials.Time-Series-Data/img/history-graphs.png)

---

# Architecture

This application builds on the components and dummy IoT devices created in 
[previous tutorials](iot-agent.md). It will use three FIWARE components:
the [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/), the
[IoT Agent for Ultralight 2.0](http://fiware-iotagent-ul.readthedocs.io/en/latest/),
and [Quantum Leap](https://smartsdk.github.io/ngsi-timeseries-api/) . 

Therefore the overall architecture will consist of the following elements:

* Three **FIWARE Generic Enablers**:
    * The FIWARE [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
    * The FIWARE [IoT Agent for Ultralight 2.0](http://fiware-iotagent-ul.readthedocs.io/en/latest/) which will receive northbound measurements from the dummy IoT devices in [Ultralight 2.0](http://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual) format and convert them to [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) requests for the context broker to alter the state of the context entities
    * FIWARE [Quantum Leap](https://smartsdk.github.io/ngsi-timeseries-api/) subscribe to context changes and persist them into a **Crate-DB** database  
* A [MongoDB](https://www.mongodb.com/) database:
    * Used by the **Orion Context Broker** to hold context data information such as data entities, subscriptions and registrations
    * Used by the **IoT Agent** to hold device information such as device URLs and Keys
* A [Crate-DB](https://crate.io/) database:
    * Used as a data sink to hold time-based historical context data
    * offers an HTTP endpoint to interpret time-based data queries

* Three **Context Providers**:
    * The **Stock Management Frontend** is not used in this tutorial. It does the following:
        + Display store information and allow users to interact with the dummy IoT devices
        + Show which products can be bought at each store
        + Allow users to "buy" products and reduce the stock count.
    * A webserver acting as set of [dummy IoT devices](iot-sensors.md) using the [Ultralight 2.0](http://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual) protocol running over HTTP.
    * The **Context Provider NGSI** proxy is not used in this tutorial. It does the following:
        + receive requests using [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
        + makes requests to publicly available data sources using their own APIs in a proprietary format 
        + returns context data back to the Orion Context Broker in [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) format.


Since all interactions between the elements are initiated by HTTP requests, the entities can be containerized and run from exposed ports. 

The overall architecture can be seen below:

![](https://fiware.github.io/tutorials.Time-Series-Data/img/architecture.png)



# Start Up

Before you start you should ensure that you have obtained or built the necessary Docker images locally. Please clone the repository and create the necessary images by running the commands as shown:

```bash
git clone git@github.com:Fiware/tutorials.Time-Series-Data.git
cd tutorials.Time-Series-Data

./services create
``` 

>**Note** The `context-provider` image has not yet been pushed to Docker hub.
> Failing to build the Docker sources before proceeding will result in the following error:
>
>```
>Pulling context-provider (fiware/cp-web-app:latest)...
>ERROR: The image for the service you're trying to recreate has been removed.
>```


Thereafter, all services can be initialized from the command line by running the [services](https://github.com/Fiware/tutorials.Historic-Context/blob/master/services) Bash script provided within the repository:

```bash
./services start
``` 

>:information_source: **Note:** If you want to clean up and start over again you can do so with the following command:
>
>```bash
>./services stop
>``` 
>

---

# Connecting FIWARE to a Crate-DB Database via Quantum Leap

In the configuration, **Quantum Leap** listens to NGSI v2 notifications on port `8868` and persists historic context
data to the Crate-DB. Crate-DB is accessible using port `4200` and can either be queried directly or attached to the
Grafana analytics tool.  The rest of the system providing the context data has been described in previous tutorials

## Crate-DB Database Server Configuration

```yaml
  crate-db:
    image: crate:1.0.5
    hostname: crate-db
    ports:
      - "4200:4200"
      - "4300:4300"
    command: -Ccluster.name=democluster -Chttp.cors.enabled=true -Chttp.cors.allow-origin="*"
```

## Quantum Leap Configuration 

```yaml
  quantum-leap:
    image: smartsdk/quantumleap
    hostname: quantum-leap
    ports:
      - "8668:8668"
    depends_on:
      - crate-db
    environment:
      - CRATE_HOST=crate-db
```

## Grafana Configuration

```yaml
  grafana:
    image: grafana/grafana
    depends_on:
      - crate-db
    ports:
      - "3003:3000"
    environment:
      - GF_INSTALL_PLUGINS=crate-datasource,grafana-clock-panel,grafana-worldmap-panel
```

The `quantum-leap` container is listening on one port: 

* The Operations for port for STH-Comet - `8668` is where the service will be listening for notifications from the Orion context broker

The `CRATE_HOST` environment variable defines the location where the data will be persisted.

The `crate-db` container is listening on two ports: 
* The Admin UI is avaliable on port `4200`
* The transport protocol is available on `4300`

The `grafana` container has connected up port `3000` internally with port `3003` externally. This is because the Grafana 
UI is usually available on port `3000`, but this port has already been taken by the dummy devices UI so it has been shifted
to another port. The Grafana Environment variables are described within their own 
[documentation](http://docs.grafana.org/installation/configuration/). The configuration ensures we will be able to connect
to the Crate-DB database later on in the tutorial

### Generating Context Data

For the purpose of this tutorial, we must be monitoring a system where the context is periodically being updated.
The dummy IoT Sensors can be used to do this. Open the device monitor page at `http://localhost:3000/device/monitor`
and unlock a **Smart Door** and switch on a **Smart Lamp**. This can be done by selecting an appropriate the command 
from the drop down list and pressing the `send` button. The stream of measurements coming from the devices can then
be seen on the same page:

![](https://fiware.github.io/tutorials.Time-Series-Data/img/door-open.gif)


## Setting up Subscriptions

Once a dynamic context system is up and running, we need to inform **Quantum Leap** directly of changes in context. 
As expected this is done using the subscription mechanism of the **Orion Context Broker**. The `attrsFormat=legacy`
attribute is not required since **Quantum Leap** accepts NGSI v2 notifications directly.

More details about subscriptions can be found in previous tutorials

### Aggregate Motion Sensor Count Events

The rate of change of the **Motion Sensor** is driven by events in the real-world. We need to receive every event to be able to aggregate the results.

This is done by making a POST request to the `/v2/subscription` endpoint of the **Orion Context Broker**.

* The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to measurements from the attached IoT Sensors
* The `idPattern` in the request body ensures that **Quantum Leap** will be informed of all **Motion Sensor** data changes.
* The `notification` url must match the exposed port.

The `metadata` attribute ensures that the `time_index` column within the **Crate-DB** database will match the data found
within the **Mongo-DB** database used by the **Orion Context Broker** rather than using the creation time of the record
within the **Crate-DB** itself.

#### 1 Request:

```bash
curl -iX POST \
  'http://{{orion}}/v2/subscriptions/' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify Quantum Leap of all Motion Sensor count changes",
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
      "url": "http://quantum-leap:8668/v2/notify"
    },
    "attrs": [
      "count"
    ],
    "metadata": ["dateCreated", "dateModified"]
  }
}'
```

### Sample Lamp Luminosity

The luminosity of the Smart Lamp is constantly changing, we only need to sample the values to be able to work out relevant statistics such as minimum and maximum values and rates of change.

This is done by making a POST request to the `/v2/subscription` endpoint of the **Orion Context Broker** and including
 the `throttling` attribute in the request body.

* The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to measurements from the attached IoT Sensors
* The `idPattern` in the request body ensures that **Quantum Leap** will be informed of all **Motion Sensor** data changes.
* The `notification` url must match the exposed port.
* The `throttling` value defines the rate that changes are sampled.

The `metadata` attribute ensures that the `time_index` column within the **Crate-DB** database will match the data found
within the **Mongo-DB** database used by the **Orion Context Broker** rather than using the creation time of the record
within the **Crate-DB** itself.

#### 2 Request:

```bash
curl -iX POST \
  'http://{{orion}}/v2/subscriptions/' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify Quantum Leap to sample Lamp changes every five seconds",
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
      "url": "http://quantum-leap:8668/v2/notify"
    },
    "attrs": [
      "luminosity"
    ],
    "metadata": ["dateCreated", "dateModified"]
  },
  "throttling": 5
}'
```

## Time Series Data Queries (Crate-DB)


Crate-DB offers an [HTTP Endpoint](https://crate.io/docs/crate/reference/en/latest/interfaces/http.html) that can be used to submit SQL queries. The endpoint is accessible under `<servername:port>/_sql`.

SQL statements are sent as the body of POST requests in JSON format, where the SQL statement is the value of the `stmt` attribute.

### Read Schemas

**Quantum Leap** does not currently offer any interfaces to query for the persisted data A good method to see if data is being persisted is to check to see if a `table_schema` has been created. This can be done by making a request to the **Crate-DB** HTTP endpoint as shown:


#### 3 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT * FROM mtopeniot.etmotion WHERE entity_id = '\''Motion:001'\'' LIMIT 10"}'
```

#### Response:

```json
{
    "cols": ["table_schema"],
    "rows": [
        [ "doc"],
        [ "information_schema"],
        [ "sys"],
        [ "mtopeniot"],
        [ "pg_catalog"]
    ],
    "rowcount": 5,
    "duration": 10.5146
}
```

Schema names are formed with the `mt` prefix followed by `fiware-service` header in lower case. The IoT Agent is forwarding measurements from the dummy IoT devices, with the header `openiot` these are being persisted under the `mtopeniot` schema.

If the `mtopeniot` does not exist, then the subscription to **Quantum Leap** has not been set up correctly. Check that the subscription exists, and has been configured to send data to the correct location.



### Read Tables

Quantum Leap will persist data into separate tables within the Crate-DB database based on the entity type. Table names are formed with the et prefix and the entity type name in lowercase.

#### 4 Request:

```bash
curl -X POST \
  'http://{{crate}}/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema ='\''mtopeniot'\''"}'
```

#### Response:

```json
{
    "cols": ["table_schema", "table_name"],
    "rows": [
        ["mtopeniot","etmotion"],
        ["mtopeniot","etlamp"]
    ],
    "rowcount": 2,
    "duration": 14.2762
}
```

The response shows that both **Motion Sensor** data and **Smart Lamp** data are being persisted in the database.

### List the first N Sampled Values

This example shows the first 3 sampled luminosity values from **Lamp:001**.

The SQL statement uses `ORDER BY` and `LIMIT` clauses to sort the data. More details can be found under within the **Crate-DB** [documentation](https://crate.io/docs/crate/reference/en/latest/sql/statements/select.html)

#### 5 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT * FROM mtopeniot.etlamp WHERE entity_id = '\''Lamp:001'\''  ORDER BY time_index ASC LIMIT 3"}'
```

#### Response:

```json
{
    "cols": ["entity_id","entity_type","fiware_servicepath","luminosity","time_index"
    ],
    "rows": [["Lamp:001","Lamp","/",1750,1530262765000],
        ["Lamp:001","Lamp","/",1507,1530262770000],
        ["Lamp:001","Lamp","/",1390,1530262775000]
    ],
    "rowcount": 3,
    "duration": 21.8338
}
```

### List N Sampled Values at an Offset

This example shows the fourth, fifth and sixth sampled count values from **Motion:001**.

The SQL statement uses an `OFFSET` clause to retrieve the required rows. More details can be found under within the **Crate-DB** [documentation](https://crate.io/docs/crate/reference/en/latest/sql/statements/select.html)

#### 6 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT * FROM mtopeniot.etmotion WHERE entity_id = '\''Motion:001'\'' LIMIT 10"}'
```

#### Response:

```json
{
    "cols": ["count","entity_id","entity_type","fiware_servicepath","time_index"
    ],
    "rows": [[0,"Motion:001","Motion","/",1530262791452],
        [1,"Motion:001","Motion","/",1530262792469],
        [0,"Motion:001","Motion","/",1530262793472]
    ],
    "rowcount": 3,
    "duration": 54.215
}
```

### List the latest N Sampled Values

This example shows latest three sampled count values from **Motion:001**.

The SQL statement uses an `ORDER BY ... DESC` clause combined with a `LIMIT` clause to retrieve the last N rows. More details can be found under within the **Crate-DB** [documentation](https://crate.io/docs/crate/reference/en/latest/sql/statements/select.html)

#### 7 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT * FROM mtopeniot.motion WHERE entity_id = '\''Motion:001'\''  ORDER BY time_index DESC LIMIT 3"}'
```

#### Response:

```json
{
    "cols": ["count","entity_id","entity_type","fiware_servicepath","time_index"
    ],
    "rows": [[0,"Motion:001","Motion","/",1530263896550],
        [1,"Motion:001","Motion","/",1530263894491],
        [0,"Motion:001","Motion","/",1530263892483]
    ],
    "rowcount": 3,
    "duration": 18.591
}
```

### List the Sum of values over a time period

This example shows total count values from **Motion:001** over each minute.

The SQL statement uses a `SUM` function and `GROUP BY` clause to retrieve the relevant data.  **Crate-DB** offers a range of [Date-Time Functions](https://crate.io/docs/crate/reference/en/latest/general/builtins/scalar.html#date-and-time-functions) to truncate and convert the timestamps into data which can be grouped.

#### 8 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT DATE_FORMAT (DATE_TRUNC ('\''minute'\'', time_index)) AS minute, SUM (count) AS sum FROM mtopeniot.etmotion WHERE entity_id = '\''Motion:001'\'' GROUP BY minute"}'
```

#### Response:

```json
{
    "cols": ["minute","sum"],
    "rows": [
        ["2018-06-29T09:17:00.000000Z",12],
        ["2018-06-29T09:34:00.000000Z",10],
        ["2018-06-29T09:08:00.000000Z",11],
        ["2018-06-29T09:40:00.000000Z",3],
        ...etc
    ],
    "rowcount": 42,
    "duration": 22.9832
}
```


### List the Minimum Values over a Time Period

This example shows minimum luminosity values from **Lamp:001** over each minute.

The SQL statement uses a `MIN` function and `GROUP BY` clause to retrieve the relevant data.  **Crate-DB** offers a range of [Date-Time Functions](https://crate.io/docs/crate/reference/en/latest/general/builtins/scalar.html#date-and-time-functions) to truncate and convert the timestamps into data which can be grouped.

#### 9 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT DATE_FORMAT (DATE_TRUNC ('\''minute'\'', time_index)) AS minute, MIN (luminosity) AS min FROM mtopeniot.etlamp WHERE entity_id = '\''Lamp:001'\'' GROUP BY minute"}'
```

#### Response:

```json
{
    "cols": ["minute","min"],
    "rows": [
        ["2018-06-29T09:34:00.000000Z",1516],
        ["2018-06-29T09:17:00.000000Z",1831],
        ["2018-06-29T09:40:00.000000Z",1768],
        ["2018-06-29T09:08:00.000000Z",1868],
        ...etc
    ],
    "rowcount": 40,
    "duration": 13.1854
}
```

### List the Maximum Values over a Time Period

This example shows maximum luminosity values from **Lamp:001** over each minute.

The SQL statement uses a `MAX` function and `GROUP BY` clause to retrieve the relevant data.  **Crate-DB** offers a range of [Date-Time Functions](https://crate.io/docs/crate/reference/en/latest/general/builtins/scalar.html#date-and-time-functions) to truncate and convert the timestamps into data which can be grouped.

#### 10 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT DATE_FORMAT (DATE_TRUNC ('\''minute'\'', time_index)) AS minute, MAX (luminosity) AS max FROM mtopeniot.etlamp WHERE entity_id = '\''Lamp:001'\'' GROUP BY minute"}'
```

#### Response:

```json
{
    "cols": ["minute","max"],
    "rows": [
        ["2018-06-29T09:34:00.000000Z",2008],
        ["2018-06-29T09:17:00.000000Z",1911],
        ["2018-06-29T09:40:00.000000Z",2005],
        ["2018-06-29T09:08:00.000000Z",2008],
        ...etc
    ],
    "rowcount": 43,
    "duration": 26.7215
}
```

### List the Average Values over a Time Period

This example shows the average of luminosity values from **Lamp:001** over each minute.

The SQL statement uses a `AVG` function and `GROUP BY` clause to retrieve the relevant data. **Crate-DB** offers a range of [Date-Time Functions](https://crate.io/docs/crate/reference/en/latest/general/builtins/scalar.html#date-and-time-functions) to truncate and convert the timestamps into data which can be grouped.

#### 11 Request:

```bash
curl -iX POST \
  'http://localhost:4200/_sql' \
  -H 'Content-Type: application/json' \
  -d '{"stmt":"SELECT DATE_FORMAT (DATE_TRUNC ('\''minute'\'', time_index)) AS minute, AVG (luminosity) AS average FROM mtopeniot.etlamp WHERE entity_id = '\''Lamp:001'\'' GROUP BY minute"}'
```

#### Response:

```json
{
    "cols": ["minute","average"],
    "rows": [
        ["2018-06-29T09:34:00.000000Z",1874.9],
        ["2018-06-29T09:17:00.000000Z",1867.3333333333333],
        ["2018-06-29T09:40:00.000000Z",1909.7142857142858],
        ["2018-06-29T09:08:00.000000Z",1955.8333333333333],
        ["2018-06-29T09:33:00.000000Z",1933.5],
        ...etc

    ],
    "rowcount": 44,
    "duration": 22.0911
}
```








