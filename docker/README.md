# FIWARE Step-by-Step Tutorials Context Provider

[![Documentation](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/documentation.svg)](https://fiware-tutorials.rtfd.io)
[![Docker](https://img.shields.io/docker/pulls/fiware/tutorials.context-provider.svg)](https://hub.docker.com/r/fiware/tutorials.context-provider/)
[![Support badge](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/fiware.svg)](https://stackoverflow.com/questions/tagged/fiware)

Simple nodejs express application for use with the FIWARE Step-by-Step
tutorials. Each tutorial consists of a series of exercises to demonstrate the
correct use of individual FIWARE components and shows the flow of context data
within a simple Smart Solution either by connecting to a series of dummy IoT
devices or manipulating the context directly or programmatically.

This application provides various sources of context and demonstrates various
aspects of FIWARE To run the application in debug mode add `DEBUG=tutorial:*`

## Store Application

-   `WEB_APP_PORT=3000` # Port used by the content provider proxy and web-app
    for viewing
-   `CONTEXT_BROKER=http://orion:1026/v2` - URL of the context broker to update
    context
-   `NGSI_LD_PREFIX=` - Whether to use full URNs for devices
-   `SECURE_ENDPOINTS=true` - Enable Keyrock as PDP - default is `false`

## Dummy Ultralight Devices

-   `IOTA_HTTP_HOST=iot-agent` - The URL of the IoT Agent
-   `IOTA_HTTP_PORT=7896` - Port used by the dummy IoT devices to commuicate
    with the IoT Agent
-   `DUMMY_DEVICES_PORT=3001` - Port used by the dummy IoT devices to receive
    commands
-   `DUMMY_DEVICES_TRANSPORT=HTTP` - Default transport used by dummy IoT devices
    (either `HTTP` or `MQTT`)
-   `DUMMY_DEVICES_API_KEY=4jggokgpepnvsb2uv4s40d59ov` - Device API Key.

## Identity Management - Keyrock

-   `KEYROCK_URL=http://localhost` - URL for Keyrock IDM
-   `KEYROCK_IP_ADDRESS=http://172.18.1.5` - IP address for Keyrock IDM
-   `KEYROCK_PORT=3005` - Port that Keyrock is listening on
-   `KEYROCK_CLIENT_ID=tutorial-dckr-site-0000-xpresswebapp` - Client ID for the
    appliction within keyrock
-   `KEYROCK_CLIENT_SECRET=tutorial-dckr-site-0000-clientsecret` - Client secret
    for the appliction within keyrock

## How to build your own image

The [Dockerfile](https://github.com/fiware/tutorials.Step-by-Step/blob/master/docker/Dockerfile)
associated with this image can be used to build an image in several ways:

* By default, the `Dockerfile` retrieves the **latest** version of the codebase direct
from GitHub (the `build-arg` is optional):

```console
docker build -t fiware/tutorials.Step-by-Step . --build-arg DOWNLOAD=latest
```

* You can alter this to obtain the last **stable** release run this `Dockerfile` with the build
  argument `DOWNLOAD=stable`

```console
docker build -t fiware/tutorials.Step-by-Step . --build-arg DOWNLOAD=stable
```

* You can also download a specific release by running this `Dockerfile` with the build
  argument `DOWNLOAD=<version>`

```console
docker build -t fiware/tutorials.Step-by-Step . --build-arg DOWNLOAD=1.7.0
```

* To download code from your own fork of the GitHub repository add the `GITHUB_ACCOUNT`
  and `GITHUB_REPOSITORY` arguments to the `docker build` command.

```console
docker build -t fiware/tutorials.Step-by-Step . --build-arg GITHUB_ACCOUNT=<your account> --build-arg GITHUB_REPOSITORY=<your repo>
```

Alternatively, if you want to build directly from your own sources, please copy the existing
`Dockerfile` into file the root of the repository and amend it to copy over your local source using :

```Dockerfile
COPY context-provider /usr/src/app
```

Full instructions can be found within the `Dockerfile` itself.
