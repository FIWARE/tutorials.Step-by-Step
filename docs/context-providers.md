[![FIWARE Core Context Management](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/core.svg)](https://github.com/FIWARE/catalogue/blob/master/core/README.md)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-blue.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

**Description:** This tutorial teaches FIWARE users about context data and context providers. The tutorial builds on the
**Store** entity created in the previous [stock management example](crud-operations.md) and enables a user to retrieve
data about a store which is not held directly within the Orion Context Broker.

The tutorial uses [cUrl](https://ec.haxx.se/) commands throughout, but is also available as
[Postman documentation](https://fiware.github.io/tutorials.Context-Providers/).

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/7c9bed4bd2ce5213a80b)

<hr class="core"/>

# Context Data and Context Providers

> "Knowledge is of two kinds. We know a subject ourselves, or we know where we can find information upon it."
>
> — Samuel Johnson (Boswell's Life of Johnson)

Within the FIWARE platform, an entity represents the state of a physical or conceptual object which exists in the real
world. For example, a **Store** is a real world bricks and mortar building.

The context data of that entity defines the state of that real-world object at a given moment in time.

In all of the tutorials so far, we are holding all of the context data for our **Store** entities directly within the
Orion Context Broker, for example stores would have attributes such as:

-   A unique identifier for the store e.g. `urn:ngsi-ld:Store:002`
-   The name of the store e.g. "Checkpoint Markt"
-   The address "Friedrichstraße 44, 10969 Kreuzberg, Berlin"
-   A physical location e.g. _52.5075 N, 13.3903 E_

As you can see, most of these attributes are completely static (such as the location) and the others are unlikely to be
changed on a regular basis - though a street could be renamed, or the store name could be rebranded.

There is however another class of context data about the **Store** entity which is much more dynamic, information such
as:

-   The current temperature at the store location
-   The current relative humidity at the store location
-   Recent social media tweets regarding the store

This information is always changing, and if it were statically held in a database, the data would always be out-of-date.
To keep the context data fresh, and to be able to retrieve the current state of the system on demand, new values for
these dynamic data attributes will need to be retrieved whenever the entity context is requested.

Smart solutions are designed to react on the current state of the real-world. They are "aware" since they rely on
dynamic data readings from external sources (such social media, IoT sensors, user inputs). The FIWARE platform makes the
gathering and presentation of real-time context data transparent, since whenever an
[NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) request is made to the Orion Context Broker it will
always return the latest context by combining the data held within its database along with real-time data readings from
any registered external context providers.

In order to be able to fulfill these requests, the Orion Context Broker, must first be supplied with two types of
information:

-   The static context data held within Orion itself (_Entities that Orion "knows" about_)
-   Registered external context providers associated with existing entities (_Entities that Orion can "find information"
    about_)

<h3>Entities within a stock management system</h3>

Within our simple stock management system, our **Store** entity currently returns `id`, `name`, `address` and `location`
attributes. We will augment this with additional real-time context data from the following free publicly available data
sources:

-   The temperature and relative humidity from the [Open Weather Map API](https://openweathermap.org/api)
-   Recent social media tweets regarding the store from the [Twitter API](https://developer.twitter.com/)

The relationship between our entities is defined as shown:

![](https://fiware.github.io/tutorials.Context-Providers/img/entities.png)

---

# Architecture

This application will only make use of one FIWARE component - the
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/). Usage of the Orion Context Broker (with proper
context data flowing through it) is sufficient for an application to qualify as _“Powered by FIWARE”_.

Currently, the Orion Context Broker relies on open source [MongoDB](https://www.mongodb.com/) technology to keep
persistence of the context data it holds. To request context data from external sources, we will now need to add a
simple Context Provider NGSI proxy.

Therefore, the architecture will consist of three elements:

-   The [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using
    [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
-   The underlying [MongoDB](https://www.mongodb.com/) database :
    -   Used by the Orion Context Broker to hold context data information such as data entities, subscriptions and
        registrations
-   The **Context Provider NGSI proxy** which will will:
    -   receive requests using [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
    -   makes requests to publicly available data sources using their own APIs in a proprietary format
    -   returns context data back to the Orion Context Broker in
        [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) format.

Since all interactions between the services are initiated by HTTP requests, the services can be containerized and run
from exposed ports.

![](https://fiware.github.io/tutorials.Context-Providers/img/architecture.png)

The necessary configuration information for the **Context Provider NGSI proxy** can be seen in the services section the
of the associated `docker-compose.yml` file:

```yaml
tutorial:
    image: fiware/tutorials.context-provider
    hostname: context-provider
    container_name: fiware-tutorial
    networks:
        - default
    expose:
        - "3000"
    ports:
        - "3000:3000"
    environment:
        - "DEBUG=tutorial:*"
        - "PORT=3000"
        - "CONTEXT_BROKER=http://orion:1026/v2"
        - "OPENWEATHERMAP_KEY_ID=<ADD_YOUR_KEY_ID>"
        - "TWITTER_CONSUMER_KEY=<ADD_YOUR_CONSUMER_KEY>"
        - "TWITTER_CONSUMER_SECRET=<ADD_YOUR_CONSUMER_SECRET>"
```

The `tutorial` container is driven by environment variables as shown:

| Key                     | Value                        | Description                                                               |
| ----------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| DEBUG                   | `tutorial:*`                 | Debug flag used for logging                                               |
| WEB_APP_PORT            | `3000`                       | Port used by the Context Provider NGSI proxy and web-app for viewing data |
| CONTEXT_BROKER          | `http://orion:1026/v2`       | URL of the context broker to connect to update context                    |
| OPENWEATHERMAP_KEY_ID   | `<ADD_YOUR_KEY_ID>`          | A consumer key used to obtain access to the Open Weather Map API          |
| TWITTER_CONSUMER_KEY    | `<ADD_YOUR_CONSUMER_KEY>`    | A consumer key used to obtain access to the Twitter API                   |
| TWITTER_CONSUMER_SECRET | `<ADD_YOUR_CONSUMER_SECRET>` | A user key used to obtain access to the Twitter API                       |

The other `tutorial` container configuration values described in the YAML file are not used in this tutorial.

The configuration information for MongoDB and the Orion Context Broker has been described in a
[previous tutorial](entity-relationships.md)

## Context Provider NGSI proxy

A simple [Node.js](https://nodejs.org/) [Express](https://expressjs.com/) application has been bundled as part of the
repository. The application offers an NGSI v2 interface for four different context providers - the Open Weather Map API,
the Twitter Search API and two dummy data context providers - a static data provider (which always returns the same
data) and a random data context provider (which will change every time it is invoked).

More information about the proxy endpoints can be found
[here](https://github.com/FIWARE/tutorials.Step-by-Step/tree/master/context-provider)

-   In order to access the Open Weather Map API, you will need to sign up for a key at `https://openweathermap.org/api`
-   In order to access the Twitter Search API, you will have to create an app in Twitter via
    `https://developer.twitter.com/` to obtain a Consumer Key & Consumer Secret.

Replace the placeholders in `docker-compose.yml` in the root of the repository with the values you obtain for your
application:

```yaml
environment:
    - "DEBUG=tutorial:*"
    - "CONTEXT_BROKER=http://orion:1026/v2"
    - "OPENWEATHERMAP_KEY_ID=<ADD_YOUR_KEY_ID>"
    - "TWITTER_CONSUMER_KEY=<ADD_YOUR_CONSUMER_KEY>"
    - "TWITTER_CONSUMER_SECRET=<ADD_YOUR_CONSUMER_SECRET>"
```

If you do not wish to sign-up for an API key, you can use data from the random data context provider instead.

# Start Up

All services can be initialised from the command-line by running the bash script provided within the repository. Please
clone the repository and create the necessary images by running the commands as shown:

```bash
git clone git@github.com:FIWARE/tutorials.Context-Providers.git
cd tutorials.Context-Providers

./services create; ./services start;
```

This command will also import seed data from the previous [Stock Management example](crud-operations.md) on startup.

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

---

# Using a Context Provider

> **Tip** You can also watch the status of recent requests yourself by following the container logs or viewing
> information on `localhost:3000/app/monitor` on a web browser.
>
> ![FIWARE Monitor](https://fiware.github.io/tutorials.Context-Providers/img/monitor.png)

## Health Checks

The Node.js proxy application offers a `health` endpoint for each of the four context providers. Making a request to the
appropriate endpoint will check that the provider is running and external data can be received. The application runs on
port `3000`.

### Static Data Context Provider (Health Check)

This example returns the health of the Static Data Context Provider endpoint.

A non-error response shows that an NGSI proxy is available on the network and returning values. Each Request will return
the same data.

#### 1 Request:

```bash
curl -X GET \
  'http://localhost:3000/health/static'
```

#### Response:

```json
{
    "array": ["Arthur", "Dent"],
    "boolean": true,
    "number": 42,
    "structuredValue": { "somevalue": "this" },
    "text": "I never could get the hang of Thursdays"
}
```

### Random Data Context Provider (Health Check)

This example returns the health of the Random Data Generator Context Provider endpoint.

A non-error response shows that an NGSI proxy is available on the network and returning values. Each Request will return
some random dummy data.

#### 2 Request:

```bash
curl -X GET \
  'http://localhost:3000/health/random'
```

#### Response:

```json
{
    "array": ["sit", "consectetur", "sint", "excepteur"],
    "boolean": false,
    "number": 4,
    "structuredValue": { "somevalue": "this" },
    "text": " nisi reprehenderit pariatur. Aute ea"
}
```

### Twitter API Context Provider (Health Check)

This example returns the health of the Twitter API Context Provider endpoint.

A non-error response shows that an NGSI proxy for the Twitter API is available on the network and returning values.

If the proxy is correctly configured to connect to the Twitter API, a series of Tweets will be returned.

The Twitter API uses OAuth2:

-   To get Consumer Key & Consumer Secret for the Twitter API, you have to create an app in Twitter via
    [https://developer.twitter.com/](https://developer.twitter.com/). Then you'll be taken to a page containing Consumer
    Key & Consumer Secret.
-   For more information see: [https://developer.twitter.com/](https://developer.twitter.com/)

#### 3 Request:

```bash
curl -X GET \
  'http://localhost:3000/health/twitter'
```

#### Response:

The response will contain a series of 15 tweets about FIWARE. The full response is rather long, but a snippet can be
seen below:

```json
{
	"statuses": [
	{
		"created_at": "Mon Apr 23 13:08:35 +0000 2018",
		"id": 988404265227038700,
		"id_str": "988404265227038721",
		"text": "@FIWARE: Full house today during the Forum Industrie 4.0 at @Hannover_Messe as #FIWARE Foundation CEO ...",
		"truncated": false,
		"entities": {
			... ETC
		},
		"metadata": {
	        ... ETC
	    }
	    ... ETC
	}
	... ETC

    ],
    "search_metadata": {
        "completed_in": 0.089,
        "max_id": 988407193497108500,
        "max_id_str": "988407193497108481",
        "next_results": "?max_id=988373340074242048&q=FIWARE&include_entities=1",
        "query": "FIWARE",
        "refresh_url": "?since_id=988407193497108481&q=FIWARE&include_entities=1",
        "count": 15,
        "since_id": 0,
        "since_id_str": "0"
    }

}
```

As you can see details the `text` of each tweet is available within the `statuses` array.

### Weather API Context Provider (Health Check)

This example returns the health of the Static Data Context Provider endpoint.

A non-error response shows that an NGSI proxy is available on the network and returning values. Each Request will return
the same data.

#### 4 Request:

```bash
curl -X GET \
  'http://localhost:3000/health/weather'
```

#### Response:

The response will contain a data about the current weather in Berlin. The full response is rather long, but a snippet
can be seen below:

```json
{
  "coord": {
    "lon": 13.39,
    "lat": 52.52
  },
  "weather": [
    {
      "id": 800,
      "main": "Clear",
      "description": "clear sky",
      "icon": "01d"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 299.64,
    "pressure": 1019,
    "humidity": 36,
    "temp_min": 299.15,
    "temp_max": 300.15
  },
  ...ETC
  "id": 2950159,
  "name": "Berlin",
  "cod": 200
}
```

As you can see details of the current temperature and relative humidity are available within the attributes of the
`current_observation`

## Accessing the NGSI v2 op/query Endpoint

Because the `3000` port of the Context Provider has been exposed outside of the Docker container, it is possible for
curl to make requests directly to the Context Provider - this simulates the requests that would have been made by the
Orion Context Broker. You can also simulate making the requests as part of the docker container network by running the
`appropriate/curl` Docker image.

Firstly obtain the name of the network used within the Docker containers by running

```bash
docker network ls
```

Then run the following curl command including the `--network` parameter:

```bash
docker run --network fiware_default --rm appropriate/curl \
  -X GET 'http://context-provider:3000/health/random'
```

As you can see, within the network, the hostname of the Context Provider is `context-provider`.

### Retrieving a Single Attribute Value

This example uses the NGSI v2 `op/query` endpoint to request a `temperature` reading from the Static Data Generator
Context Provider. The requested attributes are found within the `attributes` array of the POST body.

The Orion Context Broker will make similar requests to this `op/query` endpoint once a context provider has been
registered.

#### 5 Request:

```bash
curl -iX POST \
  'http://localhost:3000/static/temperature/op/query' \
  -H 'Content-Type: application/json' \
  -d '{
    "entities": [
        {
            "type": "Store",
            "isPattern": "false",
            "id": "urn:ngsi-ld:Store:001"
        }
    ],
    "attrs": [
        "temperature"
    ]
} '
```

#### Response:

The response will be in NGSI v2 response format as shown. The `attributes` element holds the data returned - an object
of `type:Number` with the `value:42`.

```json
[
    {
        "id": "urn:ngsi-ld:Store:001",
        "type": "Store",
        "temperature": {
            "type": "Number",
            "value": 42
        }
    }
]
```

### Retrieving Multiple Attribute Values

It is possible for the Orion Context Broker to make a request for multiple data values . This example uses the NGSI v2
`op/query` endpoint to request `temperature` and `relativeHumidity` readings from the Random Data Generator Context
Provider. The requested attributes are found within the `attributes` array of the POST body.

#### 6 Request:

```bash
curl -iX POST \
  'http://localhost:3000/random/weatherConditions/op/query' \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: 2ae9e6d6-802b-4a62-a561-5c7739489fb3' \
  -d '{
    "entities": [
        {
            "type": "Store",
            "isPattern": "false",
            "id": "urn:ngsi-ld:Store:001"
        }
    ],
    "attrs": [
        "temperature",
        "relativeHumidity"
    ]
}''
```

#### Response:

The response will be in NGSI v2 response format as shown. The `attributes` element holds the data returned

```json
[
    {
        "id": "urn:ngsi-ld:Store:001",
        "type": "Store",
        "temperature": {
            "type": "Number",
            "value": 16
        },
        "relativeHumidity": {
            "type": "Number",
            "value": 30
        }
    }
]
```

## Context Provider Registration Actions

All Context Provider Registration actions take place on the `v2/registrations` endpoint. The standard CRUD mappings
apply:

-   Creation is mapped to the HTTP POST
-   Reading/Listing registrations to HTTP GET verb
-   Deletion is mapped to HTTP DELETE

### Registering a new Context Provider

This example registers the Random Data Context Provider with the Orion Context Broker.

The body of the request states that: _"The URL_ `http://context-provider:3000/random/weatherConditions` _is capable of
providing_ `relativeHumidity` and `temperature` _data for the entity called_ `id=urn:ngsi-ld:Store:001`._"_

The values are **never** held within Orion, it is always requested on demand from the registered context provider. Orion
merely holds the registration information about which context providers can offer context data.

> _Note:_ if you have registered with the Weather API, you can retrieve live values for `temperature` and
> `relativeHumidity` in Berlin by placing the following `url` in the `provider`:
>
> -   `http://context-provider:3000/weather/weatherConditions`

This request will return with a **201 - Created** response code. The `Location` Header of the response contains a path
to the registration record held in Orion

#### 7 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/registrations' \
  -H 'Content-Type: application/json' \
  -d '{
  "description": "Random Weather Conditions",
  "dataProvided": {
    "entities": [
      {
        "id": "urn:ngsi-ld:Store:001",
        "type": "Store"
      }
    ],
    "attrs": [
      "relativeHumidity"
    ]
  },
  "provider": {
    "http": {
      "url": "http://context-provider:3000/random/weatherConditions"
    }
  }
}'
```

Once a Context Provider has been registered, the new context data will be included if the context of the **Store**
entity `urn:ngsi-ld:Store:001` is requested using the `/entities/<entity-id>` endpoint:

#### 8 Request:

```bash
curl -G -X GET \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Store:001' \
  -d 'type=Store'
```

#### Response:

```json
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
        "metadata": {}
    },
    "location": {
        "type": "geo:json",
        "value": {
            "type": "Point",
            "coordinates": [13.3986, 52.5547]
        },
        "metadata": {}
    },
    "name": {
        "type": "Text",
        "value": "Bösebrücke Einkauf",
        "metadata": {}
    },
    "temperature": {
        "type": "Number",
        "value": "22.6",
        "metadata": {}
    },
    "relativeHumidity": {
        "type": "Number",
        "value": "58%",
        "metadata": {}
    }
}
```

Similarly, a single attribute can be obtained by making a request to the `/entities/<entity-id>/attrs/<attribute>`

#### 9 Request:

```bash
curl -X GET \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Store:001/attrs/relativeHumidity/value'
```

#### Response:

```text
"58%"
```

### Read a registered Context Provider

This example reads the registration data with the ID 5addeffd93e53f86d8264521 from the context.

Registration data can be obtained by making a GET request to the `/v2/registrations/<entity>` endpoint.

#### 10 Request:

```bash
curl -X GET \
  'http://localhost:1026/v2/registrations/5ad5b9435c28633f0ae90671'
```

### List all registered Context Providers

This example lists all registered context providers

Full context data for a specified entity type can be retrieved by making a GET request to the `/v2/registrations/`
endpoint.

#### 11 Request:

```bash
curl -X GET \
  'http://localhost:1026/v2/registrations'
```

#### Response:

```json
[
    {
        "id": "5addeffd93e53f86d8264521",
        "description": "Random Weather Conditions",
        "dataProvided": {
            "entities": [
                {
                    "id": "urn:ngsi-ld:Store:002",
                    "type": "Store"
                }
            ],
            "attrs": ["temperature", "relativeHumidity"]
        },
        "provider": {
            "http": {
                "url": "http://context-provider:3000/random/weatherConditions"
            },
            "supportedForwardingMode": "all",
            "legacyForwarding": true
        },
        "status": "active"
    }
]
```

### Remove a registered Context Provider

Registrations can be deleted by making a DELETE request to the `/v2/registrations/<entity>` endpoint.

```bash
curl -iX DELETE \
  'http://localhost:1026/v2/registrations/5ad5b9435c28633f0ae90671'
```
