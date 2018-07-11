[![FIWARE Robots](https://img.shields.io/badge/FIWARE-IoT_Robots-5dc0cf.svg)](https://www.fiware.org/developers/catalogue/)

**Description:** This is an Introductory Tutorial to the [Fast-RTPS](https://eprosima-fast-rtps.readthedocs.io) and [Micro-RTPS](http://micro-rtps.readthedocs.io) protocols for RTPS (Real Time Publish Subscribe) as used in robotics and extremely constrained devices.
The enablers of the FIWARE platform are not directly involved at this low level of communication but a complete understanding of the protocols is required before proceeding to connect robotic devices to the FIWARE System.

The tutorial introduces a series of exercises which can be run directly from within a [Docker](https://www.docker.com) container, no HTTP calls are required.

---

# What is Fast-RTPS?

[eProsima](http://www.eprosima.com/) [Fast-RTPS](https://eprosima-fast-rtps.readthedocs.io) is a C++ implementation of the RTPS (Real Time Publish Subscribe) protocol, which provides publisher-subscriber communications over unreliable transports such as UDP, 
as defined and maintained by the Object Management Group (OMG) consortium. RTPS is also the wire interoperability protocol defined for the Data Distribution
Service (DDS) standard, again by the OMG. eProsima Fast RTPS holds the benefit of being standalone and up-to-date, as most vendor solutions either implement RTPS as a tool to implement DDS or use past versions of the specification.

Some of the main features of this library are:

* Configurable best-effort and reliable publish-subscribe communication policies for real-time applications.
* Plug and play connectivity so that any new applications are automatically discovered by any other members of the network.
* Modularity and scalability to allow continuous growth with complex and simple devices in the network.
* Configurable network behavior and interchangeable transport layer: Choose the best protocol and system input/output channel combination for each deployment.
* Two API Layers: a high-level Publisher-Subscriber one focused on usability and a lower-level Writer-Reader one that provides finer access to the inner workings of the RTPS protocol.

eProsima Fast RTPS has been adopted by multiple organizations in many sectors including these important cases:

* Robotics: ROS (Robotic Operating System) as their default middleware for ROS2.
* EU R&D: FIWARE Incubated GE.

# What is Micro-RTPS?

[eProsima](http://www.eprosima.com/) [Micro-RTPS](http://micro-rtps.readthedocs.io) protocols for RTPS (Real Time Publish Subscribe) as used in robotics and extremely constrained devices, which is a software solution that provides publisher-subscriber communication between eXtremely Resource Constrained Environments (XRCEs) and a DDS network. In particular, Micro-RTPS implements a client-server protocol to enable resource-constrained devices (clients) to take part in DDS communications. Micro-RTPS agent (server) enables possible this communication by acting behalf of Micro-RTPS clients and enabling them to take part as DDS publishers and/or subscribers in the DDS Global Data Space.

---

# Start Up

To start the installation, do the following:

```bash
git clone git@github.com:Fiware/tutorials.Fast-RTPS-Micro-RTPS.git

./services create
``` 

>**Note** The initial creation of Docker images can take up to fifteen minutes


Thereafter, all services can be initialized from the command line by running the [services](https://github.com/Fiware/tutorials.Fast-RTPS-Micro-RTPS/blob/master/services) Bash script provided within the repository:

```bash
./services start
``` 

>:information_source: **Note:** If you want to clean up and start over again you can do so with the following command:
>
>```bash
>./services stop
>``` 
>

---

# Introduction to Fast-RTPS

The goal of this section is to provide you with a simple getting started guide on how to install and use Fast-RTPS. 
In the subsequent tutorials we will discuss how Fast-RTPS (and therefore ROS2) can be connected to the Orion Context
Broker using FIROS2.


## Example usage

At this point, you have Fast-RTPS installed in the Docker container environment. We can now run a **Hello World** example. In the example, we will send a set of messages from a publisher to a subscriber using the Fast-RTPS protocol, as shown in the figure. 

![](https://fiware.github.io/tutorials.Fast-RTPS-Micro-RTPS/img/fast-rtps-schema.png)


### Make the examples (1st Terminal)

Open a new terminal and enter the running `examples-fast-rtps` Docker container with:

```bash
docker exec -ti examples-fast-rtps /bin/bash
```

To compile the example, do the usual:

```bash
cmake . 
make 
make install
```

### Start the Fast-RTPS Subscriber (1st Terminal)

First we start a subscriber:

```bash
./HelloWorldExample subscriber
```

#### 1st terminal - Result:

The Fast-RTPS Subscriber has started and is awaiting messages:

```
Starting 
Subscriber running. Please press enter to stop the Subscriber
```


### Start the Fast-RTPS Publisher (2nd Terminal)

Open a **second new terminal** and enter the running `examples-fast-rtps` Docker container with:

```bash
docker exec -ti examples-fast-rtps /bin/bash
```

Then we start the publisher in this second terminal:

```bash
./HelloWorldExample publisher
```

The messages should be automatically sent by the publisher and received by the subscriber. If everything is OK, in your publisher and subscriber terminals respectively you should see something like:


#### 1st terminal - Result:

The Fast-RTPS Subscriber has received a series of messages:

```
Subscriber matched
Message HelloWorld 1 RECEIVED
Message HelloWorld 2 RECEIVED
Message HelloWorld 3 RECEIVED
Message HelloWorld 4 RECEIVED
Message HelloWorld 5 RECEIVED
Message HelloWorld 6 RECEIVED
Message HelloWorld 7 RECEIVED
Message HelloWorld 8 RECEIVED
Message HelloWorld 9 RECEIVED
Message HelloWorld 10 RECEIVED
Subscriber unmatched
```

#### 2nd terminal - Result:

The Fast-RTPS Publisher sends a series of messages:

```
Starting 
Publisher matched
Message: HelloWorld with index: 1 SENT
Message: HelloWorld with index: 2 SENT
Message: HelloWorld with index: 3 SENT
Message: HelloWorld with index: 4 SENT
Message: HelloWorld with index: 5 SENT
Message: HelloWorld with index: 6 SENT
Message: HelloWorld with index: 7 SENT
Message: HelloWorld with index: 8 SENT
Message: HelloWorld with index: 9 SENT
Message: HelloWorld with index: 10 SENT
```


You can stop the Fast-RTPS Subscriber in the 1st terminal by pressing `<enter>`

To leave the containers and end interactive mode, run the following in each terminal.

```bash
exit
```
 You will then return to the command line.

Other examples are available in the `examples` folder, which are beyond the scope of this tutorial. For more information, please refer to the [official Fast-RTPS documentation](http://eprosima-fast-rtps.readthedocs.io/en/latest/).

# Introduction to Micro-RTPS

The goal of this section is to provide you with a simple getting started guide on how to install and use Micro-RTPS. 


## Example usage

At this point, you have Micro-RTPS installed in the Docker container environment. We can now run a **Hello World** example. In the example, we will send a set of messages from a Micro-RTPS publisher to a Micro-RTPS subscriber through a Micro-RTPS agent, as shown in the figure. 

![](https://fiware.github.io/tutorials.Fast-RTPS-Micro-RTPS/img/micro-rtps-schema.png)


### Start the Micro-RTPS Agent (1st Terminal)

Open a new terminal and enter the running `examples-micro-rtps` Docker container with:

```bash
docker exec -ti examples-micro-rtps /bin/bash
```

We first have to start the Micro-RTPS agent which will received messages sent by the Micro-RTPS publisher and forward them to the subscriber. In order to do that, execute the following commands, which will result in the Micro-RTPS agent being started on UDP port `2018`:

```bash
cd /usr/local/bin
MicroRTPSAgent udp 2018
```

#### 1st terminal - Result:

The Micro-RTPS Agent is up and running

```
UDP agent initialization... OK
Running DDS-XRCE Agent...
```


Now we will need two more terminals in our Docker environment. In one of the terminals, we will start the Micro-RTPS publisher, while in the other we will start the subscriber. To open second and third terminals, open two bash terminals and in both of them run the following:

### Start the Micro-RTPS Subscriber (2nd Terminal)

Open a **second new terminal** and enter the running `examples-micro-rtps` Docker container with:

```bash
docker exec -ti examples-micro-rtps /bin/bash
```

We start a subscriber as shown:

```bash
cd /usr/local/examples/micrortps/SubscribeHelloWorldClient/bin/
./SubscribeHelloWorldClient udp 127.0.0.1 2018
```

#### 2nd terminal - Result:

The Micro-RTPS Subscriber is running and awaiting messages

```
<< UDP mode => ip: 127.0.0.1 - port: 2018 >>
```

### Start the Micro-RTPS Publisher (3rd Terminal)

Open a **third new terminal** and enter the running `examples-micro-rtps` Docker container with:

```bash
docker exec -ti examples-micro-rtps /bin/bash
```

Then we start the publisher in the third terminal:

```bash
cd /usr/local/examples/micrortps/PublishHelloWorldClient/bin/
./PublishHelloWorldClient udp 127.0.0.1 2018
```

The messages should be automatically sent by the publisher and received by the subscriber. If everything is OK, in your publisher and subscriber terminals respectively you should see something like:


#### 1st terminal - Result:

The Micro-RTPS Agent has started receiving messages from the Publisher

```
UDP agent initialization... OK
Running DDS-XRCE Agent...
RTPS Publisher matched
...
```

#### 2nd terminal - Result:

The Micro-RTPS Subscriber has received the messages passed on by the Micro-RTPS Agent 

```
<< UDP mode => ip: 127.0.0.1 - port: 2018 >>
Receive topic: Hello DDS world!, count: 1
Receive topic: Hello DDS world!, count: 2
Receive topic: Hello DDS world!, count: 3
Receive topic: Hello DDS world!, count: 4
Receive topic: Hello DDS world!, count: 5
Receive topic: Hello DDS world!, count: 6
Receive topic: Hello DDS world!, count: 7
Receive topic: Hello DDS world!, count: 8
...
```

#### 3rd terminal - Result:

The Micro-RTPS Publisher has sent a series of messages as shown:

```
<< UDP mode => ip: 127.0.0.1 - port: 2018 >>
Send topic: Hello DDS world!, count: 1
Send topic: Hello DDS world!, count: 2
Send topic: Hello DDS world!, count: 3
Send topic: Hello DDS world!, count: 4
Send topic: Hello DDS world!, count: 5
Send topic: Hello DDS world!, count: 6
Send topic: Hello DDS world!, count: 7
Send topic: Hello DDS world!, count: 8
...
```




To leave the containers and end interactive mode, run the following:

```bash
exit
```

 You will then return to the command line.



Other examples are available in the _examples_ folder, which are beyond the scope of this tutorial. For more information, please refer to the [official Micro-RTPS documentation](http://micro-rtps.readthedocs.io/en/latest/).







