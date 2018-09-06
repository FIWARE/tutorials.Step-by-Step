[![FIWARE Core Context Management](https://img.shields.io/badge/FIWARE-Core-233c68.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAVCAYAAAC33pUlAAAABHNCSVQICAgIfAhkiAAAA8NJREFUSEuVlUtIFlEUx+eO+j3Uz8wSLLJ3pBiBUljRu1WLCAKXbXpQEUFERSQF0aKVFAUVrSJalNXGgmphFEhQiZEIPQwKLbEUK7VvZrRvbr8zzjfNl4/swplz7rn/8z/33HtmRhn/MWzbXmloHVeG0a+VSmAXorXS+oehVD9+0zDN9mgk8n0sWtYnHo5tT9daH4BsM+THQC8naK02jCZ83/HlKaVSzBey1sm8BP9nnUpdjOfl/Qyzj5ust6cnO5FItJLoJqB6yJ4QuNcjVOohegpihshS4F6S7DTVVlNtFFxzNBa7kcaEwUGcbVnH8xOJD67WG9n1NILuKtOsQG9FngOc+lciic1iQ8uQGhJ1kVAKKXUs60RoQ5km93IfaREvuoFj7PZsy9rGXE9G/NhBsDOJ63Acp1J82eFU7OIVO1OxWGwpSU5hb0GqfMydMHYSdiMVnncNY5Vy3VbwRUEydvEaRxmAOSSqJMlJISTxS9YWTYLcg3B253xsPkc5lXk3XLlwrPLuDPKDqDIutzYaj3eweMkPeCCahO3+fEIF8SfLtg/5oI3Mh0ylKM4YRBaYzuBgPuRnBYD3mmhA1X5Aka8NKl4nNz7BaKTzSgsLCzWbvyo4eK9r15WwLKRAmmCXXDoA1kaG2F4jWFbgkxUnlcrB/xj5iHxFPiBN4JekY4nZ6ccOiQ87hgwhe+TOdogT1nfpgEDTvYAucIwHxBfNyhpGrR+F8x00WD33VCNTOr/Wd+9C51Ben7S0ZJUq3qZJ2OkZz+cL87ZfWuePlwRcHZjeUMxFwTrJZAJfSvyWZc1VgORTY8rBcubetdiOk+CO+jPOcCRTF+oZ0okUIyuQeSNL/lPrulg8flhmJHmE2gBpE9xrJNkwpN4rQIIyujGoELCQz8ggG38iGzjKkXufJ2Klun1iu65bnJub2yut3xbEK3UvsDEInCmvA6YjMeE1bCn8F9JBe1eAnS2JksmkIlEDfi8R46kkEkMWdqOv+AvS9rcp2bvk8OAESvgox7h4aWNMLd32jSMLvuwDAwORSE7Oe3ZRKrFwvYGrPOBJ2nZ20Op/mqKNzgraOTPt6Bnx5citUINIczX/jUw3xGL2+ia8KAvsvp0ePoL5hXkXO5YvQYSFAiqcJX8E/gyX8QUvv8eh9XUq3h7mE9tLJoNKqnhHXmCO+dtJ4ybSkH1jc9XRaHTMz1tATBe2UEkeAdKu/zWIkUbZxD+veLxEQhhUFmbnvOezsJrk+zmqMo6vIL2OXzPvQ8v7dgtpoQnkF/LP8Ruu9zXdJHg4igAAAABJRU5ErkJgggA=)](https://www.fiware.org/developers/catalogue/)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-blue.svg)](http://fiware.github.io/context.Orion/api/v2/stable/)

**Description:** This tutorial teaches FIWARE users about how to create and manage context data subscriptions.
The tutorial builds on the entities and [Stock Management Frontend](https://github.com/Fiware/tutorials.Subscriptions/tree/master/proxy)
application created in the previous [example](https://github.com/Fiware/tutorials.Accessing-Context/) to enable users to understand
the [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
Subscribe/Notify paradigm and how to use NGSI subscriptions within their own code.

The tutorial refers to Stock Management actions made within the browser combined with  [cUrl](https://ec.haxx.se/) commands. The
cUrl commands are also available as [Postman documentation](http://fiware.github.io/tutorials.Subscriptions/).

[![Run in Postman](https://run.pstmn.io/button.svg)](https://www.getpostman.com/collections/fb5f564d9bc65fc3690e)

---

# Subscribing to Changes of State

> "Don't call us, we'll call you"
>
> — Dorothy Kilgallen (The Voice Of Broadway)

Within the FIWARE platform, an entity represents the state of a physical or conceptual object which exists in the real world.
Every smart solution needs to know the current state of these object at any given moment in time.

The context of each of these entities is constantly changing. For example, within the stock management example, the context will
change as new stores open up, products are sold, prices change and so on. For a smart solution based on IoT sensor data, this issue
is even more pressing as the system will constantly be reacting to changes in the real world.

Until now all the operations we have used to change the state of the system have been **synchronous** - changes have been made by
directly by a user or application and they have been informed of the result. The Orion Context Broker offers also an **asynchronous**
notification mechanism - applications can subscribe to changes of context information so that they can
be informed when something happens. This means the application does not need to continuously poll or repeat query requests.

Use of the subscription mechanism will therefore reduce both the volume of requests and amount of data being passed between components
within the system. This reduction in network traffic will improve the overall responsiveness.

<h3>Entities within a stock management system</h3>

The relationship between our entities is defined as shown:

![](https://fiware.github.io/tutorials.Subscriptions/img/entities.png)

<h3>Stock Management Front-End</h3>

In the previous [tutorial](https://github.com/Fiware/tutorials.Accessing-Context/), a simple Node.js Express application was created.
This tutorial will use the monitor page to watch the status of recent requests, and a store page to buy products. Once the services
are running these pages can be accessed from the following URLs:

<h4>Event Monitor</h4>

The event monitor can be found at: `http://localhost:3000/app/monitor`

![FIWARE Monitor](https://fiware.github.io/tutorials.Subscriptions/img/monitor.png)

<h4>Store 002</h4>

Store002 can be found at: `http://localhost:3000/app/store/urn:ngsi-ld:Store:002`

![Store](https://fiware.github.io/tutorials.Subscriptions/img/store2.png)

---

# Architecture

This application will make use of only one FIWARE component - the [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/). Usage of the Orion Context Broker (with proper context data flowing through it) is sufficient for an application to qualify as *“Powered by FIWARE”*.

Currently, the Orion Context Broker relies on open source [MongoDB](https://www.mongodb.com/) technology to keep
persistence of the context data it holds. To request context data from external sources, a simple **Context Provider NGSI
proxy** has also been added. To visualize and interact with the Context we will add a simple Express **Front End** application


Therefore, the architecture will consist of four elements:

* The [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
* The underlying [MongoDB](https://www.mongodb.com/) database:
    +  Used by the Orion Context Broker to hold context data information such as data entities, subscriptions and registrations
* The **Context Provider NGSI proxy** which will will:
    +  receive requests using [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
    +  makes requests to publicly available data sources using their own APIs in a proprietory format
    +  returns context data back to the Orion Context Broker in [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) format.
* The **Stock Management Frontend** which will will:
    +  Display store information
    +  Show which products can be bought at each store
    +  Allow users to "buy" products and reduce the stock count.

Since all interactions between the elements are initiated by HTTP requests, the entities can be containerized and run
from exposed ports.

![](https://fiware.github.io/tutorials.Subscriptions/img/architecture.png)

The necessary configuration information can be seen in the services section of the associated `docker-compose.yml` file. It
has been described in a [previous tutorial](context-providers.md)


# Start Up

All services can be initialized from the command line by running the bash script provided within the repository. Please clone the repository and create the necessary images by running the commands as shown:

```bash
git clone git@github.com:Fiware/tutorials.Subscriptions.git
cd tutorials.Subscriptions

./services create; ./services start;
```

This command will also import seed data from the previous [Stock Management example](context-providers.md) on startup.

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
>```
>./services stop
>```
>

---

#  Using Subscriptions

To follow the tutorial correctly please ensure you have the follow pages available on tabs in your browser before you enter any cUrl commands.

<h4>Event Monitor</h4>

The event monitor can be found at: `http://localhost:3000/app/monitor`

<h4>Stores</h4>

The stores can be found at:

* Store 1 -  `http://localhost:3000/app/store/urn:ngsi-ld:Store:001`
* Store 2 -  `http://localhost:3000/app/store/urn:ngsi-ld:Store:002`


## Setting up a simple Subscription

Within the stock management example, imagine that the regional manager of the company wants to alter the price of a product.
The new price should immediately be reflected at the till in all stores within the system. It would be possible to set up the
system so that it was constantly polling for new information, however prices are not changed very frequently so this would be
a waste of resources and create a lot of unnecessary data traffic.

The alternative is to create a subscription which will POST a payload to a "well-known" URL whenever a price has changed.
A new subscription can be added by making a POST request to the `/v2/subscriptions/` endpoint as shown below:

#### 1 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/subscriptions' \
  --header 'content-type: application/json' \
  --data '{
  "description": "Notify me of all product price changes",
  "subject": {
    "entities": [{"idPattern": ".*", "type": "Product"}],
    "condition": {
      "attrs": [ "price" ]
    }
  },
  "notification": {
    "http": {
      "url": "http://tutorial:3000/subscription/price-change"
    }
  }
}'
```


The body of the POST request consists of two parts, the `subject` section of the request (consisting of `entities` and `conditions`)states that the subscription will be fired whenever the `price` attribute of any **Product** entity is altered. The notification section of the body states that once the conditions of the subscription have been met, a POST request containing all affected **Product** entities will be sent to the URL `http://tutorial:3000/subscription/price-change` which is handled by the stock management front-end application.

For a first run, when the subscription is created, the Orion Context Broker runs the `condition` test, and since it has not been run before makes the assumption that all products have been changed. Therefore a request is sent to `subscription/price-change` immediately as shown:

#### `http://localhost:3000/app/monitor`

![](https://fiware.github.io/tutorials.Subscriptions/img/products-subscription.png)

Code within the Stock Management Front-End application handles received the POST request as shown:

```javascript
router.post('/subscription/:type', (req, res) => {
    _.forEach(req.body.data, item => {
        broadcastEvents(req, item, ['refStore', 'refProduct', 'refShelf', 'type']);
    });
    res.status(204).send();
});

function broadcastEvents(req, item, types) {
    const message = req.params.type + ' received';
    _.forEach(types, type => {
        if (item[type]) {
            req.app.get('io').emit(item[type], message);
        }
    });
}
```

This business logic emits socket I/O events to any registered parties (such as the cash till)

The cash till has been set to reload if is receives an event - however in this case the prices have not changed yet, so the product prices
remain the same - for example a bottle of beer remains at 0.99€

#### `http://localhost:3000/app/store/urn:ngsi-ld:Store:002`

![](https://fiware.github.io/tutorials.Subscriptions/img/beer-99.png)

Let's reduce the price of a bottle of beer to 0.89€. This can't be done programmatically yet, so it has to be done with a curl command
as shown:

#### 2 Request:

```bash
curl -iX PUT \
  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:Product:001/attrs/price/value' \
  --header 'Content-Type: text/plain' \
  --data 89
```

Whenever an attribute of the **Product** entity is updated, the Orion Context Broker checks for any existing subscriptions
(which exist for that entity) and  applies the `condition` test. This time only one **Product** entity has changed since the last run therefore a POST request is sent to `subscription/price-change` - which only contains one **Product** in the body:

#### `http://localhost:3000/app/monitor`

![](https://fiware.github.io/tutorials.Subscriptions/img/price-change.png)

The business logic of the Stock Management Front End again emits socket I/O events to any registered parties (such as the cash till)
and since the price has changed the till now displays a bottle of beer at 0.89€

#### `http://localhost:3000/app/store/urn:ngsi-ld:Store:002`

![](https://fiware.github.io/tutorials.Subscriptions/img/beer-89.png)


##  Reducing Payload with  `attrs` and `attrsFormat`

With the previous example the full verbose data from each affected **Product** entity was sent with the POST notification.
This is not very efficient.

The amount of data to passed can be reduced by adding an `attrs` attribute which will specify a list of attributes to be
included in notification messages - other attributes are ignored

>**Tip** an `exceptAttrs` attribute also exists to return all attributes except for those on the exclude list.
> `attrs` and `exceptAttrs` cannot be used simultaneously in the same subscription


The `attrsFormat` attribute specifies how the entities are represented in notifications. A verbose response is returned by
default `keyValues` and `values` work in the same manner as a `v2/entities` GET request.

##  Reducing Scope with  `expression`

Lets create two more subscriptions which will only fire under specific conditions - and will only return key-value pairs for
the entity affected. Imagine that the warehouse of each store now wants to be informed whenever the amount of product on the
shelf falls below a threshold level.

The subscription is tested whenever the `shelfCount` of an **InventoryItem** is updated, however the addition of an `expression`
attribute will mean that the subscription will only fire if the expression returns valid data - for example
`"q": "shelfCount<10;refStore==urn:ngsi-ld:Store:001` tests that the `shelfCount` is below ten and that the item is in store 001.
This means that we can set up our business logic so that other stores wont be bothered by notifications.



#### 3 Request:

The following command is a low stock notification for Store 001

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/subscriptions' \
  --header 'Content-Type: application/json' \
  --data '{
  "description": "Notify me of low stock in Store 001",
  "subject": {
    "entities": [{"idPattern": ".*","type": "InventoryItem"}],
    "condition": {
      "attrs": ["shelfCount"],
      "expression": {"q": "shelfCount<10;refStore==urn:ngsi-ld:Store:001"}
    }
  },
  "notification": {
    "http": {
      "url": "http://tutorial:3000/subscription/low-stock-store001"
    },
    "attrsFormat" : "keyValues"
  }
}'
```


#### 4 Request:

The following command is a low stock notification for Store 002

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/subscriptions' \
  --header 'Content-Type: application/json' \
  --data '{
  "description": "Notify me of low stock in Store 002",
  "subject": {
    "entities": [{"idPattern": ".*", "type": "InventoryItem"}],
    "condition": {
      "attrs": ["shelfCount"],
      "expression": {"q": "shelfCount<10;refStore==urn:ngsi-ld:Store:002"}
    }
  },
  "notification": {
    "http": {
      "url": "http://tutorial:3000/subscription/low-stock-store002"
    },
    "attrsFormat" : "keyValues"
  }
}'
```

The two requests are very similiar. It is merely the `url` and the `expression` attributes which differ. The first cUrl command
will only fire if the affected **InventoryItem** entity has a reference to Store 001 and the second one if the affected
**InventoryItem** entity has a reference to Store 002. Obviously the URLs must be different so that the business logic of our
application is able to react differently to each request.

> **Tip**: You can set stock levels directly by making a PUT request as shown:
>
>```
>curl -iX PUT \
>  --url 'http://localhost:1026/v2/entities/urn:ngsi-ld:InventoryItem:005/attrs/shelfCount/value' \
>  --header 'Content-Type: text/plain' \
>  --data 5
>```

If you now buy items from Store 002, once an **InventoryItem** dips below ten items the following occurs

#### `http://localhost:3000/app/monitor`
![](https://fiware.github.io/tutorials.Subscriptions/img/low-stock-monitor.png)

As you can see the key value pairs of the affected  **InventoryItem**  have been passed to the Stock Management Front End.

If you look at the store itself:

#### `http://localhost:3000/app/store/urn:ngsi-ld:Store:002`
![](https://fiware.github.io/tutorials.Subscriptions/img/low-stock-warehouse.png)

An alert has been raised by the business logic within the application.


## Subscription CRUD Actions

The **CRUD** operations for subscriptions map on to the expected HTTP verbs under the `/v2/subscriptions/` endpoint.

* **Create** - HTTP POST
* **Read** - HTTP GET
* **Update** - HTTP PATCH
* **Delete** - HTTP DELETE

The `<subscription-id>` is auto generated when the subscription is created and returned in Header
of the POST response to be used by the other operation thereafter.


### Creating a Subscription

This example creates a new subscription. The subscription will fire an asynchronous notification to a URL whenever the context is changed and the conditions of the subscription - Any Changes to Product prices - are met.

New subscriptions can be added by making a POST request to the /v2/subscriptions/ endpoint.

The subject section of the request states that the subscription will be fired whenever the price attribute of any Product entity is altered.

The notification section of the body states that a POST request containing all affected entities will be sent to the http://tutorial:3000/subscription/price-change endpoint.


#### 5 Request:

```bash
curl -iX POST \
  --url 'http://localhost:1026/v2/subscriptions' \
  --header 'content-type: application/json' \
  --data '{
  "description": "Notify me of all product price changes",
  "subject": {
    "entities": [
      {
        "idPattern": ".*", "type": "Product"
      }
    ],
     "condition": {
      "attrs": [ "price" ]
    }
  },
  "notification": {
    "http": {
      "url": "http://tutorial:3000/subscription/price-change"
    }
  }
}'
```


### Delete a Subscription

This example deletes the Subscription with `id=5ae079b86e4f353c5163c939` from the context.

Subscriptions can be deleted by making a DELETE request to the `/v2/subscriptions/<subscription-id>` endpoint.


#### 6 Request:
```bash
curl -iX DELETE \
  --url 'http://localhost:1026/v2/subscriptions/5ae079b86e4f353c5163c939'
```

### Update an Existing Subscription

This example amends an existing subscription with the id `5ae07c7e6e4f353c5163c93e` and updates the notification URL.

Subscriptions can be updated making a PATCH request to the `/v2/subscriptions/<subscription-id>` endpoint.


#### 7 Request:

```bash
curl -iX PATCH \
  --url 'http://localhost:1026/v2/subscriptions/5ae07c7e6e4f353c5163c93e' \
  --header 'content-type: application/json' \
  --data '{
    "status": "active",
    "notification": {
        "http": {
            "url": "http://tutorial:3000/notify/price-change"
        }
    }
}'
```

### List all Subscriptions

This example lists all subscriptions by making a GET request to the /v2/subscriptions/ endpoint.

The notification section of each subscription will also include the last time the conditions of the subscription were met, and whether associated the POST action was successful.

#### 8 Request:

```bash
curl -X GET \
  --url 'http://localhost:1026/v2/subscriptions'
```

###  Read the detail of a Subscription

This example obtains the full details of a subscription with a given id.

The response includes additional details in the notification section showing the last time the conditions of the subscription were met, and whether associated the POST action was successful.

Subscription details can be read by making a GET request to the `/v2/subscriptions/<subscription-id>` endpoint.


#### 9 Request:

```bash
curl -X GET \
  --url 'http://localhost:1026/v2/subscriptions/5aead3361587e1918de90aba'
```



