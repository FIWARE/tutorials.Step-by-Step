[![FIWARE Core Context Management](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/core.svg)](https://github.com/FIWARE/catalogue/blob/master/core/README.md)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

**Description:** This is an Introductory Tutorial to the FIWARE Platform. We will start with the data from a supermarket
chain’s store finder and create a very simple _“Powered by FIWARE”_ application by passing in the address and location
of each store as context data to the FIWARE context broker.

The tutorial uses [cUrl](https://ec.haxx.se/) commands throughout, but is also available as
[Postman documentation](https://fiware.github.io/tutorials.Getting-Started/)

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/d6671a59a7e892629d2b)

<hr class="core"/>

# Architecture

Our demo application will only make use of one FIWARE component - the
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/). Usage of the Orion Context Broker (with proper
context data flowing through it) is sufficient for an application to qualify as _“Powered by FIWARE”_.

Currently, the Orion Context Broker relies on open source [MongoDB](https://www.mongodb.com/) technology to keep
persistence of the context data it holds. Therefore, the architecture will consist of two elements:

-   The [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using
    [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
-   The underlying [MongoDB](https://www.mongodb.com/) database :
    -   Used by the Orion Context Broker to hold context data information such as data entities, subscriptions and
        registrations

Since all interactions between the two services are initiated by HTTP requests, the services can be containerized and
run from exposed ports.

![](https://fiware.github.io/tutorials.Getting-Started/img/architecture.png)

## Prerequisites

### Docker

To keep things simple both components will be run using [Docker](https://www.docker.com). **Docker** is a container
technology which allows to different components isolated into their respective environments.

-   To install Docker on Windows follow the instructions [here](https://docs.docker.com/docker-for-windows/)
-   To install Docker on Mac follow the instructions [here](https://docs.docker.com/docker-for-mac/)
-   To install Docker on Linux follow the instructions [here](https://docs.docker.com/install/)

### Docker Compose (Optional)

**Docker Compose** is a tool for defining and running multi-container Docker applications. A
[YAML file](https://raw.githubusercontent.com/Fiware/tutorials.Getting-Started/master/docker-compose.yml) is used
configure the required services for the application. This means all container services can be brought up in a single
command. Docker Compose is installed by default as part of Docker for Windows and Docker for Mac, however Linux users
will need to follow the instructions found [here](https://docs.docker.com/compose/install/)

## Starting the containers

### Option 1) Using Docker commands directly

First pull the necessary Docker images from Docker Hub and create a network for our containers to connect to:

```bash
docker pull mongo:4.2
docker pull fiware/orion
docker network create fiware_default
```

A Docker container running a [MongoDB](https://www.mongodb.com/) database can be started and connected to the network
with the following command:

```bash
docker run -d --name=mongo-db --network=fiware_default \
  --expose=27017 mongo:4.2 --bind_ip_all
```

The Orion Context Broker can be started and connected to the network with the following command:

```bash
docker run -d --name fiware-orion -h orion --network=fiware_default \
  -p 1026:1026  fiware/orion -dbhost mongo-db
```

> **Note:** If you want to clean up and start again you can do so with the following commands
>
> ```
> docker stop fiware-orion
> docker rm fiware-orion
> docker stop mongo-db
> docker rm mongo-db
> docker network rm fiware_default
> ```

### Option 2) Using Docker Compose

All services can be initialised from the command-line using the `docker-compose` command. Please clone the repository
and create the necessary images by running the commands as shown:

```bash
git clone https://github.com/FIWARE/tutorials.Getting-Started.git
cd tutorials.Getting-Started

docker-compose -p fiware up -d
```

> **Note:** If you want to clean up and start again you can do so with the following command:
>
> ```
> docker-compose -p fiware down
> ```

## Creating your first "Powered by FIWARE" app

### Checking the service health

You can check if the Orion Context Broker is running by making an HTTP request to the exposed port:

#### 1 Request:

```bash
curl -X GET \
  'http://localhost:1026/version'
```

#### Response:

The response will look similar to the following:

```json
{
    "orion": {
        "version": "1.12.0-next",
        "uptime": "0 d, 0 h, 3 m, 21 s",
        "git_hash": "e2ff1a8d9515ade24cf8d4b90d27af7a616c7725",
        "compile_time": "Wed Apr 4 19:08:02 UTC 2018",
        "compiled_by": "root",
        "compiled_in": "2f4a69bdc191",
        "release_date": "Wed Apr 4 19:08:02 UTC 2018",
        "doc": "https://fiware-orion.readthedocs.org/en/master/"
    }
}
```

> **What if I get a `Failed to connect to localhost port 1026: Connection refused` Response?**
>
> If you get a `Connection refused` response, the Orion Content Broker cannot be found where expected for this
> tutorial - you will need to substitute the URL and port in each cUrl command with the corrected IP address. All the
> cUrl commands tutorial assume that orion is available on `localhost:1026`.
>
> Try the following remedies:
>
> -   To check that the docker containers are running try the following:
>
> ```
> docker ps
> ```
>
> You should see two containers running. If orion is not running, you can restart the containers as necessary. This
> command will also display open port information.
>
> -   If you have installed [`docker-machine`](https://docs.docker.com/machine/) and
>     [Virtual Box](https://www.virtualbox.org/), the orion docker container may be running from another IP address -
>     you will need to retrieve the virtual host IP as shown:
>
> ```
> curl -X GET \
>  'http://$(docker-machine ip default):1026/version'
> ```
>
> Alternatively run all your cUrl commands from within the container network:
>
> ```
> docker run --network fiware_default --rm appropriate/curl -s \
>  -X GET 'http://orion:1026/version'
> ```

## Creating Context Data

At its heart, FIWARE is a system for managing context information, so lets add some context data into the system by
creating two new entities (stores in **Berlin**). Any entity must have a `id` and `type` attributes, additional
attributes are optional and will depend on the system being described. Each additional attribute should also have a
defined `type` and a `value` attribute.

#### 2 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/entities' \
  -H 'Content-Type: application/json' \
  -d '
{
    "id": "urn:ngsi-ld:Store:001",
    "type": "Store",
    "address": {
        "type": "PostalAddress",
        "value": {
            "streetAddress": "Bornholmer Straße 65",
            "addressRegion": "Berlin",
            "addressLocality": "Prenzlauer Berg",
            "postalCode": "10439"
        },
        "metadata": {
            "verified": {
                "value": true,
                "type": "Boolean"
            }
        }
    },
    "location": {
        "type": "geo:json",
        "value": {
             "type": "Point",
             "coordinates": [13.3986, 52.5547]
        }
    },
    "name": {
        "type": "Text",
        "value": "Bösebrücke Einkauf"
    }
}'
```

#### 3 Request:

Each subsequent entity must have a unique `id` for the given `type`

```bash
curl -iX POST \
  'http://localhost:1026/v2/entities' \
  -H 'Content-Type: application/json' \
  -d '
{
    "type": "Store",
    "id": "urn:ngsi-ld:Store:002",
    "address": {
        "type": "PostalAddress",
        "value": {
            "streetAddress": "Friedrichstraße 44",
            "addressRegion": "Berlin",
            "addressLocality": "Kreuzberg",
            "postalCode": "10969"
        },
        "metadata": {
            "verified": {
                "value": true,
                "type": "Boolean"
            }
        }
    },
    "location": {
        "type": "geo:json",
        "value": {
             "type": "Point",
             "coordinates": [13.3903, 52.5075]
        }
    },
    "name": {
        "type": "Text",
        "value": "Checkpoint Markt"
    }
}'
```

### Data Model Guidelines

Although the each data entity within your context will vary according to your use case, the common structure within each
data entity should be standardized order to promote reuse. The full FIWARE data model guidelines can be found
[here](https://fiware-datamodels.readthedocs.io/en/latest/guidelines/index.html). This tutorial demonstrates the usage
of the following recommendations:

#### All terms are defined in American English

Although the `value` fields of the context data may be in any language, all attributes and types are written using the
English language.

#### Entity type names must start with a Capital letter

In this case we only have one entity type - **Store**

#### Entity IDs should be a URN following NGSI-LD guidelines

NGSI-LD has recently been published as a full ETSI
[specification](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.03.01_60/gs_cim009v010301p.pdf), the proposal is
that each `id` is a URN follows a standard format: `urn:ngsi-ld:<entity-type>:<entity-id>`. This will mean that every
`id` in the system will be unique

#### Data type names should reuse schema.org data types where possible

[Schema.org](http://schema.org/) is an initiative to create common structured data schemas. In order to promote reuse we
have deliberately used the [`Text`](http://schema.org/PostalAddress) and
[`PostalAddress`](http://schema.org/PostalAddress) type names within our **Store** entity. Other existing standards such
as [Open311](http://www.open311.org/) (for civic issue tracking) or [Datex II](https://datex2.eu/) (for transport
systems) can also be used, but the point is to check for the existence of the same attribute on existing data models and
reuse it.

#### Use camel case syntax for attribute names

The `streetAddress`, `addressRegion`, `addressLocality` and `postalCode` are all examples of attributes using camel
casing

#### Location information should be defined using `address` and `location` attributes

-   We have used an `address` attribute for civic locations as per [schema.org](http://schema.org/)
-   We have used a `location` attribute for geographical coordinates.

#### Use GeoJSON for codifying geospatial properties

[GeoJSON](http://geojson.org) is an open standard format designed for representing simple geographical features. The
`location` attribute has been encoded as a geoJSON `Point` location.

### Attribute Metadata

Metadata is _"data about data"_, it is additional data to describe properties of the attribute value itself like
accuracy, provider, or a timestamp. Several built-in metadata attribute already exist and these names are reserved

-   `dateCreated` (type: DateTime): attribute creation date as an ISO 8601 string.
-   `dateModified` (type: DateTime): attribute modification date as an ISO 8601 string.
-   `previousValue` (type: any): only in notifications. The value of this
-   `actionType` (type: Text): only in notifications.

One element of metadata can be found within the `address` attribute. a `verified` flag indicates whether the address has
been confirmed.

## Querying Context Data

A consuming application can now request context data by making HTTP requests to the Orion Context Broker. The existing
NGSI interface enables us to make complex queries and filter results.

At the moment, for the store finder demo all the context data is being added directly via HTTP requests, however in a
more complex smart solution, the Orion Context Broker will also retrieve context directly from attached sensors
associated to each entity.

Here are a few examples, in each case the `options=keyValues` query parameter has been used shorten the responses by
stripping out the type elements from each attribute

### Obtain entity data by ID

This example returns the data of `urn:ngsi-ld:Store:001`

#### 4 Request:

```bash
curl -G -X GET \
   'http://localhost:1026/v2/entities/urn:ngsi-ld:Store:001' \
   -d 'options=keyValues'
```

#### Response:

Because of the use of the `options=keyValues`, the response consists of JSON only without the attribute `type` and
`metadata` elements.

```json
{
    "id": "urn:ngsi-ld:Store:001",
    "type": "Store",
    "address": {
        "streetAddress": "Bornholmer Straße 65",
        "addressRegion": "Berlin",
        "addressLocality": "Prenzlauer Berg",
        "postalCode": "10439"
    },
    "location": {
        "type": "Point",
        "coordinates": [13.3986, 52.5547]
    },
    "name": "Bösebrücke Einkauf"
}
```

### Obtain entity data by type

This example returns the data of all `Store` entities within the context data The `type` parameter limits the response
to store entities only.

#### 5 Request:

```bash
curl -G -X GET \
    'http://localhost:1026/v2/entities' \
    -d 'type=Store' \
    -d 'options=keyValues'
```

#### Response:

Because of the use of the `options=keyValues`, the response consists of JSON only without the attribute `type` and
`metadata` elements.

```json
[
    {
        "id": "urn:ngsi-ld:Store:001",
        "type": "Store",
        "address": {
            "streetAddress": "Bornholmer Straße 65",
            "addressRegion": "Berlin",
            "addressLocality": "Prenzlauer Berg",
            "postalCode": "10439"
        },
        "location": {
            "type": "Point",
            "coordinates": [13.3986, 52.5547]
        },
        "name": "Bose Brucke Einkauf"
    },
    {
        "id": "urn:ngsi-ld:Store:002",
        "type": "Store",
        "address": {
            "streetAddress": "Friedrichstraße 44",
            "addressRegion": "Berlin",
            "addressLocality": "Kreuzberg",
            "postalCode": "10969"
        },
        "location": {
            "type": "Point",
            "coordinates": [13.3903, 52.5075]
        },
        "name": "Checkpoint Markt"
    }
]
```

### Filter context data by comparing the values of an attribute

This example returns all stores with the `name` attribute _Checkpoint Markt_. Filtering can be done using the `q`
parameter - if a string has spaces in it, it can be URL encoded and held within single quote characters `'` = `%27`

#### 6 Request:

```bash
curl -G -X GET \
    'http://localhost:1026/v2/entities' \
    -d 'type=Store' \
    -d 'q=name==%27Checkpoint%20Markt%27' \
    -d 'options=keyValues'
```

#### Response:

Because of the use of the `options=keyValues`, the response consists of JSON only without the attribute `type` and
`metadata` elements.

```json
[
    {
        "id": "urn:ngsi-ld:Store:002",
        "type": "Store",
        "address": {
            "streetAddress": "Friedrichstraße 44",
            "addressRegion": "Berlin",
            "addressLocality": "Kreuzberg",
            "postalCode": "10969"
        },
        "location": {
            "type": "Point",
            "coordinates": [13.3903, 52.5075]
        },
        "name": "Checkpoint Markt"
    }
]
```

### Filter context data by comparing the values of a sub-attribute

This example returns all stores found in the Kreuzberg District.

Filtering can be done using the `q` parameter - sub-attributes are annotated using the dot syntax e.g.
`address.addressLocality`

#### 7 Request:

```bash
curl -G -X GET \
    'http://localhost:1026/v2/entities' \
    -d 'type=Store' \
    -d 'q=address.addressLocality==Kreuzberg' \
    -d 'options=keyValues'
```

#### Response:

Because of the use of the `options=keyValues`, the response consists of JSON only without the attribute `type` and
`metadata` elements.

```json
[
    {
        "id": "urn:ngsi-ld:Store:002",
        "type": "Store",
        "address": {
            "streetAddress": "Friedrichstraße 44",
            "addressRegion": "Berlin",
            "addressLocality": "Kreuzberg",
            "postalCode": "10969"
        },
        "location": {
            "type": "Point",
            "coordinates": [13.3903, 52.5075]
        },
        "name": "Checkpoint Markt"
    }
]
```

### Filter context data by querying metadata

This example returns the data of all `Store` entities with a verified address.

Metadata queries can be made using the `mq` parameter.

#### 8 Request:

```bash
curl -G -X GET \
    'http://localhost:1026/v2/entities' \
    -d 'type=Store' \
    -d 'mq=address.verified==true' \
    -d 'options=keyValues'
```

#### Response:

Because of the use of the `options=keyValues`, the response consists of JSON only without the attribute `type` and
`metadata` elements.

```json
[
    {
        "id": "urn:ngsi-ld:Store:001",
        "type": "Store",
        "address": {
            "streetAddress": "Bornholmer Straße 65",
            "addressRegion": "Berlin",
            "addressLocality": "Prenzlauer Berg",
            "postalCode": "10439"
        },
        "location": {
            "type": "Point",
            "coordinates": [13.3986, 52.5547]
        },
        "name": "Bösebrücke Einkauf"
    },
    {
        "id": "urn:ngsi-ld:Store:002",
        "type": "Store",
        "address": {
            "streetAddress": "Friedrichstraße 44",
            "addressRegion": "Berlin",
            "addressLocality": "Kreuzberg",
            "postalCode": "10969"
        },
        "location": {
            "type": "Point",
            "coordinates": [13.3903, 52.5075]
        },
        "name": "Checkpoint Markt"
    }
]
```

### Filter context data by comparing the values of a geo:json attribute

This example return all Stores within 1.5km the **Brandenburg Gate** in **Berlin** (_52.5162N 13.3777W_)

#### 9 Request:

```bash
curl -G -X GET \
  'http://localhost:1026/v2/entities' \
  -d 'type=Store' \
  -d 'georel=near;maxDistance:1500' \
  -d 'geometry=point' \
  -d 'coords=52.5162,13.3777'
```

#### Response:

Because of the use of the `options=keyValues`, the response consists of JSON only without the attribute `type` and
`metadata` elements.

```json
[
    {
        "id": "urn:ngsi-ld:Store:002",
        "type": "Store",
        "address": {
            "streetAddress": "Friedrichstraße 44",
            "addressRegion": "Berlin",
            "addressLocality": "Kreuzberg",
            "postalCode": "10969"
        },
        "location": {
            "type": "Point",
            "coordinates": [13.3903, 52.5075]
        },
        "name": "Checkpoint Markt"
    }
]
```

## Next Steps

Want to learn how to add more complexity to your application by adding advanced features? You can find out by reading
the other tutorials in this series:

### Iterative Development

The context of the store finder demo is very simple, it could easily be expanded to hold the whole of a stock management
system by passing in the current stock count of each store as context data to the
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/).

So far, so simple, but consider how this Smart application could be iterated:

-   Real-time dashboards could be created to monitor the state of the stock across each store using a visualization
    component. \[[Wirecloud](https://github.com/FIWARE/catalogue/blob/master/processing/README.md#Wirecloud)\]
-   The current layout of both the warehouse and store could be passed to the context broker so the location of the
    stock could be displayed on a map
    \[[Wirecloud](https://github.com/FIWARE/catalogue/blob/master/processing/README.md#Wirecloud)\]
-   User Management components \[[Wilma](https://github.com/FIWARE/catalogue/blob/master/security/README.md#Wilma),
    [AuthZForce](https://github.com/FIWARE/catalogue/blob/master/security/README.md#Authzforce),
    [Keyrock](https://github.com/FIWARE/catalogue/blob/master/security/README.md#Keyrock)\] could be added so that only
    store managers are able to change the price of items
-   A threshold alert could be raised in the warehouse as the goods are sold to ensure the shelves are not left empty
    [publish/subscribe function of [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/)]
-   Each generated list of items to be loaded from the warehouse could be calculated to maximize the efficiency of
    replenishment
    \[[Complex Event Processing - CEP](https://github.com/FIWARE/catalogue/blob/master/processing/README.md#new-perseo-incubated)\]
-   A motion sensor could be added at the entrance to count the number of customers
    \[[IDAS](https://github.com/FIWARE/catalogue/blob/master/iot-agents/README.md)\]
-   The motion sensor could ring a bell whenever a customer enters
    \[[IDAS](https://github.com/FIWARE/catalogue/blob/master/iot-agents/README.md)\]
-   A series of video cameras could be added to introduce a video feed in each store
    \[[Kurento](https://github.com/FIWARE/catalogue/blob/master/processing/README.md#Kurento)\]
-   The video images could be processed to recognize where customers are standing within a store
    \[[Kurento](https://github.com/FIWARE/catalogue/blob/master/processing/README.md#Kurento)\]
-   By maintaining and processing historical data within the system, footfall and dwell time can be calculated -
    establishing which areas of the store attract the most interest \[connection through
    [Cygnus](https://github.com/FIWARE/catalogue/blob/master/core/README.md#Cygnus) to Apache Flink\]
-   Patterns recognizing unusual behaviour could be used to raise an alert to avoid theft
    \[[Kurento](https://github.com/FIWARE/catalogue/blob/master/processing/README.md#Kurento)\]
-   Data on the movement of crowds would be useful for scientific research - data about the state of the store could be
    published externally.
    \[[extensions to CKAN](https://github.com/FIWARE/catalogue/tree/master/data-publication#extensions-to-ckan)\]

Each iteration adds value to the solution through existing components with standard interfaces and therefore minimizes
development time.
