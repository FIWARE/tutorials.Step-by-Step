[![FIWARE Core Context Management](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/core.svg)](https://github.com/FIWARE/catalogue/blob/master/core/README.md)
[![NGSI LD](https://img.shields.io/badge/NGSI-LD-d6604d.svg)](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.03.01_60/gs_cim009v010301p.pdf)
[![JSON](https://img.shields.io/badge/JSON--LD-1.1-f06f38.svg)](https://w3c.github.io/json-ld-syntax/)

**Description:** This tutorial discusses the usage of subscriptions and registrations within NGSI-LD and highlights the
similarities and differences between the equivalent NGSI-v2 and NGSI-LD operations. The tutorial is an analogue of the
original context-provider and subscriptions tutorials but uses API calls from the **NGSI-LD** interface throughout.

The tutorial uses [cUrl](https://ec.haxx.se/) commands throughout, but is also available as
[Postman documentation](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/)

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/2c53b7c2bce9fd7b7b47)

<hr class="core"/>

# Understanding Linked Data Subscriptions and Registrations

> “Do not repeat after me words that you do not understand. Do not merely put on a mask of my ideas, for it will be an
> illusion and you will thereby deceive yourself.”
>
> ― Jiddu Krishnamurti

NGSI-LD Subscriptions and Registrations provide the basic mechanism to allow the components within a Smart Linked Data
Solution to interact with each other.

As a brief reminder, within a distributed system, subscriptions inform a third party component that a change in the
context data has occurred (and the component needs to take further actions), whereas registrations tell the context
broker that additional context information is available from another source.

Both of these operations require that the receiving component fully understands the requests it receives, and is capable
of creating and interpreting the resultant payloads. The differences here between NGSI-v2 and NGSI-LD operations is
small, but there has been a minor amendment to facilite the incorporation of linked data concepts, and therefore the
contract between the various components has changed to include minor updates.

<h3>Entities within a stock management system</h3>

The relationship between our Linked Data entities is defined as shown, in addition to the existing data, the `tweets`
attribute will be supplied by a _Context Provider_. In all other respects this model remains the same as the
[previous tutorial](working-with-linked-data.md) :

![](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/entities.png)

<h3>Stock Management frontend</h3>

The simple Node.js Express application has updated to use NGSI-LD in the previous
[tutorial](working-with-linked-data.md). We will use the monitor page to watch the status of recent requests, and a two
store pages to buy products. Once the services are running these pages can be accessed from the following URLs:

<h4>Event Monitor</h4>

The event monitor can be found at: `http://localhost:3000/app/monitor`

![FIWARE Monitor](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/monitor.png)

<h4>Store 001</h4>

Store001 can be found at: `http://localhost:3000/app/store/urn:ngsi-ld:Building:store001`

![Store](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/store.png)

<h4>Store 002</h4>

Store002 can be found at: `http://localhost:3000/app/store/urn:ngsi-ld:Building:store002`

![Store2](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/store2.png)

## Architecture

The demo Supermarket application will send and receive NGSI-LD calls to a compliant context broker. Since the NGSI-LD
interface is available on an experimental version of the
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/), the demo application will only make use of one
FIWARE component.

Currently, the Orion Context Broker relies on open source [MongoDB](https://www.mongodb.com/) technology to keep
persistence of the context data it holds. To request context data from external sources, a simple Context Provider NGSI
proxy has also been added. To visualize and interact with the Context we will add a simple Express application

Therefore, the architecture will consist of four elements:

-   The [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using
    [NGSI-LD](https://forge.etsi.org/swagger/ui/?url=https://forge.etsi.org/gitlab/NGSI-LD/NGSI-LD/raw/master/spec/updated/full_api.json)
-   The underlying [MongoDB](https://www.mongodb.com/) database :
    -   Used by the Orion Context Broker to hold context data information such as data entities, subscriptions and
        registrations
-   The **Context Provider NGSI** proxy which will:
    -   receive requests using
        [NGSI-LD](https://forge.etsi.org/swagger/ui/?url=https://forge.etsi.org/gitlab/NGSI-LD/NGSI-LD/raw/master/spec/updated/full_api.json#/)
    -   makes requests to publicly available data sources using their own APIs in a proprietary format
    -   returns context data back to the Orion Context Broker in
        [NGSI-LD](https://forge.etsi.org/swagger/ui/?url=https://forge.etsi.org/gitlab/NGSI-LD/NGSI-LD/raw/master/spec/updated/full_api.json#/)
        format.
-   The **Stock Management Frontend** which will:
    -   Display store information
    -   Show which products can be bought at each store
    -   Allow users to "buy" products and reduce the stock count.

Since all interactions between the elements are initiated by HTTP requests, the entities can be containerized and run
from exposed ports.

![](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/architecture.png)

The necessary configuration information can be seen in the services section of the associated `orion-ld.yml` file. It
has been described in a [previous tutorial](working-with-linked-data.md)

## Start Up

All services can be initialised from the command-line by running the
[services](https://github.com/FIWARE/tutorials.LD-Subscriptions-Registrations/blob/master/services) Bash script provided
within the repository. Please clone the repository and create the necessary images by running the commands as shown:

```bash
git clone https://github.com/FIWARE/tutorials.LD-Subscriptions-Registrations.git
cd tutorials.LD-Subscriptions-Registrations

./services orion
```

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

---

## Interactions between Components

## Using Subscriptions with NGSI-LD

Goto `http://localhost:3000/app/store/urn:ngsi-ld:Building:store001` to display and interact with the Supermarket data.

### Create a Subscription (Store 1) - Low Stock

NGSI-LD subscriptions can be set up using the `/ngsi-ld/v1/subscriptions/` endpoint and in a similar manner to the
NGSI-v2 `/v2/subscriptions` endpoint. The payload body is slightly different however. Firstly the linked data `@context`
must be present either as an attribute or in the `Link` header. If the `@context` is placed in the body the
`Context-Type` header must state that the payload is `application/ld+json` - i.e. Linked Data plus JSON. The supplied
`@context` will also be used when making notifications as part of the notification request.

The `type` of the NGSI-LD subscription request is always `type=Subscription`. The structure of the subscription has
changed. When setting up a subscription, there is no longer a separate `subject` section to the payload, entities to
watch and trigger conditions are now set at the same level as the `description` of the subscription.

-   `condition.attrs` has been moved up a level and renamed to `watchedAttributes`
-   `condition.expression` has been moved up a level and renamed to `q`

The `notification` section of the body states that once the conditions of the subscription have been met, a POST request
containing all affected Shelf entities will be sent to the URL `http://tutorial:3000/subscription/low-stock-store001`.
It is now possible to amend the notification payload by requesting `notification.format=keyValues` and remove the
`@context` from the notification body by stating `notification.endpoint.accept=application/json`. The `@context` is not
lost, it is merely passed as a `Link` header. In summary, all of the flags within a subscription work in the same manner
as a GET request to the context broker itself. If no flags are set, a full NGSI-LD response including the `@context` is
returned by default, and the payload can be reduced and amended by adding in further restrictions.

#### 1 Request:

```bash
curl -L -X POST 'http://localhost:1026/ngsi-ld/v1/subscriptions/' \
-H 'Content-Type: application/ld+json' \
--data-raw '{
  "description": "Notify me of low stock in Store 001",
  "type": "Subscription",
  "entities": [{"type": "Shelf"}],
  "watchedAttributes": ["numberOfItems"],
  "q": "numberOfItems<10;locatedIn==urn:ngsi-ld:Building:store001",
  "notification": {
    "attributes": ["numberOfItems", "stocks", "locatedIn"],
    "format": "keyValues",
    "endpoint": {
      "uri": "http://tutorial:3000/subscription/low-stock-store001",
      "accept": "application/json"
    }
  },
   "@context": "https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld"
}'
```

### Create a Subscription (Store 2) - Low Stock

This second request fires notifications to a different endpoint (URL
`http://tutorial:3000/subscription/low-stock-store002`.) The `notification.format=normalized` and
`notification.endpoint.accept=application/ld+json` will ensure that the `@context` is passed in the body of the
notification request and that the payload will consist of the expanded entities.

#### 2 Request:

```bash
curl -L -X POST 'http://localhost:1026/ngsi-ld/v1/subscriptions/' \
-H 'Content-Type: application/json' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
--data-raw '{
  "description": "LD Notify me of low stock in Store 002",
  "type": "Subscription",
  "entities": [{"type": "Shelf"}],
  "watchedAttributes": ["numberOfItems"],
  "q": "numberOfItems<10;locatedIn==urn:ngsi-ld:Building:store002",
  "notification": {
    "attributes": ["numberOfItems", "stocks", "locatedIn"],
    "format": "normalized",
    "endpoint": {
      "uri": "http://tutorial:3000/subscription/low-stock-store002",
      "accept": "application/ld+json"
    }
  }
}'
```

### Read Subscription Details

Subscription details can be read by making a GET request to the `/ngsi-ld/v1/subscriptions/`. All subscription CRUD
actions continue to be mapped to the same HTTP verbs as before. Adding the `Accept: application/json` will remove the
`@context` element from the response body.

#### 3 Request:

```bash
curl -L -X GET 'http://localhost:1026/ngsi-ld/v1/subscriptions/'
```

#### Response:

The response consists of the details of the subscriptions within the system. The parameters within the `q` attribute
have been expanded to use the full URIs, as internally the broker consistently uses long names. The differences between
the payloads offered by the two subscriptions will be discussed below.

```json
[
    {
        "id": "urn:ngsi-ld:Subscription:5e62405ee232da3a07b5fa7f",
        "type": "Subscription",
        "description": "Notify me of low stock in Store 001",
        "entities": [
            {
                "type": "Shelf"
            }
        ],
        "watchedAttributes": ["numberOfItems"],
        "q": "https://fiware.github.io/tutorials.Step-by-Step/schema/numberOfItems<10;https://fiware.github.io/tutorials.Step-by-Step/schema/locatedIn==urn:ngsi-ld:Building:store001",
        "notification": {
            "attributes": ["numberOfItems", "stocks", "locatedIn"],
            "format": "keyValues",
            "endpoint": {
                "uri": "http://tutorial:3000/subscription/low-stock-store001",
                "accept": "application/json"
            }
        },
        "@context": "https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld"
    },
    {
        "id": "urn:ngsi-ld:Subscription:5e624063e232da3a07b5fa80",
        "type": "Subscription",
        "description": "Notify me of low stock in Store 002",
        "entities": [
            {
                "type": "Shelf"
            }
        ],
        "watchedAttributes": ["numberOfItems"],
        "q": "https://fiware.github.io/tutorials.Step-by-Step/schema/numberOfItems<10;https://fiware.github.io/tutorials.Step-by-Step/schema/locatedIn==urn:ngsi-ld:Building:store002",
        "notification": {
            "attributes": ["numberOfItems", "stocks", "locatedIn"],
            "format": "keyValues",
            "endpoint": {
                "uri": "http://tutorial:3000/subscription/low-stock-store002",
                "accept": "application/json"
            }
        },
        "@context": "https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld"
    }
]
```

### Retrieving Subscription Events

Open two tabs on a browser. Go to the event monitor (`http://localhost:3000/app/monitor`) to see the payloads that are
received when a subscription fires, and then go to store001
(`http://localhost:3000/app/store/urn:ngsi-ld:Building:store001`) and buy beer until less than 10 items are in stock.
The low stock message should be displayed on screen.

![low-stock](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/low-stock-warehouse.png)

`low-stock-store001` is fired when the Products on the shelves within Store001 are getting low, the subscription payload
can be seen below:

![low-stock-json](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/low-stock-monitor.png)

The data within the payload consists of key-value pairs of the attributes which were specified in the request. This is
because the subscription was created using the `format=keyValues` attribute. The `@context` is not present in the
payload body since `endpoint.accept=application/json` was set. The effect is to return a `data` array in a very similar
format to the `v2/subscription/` payload. In addition to the `data` array, the `subscriptionId` is included in the
response, along with a `notifiedAt` element which describes when the notification was fired.

Now go to store002 (`http://localhost:3000/app/store/urn:ngsi-ld:Building:store002`) and buy beer until fewer than 10
items are in stock. The low stock message is once again displayed on screen, the payload can be seen within the event
monitor.

![low-stock-ld](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/low-stock-monitor-ld.png)

The second subscription has been set up to pass the full normalized NGSI-LD payload along with the `@context`. This has
been achieved by using the using the `format=normalized` attribute within the subscription itself, as well as setting
`endpoint.accept=application/ld+json`, so that the `@context` is also passed with each entity.

## Using Registrations with NGSI-LD

Context Registrations allow some (or all) data within an entity to be provided by an external context provider. It could
be another full context-provider a separate micro-service which only responds to a subset of the NGSI-LD endpoints.
However, there needs to be a contract created as to who supplies what.

All registrations can be subdivided into one of two types. Simple registrations where a single context provider is
responsible for the maintenance of the whole entity, and partial registrations where attributes are spread across
multiple context providers. For a simple registration, all context requests are forwarded

| Request    | Action at **Context Broker**                                                | Action at **Context Provider**                                                                      |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **GET**    | Pass request to **Context Provider**, proxy the response back unaltered.    | Respond to context broker with the result of the GET request based on the entities held internally  |
| **PATCH**  | Pass request to **Context Provider**, proxy back the HTTP back status code. | Update the entity within the **Context Provider**, Respond to the context broker with a status code |
| **DELETE** | Pass request to **Context Provider**                                        | Delete the entity within the **Context Provider**, Respond to the context broker with a status code |

Effectively every simple registration is saying _"this entity is held elsewhere"_, but the entity data can be requested
and modified via requests to this context broker. All context brokers should support simple registrations, and indeed,
simple registrations such as these are necessary for the operation of federated arrays of context brokers working in
large scale systems, where there is no concept of "entity exclusiveness", that is no entity is bound to an individual
broker.

For partial registrations the situation is more complex

| Request    | Action at **Context Broker**                                                                                                                                                                                                | Action at **Context Provider**                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **GET**    | Assuming an entity exists locally, pass request for additional proxied attributes to **Context Provider**, concatenate a response back for locally held attributes and additional information from the **Context Provider** | Respond to context broker with the result of the GET request based on the entities held internally                                   |
| **PATCH**  | Update any locally held attributes, Pass update requests for additional attributes to **Context Provider**, and return **success** or **partial success** HTTP status code dependent upon the overall result.               | Update the requested attributes of the entity held within the **Context Provider**. Respond to the context broker with a status code |
| **DELETE** | If deleting an entity, remove the complete local instance. If deleting locally held attributes remove them. If deleting attributes held in the **Context Provider**, pass request on to **Context Provider**                | Delete the entity attributes within the **Context Provider**, Respond to the context broker with a status code                       |

Each partial registration is saying _"additional augmented context for this entity is held elsewhere"_. The entity data
can be requested and modified via requests to this context broker. In this case the entity data is effectively bound to
an individual context broker, and therefore may need special processing when running in a large-scale federated
environment. Covering the special needs of the federation use-case is not the concern of this tutorial here.

Note that within the context broker a single entity cannot partake in both a simple registration and a partial
registration at the same time, as this would indicate that both the whole entity and only part of that entity are to be
retrieved remotely and this is nonsensical. If such a situation is requested, the context broker will return with a
`409` - **Conflict** HTTP response.

Also, a simple registration for an entity will be rejected if an entity already exists within the context broker, and a
partial registration for an entity attribute will be rejected if the attribute exists within the context broker (or is
already subject to a partial registration). The latter may be ovecome with the use of the `datasetId`.

Internally the [X-Forwarded-For](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) header is
used to avoid circular dependencies where **context broker A** registers an entity with **context broker B** which
registers an entity with **context broker C** which registers an entity with **context broker A** again. The
`X-Forwarded-For` Header is removed prior to responding to a client however.

With normal operation, the NGSI-LD response does not expose whether data collated from multiple sources is held directly
within the context broker or whether the information has been retrieved externally. It is only when an error occurs
(e.g. timeout) that the HTTP status error code reveals that externally held information could not be retrieved or
amended.

### Create a Registration

All NGSI-LD Context Provider Registration actions take place on the `/ngsi-ld/v1/csourceRegistrations/` endpoint. The
standard CRUD mappings apply. The `@context` must be passed either as a `Link` header or within the main body of the
request.

The body of the request is similar to the NGSI-v2 equivalent with the following modifications:

-   The NGSI-v2 `dataProvided` object is now an array called `information`.
-   NGSI-v2 `attrs` have been split into separate arrays of `properties` and `relationships`
-   The NGSI-v2 `provider.url` has moved up to `endpoint`

#### 4 Request:

```bash
curl -iX POST 'http://localhost:1026/ngsi-ld/v1/csourceRegistrations/' \
-H 'Content-Type: application/json' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
--data-raw ' {
    "type": "ContextSourceRegistration",
    "information": [
        {
            "entities": [
                {
                    "type": "Building",
                    "id": "urn:ngsi-ld:Building:store001"
                }
            ],
            "properties": [
                "tweets"
            ]
        }
    ],
    "endpoint": "http://context-provider:3000/static/tweets"
}'
```

### Read Registration Details

Retrieving the registration details can be made by sending a GET request to the `/ngsi-ld/v1/csourceRegistrations/`
endpoint, along with an appropriate JSON-LD context in the `Link` header and the type of entity to filter.

#### 5 Request:

```bash
curl -G -iX GET 'http://localhost:1026/ngsi-ld/v1/csourceRegistrations/' \
-H 'Accept: application/ld+json' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-d 'type=Building'
```

#### Response:

The response returns the details of the registration. In this case the short names of the `properties` have been
returned, along with the `@context`.

```json
[
    {
        "@context": "https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld",
        "id": "urn:ngsi-ld:ContextSourceRegistration:5e6242179c26be5aef9991d4",
        "type": "ContextSourceRegistration",
        "endpoint": "http://context-provider:3000/static/tweets",
        "information": [
            {
                "entities": [
                    {
                        "id": "urn:ngsi-ld:Building:store001",
                        "type": "Building"
                    }
                ],
                "properties": ["tweets"]
            }
        ]
    }
]
```

### Read from Store 1

Once a registration has been set up, the additional registered `properties` and `relationships` are transparently
returned when an requested entity is requested. For simple registrations, a request to obtain the whole entity will be
proxied to the registered `endpoint`, for partial registrations the `properties` and `relationships` are added to the
existing entity held within the context broker.

#### 6 Request:

```bash
curl -iX GET 'http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/json'
```

> Note that at the time of writing, for the federated Scorpio broker, this request indicates the retrieval of a local
> entity only - forwarded data from a registration must be retrieved using:
> `/ngsi-ld/v1/entities/?id=urn:ngsi-ld:Building:store001` instead.

#### Response:

The response now holds an additional `tweets` Property, which returns the values obtained from
`http://context-provider:3000/static/tweets/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001` - i.e. the forwarding
endpoint.

```json
{
    "@context": "https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld",
    "id": "urn:ngsi-ld:Building:store001",
    "type": "Building",
    "furniture": {
        "type": "Relationship",
        "object": ["urn:ngsi-ld:Shelf:unit001", "urn:ngsi-ld:Shelf:unit002", "urn:ngsi-ld:Shelf:unit003"]
    },
    "address": {
        "type": "Property",
        "value": {
            "streetAddress": "Bornholmer Straße 65",
            "addressRegion": "Berlin",
            "addressLocality": "Prenzlauer Berg",
            "postalCode": "10439"
        },
        "verified": {
            "type": "Property",
            "value": true
        }
    },
    "name": {
        "type": "Property",
        "value": "Bösebrücke Einkauf"
    },
    "category": {
        "type": "Property",
        "value": "commercial"
    },
    "location": {
        "type": "GeoProperty",
        "value": {
            "type": "Point",
            "coordinates": [13.3986, 52.5547]
        }
    },
    "tweets": {
        "type": "Property",
        "value": [
            "It has great practical value – you can wrap it around you for warmth as you bound across the cold moons of Jaglan Beta;",
            "You can lie on it on the brilliant marble-sanded beaches of Santraginus V, inhaling the heady sea vapours;",
            "You can sleep under it beneath the stars which shine so redly on the desert world of Kakrafoon;",
            "Use it to sail a mini raft down the slow heavy river Moth;",
            "Wet it for use in hand-to-hand-combat;",
            "Wrap it round your head to ward off noxious fumes or to avoid the gaze of the Ravenous Bugblatter Beast of Traal  (a mindboggingly stupid animal, it assumes that if you can’t see it, it can’t see you – daft as a bush, but very, very ravenous);",
            "You can wave your towel in emergencies as a distress signal, and of course dry yourself off with it if it still seems to be clean enough."
        ]
    }
}
```

The same response data can be seen within the supermarket application itself. In practice this data has been created via
a series of requests - the context broker is responsible for the `urn:ngsi-ld:Building:store001` data, however it checks
to see if any further information can be provided from other sources. In our case the `CSourceRegistration` indicates
that one further attribute _may_ be available. The broker then requests `tweets` information from the context provider,
and provided that it responds in a timely manner, the `tweets` information is added to the resultant payload.

The supermarket application displays the received data on screen within the supermarket application itself:

![tweets-1](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/tweets-1.png)

### Read direct from the Context Provider

Every context-provider must stand by a fixed contract. At a minimum must be able to respond to varieties of the
`/ngsi-ld/v1/entities/<entity-id>` GET request. If the registration is limited to certain properties, this request will
also contain an `attrs` parameter in the query string.

Dependent upon the use case of the context-provider, it may or may not need to be able to interpret JSON-LD `@context` -
in this case a request is merely returning the full `tweets` attribute.

The same request is made by the context broker itself when querying for registered attributes

#### 7 Request:

```bash
curl -L -X GET 'http://localhost:3000/static/tweets/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001?attrs=tweets' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/ld+json'
```

#### Response:

As can be seen the `@context` has been returned in the request (since the `Content-Type` header was set). The rest of
the response resembles any standard NGSI-LD request.

```json
{
    "@context": "https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld",
    "id": "urn:ngsi-ld:Building:store001",
    "type": "Building",
    "tweets": {
        "type": "Property",
        "value": [
            "It has great practical value – you can wrap it around you for warmth as you bound across the cold moons of Jaglan Beta;",
            "You can lie on it on the brilliant marble-sanded beaches of Santraginus V, inhaling the heady sea vapours;",
            "You can sleep under it beneath the stars which shine so redly on the desert world of Kakrafoon;",
            "Use it to sail a mini raft down the slow heavy river Moth;",
            "Wet it for use in hand-to-hand-combat;",
            "Wrap it round your head to ward off noxious fumes or to avoid the gaze of the Ravenous Bugblatter Beast of Traal  (a mindboggingly stupid animal, it assumes that if you can’t see it, it can’t see you – daft as a bush, but very, very ravenous);",
            "You can wave your towel in emergencies as a distress signal, and of course dry yourself off with it if it still seems to be clean enough."
        ]
    }
}
```

### Direct update of the Context Provider

For a read-write interface it is also possible to amend context data by making a PATCH request to the relevant
`ngsi-ld/v1/entities/<entity-id>/attrs` endpoint.

#### 8 Request:

```bash
curl -L -X PATCH 'http://localhost:3000/static/tweets/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001/attrs' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/json' \
--data-raw '{
  "tweets": {
    "type": "Property",
    "value": [
      "Space is big.",
      "You just won'\''t believe how vastly, hugely, mind-bogglingly big it is.",
      "I mean, you may think it'\''s a long way down the road to the chemist'\''s, but that'\''s just peanuts to space."
    ]
  }
}'
```

#### 9 Request:

If the regisitered attribute is requested from the context broker, it returns the _updated_ values obtained from
`http://context-provider:3000/static/tweets/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001` - i.e. the forwarding
endpoint.

```bash
curl -L -X GET 'http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001?attrs=tweets&options=keyValues' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
```

#### Response:

This alters the response to match the values updated in the previous PATCH request.

```json
{
    "@context": "https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld",
    "id": "urn:ngsi-ld:Building:store001",
    "type": "Building",
    "tweets": [
        "Space is big.",
        "You just won't believe how vastly, hugely, mind-bogglingly big it is.",
        "I mean, you may think it's a long way down the road to the chemist's, but that's just peanuts to space."
    ]
}
```

Since the context provider is responsible for supplying `tweets` information, changes in the context provider will
always be reflected in requests to the context-broker itself. The supermarket application is calling the context broker
for context regardless of origin, so the updated `tweets` data are displayed on screen within the supermarket
application itself:

![tweets-2](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/tweets-2.png)

The context broker is therefore able to return a complete holistic picture of the current state of the world.

### Forwarded Update

#### 10 Request:

A PATCH request to the context broker ( either `ngsi-ld/v1/entities/<entity-id>/` or
`ngsi-ld/v1/entities/<entity-id>/attrs`) will be forwarded to the registered context provider if a registration is
found. It is therefore possible to alter the state of a context-provider as a side effect. Of course, not all context
providers are necessarily read-write, so attempting to change the attributes of forwarded context may not be fully
respected.

In this case however a request to PATCH `ngsi-ld/v1/entities/<entity-id>` will be successfully forwarded as a series of
`ngsi-ld/v1/entities/<entity-id>/attrs` requests for each regsitered attribute that is found in the registration.

```bash
curl -L -X PATCH 'http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001/attrs/tweets' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/json' \
--data-raw '{
  "type": "Property",
  "value": [
    "This must be Thursday",
    "I never could get the hang of Thursdays."
  ]
} '
```

#### 11 Request:

The result of the previous operation can be seen by retrieving the whole entity using a GET request.

```bash
curl -L -X GET 'http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001?attrs=tweets&options=keyValues' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/json'
```

#### Response:

This alters the response to match the values updated in the previous PATCH request which was sent to the context broker
and then forwarded to the context provider endpoint.

```json
{
    "@context": "https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld",
    "id": "urn:ngsi-ld:Building:store001",
    "type": "Building",
    "tweets": ["This must be Thursday", "I never could get the hang of Thursdays."]
}
```

As can be seen, the updated `tweets` data is also displayed within the supermarket application itself:

![tweets-3](https://fiware.github.io/tutorials.LD-Subscriptions-Registrations/img/tweets-3.png)
