# FIWARE Step-by-Step

[![Documentation](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/documentation.svg)](https://fiware-tutorials.rtfd.io)
[![Support badge](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/fiware.svg)](https://stackoverflow.com/questions/tagged/fiware)

This is a collection of tutorials for the FIWARE system. Each tutorial consists of a series of exercises to demonstrate
the correct use of individual FIWARE components and shows the flow of context data within a simple Smart Solution either
by connecting to a series of dummy IoT devices or manipulating the context directly or programmatically.

<h3>How to Use</h3>

Each tutorial is a self contained learning exercise designed to teach the developer about a single aspect of FIWARE. A
summary of the goal of the tutorial can be found in the description at the head of each page. Every tutorial is
associated with a GitHub repository holding the configuration files needed to run the examples. Most of the tutorials
build upon concepts or enablers described in previous exercises the to create a complex smart solution which is
_"powered by FIWARE"_.

The tutorials are split according to the chapters defined within the
[FIWARE catalog](https://www.fiware.org/developers/catalogue/) and are numbered in order of difficulty within each
chapter hence the an introduction to a given enabler will occur before the full capabilities of that element are
explored in more depth.

It is recommended to start with reading the full **Core Context Management: Fundamentals** Chapter before moving on to
other subjects, as this will give you an fuller understanding of the role of context data in general. However it is not
necessary to follow all the subsequent tutorials sequentially - as FIWARE is a modular system, you can choose which
enablers are of interest to you.

## Prerequisites

### Docker and Docker Compose

To keep things simple all components will be run using [Docker](https://www.docker.com). **Docker** is a container
technology which allows to different components isolated into their respective environments.

-   To install Docker on Windows follow the instructions [here](https://docs.docker.com/docker-for-windows/)
-   To install Docker on Mac follow the instructions [here](https://docs.docker.com/docker-for-mac/)
-   To install Docker on Linux follow the instructions [here](https://docs.docker.com/install/)

**Docker Compose** is a tool for defining and running multi-container Docker applications. A series of `*.yaml` files
are used configure the required services for the application. This means all container services can be brought up in a
single command. Docker Compose is installed by default as part of Docker for Windows and Docker for Mac, however Linux
users will need to follow the instructions found [here](https://docs.docker.com/compose/install/)

You can check your current **Docker** and **Docker Compose** versions using the following commands:

```bash
docker-compose -v
docker version
```

Please ensure that you are using Docker version 18.03 or higher and Docker Compose 1.21 or higher and upgrade if
necessary.

If using a linux distro with an outdated docker-compose, the files can be installed directly as shown:

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Cygwin for Windows

We will start up our services using a simple Bash script. Windows users should download [cygwin](http://www.cygwin.com/)
to provide a command-line functionality similar to a Linux distribution on Windows.

## List of Tutorials

<h3 style="box-shadow: 0px 4px 0px 0px #233c68;">Core Context Managment: Fundamentals</h3>

These first tutorials are an introduction to the FIWARE Context Broker, and are an essential first step when learning to
use FIWARE

&nbsp; 101. [Getting Started](getting-started.md)<br/> &nbsp; 102. [Entity Relationships](entity-relationships.md)<br/>
&nbsp; 103. [CRUD Operations](crud-operations.md)<br/> &nbsp; 104. [Context Providers](context-providers.md)<br/>
&nbsp; 105. [Altering the Context Programmatically](accessing-context.md)<br/> &nbsp; 106.
[Subscribing to Changes in Context](subscriptions.md)<br/>

<h3 style="box-shadow: 0px 4px 0px 0px #5dc0cf;">Internet of Things, Robots and third-party systems</h3>

In order to make a context-based system aware of the state of the real world, it will need to access information from
Robots, IoT Sensors or other suppliers of context data such as social media. It is also possible to generate commands
from the context broker to alter the state of real-world objects themselves.

&nbsp; 201. [Introduction to IoT Sensors](iot-sensors.md)<br/> &nbsp; 202.
[Provisioning an IoT Agent](iot-agent.md)<br/> &nbsp; 203. [IoT over MQTT](iot-over-mqtt.md)<br/> &nbsp; 250.
[Introduction to Fast-RTPS and Micro-RTPS](fast-rtps-micro-rtps.md)<br/>

<h3 style="box-shadow: 0px 4px 0px 0px #233c68;">Core Context Management: History Management</h3>

These tutorials show how to manipulate and store context data so it can be used for further processesing

&nbsp; 301. [Persisting Context Data using Apache Flume (MongoDB, MySQL, PostgreSQL)](historic-context-flume.md)<br/>
&nbsp; 302. [Persisting Context Data using Apache NIFI (MongoDB, MySQL, PostgreSQL)](historic-context-nifi.md)<br/>
&nbsp; 303. [Querying Time Series Data (MongoDB)](short-term-history.md)<br/> &nbsp; 304.
[Querying Time Series Data (Crate-DB)](time-series-data.md)<br/>

<h3 style="box-shadow: 0px 4px 0px 0px #ff7059;">Security: Identity Management</h3>

These tutorials show how to create and administer users within an application, and how to restrict access to assets, by
assigning roles and permissions.

&nbsp; 401. [Administrating Users and Organizations](identity-management.md)<br/> &nbsp; 402.
[Managing Roles and Permissions](roles-permissions.md)<br/> &nbsp; 403.
[Securing Application Access](securing-access.md)<br/> &nbsp; 404.
[Securing Microservices with a PEP Proxy](pep-proxy.md)<br/> &nbsp; 405.
[XACML Rules-based Permissions](xacml-access-rules.md)<br/> &nbsp; 406.
[Administrating XACML via a PAP](administrating-xacml.md)<br/>

<h3 style="box-shadow: 0px 4px 0px 0px #88a1ce;">Processing, Analysis and Visualization</h3>

These tutorials show how to create, process, analyze or visualize context information

&nbsp; 501. [Creating Application Mashups](application-mashups.md)<br/> &nbsp; 503.
[Introduction to Media Streams](media-streams.md)<br/>

<h3 style="box-shadow: 0px 4px 0px 0px #233c68;">Core Context Management: Linked Data</h3>

These tutorials show how to create, process, analyze or visualize context information

&nbsp; 601. [Introduction to Linked Data](linked-data.md)<br/> &nbsp; 602.
[Linked Data Relationships and Data Models](relationships-linked-data.md)<br/>
