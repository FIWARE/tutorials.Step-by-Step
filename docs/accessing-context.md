[![FIWARE Core Context Management](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/core.svg)](https://www.fiware.org/developers/catalogue/)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-blue.svg)](https://fiware-ges.github.io/core.Orion/api/v2/stable/)

**Description:** This tutorial teaches FIWARE users how to alter the context
programmatically. The tutorial builds on the entities created in the previous
[stock management example](context-providers.md) and enables a user understand
how to write code in an
[NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) capable
[Node.js](https://nodejs.org/) [Express](https://expressjs.com/) application in
order to retrieve and alter context data. This removes the need to use the
command-line to invoke cUrl commands.

The tutorial is mainly concerned with discussing code written in Node.js,
however some of the results can be checked by making [cUrl](https://ec.haxx.se/)
commands.
[Postman documentation](https://fiware.github.io/tutorials.Accessing-Context/)
for the same commands is also available.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/fb5f564d9bc65fc3690e)

---

# Accessing the Context Data

For a typical smart solution you will be retrieving context data from diverse
sources (such as a CRM system, social networks, mobile apps or IoT sensors for
example) and then analyzing the context programmatically to make appropriate
business logic decisions. For example in the stock management demo, the
application will need to ensure that the prices paid for each item always
reflect the current price held within the **Product** entity. For a dynamic
system, the application will also need to be able to amend the current context.
(e.g. creating or updating data or actuating a sensor for example)

In general terms, three basic scenarios are defined below:

-   Reading Data - e.g. Give me all the data for the **Store** entity
    `urn:ngsi-ld:Store:001`
-   Aggregation - e.g. Combine the **InventoryItems** entities for Store
    `urn:ngsi-ld:Store:001` with the names and prices of the **Product**
    entities for sale
-   Altering the Context - e.g. Make a sale of a product:
    -   Update the daily sales records by the price of the **Product**
    -   decrement the `shelfCount` of the **InventoryItem** entity
    -   Create a new Transaction Log record showing the sale has occurred
    -   Raise an alert in the warehouse if less than 10 objects remain on sale
    -   etc.

As you can see the business logic behind each request to access/amend context
can range from the simple to complex depending upon business needs.

## Making HTTP Requests in the language of your choice

The [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) specification
defines a language agnostic REST API based on the standard usage of HTTP verbs.
Therefore context data can be accessed by any programming language, simply
through making HTTP requests.

Here for example is the same HTTP request written in
[PHP](https://secure.php.net/), [Node.js](https://nodejs.org/) and
[Java](https://www.oracle.com/java/)

#### PHP (with `HTTPRequest`)

```php
<?php

$request = new HttpRequest();
$request->setUrl('http://localhost:1026/v2/entities/urn:ngsi-ld:Store:001');
$request->setMethod(HTTP_METH_GET);

$request->setQueryData(array(
  'options' => 'keyValues'
));

try {
  $response = $request->send();

  echo $response->getBody();
} catch (HttpException $ex) {
  echo $ex;
}
```

#### Node.js (with `request` library)

```javascript
const request = require("request");

const options = {
    method: "GET",
    url: "http://localhost:1026/v2/entities/urn:ngsi-ld:Store:001",
    qs: { options: "keyValues" }
};

request(options, function(error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
});
```

#### Java (with `CloseableHttpClient` library)

```java
CloseableHttpClient httpclient = HttpClients.createDefault();
try {
    HttpGet httpget = new HttpGet("http://localhost:1026/v2/entities/urn:ngsi-ld:Store:001?options=keyValues");

    ResponseHandler<String> responseHandler = new ResponseHandler<String>() {
        @Override
        public String handleResponse(
                final HttpResponse response) throws ClientProtocolException, IOException {
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                return entity != null ? EntityUtils.toString(entity) : null;
            } else {
                throw new ClientProtocolException("Unexpected response status: " + status);
            }
        }

    };
    String body = httpclient.execute(httpget, responseHandler);
    System.out.println(body);
} finally {
    httpclient.close();
}
```

## Generating NGSI API Clients

As you can see from the examples above, each one uses their own programming
paradigm to do the following:

-   Create a well formed URL.
-   Make an HTTP GET request.
-   Retrieve the response.
-   Check for an error status and throw an exception if necessary.
-   Return the body of the request for further processing.

Since such boilerplate code is frequently re-used it is usually hidden within a
library.

The [`swagger-codegen`](https://github.com/swagger-api/swagger-codegen) tool is
able to generate boilerplate API client libraries in a wide variety of
programming languages directly from the
[NGSI v2 Swagger Specification](https://fiware.github.io/specifications/OpenAPI/ngsiv2).
Currently `swagger-codegen` will generate code for the following languages:

-   ActionScript, Ada, Apex, Bash, C#, C++, Clojure, Dart, Elixir, Elm, Eiffel,
    Erlang, Go, Groovy, Haskell, Java, Kotlin, Lua, Node.js, Objective-C, Perl,
    PHP, PowerShell, Python, R, Ruby, Rust, Scala, Swift, TypeScript

For example the command:

```bash
swagger-codegen generate \
  -l javascript \
  -i https://fiware.github.io/specifications/OpenAPI/ngsiv2/ngsiv2-openapi.json
```

Will generate a default ES5 npm package for NGSI v2 directly from the current
specification.

Additional information can be found by running

```bash
swagger-codegen help generate
```

With information about the customization switches available for a specific
language found by running

```bash
swagger-codegen config-help -l <language-name>
```

## The teaching goal of this tutorial

The aim of this tutorial is to improve developer understanding of programmatic
access of context data through defining and discussing a series of generic code
examples covering common data access scenarios. For this purpose a simple
Node.js Express application will be created.

The intention here is not to teach users how to write an application in
Express - indeed any language could have been chosen. It is merely to show how
**any** sample programming language could be used alter the context to achieve
the business logic goals.

Obviously, your choice of programming language will depend upon your own
business needs - when reading the code below please keep this in mind and
substitute Node.js with your own programming language as appropriate.

<h3>Entities within a stock management system</h3>

The relationship between our entities is defined as shown:

![](https://fiware.github.io/tutorials.Accessing-Context/img/entities.png)

The **Store**, **Product** and **InventoryItem** entities will be used to
display data on the frontend of our demo application.

---

# Architecture

This application will make use of only one FIWARE component - the
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/). Usage of
the Orion Context Broker (with proper context data flowing through it) is
sufficient for an application to qualify as _“Powered by FIWARE”_.

Currently, the Orion Context Broker relies on open source
[MongoDB](https://www.mongodb.com/) technology to keep persistence of the
context data it holds. To request context data from external sources, a simple
Context Provider NGSI proxy has also been added. To visualize and interact with
the Context we will add a simple Express application

Therefore, the architecture will consist of four elements:

-   The [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/)
    which will receive requests using
    [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
-   The underlying [MongoDB](https://www.mongodb.com/) database :
    -   Used by the Orion Context Broker to hold context data information such
        as data entities, subscriptions and registrations
-   The **Context Provider NGSI** proxy which will will:
    -   receive requests using
        [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
    -   makes requests to publicly available data sources using their own APIs
        in a proprietary format
    -   returns context data back to the Orion Context Broker in
        [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) format.
-   The **Stock Management Frontend** which will will:
    -   Display store information
    -   Show which products can be bought at each store
    -   Allow users to "buy" products and reduce the stock count.

Since all interactions between the elements are initiated by HTTP requests, the
entities can be containerized and run from exposed ports.

![](https://fiware.github.io/tutorials.Accessing-Context/img/architecture.png)

The necessary configuration information can be seen in the services section of
the associated `docker-compose.yml` file. It has been described in a
[previous tutorial](context-providers.md)

# Start Up

All services can be initialized from the command-line by running the bash script
provided within the repository. Please clone the repository and create the
necessary images by running the commands as shown:

```bash
git clone git@github.com:Fiware/tutorials.Accessing-Context.git
cd tutorials.Accessing-Context

./services create; ./services start;
```

This command will also import seed data from the previous
[Stock Management example](context-providers.md) on startup.

> **Note:** If you want to clean up and start over again you can do so with the
> following command:
>
> ```
> ./services stop
> ```

---

# Stock Management Frontend

All the code Node.js Express for the demo can be found within the `proxy` folder
within the GitHub
repository.[Stock Management example](https://github.com/Fiware/tutorials.Step-by-Step/tree/master/docker/context-provider).
The application runs on the following URLs:

-   `http://localhost:3000/app/store/urn:ngsi-ld:Store:001`
-   `http://localhost:3000/app/store/urn:ngsi-ld:Store:002`
-   `http://localhost:3000/app/store/urn:ngsi-ld:Store:003`
-   `http://localhost:3000/app/store/urn:ngsi-ld:Store:004`

> **Tip** Additionally, you can also watch the status of recent requests
> yourself by following the container logs or viewing information on
> `localhost:3000/app/monitor` on a web browser.
>
> ![FIWARE Monitor](https://fiware.github.io/tutorials.Accessing-Context/img/monitor.png)

## NGSI v2 npm library

A Swagger Generated NGSI v2 client
[npm library](https://github.com/smartsdk/ngsi-sdk-javascript) has been
developed by the [SmartSDK](https://www.smartsdk.eu/) team. This is a
callback-based library which will be used to take care of our low level HTTP
requests and will simplify the code to be written. The methods exposed in the
library map directly onto the NGSI v2
[CRUD operations](crud-operations.md#what-is-crud) with the following names:

| HTTP Verb  |                                                  `/v2/entities`                                                  |                                               `/v2/entities/<entity>`                                                |
| ---------- | :--------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------: |
| **POST**   | [`createEntity()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/EntitiesApi.md#createEntity) |                                                         :x:                                                          |
| **GET**    | [`listEntities()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/EntitiesApi.md#listEntities) | [`retrieveEntity()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/EntitiesApi.md#retrieveEntity) |
| **PUT**    |                                                       :x:                                                        |                                                         :x:                                                          |
| **PATCH**  |                                                       :x:                                                        |                                                         :x:                                                          |
| **DELETE** |                                                       :x:                                                        |   [`removeEntity()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/EntitiesApi.md#removeEntity)   |

| HTTP Verb   |                                                                     `.../attrs`                                                                      |  `.../attrs/<attribute>`   |                                                     `.../attrs/<attribute>/value`                                                      |
| ----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------: | :------------------------------------------------------------------------------------------------------------------------------------: |
| **POST**    | [`updateOrAppendEntityAttributes()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/EntitiesApi.md#updateOrAppendEntityAttributes) |            :x:             |                                                                  :x:                                                                   |
| **GET**     |       [`retrieveEntityAttributes()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/EntitiesApi.md#retrieveEntityAttributes)       |            :x:             |    [`getAttributeValue()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/AttributeValueApi.md#getAttributeValue)    |
| **PUT**     |                                                                         :x:                                                                          |            :x:             | [`updateAttributeValue()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/AttributeValueApi.md#updateAttributeValue) |
| **PATCH**   | [`updateExistingEntityAttributes()`](https://github.com/smartsdk/ngsi-sdk-javascript/blob/master/docs/EntitiesApi.md#updateExistingEntityAttributes) |            :x:             |                                                                  :x:                                                                   |
| **DELETE**. |                                                                         :x:                                                                          | `removeASingleAttribute()` |                                                                  :x:                                                                   |

## Analyzing the Code

The code under discussion can be found within the `store` controller in the
[Git Repository](https://github.com/Fiware/tutorials.Step-by-Step/blob/master/docker/context-provider/express-app/controllers/store.js)

### Initializing the library

We don't want to reinvent the wheel and spend time writing a unnecessary
boilerplate code for HTTP access. Therefore we will use the existing `ngsi_v2`
npm library. This needs to be included in the header of the file as shown. The
`basePath` must also be set - this defines the location of the Orion Context
Broker.

```javascript
const NgsiV2 = require("ngsi_v2");
const defaultClient = NgsiV2.ApiClient.instance;
defaultClient.basePath =
    process.env.CONTEXT_BROKER || "http://localhost:1026/v2";
```

### Reading Store Data

This example reads the context data of a given **Store** entity to display the
results on screen. Reading entity data can be done using the
`apiInstance.retrieveEntity()` method. Since the library uses callbacks, they
have been wrapped by a `Promise` function as shown below. The library function
`apiInstance.retrieveEntity()` will fill out the URL for the GET request and
make the necessary HTTP call:

```javascript
function retrieveEntity(entityId, opts) {
    return new Promise(function(resolve, reject) {
        const apiInstance = new NgsiV2.EntitiesApi();
        apiInstance.retrieveEntity(entityId, opts, (error, data) => {
            return error ? reject(error) : resolve(data);
        });
    });
}
```

This enables us to wrap the requests in `Promises` as shown:

```javascript
function displayStore(req, res) {
    retrieveEntity(req.params.storeId, { options: "keyValues", type: "Store" })
        .then(store => {
            // If a store has been found display it on screen
            return res.render("store", { title: store.name, store });
        })
        .catch(error => {
            debug(error);
            // If no store has been found, display an error screen
            return res.render("store-error", { title: "Error", error });
        });
}
```

Indirectly this is making an HTTP GET request to
`http://localhost:1026/v2/entities/<store-id>?type=Store&options=keyValues`.
Note the re-use of the Store URN in the incoming request.

The equivalent cUrl command would be as shown:

```bash
curl -G -X GET \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Store:001' \
  -d 'type=Store' \
  -d 'options=keyValues'
```

The response will be as shown below:

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

The store data from the HTTP response body is then passed to the PUG rendering
engine to display on screen as shown below:

#### `http://localhost:3000/app/store/urn:ngsi-ld:Store:001`

![Store 1](https://fiware.github.io/tutorials.Accessing-Context/img/store.png)

For efficiency, it is important to request as few attributes as possible, in
order to reduce network traffic. This optimization has not been made in the code
yet.

An error handler is necessary in case the context data is not available - for
example if a user queries for a store that does not exist. This will forward to
an error page as shown:

#### `http://localhost:3000/app/store/urn:ngsi-ld:Store:005`

![Store 5](https://fiware.github.io/tutorials.Accessing-Context/img/store-error.png)

The equivalent cUrl command would be as shown:

```bash
curl -G -X GET \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Store:005' \
  -d 'type=Store' \
  -d 'options=keyValues'
```

The response has a status of **404 Not Found** with a body as shown below:

```json
{
    "error": "NotFound",
    "description": "The requested entity has not been found. Check type and id"
}
```

The `error` object in the `catch` method hold the error response. This is then
displayed on the frontend.

### Aggregating Products and Inventory Items

This example reads the context data of the current **InventoryItem** entities
for a given store and combines the information with the prices from the
**Product** entities. The result is information to be displayed on the cash
till.

![Till](https://fiware.github.io/tutorials.Accessing-Context/img/till.png)

Multiple entities can be requested and aggregated by creating a `Promise` chain
or by using `Promise.all`. Here the **Product** and **InventoryItems** entities
have been requested using the `apiInstance.listEntities()` library method. The
presence of the `q` parameter in the request will filter the list of entities
received.

```javascript
function displayTillInfo(req, res) {
    Promise.all([
        listEntities({
            options: "keyValues",
            type: "Product"
        }),
        listEntities({
            q: "refStore==" + req.params.storeId,
            options: "keyValues",
            type: "InventoryItem"
        })
    ])
        .then(values => {
            // If values have been found display it on screen
            return res.render("till", {
                products: values[0],
                inventory: values[1]
            });
        })
        .catch(error => {
            debug(error);
            // An error occurred, return with no results
            return res.render("till", { products: {}, inventory: {} });
        });
}

function listEntities(opts) {
    return new Promise(function(resolve, reject) {
        const apiInstance = new NgsiV2.EntitiesApi();
        apiInstance.listEntities(opts, (error, data) => {
            return error ? reject(error) : resolve(data);
        });
    });
}
```

The code used for aggregating the results (displaying the product names for each
item stocked) has been delegated to a `mixin` on the frontend. The foreign key
aggregation (`item.refProduct === product.id`) could have been added to the
Node.js code if we were passing on aggregated data to another component:

```pug
mixin product(item, products)
  each product in products
    if (item.refProduct === product.id)
      span(id=`${product.id}`)
        strong
          | #{product.name}

        | &nbsp; @ #{product.price /100} &euro; each
        | - #{item.shelfCount} in stock
        |
```

Again an error handler has been created to ensure that if any of the HTTP
requests to the Orion Context Broker fail, an empty list of products is
returned.

Retrieving the full list of **Product** entities for each request is not
efficient. It would be better to load the list of products from cache, and only
update the list if prices have changed. This could be achieved using the NGSI
Subscription mechanism which is the subject of a subsequent tutorial.

This is the equivalent of the following cURL commands (plus some business logic)

```bash
curl -G -X GET \
  'http://localhost:1026/v2/entities/' \
  -d 'type=Product' \
  -d 'options=keyValues'
curl -G -X GET \
  'http://localhost:1026/v2/entities' \
  -d 'q=refStore==urn:ngsi-ld:Store:001' \
  -d 'type=InventoryItem' \
  -d 'options=keyValues'
```

### Updating Context

Buying an item will involve decrementing the number of items left on a shelf.
The example consists of two linked requests. The reading of the
**InventoryItem** entity data can be done using the
`apiInstance.retrieveEntity()` method as shown previously. The data is then
amended in memory before being sent to the Orion Context Broker using the
`apiInstance.updateExistingEntityAttributes()` method. This is effectively just
a wrapper around an HTTP PATCH request to
`http://localhost:1026/v2/entities/<inventory-id>?type=InventoryItem`, with a
body containing the elements to be updated. There is no error handling on this
function, it has been left to a function on the router.

```javascript
async function buyItem(req, res) {
    const inventory = await retrieveEntity(req.params.inventoryId, {
        options: "keyValues",
        type: "InventoryItem"
    });
    const count = inventory.shelfCount - 1;
    await updateExistingEntityAttributes(
        req.params.inventoryId,
        { shelfCount: { type: "Integer", value: count } },
        {
            type: "InventoryItem"
        }
    );
    res.redirect(`/app/store/${inventory.refStore}/till`);
}

function updateExistingEntityAttributes(entityId, body, opts) {
    return new Promise(function(resolve, reject) {
        const apiInstance = new NgsiV2.EntitiesApi();
        apiInstance.updateExistingEntityAttributes(
            entityId,
            body,
            opts,
            (error, data) => {
                return error ? reject(error) : resolve(data);
            }
        );
    });
}
```

Care should be taken when amending the context to ensure that changes of state
are committed atomically. This is not an issue in Node.JS since it is single
threaded - each request but will execute each request one by one. However in
multithreaded environments (such as Java for example) it could be possible to
service two buy requests concurrently - meaning that the `shelfCount` will only
be reduced once if the requests interleave. This issue can be resolved by the
use of a monitor mechanism.

This is the equivalent of the following cURL commands (plus some business logic)

```bash
curl -X GET \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:InventoryItem:001/attrs/shelfCount/value'
curl -iX PATCH \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:InventoryItem:006/attrs' \
  -H 'Content-Type: application/json' \
  -d '{ "shelfCount":
  { "type": "Integer", "value": "13" }
}'
```
