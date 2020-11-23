[![FIWARE Core Context Management](https://nexus.lab.fiware.org/static/badges/chapters/core.svg)](https://github.com/FIWARE/catalogue/blob/master/core/README.md)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

**Description:** This tutorial is an introduction to the
[FIWARE Cosmos Orion Flink Connector](http://fiware-cosmos-flink.rtfd.io), which facilitates Big Data analysis of
context data, through an integration with [Apache Flink](https://flink.apache.org/), one of the most popular Big Data
platforms. Apache Flink is a framework and distributed processing engine for stateful computations both over unbounded
and bounded data streams. Flink has been designed to run in all common cluster environments, perform computations at
in-memory speed and at any scale.

The tutorial uses [cUrl](https://ec.haxx.se/) commands throughout, but is also available as
[Postman documentation](https://fiware.github.io/tutorials.Big-Data-Flink/)

[![Run in Postman](https://run.pstmn.io/button.svg)](https://www.getpostman.com/collections/https://app.getpostman.com/run-collection/fb0de86dea21e2073054)

<hr class="core"/>

# Real-time Processing and Big Data Analysis

> "Who controls the past controls the future: who controls the present controls the past."
>
> — George Orwell. "1984"

Smart solutions based on FIWARE are architecturally designed around microservices. They are therefore are designed to
scale-up from simple applications (such as the Supermarket tutorial) through to city-wide installations base on a large
array of IoT sensors and other context data providers.

The massive amount of data involved enventually becomes too much for a single machine to analyse, process and store, and
therefore the work must be delegated to additional distributed services. These distributed systems form the basis of
so-called **Big Data Analysis**. The distribution of tasks allows developers to be able to extract insights from huge
data sets which would be too complex to be dealt with using traditional methods. and uncover hidden patterns and
correlations.

As we have seen, context data is core to any Smart Solution, and the Context Broker is able to monitor changes of state
and raise [subscription events](subscriptions.md) as the context changes. For smaller installations, each subscription
event can be processed one-by-one by a single receiving endpoint, however as the system grows, another technique will be
required to avoid overwhelming the listener, potentially blocking resources and missing updates.

**Apache Flink** is a Java/Scala based stream-processing framework which enables the delegation of data-flow processes.
Therefore additional computational resources can be called upon to deal with data as events arrive. The **Cosmos Flink**
connector allows developers write custom business logic to listen for context data subscription events and then process
the flow of the context data. Flink is able to delegate these actions to other workers where they will be acted upon
either in sequentiallly or in parallel as required. The data flow processing itself can be arbitrarily complex.

Obviously in reality our existing Supermarket scenario is far too small to require the use of a Big Data solution, but
will serve as a basis for demonstrating the type of real-time processing which may be required in a larger solution
which is processing a continuous stream of context-data events.

# Architecture

This application builds on the components and dummy IoT devices created in [previous tutorials](iot-agent.md). It will
make use of three FIWARE components - the [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/), the
[IoT Agent for Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/), and the
[Cosmos Orion Flink Connector](https://fiware-cosmos-flink.readthedocs.io/en/latest/) for connecting Orion to an
[Apache Flink cluster](https://ci.apache.org/projects/flink/flink-docs-stable/concepts/runtime.html). The Flink cluster
itself will consist of a single **JobManager** _master_ to coordinate execution and a single **TaskManager** _worker_ to
execute the tasks.

Both the Orion Context Broker and the IoT Agent rely on open source [MongoDB](https://www.mongodb.com/) technology to
keep persistence of the information they hold. We will also be using the dummy IoT devices created in the
[previous tutorial](iot-agent.md).

Therefore the overall architecture will consist of the following elements:

-   Two **FIWARE Generic Enablers** as independent microservices:
    -   The FIWARE [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests
        using [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
    -   The FIWARE [IoT Agent for Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) which will
        receive northbound measurements from the dummy IoT devices in
        [Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
        format and convert them to [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2) requests for the
        context broker to alter the state of the context entities
-   An [Apache Flink cluster](https://ci.apache.org/projects/flink/flink-docs-stable/concepts/runtime.html) consisting
    of a single **JobManager** and a single **TaskManager**
    -   The FIWARE [Cosmos Orion Flink Connector](https://fiware-cosmos-flink.readthedocs.io/en/latest/) will be
        deployed as part of the dataflow which will subscribe to context changes and make operations on them in
        real-time
-   One [MongoDB](https://www.mongodb.com/) **database** :
    -   Used by the **Orion Context Broker** to hold context data information such as data entities, subscriptions and
        registrations
    -   Used by the **IoT Agent** to hold device information such as device URLs and Keys
-   Three **Context Providers**:
    -   A webserver acting as set of [dummy IoT devices](iot-sensors.md) using the
        [Ultralight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
        protocol running over HTTP.
    -   The **Stock Management Frontend** is not used in this tutorial. It does the following:
        -   Display store information and allow users to interact with the dummy IoT devices
        -   Show which products can be bought at each store
        -   Allow users to "buy" products and reduce the stock count.
    -   The **Context Provider NGSI** proxy is not used in this tutorial. It does the following:
        -   receive requests using [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
        -   makes requests to publicly available data sources using their own APIs in a proprietary format
        -   returns context data back to the Orion Context Broker in
            [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2) format.

The overall architecture can be seen below:

![](https://fiware.github.io/tutorials.Big-Data-Flink/img/architecture.png)

Since all interactions between the elements are initiated by HTTP requests, the entities can be containerized and run
from exposed ports.

The configuration information of the Apache Flink cluster can be seen in the `jobmanager` and `taskmanager` sections of
the associated `docker-compose.yml` file:

<h3>Flink Cluster Configuration</h3>

```yaml
jobmanager:
    image: flink:1.9.0-scala_2.11
    hostname: jobmanager
    container_name: flink-jobmanager
    expose:
        - "8081"
        - "9001"
    ports:
        - "6123:6123"
        - "8081:8081"
        - "9001:9001"
    command: jobmanager
    environment:
        - JOB_MANAGER_RPC_ADDRESS=jobmanager
```

```yaml
taskmanager:
    image: flink:1.9.0-scala_2.11
    hostname: taskmanager
    container_name: flink-taskmanager
    ports:
        - "6121:6121"
        - "6122:6122"
    depends_on:
        - jobmanager
    command: taskmanager
    links:
        - "jobmanager:jobmanager"
    environment:
        - JOB_MANAGER_RPC_ADDRESS=jobmanager
```

The `jobmanager` container is listening on three ports:

-   Port `8081` is exposed so we can see the web frontend of the Apache Flink Dashboard
-   Port `9001` is exposed so that the installation can receive context data subscriptions
-   Port `6123` is the standard **JobManager** RPC port, used for internal communications

The `taskmanager` container is listening on two ports:

-   Ports `6121` and `6122` are used and RPC ports by the **TaskManager**, used for internal communications

The containers within the flink cluster are driven by a single environment variable as shown:

| Key                     | Value        | Description                                                           |
| ----------------------- | ------------ | --------------------------------------------------------------------- |
| JOB_MANAGER_RPC_ADDRESS | `jobmanager` | URL of the _master_ Job Manager which coordinates the task processing |

# Start Up

Before you start, you should ensure that you have obtained or built the necessary Docker images locally. Please clone
the repository and create the necessary images by running the commands shown below. Note that you might need to run some
of the commands as a privileged user:

```bash
git clone https://github.com/FIWARE/tutorials.Big-Data-Flink.git
cd tutorials.Big-Data-Flink
./services create
```

This command will also import seed data from the previous tutorials and provision the dummy IoT sensors on startup.

To start the system, run the following command:

```bash
./services start
```

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

---

# Real-time Processing Operations

Dataflow within **Apache Flink** is defined within the
[Flink documentation](https://ci.apache.org/projects/flink/flink-docs-release-1.9/concepts/programming-model.html) as
follows:

> "The basic building blocks of Flink programs are streams and transformations. Conceptually a stream is a (potentially
> never-ending) flow of data records, and a transformation is an operation that takes one or more streams as input, and
> produces one or more output streams as a result.
>
> When executed, Flink programs are mapped to streaming dataflows, consisting of streams and transformation operators.
> Each dataflow starts with one or more sources and ends in one or more sinks. The dataflows resemble arbitrary directed
> acyclic graphs (DAGs). Although special forms of cycles are permitted via iteration constructs, for the most part this
> can be glossed over this for simplicity."

![](https://fiware.github.io/tutorials.Big-Data-Flink/img/streaming-dataflow.png)

This means that to create a streaming data flow we must supply the following:

-   A mechanism for reading Context data as a **Source Operator**
-   Business logic to define the transform operations
-   A mechanism for pushing Context data back to the context broker as a **Sink Operator**

The `orion-flink.connect.jar` offers both **Source** and **Sink** operations. It therefore only remains to write the
necessary Scala code to connect the streaming dataflow pipeline operations together. The processing code can be complied
into a JAR file which can be uploaded to the flink cluster. Two examples will be detailed below, all the source code for
this tutorial can be found within the
[cosmos-examples](https://github.com/FIWARE/tutorials.Big-Data-Flink/tree/master/cosmos-examples) directory.

Further Flink processing examples can be found on the
[Apache Flink site](https://ci.apache.org/projects/flink/flink-docs-release-1.9/getting-started) and
[Flink Connector Examples](https://fiware-cosmos-flink-examples.readthedocs.io/).

### Compiling a JAR file for Flink

An existing `pom.xml` file has been created which holds the necessary prerequisites to build the examples JAR file

In order to use the Orion Flink Connector we first need to manually install the connector JAR as an artifact using
Maven:

```bash
cd cosmos-examples
mvn install:install-file \
  -Dfile=./orion.flink.connector-1.2.3.jar \
  -DgroupId=org.fiware.cosmos \
  -DartifactId=orion.flink.connector \
  -Dversion=1.2.3 \
  -Dpackaging=jar
```

Thereafter the source code can be compiled by running the `mvn package` command within the same directory:

```bash
cd cosmos-examples
mvn package
```

A new JAR file called `cosmos-examples-1.0.jar` will be created within the `cosmos-examples/target` directory.

<h3>Generating a stream of Context Data</h3>

For the purpose of this tutorial, we must be monitoring a system in which the context is periodically being updated. The
dummy IoT Sensors can be used to do this. Open the device monitor page at `http://localhost:3000/device/monitor` and
unlock a **Smart Door** and switch on a **Smart Lamp**. This can be done by selecting an appropriate the command from
the drop down list and pressing the `send` button. The stream of measurements coming from the devices can then be seen
on the same page:

![](https://fiware.github.io/tutorials.Big-Data-Flink/img/door-open.gif)

## Logger - Reading Context Data Streams

The first example makes use of the `OrionSource` operator in order to receive notifications from the Orion Context
Broker. Specifically, the example counts the number notifications that each type of device sends in one minute. You can
find the source code of the example in
[org/fiware/cosmos/tutorial/Logger.scala](https://github.com/FIWARE/tutorials.Big-Data-Flink/blob/master/cosmos-examples/src/main/scala/org/fiware/cosmos/tutorial/Logger.scala)

### Logger - Installing the JAR

Goto `http://localhost:8081/#/submit`

![](https://fiware.github.io/tutorials.Big-Data-Flink/img/submit-logger.png)

Submit new job

-   **Filename:** `cosmos-examples-1.0.jar`
-   **Entry Class:** `org.fiware.cosmos.tutorial.Logger`

### Logger - Subscribing to context changes

Once a dynamic context system is up and running (execute `Logger`), we need to inform **Flink** of changes in context.

This is done by making a POST request to the `/v2/subscriptions` endpoint of the Orion Context Broker.

-   The `fiware-service` and `fiware-servicepath` headers are used to filter the subscription to only listen to
    measurements from the attached IoT Sensors, since they had been provisioned using these settings

-   The notification `url` must match the one our Flink program is listening to.

#### 1 Request:

```bash
curl -iX POST \
  'http://localhost:1026/v2/subscriptions' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify Flink of all context changes",
  "subject": {
    "entities": [
      {
      "idPattern": ".*"
      }
    ]
  },
  "notification": {
    "http": {
        "url": "http://jobmanager:9001"
    }
  }
}'
```

The response will be `**201 - Created**`

If a subscription has been created, we can check to see if it is firing by making a GET request to the
`/v2/subscriptions` endpoint.

#### 2 Request:

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
        "id": "5d76059d14eda92b0686f255",
        "description": "Notify Flink of all context changes",
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
            "timesSent": 362,
            "lastNotification": "2019-09-09T09:36:33.00Z",
            "attrs": [],
            "attrsFormat": "normalized",
            "http": {
                "url": "http://jobmanager:9001"
            },
            "lastSuccess": "2019-09-09T09:36:33.00Z",
            "lastSuccessCode": 200
        }
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

The `lastSuccess` should match the `lastNotification` date - if this is not the case then **Cosmos** is not receiving
the subscription properly. Check that the hostname and port are correct.

Finally, check that the `status` of the subscription is `active` - an expired subscription will not fire.

### Logger - Checking the Output

Leave the subscription running for **one minute**, then run the following:

```bash
docker logs flink-taskmanager -f --until=60s > stdout.log 2>stderr.log
cat stderr.log
```

After creating the subscription, the output on the console will be like the following:

```text
Sensor(Bell,3)
Sensor(Door,4)
Sensor(Lamp,7)
Sensor(Motion,6)
```

### Logger - Analyzing the Code

```scala
package org.fiware.cosmos.tutorial

import org.apache.flink.streaming.api.scala.{StreamExecutionEnvironment, _}
import org.apache.flink.streaming.api.windowing.time.Time
import org.fiware.cosmos.orion.flink.connector.{OrionSource}


object Logger{

  def main(args: Array[String]): Unit = {

    val env = StreamExecutionEnvironment.getExecutionEnvironment
    // Create Orion Source. Receive notifications on port 9001
    val eventStream = env.addSource(new OrionSource(9001))

    // Process event stream
    val processedDataStream = eventStream
    .flatMap(event => event.entities)
    .map(entity => new Sensor(entity.`type`,1))
    .keyBy("device")
    .timeWindow(Time.seconds(60))
    .sum(1)

    // print the results with a single thread, rather than in parallel
    processedDataStream.print().setParallelism(1)
    env.execute("Socket Window NgsiEvent")
  }
  case class Sensor(device: String, sum: Int)
}
```

The first lines of the program are aimed at importing the necessary dependencies, including the connector. The next step
is to create an instance of the `OrionSource` using the class provided by the connector and to add it to the environment
provided by Flink.

The `OrionSource` constructor accepts a port number (`9001`) as a parameter. This port is used to listen to the
subscription notifications coming from Orion and converted to a `DataStream` of `NgsiEvent` objects. The definition of
these objects can be found within the
[Orion-Flink Connector documentation](https://github.com/ging/fiware-cosmos-orion-flink-connector/blob/master/README.md#orionsource).

The stream processing consists of five separate steps. The first step (`flatMap()`) is performed in order to put
together the entity objects of all the NGSI Events received in a period of time. Thereafter the code iterates over them
(with the `map()` operation) and extracts the desired attributes. In this case, we are interested in the sensor `type`
(`Door`, `Motion`, `Bell` or `Lamp`).

Within each iteration, we create a custom object with the properties we need: the sensor `type` and the increment of
each notification. For this purpose, we can define a case class as shown:

```scala
case class Sensor(device: String, sum: Int)
```

Therefter can group the created objects by the type of device (`keyBy("device")`) and perform operations such as
`timeWindow()` and `sum()` on them.

After the processing, the results are output to the console:

```scala
processedDataStream.printToErr().setParallelism(1)
```

## Feedback Loop - Persisting Context Data

The second example switches on a lamp when its motion sensor detects movement.

The dataflow stream uses the `OrionSource` operator in order to receive notifications and filters the input to only
respond to motion senseors and then uses the `OrionSink` to push processed context back to the Context Broker. You can
find the source code of the example in
[org/fiware/cosmos/tutorial/Feedback.scala](https://github.com/FIWARE/tutorials.Big-Data-Flink/blob/master/cosmos-examples/src/main/scala/org/fiware/cosmos/tutorial/Feedback.scala)

### Feedback Loop - Installing the JAR

Goto `http://localhost:8081/#/job/running`

![](https://fiware.github.io/tutorials.Big-Data-Flink/img/running-jobs.png)

Select the running job (if any) and click on **Cancel Job**

Thereafter goto `http://localhost:8081/#/submit`

![](https://fiware.github.io/tutorials.Big-Data-Flink/img/submit-feedback.png)

Submit new job

-   **Filename:** `cosmos-examples-1.0.jar`
-   **Entry Class:** `org.fiware.cosmos.tutorial.Feedback`

### Feedback Loop - Subscribing to context changes

If the previous example has not been run, a new subscription will need to be set up. A narrower subscription can be set
up to only trigger a notification when a motion sensor detects movement.

> **Note:** If the previous subscription already exists, this step creating a second narrower Motion-only subscription
> is unnecessary. There is a filter within the business logic of the scala task itself.

```bash
curl -iX POST \
  'http://localhost:1026/v2/subscriptions' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Notify Flink of all context changes",
  "subject": {
    "entities": [
      {
        "idPattern": "Motion.*"
      }
    ]
  },
  "notification": {
    "http": {
      "url": "http://taskmanger:9001"
    }
  }
}'
```

### Feedback Loop - Checking the Output

Go to `http://localhost:3000/device/monitor`

Within any Store, unlock the door and wait. Once the door opens and the Motion sensor is triggered, the lamp will switch
on directly

### Feedback Loop - Analyzing the Code

```scala
package org.fiware.cosmos.tutorial


import org.apache.flink.streaming.api.scala.{StreamExecutionEnvironment, _}
import org.apache.flink.streaming.api.windowing.time.Time
import org.fiware.cosmos.orion.flink.connector._


object Feedback{
  final val CONTENT_TYPE = ContentType.Plain
  final val METHOD = HTTPMethod.POST
  final val CONTENT = "{  \"on\": {      \"type\" : \"command\",      \"value\" : \"\"  }}"
  final val HEADERS = Map("fiware-service" -> "openiot","fiware-servicepath" -> "/","Accept" -> "*/*")

  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment
  // Create Orion Source. Receive notifications on port 9001
  val eventStream = env.addSource(new OrionSource(9001))

    // Process event stream
  val processedDataStream = eventStream
      .flatMap(event => event.entities)
      .filter(entity=>(entity.attrs("count").value == "1"))
      .map(entity => new Sensor(entity.id))
      .keyBy("id")
      .timeWindow(Time.seconds(5),Time.seconds(2))
      .min("id")

    // print the results with a single thread, rather than in parallel
  processedDataStream.printToErr().setParallelism(1)

    val sinkStream = processedDataStream.map(node => {
      new OrionSinkObject("urn:ngsi-ld:Lamp"+ node.id.takeRight(3)+ "@on","http://${IP}:3001/iot/lamp"+ node.id.takeRight(3),CONTENT_TYPE,METHOD)
    })
    OrionSink.addSink(sinkStream)
    env.execute("Socket Window NgsiEvent")
  }

  case class Sensor(id: String)
}
```

As you can see, the code is similar to the previous example. The main difference is that it writes the processed data
back in the Context Broker through the **`OrionSink`**.

The arguments of the **`OrionSinkObject`** are as follows:

-   **Message**: `"{ \"on\": { \"type\" : \"command\", \"value\" : \"\" }}"`. We send 'on' command
-   **URL**: `"http://localhost:1026/v2/entities/Lamp:"+node.id.takeRight(3)+"/attrs"`. TakeRight(3) gets the number of
    the room, for example '001')
-   **Content Type**: `ContentType.Plain`.
-   **HTTP Method**: `HTTPMethod.POST`.
-   **Headers**: `Map("fiware-service" -> "openiot","fiware-servicepath" -> "/","Accept" -> "*/*")`. Optional parameter.
    We add the headers we need in the HTTP Request.
