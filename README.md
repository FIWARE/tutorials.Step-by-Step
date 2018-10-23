# FIWARE Step-by-Step Tutorials

[![FIWARE Documentation](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/documentation.svg)](https://fiware-tutorials.rtfd.io)
[![License: MIT](https://img.shields.io/github/license/fiware/tutorials.Step-by-Step.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/readthedocs/fiware-tutorials.svg)](https://fiware-tutorials.rtfd.io)
[![Docker](https://img.shields.io/docker/pulls/fiware/tutorials.context-provider.svg)](https://hub.docker.com/r/fiware/tutorials.context-provider/)

This is a collection of tutorials for the FIWARE platform. Each tutorial consists of a series
of exercises to demonstrate the correct use of individual FIWARE components and shows the flow of context
data within a simple Smart Solution either by connecting to a series of dummy IoT devices or manipulating
the context directly or programmatically.


## Install

To download the full set of tutorials, simply clone this repository:

```console
git clone https://github.com/Fiware/tutorials.Step-by-Step.git
cd tutorials.Step-by-Step/
git submodule update --init --recursive
```

### Docker and Docker Compose

Each tutorial runs all components using [Docker](https://www.docker.com). **Docker** is a container technology which allows to different components isolated into their respective environments.

* To install Docker on Windows follow the instructions [here](https://docs.docker.com/docker-for-windows/)
* To install Docker on Mac follow the instructions [here](https://docs.docker.com/docker-for-mac/)
* To install Docker on Linux follow the instructions [here](https://docs.docker.com/install/)

**Docker Compose** is a tool for defining and running multi-container Docker applications. A  series of `*.yaml`
files are used configure the required services for the application. This means all container services can be
brought up in a single command. Docker Compose is installed by default as part of Docker for Windows and
Docker for Mac, however Linux users will need to follow the instructions found [here](https://docs.docker.com/compose/install/)

You can check your current **Docker** and **Docker Compose** versions using the following commands:

```console
docker-compose -v
docker version
```

Please ensure that you are using Docker version 18.03 or higher and Docker Compose 1.21 or higher and upgrade if necessary.


### Postman

The tutorials which use HTTP requests supply a collection for use with the Postman utility. Postman is a testing
framework for REST APIs. The tool can be downloaded from www.getpostman.com.

### Cygwin for Windows

We will start up our services using a simple Bash script. Windows users should download [cygwin](http://www.cygwin.com/) to provide a command line functionality similar to a Linux distribution on Windows.



## Usage

Most tutorials supply a `services` script to start the containers:

```console
cd <tutorial-name>
./services start
```

### Following the tutorial exercises via Postman

Each tutorial submodule contains one or more `docker-compose.yml` files, along with a Postman collection
containing the necessary HTTP requests: import the collection into Postman and follow the instructions.

### Following the tutorial exercises from the Command line

Each submodule contains full instructions in README which details the  appropriate bash commands
(cUrl and Docker Compose) to run.

Full instructions can be found within the [documentation](https://fiware-tutorials.rtfd.io)

---

## License

[MIT](LICENSE) © FIWARE Foundation e.V.
