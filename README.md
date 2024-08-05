# Step-by-Step Tutorials[<img src="/img/logo.png" align="left" width="162">](https://www.fiware.org/)

[![License: MIT](https://img.shields.io/github/license/fiware/tutorials.Step-by-Step.svg)](https://opensource.org/licenses/MIT)
[![Support badge](https://img.shields.io/badge/tag-fiware-orange.svg?logo=stackoverflow)](https://stackoverflow.com/questions/tagged/fiware)

This is an umbrella repository which holds collections of  **NGSI-v2** and **NGSI-LD** tutorials for developers wishing to 
learn about the [FIWARE](https://www.fiware.org/) ecosystem and allow users and developers to easily navigate to the relevant 
source code, documentation and Docker images.

<!--- GLOBAL SUMMIT BANNER AD
| <a href="https://www.fiware.org/global-summit/"><img src="https://fiware.github.io//catalogue/img/Summit23.png" width="240" height="70" /></a> | <a href="https://www.eventbrite.com/e/fiware-on-site-training-tickets-591474775977"><img src="https://fiware.github.io//catalogue/img/Training23.png" width="240" height="70" /></a> |
| --- | --- |
--->

---

> [!NOTE]
>  ### Should I be using NGSI-v2 or NGSI-LD?
> 
>  FIWARE offers two flavours of the NGSI interfaces:
>
>  -  **NGSI-v2** offers JSON based interoperability used in individual Smart Systems
>  -  **NGSI-LD** offers JSON-LD based interoperability used for Federations and Data Spaces
>
>  NGSI-v2 is ideal for creating individual applications offering interoperable interfaces for web services or IoT devices. It is easier to understand than NGSI-LD and does not require a [JSON-LD
`@context`](https://www.w3.org/TR/json-ld11/#the-context).
>
>  However, NGSI-LD and Linked Data is necessary when creating a data space or introducing a system of systems aproach, and in situations requiring
>  interoperability across apps and organisations.

---

## [<img src="https://img.shields.io/badge/NGSI-v2-5dc0cf.svg" width="90"  align="left" />]("https://fiware-ges.github.io/orion/api/v2/stable/) Smart Supermarket

This is a collection of tutorials for the FIWARE ecosystem designed for **NGSI-v2** developers. Each tutorial,  based around a 
Smart Supermarket  consists of a series of exercises to demonstrate the correct use of individual FIWARE components using **NGSI-v2**
interfaces and shows the flow of context data within a simple Smart Solution either by connecting to a series of dummy IoT devices 
or manipulating the context directly or programmatically.

| :movie_camera: [Introduction<br>to NGSI-v2](https://www.youtube.com/watch?v=pK4GgYjlmdY)| :books: [NGSI-v2 Tutorial<br>Documentation](https://fiware-tutorials.rtfd.io) | 
| -------------------------------------------------------------------- | --- |


🇯🇵 このチュートリアルは[日本語](https://fiware-tutorials.letsfiware.jp/)でもご覧いただけます。<br/>

## [<img src="https://img.shields.io/badge/NGSI-LD-d6604d.svg" width="90"  align="left" />]("https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.03.01_60/gs_cim009v010301p.pdf) Smart Farm

This is a collection of tutorials for the FIWARE ecosystem designed for **NGSI-LD** developers. Linked data concepts are explained
using the entities from a Smart Farm. Each tutorial then demonstrates the correct use of individual FIWARE components via the **NGSI-LD**
interface and shows the flow of context data within a simple Smart Solution either by connecting to a series of dummy IoT devices or 
manipulating the context directly or programmatically.

| :movie_camera: [Introduction<br>to Linked Data](https://www.youtube.com/watch?v=4x_xzT5eF5Q) |  :movie_camera: [Introduction<br>to NGSI-LD](https://www.youtube.com/watch?v=rZ13IyLpAtA) | :books: [NGSI-LD Tutorial<br>Documentation](https://ngsi-ld-tutorials.rtfd.io/) | 
|---| ---------------------------------------------------------------------- | --- |

---

## Install

To download the full set of tutorials, simply clone this repository:

```console
git clone https://github.com/FIWARE/tutorials.Step-by-Step.git
cd tutorials.Step-by-Step/
git submodule update --init --recursive
```

The **NGSI-v2** and **NGSI-LD** tutorials are then available under the `NGSI-v2` and `NGSI-LD` directories respectively.

### Docker and Docker Compose <img src="https://www.docker.com/favicon.ico" align="left"  height="30" width="30">

Each tutorial runs all components using [Docker](https://www.docker.com). **Docker** is a container technology which
allows to different components isolated into their respective environments.

-   To install Docker on Windows follow the instructions [here](https://docs.docker.com/docker-for-windows/)
-   To install Docker on Mac follow the instructions [here](https://docs.docker.com/docker-for-mac/)
-   To install Docker on Linux follow the instructions [here](https://docs.docker.com/install/)

**Docker Compose** is a tool for defining and running multi-container Docker applications. A series of `*.yaml` files
are used configure the required services for the application. This means all container services can be brought up in a
single command. Docker Compose is installed by default as part of Docker for Windows and Docker for Mac, however Linux
users will need to follow the instructions found [here](https://docs.docker.com/compose/install/)

You can check your current **Docker** and **Docker Compose** versions using the following commands:

```console
docker-compose -v
docker version
```

Please ensure that you are using Docker version 24.0.x or higher and Docker Compose 2.24.x or higher and upgrade if
necessary.

### Postman <img src="https://raw.githubusercontent.com/FIWARE/tutorials.Step-by-Step/master/img/postman.svg" align="left"  height="30" width="30">

The tutorials which use HTTP requests supply a collection for use with the Postman utility. Postman is a testing
framework for REST APIs. The tool can be downloaded from [www.getpostman.com](https://www.postman.com/downloads/). All the FIWARE
Postman collections can downloaded directly from the
[Postman API network](https://explore.postman.com/team/3mM5EY6ChBYp9D)


### Apache Maven <img src="https://maven.apache.org/favicon.ico" align="left"  height="30" width="30" style="border-right-style:solid; border-right-width:10px; border-color:transparent; background: transparent">

[Apache Maven](https://maven.apache.org/download.cgi) is a software project management and comprehension tool. Based on
the concept of a project object model (POM), Maven can manage a project's build, reporting and documentation from a
central piece of information. Maven can be used to define and download our dependencies and to build and package Java or
Scala code into a JAR file.

### Windows Subsystem for Linux

We will start up our services using a simple bash script. Windows users should download the
[Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/install) to provide a command-line
functionality similar to a Linux distribution on Windows.

---

## License

[MIT](LICENSE) © 2018-2024 FIWARE Foundation e.V.
