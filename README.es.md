# FIWARE Step-by-Step Tutorials

[![Documentation](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/documentation.svg)](https://fiware-tutorials.rtfd.io)
[![License: MIT](https://img.shields.io/github/license/fiware/tutorials.Step-by-Step.svg)](https://opensource.org/licenses/MIT)
[![Support badge](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/fiware.svg)](https://stackoverflow.com/questions/tagged/fiware)
[![Docker](https://img.shields.io/docker/pulls/fiware/tutorials.context-provider.svg)](https://hub.docker.com/r/fiware/tutorials.context-provider/)
[<img src="https://raw.githubusercontent.com/FIWARE/tutorials.Step-by-Step/master/docs/img/logo.png" align="right" width="162">](https://www.fiware.org/)<br/>
[![Documentation](https://img.shields.io/readthedocs/fiware-tutorials.svg)](https://fiware-tutorials.rtfd.io)
[![Build Status](https://img.shields.io/travis/FIWARE/tutorials.Step-by-Step.svg)](https://travis-ci.org/FIWARE/tutorials.Step-by-Step)

> [![FIWARE Zone logo](https://raw.githubusercontent.com/FIWAREZone/misc/master/Group%400%2C2x.png)](www.fiware.zone)
>
> Este tutorial ha sido traducido por **FIWARE ZONE**, una iniciativa sin ánimo de lucro entre **Telefónica** y la **Junta de Andalucía** cuyo fin es la divulgación, promoción y difusión de la tecnología *FIWARE*, para hacer crecer el ecosistema y generar conocimiento y oportunidades a los desarrolladores y empresas andaluzas. **FIWARE ZONE**, como *iHub* de 3 estrellas ofrece servicios de alto nivel en formación, mentorización y consultoría de forma totalmente **gratuita**. Si necesitas cualquier tipo de ayuda o quieres contarnos tu proyecto, puedes ponerte en contacto con nostros a través de la direción [fiware.zone@fiware.zone](mailto:fiware.zone@fiware.zone), por nuestro [formulario web](https://fiware.zone/contacto/), en cualquiera de nuestras redes sociales o físicamente en [nuestros centros en Málaga y Sevilla](https://fiware.zone/contacto/)
>
>![3 stars iHub](https://badgen.net/badge/iHub/3%20stars/yellow)
>
>[![Twitter](https://raw.githubusercontent.com/FIWAREZone/misc/master/twitter.png)](https://twitter.com/FIWAREZone) [![Linkedin](https://raw.githubusercontent.com/FIWAREZone/misc/master/linkedin.png)](https://www.linkedin.com/company/fiware-zone) [![Instagram](https://raw.githubusercontent.com/FIWAREZone/misc/master/instagram.png)](https://www.instagram.com/fiwarezone/) [![Github](https://raw.githubusercontent.com/FIWAREZone/misc/master/github.png)](https://github.com/FIWAREZone) [![Facebook](https://raw.githubusercontent.com/FIWAREZone/misc/master/facebook.png)](https://www.facebook.com/FIWAREZone/)

Esto es una colección de tutoriales para la plataforma FIWARE. Cada tutorial consiste en una serie de ejercicios para demostrar el correcto
uso de componentes FIWARE individualmente, y mostrar el flujo del contexto con una solución Smart simple ya sea conectándose a una serie de 
dispositivos de IoT simulados o manipulando el contexto directamente mediante algun código.

| :books: [Documentation](https://fiware-tutorials.rtfd.io) | :whale: [Docker Hub](https://hub.docker.com/r/fiware/tutorials.context-provider/) | <img src="https://json-ld.org/favicon.ico" align="center" height="25"> [NGSI-LD Data Models](https://fiware.github.io/tutorials.Step-by-Step/schema/) | <img src="https://assets.getpostman.com/common-share/postman-logo-stacked.svg" align="center" height="25"> [Postman Collections](https://explore.postman.com/team/3mM5EY6ChBYp9D) |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## Instalación

Para descargar el catalogo completo de tutoriales, basta con clonar este respositorio:

```console
git clone https://github.com/FIWARE/tutorials.Step-by-Step.git
cd tutorials.Step-by-Step/
git submodule update --init --recursive
```

### Docker y Docker Compose <img src="https://www.docker.com/favicon.ico" align="left"  height="30" width="30">

Cada tutorial ejecuta todos los componentes empleando [Docker](https://www.docker.com). **Docker** **Docker** es una tecnología de contenedores que 
permite aislar diferentes componentes en sus respectivos entornos.

-  Para instalar Docker en Windows siga las instrucciones [aquí](https://docs.docker.com/docker-for-windows/)
-  Para instalar Docker en Mac siga las instrucciones [aquí](https://docs.docker.com/docker-for-mac/)
-  Para instalar Docker en Linux siga las instrucciones [aquí](https://docs.docker.com/install/)

**Docker Compose** es una herramienta para definir y ejecutar aplicaciones Docker multi-contenedor. A
Se utiliza el [archivo YAML](https://raw.githubusercontent.com/Fiware/tutorials.Getting-Started/master/docker-compose.yml) para configurar los 
servicios requeridos para la aplicación. Esto significa que todos los servicios de los contenedores pueden ser lanzados en un solo comando. 
Docker Compose se instala de forma predeterminada como parte de Docker para Windows y Docker para Mac, sin embargo los usuarios de Linux
tendrá que seguir las instrucciones que se encuentran [aquí](https://docs.docker.com/compose/install/)

Puede comprobar sus versiones actuales de **Docker** y **Docker Compose** usando los siguientes comandos:

```console
docker-compose -v
docker version
```

Por favor, asegúrese de que está utilizando la versión 18.03 o superior de Docker y la versión 1.21 o superior de Docker Compose y 
actualícela si es necesario.

### Postman <img src="https://www.getpostman.com/favicon.ico" align="left"  height="30" width="30">

Los tutoriales que usan peticciones HTTP proveen de una colección para utilizar con la utilidad Postman. Postman es una utilidad de 
pruebas para APIs REST. La herrmienta se puede descargar desde [www.getpostman.com](www.getpostman.com). Todas las colecciones FIWARE de
Postman se pueden descargar directamente desde [Postman API network](https://explore.postman.com/team/3mM5EY6ChBYp9D)

### Cygwin para Windows <img src="https://www.cygwin.com/favicon.ico" align="left"  height="30" width="30">

En los tutoriales se inician los servicios empleando un script de Bash. Los usuarios de windows deben descargar [cygwin](http://www.cygwin.com/)
para proveer de una línea de comandos similar a las de las distribuciones Linux en Windows.

## Lista de tutoriales

&nbsp; 101. [Getting Started](https://github.com/FIWARE/tutorials.Getting-Started)<br/> &nbsp; 102.
[Entity Relationships](https://github.com/FIWARE/tutorials.Entity-Relationships)<br/> &nbsp; 103.
[CRUD Operations](https://github.com/FIWARE/tutorials.CRUD-Operations)<br/> &nbsp; 104.
[Context Providers](https://github.com/FIWARE/tutorials.Context-Providers)<br/> &nbsp; 105.
[Altering the Context Programmatically](https://github.com/FIWARE/tutorials.Accessing-Context)<br/> &nbsp; 106.
[Subscribing to Changes in Context](https://github.com/FIWARE/tutorials.Subscriptions)<br/>

&nbsp; 201. [Introduction to IoT Sensors](https://github.com/FIWARE/tutorials.IoT-Sensors)<br/> &nbsp; 202.
[Provisioning an IoT Agent](https://github.com/FIWARE/tutorials.IoT-Agent)<br/> &nbsp; 203.
[IoT over MQTT](https://github.com/FIWARE/tutorials.IoT-over-MQTT)<br/> &nbsp; 204.
[Using an alternative IoT Agent](https://github.com/FIWARE/tutorials.IoT-Agent-JSON)<br/> &nbsp; 205.
[Creating a Custom IoT Agent](https://github.com/FIWARE/tutorials.Custom-IoT-Agent)<br/> &nbsp; 250.
[Introduction to Fast-RTPS and Micro-RTPS](https://github.com/FIWARE/tutorials.Fast-RTPS-Micro-RTPS)<br/>

&nbsp; 301.
[Persisting Context Data using Apache Flume (MongoDB, MySQL, PostgreSQL)](https://github.com/FIWARE/tutorials.Historic-Context-Flume)<br/>
&nbsp; 302.
[Persisting Context Data using Apache NIFI (MongoDB, MySQL, PostgreSQL)](https://github.com/FIWARE/tutorials.Historic-Context-NIFI)<br/>
&nbsp; 303. [Querying Time Series Data (MongoDB)](https://github.com/FIWARE/tutorials.Short-Term-History)<br/>
&nbsp; 304. [Querying Time Series Data (CrateDB)](https://github.com/FIWARE/tutorials.Time-Series-Data)<br/> &nbsp;

&nbsp; 401. [Managing Users and Organizations](https://github.com/FIWARE/tutorials.Identity-Management)<br/> &nbsp; 402.
[Roles and Permissions](https://github.com/FIWARE/tutorials.Roles-Permissions)<br/> &nbsp; 403.
[Securing Application Access](https://github.com/FIWARE/tutorials.Securing-Access)<br/> &nbsp; 404.
[Securing Microservices with a PEP Proxy](https://github.com/FIWARE/tutorials.PEP-Proxy)<br/> &nbsp; 405.
[XACML Rules-based Permissions](https://github.com/FIWARE/tutorials.XACML-Access-Rules)<br/> &nbsp; 406.
[Administrating XACML via a PAP](https://github.com/FIWARE/tutorials.Administrating-XACML)<br/>

&nbsp; 501. [Creating Application Mashups](https://github.com/FIWARE/tutorials.Application-Mashup)<br/> &nbsp; 503.
[Introduction to Media Streams](https://github.com/FIWARE/tutorials.Media-Streams)<br/> &nbsp; 505.
[Big Data Analysis (Flink)](https://github.com/FIWARE/tutorials.Big-Data-Analysis)<br/>

&nbsp; 601. [Introduction to Linked Data](https://github.com/FIWARE/tutorials.Linked-Data)<br/> &nbsp; 602.
[Linked Data Relationships and Data Models](https://github.com/FIWARE/tutorials.Relationships-Linked-Data)<br/>
&nbsp; 603. [Traversing Linked Data Programmatically](https://github.com/FIWARE/tutorials.Accessing-Linked-Data)<br/>

## Uso

La mayoria de los tutoriales tiene un script llamado `services` para iniciar los contenedores:

```console
cd <tutorial-name>
./services start
```

### Siguiendo los ejercicios del tutorial vía Postman

Cada submodulo del tutorial contiene uno o más ficheros `docker-compose.yml` junto con la colección que contiene las peticiones HTTP necesarias. 
Importa la colección en Postman y siga las instrucciones

### Siguiendo los ejercicios del tutorial desde la línea de comandos

Cada submodulo contiene las instrucciones completas en el fichero README en el que se detallan los comandos necesarios (cUrl y Docker) para correrlo.

Las instrucciones completas se pueden encontrar en la [documentación](https://fiware-tutorials.rtfd.io)

---

## License

[MIT](LICENSE) © 2018-2020 FIWARE Foundation e.V.