[![FIWARE Core Context Management](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/core.svg)](https://github.com/FIWARE/catalogue/blob/master/core/README.md)
[![NGSI LD](https://img.shields.io/badge/NGSI-linked_data-red.svg)](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.01.01_60/gs_CIM009v010101p.pdf)

This tutorial teaches FIWARE users how to architect and design a system based on **linked data** and to alter linked
data context programmatically. The tutorial extends the knowledge gained from the equivalent
[NGSI-v2 tutorial](accessing-context.md) and enables a user understand how to write code in an
[NGSI-LD](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.01.01_60/gs_CIM009v010101p.pdf) capable
[Node.js](https://nodejs.org/) [Express](https://expressjs.com/) application in order to retrieve and alter context
data. This removes the need to use the command-line to invoke cUrl commands.

The tutorial is mainly concerned with discussing code written in Node.js, however some of the results can be checked by
making [cUrl](https://ec.haxx.se/) commands.
[Postman documentation](https://fiware.github.io/tutorials.Working-with-Linked-Data) for the same commands is also
available.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/644a1df1e2d226da65ef)

<hr class="core"/>

# Working with Linked Data Entities

> -   “This is the house that Jack built.
> -   This is the malt that lay in the house that Jack built.
> -   This is the rat that ate the malt<br/> That lay in the house that Jack built.
> -   This is the cat<br/> That killed the rat that ate the malt<br/> That lay in the house that Jack built.
> -   This is the dog that chased the cat<br/> That killed the rat that ate the malt<br/> That lay in the house that
>     Jack built.”
>
> ― This Is the House That Jack Built, Traditional English Nursery Rhyme

NSGI-LD is an evolution of NGSI-v2, so it should not be surprising that Smart solutions based on NSGI-LD will need to
cover the same basic scenarios as outlined in the previous NGSI-v2 [tutorial](accessing-context.md) on programatic data
access.

NGSI-LD Linked data formalizes the structure of context entities to a greater degree, through restricting data
attributes to be defined as either _Property_ attributes or _Relationship_ attributes only. This means that it is
possible to traverse the context data graph with greater certainty when moving from one _Relationship_ to another. All
the context data entities within the system are defined by JSON-LD data models, which are formally defined by
referencing a context file, and this programatic definition should guarantee that the associated linked entity exists.

Three basic data access scenarios for the supermaket are defined below:

-   Reading Data - e.g. Give me all the data for the **Building** entity `urn:ngsi-ld:Building:store001`
-   Aggregation - e.g. Combine the **Products** entities sold in **Building** `urn:ngsi-ld:Building:store001` and
    display the goods for sale
-   Altering context within the system - e.g. Make a sale of a product:
    -   Update the daily sales records by the price of the **Product**
    -   decrement the `numberOfItems` of the **Shelf** entity
    -   Create a new Transaction Log record showing the sale has occurred
    -   Raise an alert in the warehouse if less than 10 objects remain on sale
    -   etc.

Further advanced scenarios will be covered in later tutorials

## Linked Data Entities within a stock management system

The supermarket data created in the [previous tutorial](relationships-linked-data.md) will be loaded into the context
broker. The existing relationships between the entities are defined as shown below:

![](https://fiware.github.io/tutorials.Working-with-Linked-Data/img/entities-ld.png)

The **Building**, **Product**, **Shelf** and **StockOrder** entities will be used to display data on the frontend of our
demo application.

## The teaching goal of this tutorial

The aim of this tutorial is to improve developer understanding of programmatic access of context data through defining
and discussing a series of generic code examples covering common data access scenarios. For this purpose a simple
Node.js Express application will be created.

The intention here is not to teach users how to write an application in Express - indeed any language could have been
chosen. It is merely to show how **any** sample programming language could be used alter the context to achieve the
business logic goals.

Obviously, your choice of programming language will depend upon your own business needs - when reading the code below
please keep this in mind and substitute Node.js with your own programming language as appropriate.

# Stock Management Frontend

All the code Node.js Express for the demo can be found within the `ngsi-ld` folder within the GitHub repository.
[Stock Management example](https://github.com/FIWARE/tutorials.Step-by-Step/tree/master/context-provider). The
application runs on the following URLs:

-   `http://localhost:3000/app/store/urn:ngsi-ld:Building:store001`
-   `http://localhost:3000/app/store/urn:ngsi-ld:Building:store002`
-   `http://localhost:3000/app/store/urn:ngsi-ld:Building:store003`
-   `http://localhost:3000/app/store/urn:ngsi-ld:Building:store004`

> :information_source: **Tip** Additionally, you can also watch the status of recent requests yourself by following the
> container logs or viewing information on `localhost:3000/app/monitor` on a web browser.
>
> ![FIWARE Monitor](https://fiware.github.io/tutorials.Working-with-Linked-Data/img/monitor.png)

# Architecture

The demo Supermarket application will send and receive NGSI-LD calls to a compliant context broker. Since the NGSI-LD
interface is available on an experimental version of the
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/), the demo application will only make use of one
FIWARE component.

Currently, the Orion Context Broker relies on open source [MongoDB](https://www.mongodb.com/) technology to keep
persistence of the context data it holds. To request context data from external sources, a simple Context Provider NGSI
proxy has also been added. To visualize and interact with the Context we will add a simple Express application

Therefore, the architecture will consist of three elements:

-   The [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using
    [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
-   The underlying [MongoDB](https://www.mongodb.com/) database :
    -   Used by the Orion Context Broker to hold context data information such as data entities, subscriptions and
        registrations
-   The **Stock Management Frontend** which will:
    -   Display store information
    -   Show which products can be bought at each store
    -   Allow users to "buy" products and reduce the stock count.

Since all interactions between the elements are initiated by HTTP requests, the entities can be containerized and run
from exposed ports.

![](https://fiware.github.io/tutorials.Working-with-Linked-Data/img/architecture.png)

The necessary configuration information for the **Context Provider NGSI proxy** can be seen in the services section the
of the associated `docker-compose.yml` file:

<h3>Tutorial Configuration</h3>

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
        - "WEB_APP_PORT=3000"
        - "NGSI_VERSION=ngsi-ld"
        - "CONTEXT_BROKER=http://orion:1026/ngsi-ld/v1"
```

The `tutorial` container is driven by environment variables as shown:

| Key            | Value                          | Description                                                               |
| -------------- | ------------------------------ | ------------------------------------------------------------------------- |
| DEBUG          | `tutorial:*`                   | Debug flag used for logging                                               |
| WEB_APP_PORT   | `3000`                         | Port used by the Context Provider NGSI proxy and web-app for viewing data |
| CONTEXT_BROKER | `http://orion:1026/ngsi-ld/v1` | URL of the context broker to connect to update context                    |

The other `tutorial` container configuration values described in the YAML file are not used in this section of the
tutorial.

The configuration information for MongoDB and the Orion Context Broker has been described in a
[previous tutorial](relationships-linked-data.md)

# Start Up

All services can be initialised from the command-line by running the
[services](https://github.com/FIWARE/tutorials.Relationships-Linked-Data/blob/master/services) Bash script provided
within the repository. Please clone the repository and create the necessary images by running the commands as shown:

```bash
git clone https://github.com/FIWARE/tutorials.Working-with-Linked-Data.git
cd tutorials.Working-with-Linked-Data

./services orion
```

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

---

# Traversing Linked Data Programmatically

Goto `http://localhost:3000/app/store/urn:ngsi-ld:Building:store001` to display and interact with the working
Supermarket data application.

## Reading Linked Data

The code under discussion can be found within the `ngsi-ld/store` controller in the
[Git Repository](https://github.com/FIWARE/tutorials.Step-by-Step/blob/master/context-provider/controllers/ngsi-ld/store.js)

### Initializing the library

As usual, the code for HTTP access can be split out from the business logic of the Supermarket application itself. The
lower level calls have been placed into a library file, which simplifies the codebase. This needs to be included in the
header of the file as shown. Some constants are also required - for the Supermarket data, the `LinkHeader` is used to
define location of the data models JSON-LD context as
`https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld`.

```javascript
const ngsiLD = require("../../lib/ngsi-ld");

const LinkHeader =
    '<https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json">';
```

### Retrieve a known Store

This example reads the context data of a given **Store** entity to display the results on screen. Reading entity data
can be done using the `ngsiLD.readEntity()` method - this will fill out the URL for the GET request and make the
necessary HTTP call in an asynchronous fashion:

```javascript
async function displayStore(req, res) {
    const store = await ngsiLD.readEntity(
        req.params.storeId,
        { options: "keyValues" },
        ngsiLD.setHeaders(req.session.access_token, LinkHeader)
    );

    return res.render("store", { title: store.name, store });
}
```

The function above also sends some standard HTTP Headers as part of the request - these are defined in the
`setHeaders()` function.

Within an NGSI-LD-based system, the usual default HTTP headers would include a `Link` header to send the JSON-LD context
and a `Content-Type` header to identify the request as `application/ld+json` (note that every NGSI-LD request is valid
JSON_LD since NGSI-LD is a subset of JSON-LD). Other additional headers such as `X-Auth-Token` can be added to enable
OAuth2 security.

```javascript
function setHeaders(accessToken, link, contentType) {
    const headers = {};
    if (accessToken) {
        headers["X-Auth-Token"] = accessToken;
    }
    if (link) {
        headers.Link = link;
    }
    if (contentType) {
        headers["Content-Type"] = contentType || "application/ld+json";
    }
    return headers;
}
```

Within the `lib/ngsi-ld.js` library file, the `BASE_PATH` defines the location of the Orion Context Broker, reading a
data entity is simply a wrapper around an asynchronous HTTP GET request passing the appropriate headers

```javascript
const BASE_PATH = process.env.CONTEXT_BROKER || "http://localhost:1026/ngsi-ld/v1";

function readEntity(entityId, opts, headers = {}) {
    return request({
        qs: opts,
        url: BASE_PATH + "/entities/" + entityId,
        method: "GET",
        headers,
        json: true
    });
}
```

The equivalent cUrl statement can be seen below:

```bash
curl -G -X GET 'http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001/' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/ld+json' \
-d 'type=Building' \
-d 'options=keyValues'
```

## Aggregating and Traversing Linked Data

To display information at the till, it is necessary to discover information about the products found within a Store.
From the Data Entity diagram we can ascertain that:

-   **Building** entities hold related **Shelf** information within the `furniture` _Relationship_
-   **Shelf** entities hold related **Product** information within the `stocks` _Relationship_
-   Products hold `name` and `price` as _Property_ attributes of the **Product** entity itself.

Therefore the code for the `displayTillInfo()` method will consist of the following steps.

1. Make a request to the Context Broker to _find shelves within a known store_
2. Reduce the result to a `id` parameter and make a second request to the Context Broker to _retrieve stocked products
   from shelves_
3. Reduce the result to a `id` parameter and make a third request to the Context Broker to _retrieve product details for
   selected shelves_

To users familar with database joins, it may seem strange being forced to making a series of requests like this, however
it is necessary due to scalability issues/concerns in a large distributed setup. Direct join requests are not possible
with NGSI-LD.

### Find Shelves within a known Store

To access the `furniture` attribute of a known **Building** entity, a `keyValues` request is made using the `attrs`
parameter.

```javascript
const building = await ngsiLD.readEntity(
    req.params.storeId,
    {
        type: "Building",
        options: "keyValues",
        attrs: "furniture"
    },
    ngsiLD.setHeaders(req.session.access_token, LinkHeader)
);
```

The equivalent cUrl statement can be seen below:

```bash
curl -G -X GET 'http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:Building:store001/' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/ld+json' \
-d 'type=Building' \
-d 'options=keyValues' \
-d 'attrs=furniture' \
```

The response is a JSON Object which includes a `furniture` attribute which can be manipulated further.

### Retrieve Stocked Products from shelves

To retrieve a series of **Shelf** entities, the `ngsiLD.listEntities()` function is called and filtered using the `id`
parameter. The `id` is just a comma separated list taken from the request above.

```javascript
let productsList = await ngsiLD.listEntities(
    {
        type: "Shelf",
        options: "keyValues",
        attrs: "stocks,numberOfItems",
        id: building.furniture.join(",")
    },
    ngsiLD.setHeaders(req.session.access_token, LinkHeader)
);
```

`listEntities()` is another function within the `lib/ngsi-ld.js` library file

```javascript
function listEntities(opts, headers = {}) {
    return request({
        qs: opts,
        url: BASE_PATH + "/entities",
        method: "GET",
        headers,
        json: true
    });
}
```

The equivalent cUrl statement can be seen below:

```bash
curl -G -X GET 'http://localhost:1026/ngsi-ld/v1/entities/' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/ld+json' \
-H 'Accept: application/json' \
-d 'type=Shelf' \
-d 'options=keyValues' \
-d 'attrs=stocks,numberOfItems' \
-d 'id=urn:ngsi-ld:Shelf:unit001,urn:ngsi-ld:Shelf:unit002,urn:ngsi-ld:Shelf:unit003'
```

The response is a JSON Array of **Shelf** entities which includes as `stocks` attribute which can be manipulated
further. The code below extracts the ids for later use.

```javascript
const stockedProducts = [];

productsList = _.groupBy(productsList, e => {
    return e.stocks;
});
_.forEach(productsList, (value, key) => {
    stockedProducts.push(key);
});
```

### Retrieve Product Details for selected shelves

To retrieve a series of **Product** entities, the `ngsiLD.listEntities()` function is once again called and filtered
using the `id` parameter. The `id` is just a comma separated list taken from the request above.

```javascript
let productsInStore = await ngsiLD.listEntities(
    {
        type: "Product",
        options: "keyValues",
        attrs: "name,price",
        id: stockedProducts.join(",")
    },
    headers
);
```

The equivalent cUrl statement can be seen below:

```bash
curl -G -X GET 'http://localhost:1026/ngsi-ld/v1/entities/' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/ld+json' \
-H 'Accept: application/json' \
-d 'type=Product' \
-d 'options=keyValues' \
-d 'attrs=name,price' \
-d 'id=urn:ngsi-ld:Product:001,urn:ngsi-ld:Product:003,urn:ngsi-ld:Product:004'
```

The response is a JSON Array of **Product** entities which are then displayed on screen.

## Updating Linked Data

### Find a shelf stocking a product

To retrieve a series of **Shelf** entities, the `ngsiLD.listEntities()` function is called. It is important to retrieve
the current context before amending it, so the `q` parameter is used to only retrieve a shelf from the correct store
containing the correct product. This request is only possible because the **Shelf** data model has been designed to hold
_relationships_ with both **Building** and **Product**.

```javascript
const shelf = await ngsiLD.listEntities(
    {
        type: "Shelf",
        options: "keyValues",
        attrs: "stocks,numberOfItems",
        q: 'numberOfItems>0;locatedIn=="' + req.body.storeId + '";stocks=="' + req.body.productId + '"',
        limit: 1
    },
    headers
);
```

The equivalent cUrl statement can be seen below:

```bash
curl -G -X GET 'http://localhost:1026/ngsi-ld/v1/entities/' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/ld+json' \
-H 'Accept: application/json' \
-d 'type=Shelf' \
-d 'options=keyValues' \
-d 'q=numberOfItems%3E0;locatedIn==%22urn:ngsi-ld:Building:store001%22;stocks==%22urn:ngsi-ld:Product:001%22'
```

### Update the state of a shelf

To update an entity a PATCH request is made using the id of the **Shelf** returned in the previous request

```javascript
const count = shelf[0].numberOfItems - 1;
await ngsiLD.updateAttribute(
    shelf[0].id,
    { numberOfItems: { type: "Property", value: count } },
    ngsiLD.setHeaders(req.session.access_token, LinkHeader)
);
```

The asynchronous PATCH request is found in the `updateAttribute()` function within the `lib/ngsi-ld.js` library file

```javascript
function updateAttribute(entityId, body, headers = {}) {
    return request({
        url: BASE_PATH + "/entities/" + entityId + "/attrs",
        method: "PATCH",
        body,
        headers,
        json: true
    });
}
```

The equivalent cUrl statement can be seen below:

```bash
curl -X PATCH 'http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:Shelf:unit001/attrs' \
-H 'Link: <https://fiware.github.io/tutorials.Step-by-Step/tutorials-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
-H 'Content-Type: application/json' \
-d '{ "numberOfItems": { "type": "Property", "value": 10 } }'
```
