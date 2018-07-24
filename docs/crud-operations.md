[![FIWARE Core Context](https://img.shields.io/badge/FIWARE-Core_Context-233c68.svg)](https://www.fiware.org/developers/catalogue/)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-blue.svg)](http://fiware.github.io/context.Orion/api/v2/stable/)

**Description:** This tutorial teaches FIWARE users about CRUD Operations.
The tutorial builds on the data created in the previous [stock management example](entity-relationships.md) and introduces the concept of [CRUD operations](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete), allowing users to manipulate the data held within the context.

The tutorial uses [cUrl](https://ec.haxx.se/) commands throughout, but is also available as [Postman documentation](http://fiware.github.io/tutorials.CRUD-Operations/).

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/825950653bc2350307c3)

---

# Data Entities

Within the FIWARE platform, an entity represents the state of a physical or conceptural object which exists in the real world.

<h3>Entities within a stock management system</h3>

Within our simple stock management system, currently have four types of entity. The relationship between our entities is defined as shown:

![](https://fiware.github.io/tutorials.Entity-Relationships/img/entities.png)

* A **Store** is a real world bricks and mortar building. Stores would have properties such as:
    +  A name of the store e.g. "Checkpoint Markt"
    +  An address "Friedrichstraße 44, 10969 Kreuzberg, Berlin"
    +  A phyiscal location  e.g. *52.5075 N, 13.3903 E*
* A **Shelf** is a real world device to hold objects which we wish to sell. Each shelf would have properties such as:
    +  A name of the shelf e.g. "Wall Unit"
    +  A phyiscal location  e.g. *52.5075 N, 13.3903 E*
    +  A maximum capacity
    +  An association to the store in which the shelf is present
* A **Product** is defined as something that we sell - it is conceptural object. Products would have properties such as:
    +  A name of the product e.g. "Vodka"
    +  A price e.g. 13.99 Euros
    +  A size e.g. Small
* An **Inventory Item** is another conceptural entity, used to assocate products, stores, shelves and physical objects. It would have properties such as:
    +  An assocation to the product being sold
    +  An association to the store in which the product is being sold
    +  An association to the shelf where the product is being displayed
    +  A stock count of the quantity of the product available in the warehouse
    +  A stock count of the quantity of the product available on the shelf


As you can see, each of the entities defined above contain some properties which are liable to change. A product could change its price, stock could be sold and the shelf count of stock could be reduced and so on.

---

# Architecture

This application will only make use of one FIWARE component - the [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/). Usage of the Orion Context Broker (with proper context data flowing through it) is sufficient for an application to qualify as *“Powered by FIWARE”*.

Currently, the Orion Context Broker relies on open source [MongoDB](https://www.mongodb.com/) technology to keep persistence of the context data it holds. Therefore, the architecture will consist of two elements:

* The [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
* The underlying [MongoDB](https://www.mongodb.com/) database :
    +  Used by the Orion Context Broker to hold context data information such as data entities, subscriptions and registrations

Since all interactions between the two elements are initiated by HTTP requests, the entities can be containerized and run from exposed ports.

![](https://fiware.github.io/tutorials.CRUD-Operations/img/architecture.png)

The necessary configuration information can be seen in the services section of the associated `docker-compose.yml`  file:

```yaml
  orion:
    image: fiware/orion:latest
    hostname: orion
    container_name: orion
    depends_on:
      - mongo-db
    networks:
        - default
    expose:
        - "1026"
    ports:
        - "1026:1026"
    command: -dbhost mongo-db -logLevel DEBUG
```

```yaml
  mongo-db:
    image: mongo:3.6
    hostname: mongo-db
    container_name: db-mongo
    expose:
        - "27017"
    ports:
        - "27017:27017"
    networks:
        - default
    command: --bind_ip_all --smallfiles
```

Both containers are residing on the same network - the Orion Context Broker is listening on Port `1026`
and MongoDB is listening on the default port `271071`. Both containers are also exposing the same ports
externally - this is purely for the tutorial access - so that cUrl or Postman can access them without
being part of the same network. The command line initialization should be self explanatory.


# Start Up

All services can be initialised from the command line by running the bash script provided within the repository. Please clone the repository and create the necessary images by running the commands as shown:

```bash
git clone git@github.com:Fiware/tutorials.CRUD-Operations.git
cd tutorials.CRUD-Operations

./services start
```

This command will also import seed data from the previous [Store Finder tutorial](entity-relationships.md) on startup.

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
>```
>./services stop
>```
>

---

# What is CRUD?

**Create**, **Read**, **Update** and **Delete** are the four basic functions of persistent storage.  These operations are usually referred to using the acronym **CRUD**. Within a database each of these operations map directly to a series of commands, however the relationship with a RESTful API is slightly more complex.

The [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/)uses [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) to manipulate the context data. As a RESTful API, requests to manipulate the data held within the context follow the standard conventions found when mapping HTTP verbs to CRUD operations.

## Entity CRUD Operations


For operations where the `<entity-id>` is not yet known within the context, or is unspecified, the `/v2/entities` endpoint is used.

Once an `<entity-id>` is known within the context, individual data entities can be manipulated using the `/v2/entities/<entity-id>`  endpoint.

It is recommended that entity identifiers should be a URN following [NGSI-LD guidelines](https://docbox.etsi.org/ISG/CIM/Open/ISG_CIM_NGSI-LD_API_Draft_for_public_review.pdf), therefore each `id` is a URN follows a standard format: `urn:ngsi-ld:<entity-type>:<entity-id>`. This will mean that every `id` in the context data will be unique.


| HTTP Verb   | `/v2/entities`  | `/v2/entities/<entity-id>`  |
|-----------  |:--------------: |:-----------------------: |
| **POST**    | CREATE a new entity and add to the context.  | CREATE or UPDATE an attribute of a specified entity. |
| **GET**     | READ entity data from the context. This will return data from multiple entities. The data can be filtered.  | READ entity data from a specified entity. This will return data from a single entity only. The data can be filtered.  |
| **PUT**     | :x:   | :x:   |
| **PATCH**   | :x:   | :x:   |
| **DELETE**  | :x:  | DELETE an entity from the context   |

A complete list of entity endpoints can be found by looking at the [NGSI v2 Swagger Specification](https://fiware.github.io/specifications/OpenAPI/ngsiv2#/Entities)

## Attribute CRUD Operations

To perform CRUD operations on attributes, the `<entity-id>` must be known. Each attribute is effectively a key value pair.

  There are three endpoints:

*  `/v2/entities/<entity-id>/attrs`  is only used for a patch operation to update one or more exisiting attributes.
*  `/v2/entities/<entity-id>/attrs/<attribute>`  is used to manipulate an attribute as a whole.
*  `/v2/entities/<entity-id>/attrs/<attribute>/value`  is used to read or update the `value` of an attribute, leaving the `type` untouched.


| HTTP Verb   | `.../attrs`  | `.../attrs/<attribute>`  | `.../attrs/<attribute>/value`  |
|-----------  |:-----------: |:-----------------------: |:-----------------------------: |
| **POST**    |  :x:   | :x:   | :x:   |
| **GET**     |  :x:   | :x:   | READ the value of an attribute from a specified entity. This will return a single field.   |
| **PUT**     |  :x:   | :x:   | UPDATE the value of single attribute from a specified entity.   |
| **PATCH**   |  UPDATE one or more existing attributes from an existing entity.  | :x:   | :x:   |
| **DELETE**. |  :x: | DELETE an existing attribute from an existing entity.  | :x:  |


A complete list of attribute endpoints can be found by looking at the [NGSI v2 Swagger Specification](https://fiware.github.io/specifications/OpenAPI/ngsiv2#/Attributes)

## Batch CRUD Operations

Additionally the Orion Context Broker a convenience batch operation endpoint `/v2/op/update` to manipulate multiple entities in a single operation.

Batch operations are always made using a POST request, where the payload is an object with two properties:

*  `actionType` specifies the kind of action to invoke (e.g. `DELETE`)
*  `entities` is an array object holding the list of entities to update, along with the relevant entity data used to make the operation.



# Example CRUD Operations using FIWARE

The following examples assume that the Orion Context Broker is listening on port 1026 of `localhost`, and the initial seed data has been imported from the previous tutorial.

All examples refer to the **Product** entity as defined in the stock management system. CRUD operations will therefore relate to adding, reading,  amending and deleting a product or series of products. This is a typical use case for a regional manager of store for example - setting prices and deciding what products can be sold.
The actual responses you receive in each case will depend on the state of the context data in your system at the time. If you find that you have already deleted an entity by mistake, you can restore the initial context by reloading the data from the command line

```bash
./import-data
```


## Create Operations
Create Operations map to HTTP POST.

* The `/v2/entities` endpoint is used for creating new entities
* The `/v2/entities/<entity>` endpoint is used adding new attributes

Any newly created entity must have a `id` and `type` attributes, each additional attributes are optional and will depend on the system being described. Each additional attribute should also have a defined `type` and a `value` attribute.

The response will be **204 - No Content** if the operation is successful or  **422 - Unprocessable Entity** error response if the operation fails


### Create a New Data Entity

This example adds a new **Product** entity ("Lemonade" at 99 cents) to the context.

#### 1 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/entities' \
  --header 'Content-Type: application/json' \
  --data ' {
      "id":"urn:ngsi-ld:Product:010", "type":"Product",
      "name":{"type":"Text", "value":"Lemonade"},
      "size":{"type":"Text", "value": "S"},
      "price":{"type":"Integer", "value": 99}
}'
```

New entities can be added by making a POST request to the `/v2/entities` endpoint.

The request will fail if any of the attributes already exist in the context.


#### 2 Request:

You can check to see if the new **Product** can be found in the context by making a GET request

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:010' \
  -d 'type=Product'
```




### Create a New Attribute

This example adds a new `specialOffer` attribute to the existing **Product** entity with `id=urn:ngsi-ld:Product:001`.

#### 3 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:001/attrs' \
  --header 'Content-Type: application/json' \
  --data '{
      "specialOffer":{"value": true}
}'
```

New attributes can be added by making a POST request to the `/v2/entities/<entity>/attrs` endpoint.

The payload should consist of a JSON object holding the attribute names and values as shown.

If no `type` is specified a default type (`Boolean`, `Text` , `Number` or `StructuredValue`) will be assigned.

Subsequent requests using the same `id` will update the value of the attribute in the context.


#### 4 Request:

You can check to see if the new **Product** attribute can be found in the context by making a GET request

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:001' \
  -d 'type=Product'
```

As you can see there is now  boolean `specialOffer` flag attached to the "Beer" **Product** entity



### Batch Create New Data Entities or Attributes

This example uses the convenience batch processing endpoint to add two new **Product** entities and one new attribute (`offerPrice`) to the context.

#### 5 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/op/update' \
  --header 'Content-Type: application/json' \
  --data '{
  "actionType":"APPEND_STRICT",
  "entities":[
    {
      "id":"urn:ngsi-ld:Product:011", "type":"Product",
      "name":{"type":"Text", "value":"Brandy"},
      "size":{"type":"Text", "value": "M"},
      "price":{"type":"Integer", "value": 1199}
    },
    {
      "id":"urn:ngsi-ld:Product:012", "type":"Product",
      "name":{"type":"Text", "value":"Port"},
      "size":{"type":"Text", "value": "M"},
      "price":{"type":"Integer", "value": 1099}
    },
    {
      "id":"urn:ngsi-ld:Product:001", "type":"Product",
      "offerPrice":{"type":"Integer", "value": 89}
    }
  ]
}'
```

The request will fail if any of the attributes already exist in the context.

Batch processing uses the `/v2/op/update` endpoint with a payload with two attributes

* `actionType=APPEND_STRICT` means that the request only succeed all entities / attributes are new.
* The `entities` attribute holds an array of entities we wish to create.

Subsequent request using the same data with the `actionType=APPEND_STRICT` batch operation will result in an error response.


### Batch Create/Overwrite New Data Entities

This example uses the convenience batch processing endpoint to adds or amend two **Product** entities and one attribute (`offerPrice`) to the context.

* if the entities already exist - the request will update the attributes of an entity.
* if the entities do not exist, a new entity will be created.

#### 6 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/op/update' \
  --header 'Content-Type: application/json' \
  --data '{
  "actionType":"APPEND",
  "entities":[
    {
      "id":"urn:ngsi-ld:Product:011", "type":"Product",
      "name":{"type":"Text", "value":"Brandy"},
      "size":{"type":"Text", "value": "M"},
      "price":{"type":"Integer", "value": 1199}
    },
    {
      "id":"urn:ngsi-ld:Product:012", "type":"Product",
      "name":{"type":"Text", "value":"Port"},
      "size":{"type":"Text", "value": "M"},
      "price":{"type":"Integer", "value": 1099}
    }
  ]
}'
```

Batch processing uses the `/v2/op/update` endpoint with a payload with two attributes:

* `actionType=APPEND` means we will overwrite existing entities if they exist
* The entities attribute holds an array of entities we wish to create/overwrite.

A Subsequent request using the same data with the `actionType=APPEND` batch operation can applied without changing the result beyond the initial application.


## Read Operations

* The `/v2/entities` endpoint is used for listing operations
* The `/v2/entities/<entity>` endpoint is used for retrieving the details of a single entity

### Filtering

* The options parameter (combined with the attrs parameter) is used to filter the fields returned
* The q parameter can be used to filter the entities returned

### Read a Data Entity (verbose)

This example reads the full context from an existing **Product** entity with a known `id`.

#### 7 Request:

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:010' \
  -d 'type=Product'
```

#### Response:

Product `urn:ngsi-ld:Product:010` is "Lemonade" at 99 cents. The response is as shown:

```json
{
    "id": "urn:ngsi-ld:Product:010",
    "type": "Product",
    "name": { "type": "Text","value": "Lemonade","metadata": {}},
    "price": { "type": "Integer","value": 99,"metadata": {}},
    "size": { "type": "Text","value": "S","metadata": {}}
}
```

Context data can be retrieved by making a GET request to the `/v2/entities/<entity>` endpoint.


### Read an Attribute from a Data Entity

This example reads the value of a single attribute (`name`) from an existing **Product** entity with a known `id`.

#### 8 Request:

```bash
curl -X GET \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:001/attrs/name/value'
```

#### Response:

Product `urn:ngsi-ld:Product:001` is "Beer" at 99 cents. The response is as shown:

```json
"Beer"
```

Context data can be retrieved by making a GET request to the `/v2/entities/<entity>/attrs/<attribute>/value` endpoint.


### Read a Data Entity (key value pairs)

This example reads the key-value pairs for two requested attributes (`name` and `price`) from the context of existing **Product** entity with a known `id`.

#### 9 Request:

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:001' \
  -d 'type=Product' \
  -d 'options=keyValues' \
  -d' attrs=name,price'
```

#### Response:

Product `urn:ngsi-ld:Product:001` is "Beer" at 99 cents. The response is as shown:

```json
{
    "id": "urn:ngsi-ld:Product:001",
    "type": "Product",
    "name": "Beer",
    "price": 99
}
```

Combine the `options=keyValues` parameter and the `attrs` parameter to obtain key-value pairs.



### Read Multiple attributes values from a Data Entity

This example reads the value of two requested attributes (`name` and `price`) from the context of existing **Product** entity with a known id.

#### 10 Request:

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:001'\
  -d 'type=Product' \
  -d 'options=values' \
  -d 'attrs=name,price'
```

#### Response:

Product `urn:ngsi-ld:Product:001` is "Beer" at 99 cents. The response is as shown:

```json
[
    "Beer",
    99
]
```

Combine the `options=values` parameter and the `attrs` parameter to return a list of values in an array




### List all Data Entities (verbose)

This example lists the full context of all **Product** entities.

#### 11 Request:

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities' \
  -d 'type=Product'
```

### Response:

On Start up the context held nine products, three more have been added by the create operations so the full context will return twelve products.

```json
[
    {
        "id": "urn:ngsi-ld:Product:001",
        "type": "Product",
        "name": {"type": "Text","value": "Beer","metadata": {}},
        "offerPrice": {"type": "Integer","value": 89,"metadata": {}},
        "price": {"type": "Integer","value": 99,"metadata": {}},
        "size": {"type": "Text","value": "S","metadata": {}},
        "specialOffer": {"type": "Boolean","value": true,"metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:002",
        "type": "Product",
        "name": {"type": "Text","value": "Red Wine","metadata": {}},
        "price": {"type": "Integer","value": 1099,"metadata": {}},
        "size": {"type": "Text","value": "M","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:003",
        "type": "Product",
        "name": {"type": "Text","value": "White Wine","metadata": {}},
        "price": {"type": "Integer","value": 1499,"metadata": {}},
        "size": {"type": "Text","value": "M","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:004",
        "type": "Product",
        "name": {"type": "Text","value": "Vodka","metadata": {}},
        "price": {"type": "Integer","value": 5000,"metadata": {}},
        "size": {"type": "Text","value": "XL","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:005",
        "type": "Product",
        "name": {"type": "Text","value": "Lager","metadata": {}},
        "price": {"type": "Integer","value": 99,"metadata": {}},
        "size": {"type": "Text","value": "S","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:006",
        "type": "Product",
        "name": {"type": "Text","value": "Whisky","metadata": {}},
        "price": {"type": "Integer","value": 99,"metadata": {}},
        "size": {"type": "Text","value": "S","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:007",
        "type": "Product",
        "name": {"type": "Text","value": "Gin","metadata": {}},
        "price": {"type": "Integer","value": 99,"metadata": {}},
        "size": {"type": "Text","value": "S","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:008",
        "type": "Product",
        "name": {"type": "Text","value": "Apple Juice","metadata": {}},
        "price": {"type": "Integer","value": 99,"metadata": {}},
        "size": {"type": "Text","value": "S","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:009",
        "type": "Product",
        "name": {"type": "Text","value": "Orange Juice","metadata": {}},
        "price": {"type": "Integer","value": 99,"metadata": {}},
        "size": {"type": "Text","value": "S","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:010",
        "type": "Product",
        "name": {"type": "Text","value": "Lemonade","metadata": {}},
        "price": {"type": "Integer","value": 99,"metadata": {}},
        "size": {"type": "Text","value": "S","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:011",
        "type": "Product",
        "name": {"type": "Text","value": "Brandy","metadata": {}},
        "price": {"type": "Integer","value": 1199,"metadata": {}},
        "size": {"type": "Text","value": "M","metadata": {}}
    },
    {
        "id": "urn:ngsi-ld:Product:012",
        "type": "Product",
        "name": {"type": "Text","value": "Port","metadata": {}},
        "price": {"type": "Integer","value": 1099,"metadata": {}},
        "size": {"type": "Text","value": "M","metadata": {}}
    }
]
```

### List all Data Entities (key value pairs)

This example lists the `name` and `price` attributes of all **Product** entities.

#### 12 Request:

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities' \
  -d 'type=Product' \
  -d 'options=keyValues' \
  -d 'attrs=name,price'
```

#### Response:
On Start up the context held nine products, three more have been added by the create operations so the full context will return twelve products.

```json
[
    {
        "id": "urn:ngsi-ld:Product:001",
        "type": "Product",
        "name": "Beer",
        "price": 99
    },
    {
        "id": "urn:ngsi-ld:Product:002",
        "type": "Product",
        "name": "Red Wine",
        "price": 1099
    },
    {
        "id": "urn:ngsi-ld:Product:003",
        "type": "Product",
        "name": "White Wine",
        "price": 1499
    },
    {
        "id": "urn:ngsi-ld:Product:004",
        "type": "Product",
        "name": "Vodka",
        "price": 5000
    },
    {
        "id": "urn:ngsi-ld:Product:005",
        "type": "Product",
        "name": "Lager",
        "price": 99
    },
    {
        "id": "urn:ngsi-ld:Product:006",
        "type": "Product",
        "name": "Whisky",
        "price": 99
    },
    {
        "id": "urn:ngsi-ld:Product:007",
        "type": "Product",
        "name": "Gin",
        "price": 99
    },
    {
        "id": "urn:ngsi-ld:Product:008",
        "type": "Product",
        "name": "Apple Juice",
        "price": 99
    },
    {
        "id": "urn:ngsi-ld:Product:009",
        "type": "Product",
        "name": "Orange Juice",
        "price": 99
    },
    {
        "id": "urn:ngsi-ld:Product:010",
        "type": "Product",
        "name": "Lemonade",
        "price": 99
    },
    {
        "id": "urn:ngsi-ld:Product:011",
        "type": "Product",
        "name": "Brandy",
        "price": 1199
    },
    {
        "id": "urn:ngsi-ld:Product:012",
        "type": "Product",
        "name": "Port",
        "price": 1099
    }
]
```

Full context data for a specified entity type can be retrieved by making a GET request to the `/v2/entities` endpoint and supplying the `type` parameter, combine this with the o`ptions=keyValues` parameter and the `attrs` parameter to obtain key-values.


### List Data Entity by id

This example lists the `id` and `type` of all **Product** entities.

#### 13 Request:

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities' \
  -d 'type=Product' \
  -d 'options=count' \
  -d 'attrs=id'
```

#### Response:
On Start up the context held nine products, three more have been added by the create operations so the full context will return twelve products.

```json
[
    {
        "id": "urn:ngsi-ld:Product:001",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:002",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:003",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:004",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:005",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:006",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:007",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:008",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:009",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:010",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:011",
        "type": "Product"
    },
    {
        "id": "urn:ngsi-ld:Product:012",
        "type": "Product"
    }
]
```

Context data for a specified entity type can be retrieved by making a GET request to the `/v2/entities` endpoint and supplying the `type` parameter. Combine this with `options=count` and `attrs=id` to return the `id` attributes of the given `type`


## Update Operations

Overwrite operations are mapped to HTTP PUT. HTTP PATCH can be used to update several attributes at once.

* The `/v2/entities/<entity>/attrs/<attribute>/value` endpoint is used to update an attribute
* The `/v2/entities/<entity>/attrs` endpoint is used to update multiple attributes


### Overwrite the value of an Attribute value

This example updates the value of the price attribute of the Entity with `id=urn:ngsi-ld:Product:001`

#### 14 Request:

```bash
curl -iX PUT \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:001/attrs/price/value' \
  --header 'Content-Type: text/plain' \
  --data 89
```

Existing attribute values can be altered by making a PUT request to the `/v2/entities/<entity>/attrs/<attribute>/value` endpoint.


### Overwrite Multiple Attributes of a Data Entity

This example simultaneously updates the values of both the price and name attributes of the Entity with `id=urn:ngsi-ld:Product:001`

#### 15 Request:

```bash
curl -iX PATCH \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:001/attrs' \
  --header 'Content-Type: application/json' \
  --data ' {
      "price":{"type":"Integer", "value": 89}
}'
```


### Batch Overwrite Attributes of Multiple Data Entities

This example uses the convenience batch processing endpoint to create a series of available products.

#### 16 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/op/update' \
  --header 'Content-Type: application/json' \
  --data '{
  "actionType":"UPDATE",
  "entities":[
    {
      "id":"urn:ngsi-ld:Product:001", "type":"Product",
      "price":{"type":"Integer", "value": 1199}
    },
    {
      "id":"urn:ngsi-ld:Product:002", "type":"Product",
      "price":{"type":"Integer", "value": 1199},
      "size": {"type":"Text", "value": "L"}
    }
  ]
}'
```

Batch processing uses the `/v2/op/update` endpoint with a payload with two attributes - `actionType=APPEND` means we will overwrite existing entities if they exist whereas the `entities` attribute holds an array of entities we wish to update.


### Batch Create/Overwrite Attributes of Multiple Data Entities

This example uses the convenience batch processing endpoint to create a series of available products.

#### 17 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/op/update' \
  --header 'Content-Type: application/json' \
  --data '{
  "actionType":"APPEND",
  "entities":[
    {
      "id":"urn:ngsi-ld:Product:001", "type":"Product",
      "price":{"type":"Integer", "value": 1199}
    },
    {
      "id":"urn:ngsi-ld:Product:002", "type":"Product",
      "price":{"type":"Integer", "value": 1199},
      "specialOffer": {"type":"Boolean", "value":  true}
    }
  ]
}'
```

Batch processing uses the `/v2/op/update` endpoint with a payload with two attributes - `actionType=APPEND` means we will overwrite existing entities if they exist whereas the `entities` attribute holds an array of entities we wish to update.



### Batch Replace Entity Data

This example uses the convenience batch processing endpoint to create a series of available products.

#### 18 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/op/update' \
  --header 'Content-Type: application/json' \
  --data '{
  "actionType":"REPLACE",
  "entities":[
    {
      "id":"urn:ngsi-ld:Product:010", "type":"Product",
      "price":{"type":"Integer", "value": 1199}
    }
  ]
}'
```

Batch processing uses the `/v2/op/update` endpoint with a payload with two attributes - `actionType=REPLACE` means we will overwrite existing entities if they exist whereas the `entities` attribute holds an array of entities we wish to update.


## Delete Operations
Delete Operations map to HTTP DELETE.

* The `/v2/entities/<entity>` endpoint is used to delete an entity
* The `/v2/entities/<entity>/attrs/<attribute>` endpoint is used to delete an attribute

The response will be **204 - No Content** if the operation is successful or  **404 - Not Found** error response if the operation fails


### Data Relationships
If there are entities within the context which relate to one another, you must be careful when deleting an entity. You will need to check that no references are left dangling once the entity has been deleted.

Organizing a cascade of deletions is beyond the scope of this tutorial, but it would be possible using a batch delete request.

### Delete a Data Entity

This example deletes the Entity with `id=urn:ngsi-ld:Product:001` from the context

#### 19 Request:

```bash
curl -iX DELETE \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:010'
```

Entities be deleted by making a DELETE request to the `/v2/entities/<entity>` endpoint.

Subsequent requests using the same `id` will result in an error response since the entity no longer exists in the context.


### Delete an Attribute from a Data Entity

This example remove the `specialOffer` attribute from the entity with `id=urn:ngsi-ld:Product:010`

#### 20 Request:

```bash
curl -iX DELETE \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:010/attrs/specialOffer'
```

Attributes can be deleted by making a DELETE request to the `/v2/entities/<entity>/attrs/<attribute>` endpoint.

If the attribute does not exist in the context, the result in an error response.

### Batch Delete Multiple Data Entities

This example uses the convenience batch processing endpoint to delete a series of available **Product** entities.

#### 21 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/op/update' \
  --header 'Content-Type: application/json' \
  --data '{
  "actionType":"DELETE",
  "entities":[
    {
      "id":"urn:ngsi-ld:Product:001", "type":"Product"
    },
    {
      "id":"urn:ngsi-ld:Product:002", "type":"Product"
    }
  ]
}'
```

Batch processing uses the `/v2/op/update` endpoint with a payload with two attributes - `actionType=DELETE` means we will delete something from the context and the `entities` attribute holds the `id` of the entities we wish to update.

If any entity does not exist in the context, the result in an error response.

### Batch Delete Multiple Attributes from a Data Entity

This example uses the convenience batch processing endpoint to delete a series of attributes from an available **Product** entity.

#### 22 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/op/update' \
  --header 'Content-Type: application/json' \
  --data '{
  "actionType":"DELETE",
  "entities":[
    {
      "id":"urn:ngsi-ld:Product:010", "type":"Product",
      "price":{},
      "name": {}
    }
  ]
}'
```

Batch processing uses the `/v2/op/update` endpoint with a payload with two attributes - `actionType=DELETE` means we will delete something from the context and the `entities` attribute holds an array of attributes we wish to update.

If any attribute does not exist in the context, the result will be an error response.

### Find existing data relationships

This example returns the key of all entities directly associated with the `urn:ngsi-ld:Product:001`.

#### 23 Request:

```bash
curl -G -X GET \
  --url 'http://localhost:1026/v2/entities' \
  -d 'q=refProduct==urn:ngsi-ld:Product:001' \
  -d 'options=count' \
  -d 'attrs=type'
```

#### Response:

```json
[
    {
        "id": "urn:ngsi-ld:InventoryItem:001",
        "type": "InventoryItem"
    },
    {
        "id": "urn:ngsi-ld:InventoryItem:004",
        "type": "InventoryItem"
    },
    {
        "id": "urn:ngsi-ld:InventoryItem:006",
        "type": "InventoryItem"
    },
    {
        "id": "urn:ngsi-ld:InventoryItem:401",
        "type": "InventoryItem"
    }
]
```

* If this request returns an empty array, the entity has no associates - it can be safely deleted
* If the response lists a series of **InventoryItem** entities they should be deleted before the associated **Product** entity is removed from the context.



