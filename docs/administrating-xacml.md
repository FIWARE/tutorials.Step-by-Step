[![FIWARE Security](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/security.svg)](https://github.com/FIWARE/catalogue/blob/master/security/README.md)
[![XACML 3.0](https://img.shields.io/badge/XACML-3.0-ff7059.svg)](https://docs.oasis-open.org/xacml/3.0/xacml-3.0-core-spec-os-en.html)

**Description:** This tutorial describes the administration of level 3 advanced authorization rules into **Authzforce**,
either directly, or with the help of the **Keyrock** GUI. The simple verb-resource based permissions are amended to use
XACML and new XACML permissions added to the existing roles. The updated ruleset is automatically uploaded to
**Authzforce** PDP, so that policy execution points such as the **PEP proxy** are able to apply the latest ruleset.

The tutorial demonstrates examples of interactions using the **Keyrock** GUI, as well [cUrl](https://ec.haxx.se/)
commands used to access the REST APIs of **Keyrock** and **Authzforce** -
[Postman documentation](https://fiware.github.io/tutorials.Administrating-XACML) is also available.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/23b7045a5b52a54a2666)

<hr class="security"/>

<!--lint disable no-shortcut-reference-link -->
<!--lint disable no-undefined-references -->

# Administrating XACML Rules

> **12.3 Central Terminal Area**
>
> -   Red or Yellow Zone
>     -   No private vehicle shall stop, wait, or park in the red or yellow zone.
> -   White Zone
>     -   No vehicle shall stop, wait, or park in the white zone unless actively engaged in the immediate loading or
>         unloading of passengers and/or baggage.
>
> — Los Angeles International Airport Rules and Regulations, Section 12 - Landside Motor Vehicle Operations

Business rules change over time, and it is necessary to be able to amend access controls accordingly. The
[previous tutorial](xacml-access-rules.md) included a static XACML `<PolicySet>` loaded into **Authzforce**. This
component offers advanced authorization (level 3) access control where every policy decision is calculated on the fly
and new rules can be applied under new circumstances. The details of the
[Authzforce](https://authzforce-ce-fiware.readthedocs.io/) Policy Decision Point (PDP) were discussed in the
[previous tutorial](xacml-access-rules.md), suffice to say, the **Authzforce** PDP interprets rules according to the
[XACML standard](https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=xacml) and offers a means to adjudicate on
any access request provided that sufficient information can be supplied.

For full flexibility, it must be possible to load, update and activate a new access control XACML `<PolicySet>` whenever
necessary. In order to do, this **Authzforce** offers a simple REST Policy Administration Point (PAP), an alternative
role-based PAP is available within **Keyrock**

## What is XACML

eXtensible Access Control Markup Language (XACML) is a vendor neutral declarative access control policy language. It was
created to promote common access control terminology and interoperability. The architectural naming conventions for
elements such as Policy Execution Point (PEP) and Policy Decision Point (PDP) come from the XACML specifications.

XACML policies are split into a hierarchy of three levels - `<PolicySet>`, `<Policy>` and `<Rule>`, the `<PolicySet>` is
a collection of `<Policy>` elements each of which contain one or more `<Rule>` elements.

Each `<Rule>` within a `<Policy>` is evaluated as to whether it should grant access to a resource - the overall
`<Policy>` result is defined by the overall result of all `<Rule>` elements processed in turn. Separate `<Policy>`
results are then evaluated against each other using combining alogorthms define which `<Policy>` wins in case of
conflict.

Further information can be found within the
[XACML standard](https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=xacml) and
[additional resources](https://www.webfarmr.eu/xacml-tutorial-axiomatics/) can be found on the web.

## PAP - Policy Administration Point

For the first half of the tutorial, a simple two rule `<PolicySet>` will be administered using the **Authzforce** PAP.
Thereafter the **Keyrock** GUI will be used to administer XACML rules within the existing tutorial application on an
individual XACML `<Rule>` level. The policy decision request code within the **PEP-Proxy** may also need to be
customized to enable the enforcement of complex XACML rules.

### Authzforce PAP

Within the **Authzforce** PAP all CRUD actions occur on the `<PolicySet>` level. It is therefore necessary to create a
complete, valid XACML file before uploading it to the service. There is no GUI available to ensure the validity of the
`<PolicySet>` prior to uploading the XACML.

### Keyrock PAP

**Keyrock** can create a valid XACML file based on available roles and permissions and pass this to **Authzforce**.
Indeed **Keyrock** already does this whenever it combines with **Authzforce** as all its own basic authorization
(level 2) permissions must be translated into advanced authorization (level 3) permissions before they can be
adjudicated by **Authzforce**.

Within **Keyrock**, each role corresponds to an XACML `<Policy>`, each permission within that role corresponds to an
XACML `<Rule>`. There is a GUI available for uploading and amending the XACML for each `<Rule>` and all CRUD actions
occur on the `<Rule>` level.

Provided care is taken when creating `<Rule>` you can use **Keyrock** to simplify the administration of XACML and create
a valid `<PolicySet>` for **Authzforce**.

## PEP - Policy Execution Point

When using advanced authorization (level 3), a policy execution point sends the an authorization request to he relevant
domain endpoint within **Authzforce**, providing all of the information necessary for **Authzforce** to provide a
judgement. Details of the interaction can be found in the [previous tutorial](xacml-access-rules.md).

The full code to supply each request to **Authzforce** can be found within the tutorials'
[Git Repository](https://github.com/FIWARE/tutorials.Step-by-Step/blob/master/context-provider/lib/azf.js)

Obviously the definition of _"all of the information necessary"_ may change over time, applications must therefore be
flexible enough to be able to modify the requests sent to ensure that sufficient information is passed.

# Architecture

This application demonstrates the admininistration of level 3 Advanced Authorization security into the existing Stock
Management and Sensors-based application created in [previous tutorials](xacml-access-rules.md) and secures access to
the context broker behind a [PEP Proxy](https://github.com/FIWARE/tutorials.PEP-Proxy/). It will make use of five FIWARE
components - the [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/),the
[IoT Agent for UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/), the
[Keyrock](https://fiware-idm.readthedocs.io/en/latest/) Identity Manager, the [Wilma]() PEP Proxy and the
[Authzforce](https://authzforce-ce-fiware.readthedocs.io) XACML Server. All access control decisions will be delegated
to **Authzforce** which will read the ruleset from a previously uploaded policy domain.

Both the Orion Context Broker and the IoT Agent rely on open source [MongoDB](https://www.mongodb.com/) technology to
keep persistence of the information they hold. We will also be using the dummy IoT devices created in the
[previous tutorial](iot-sensors.md). **Keyrock** uses its own [MySQL](https://www.mysql.com/) database.

Therefore the overall architecture will consist of the following elements:

-   The FIWARE [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) which will receive requests using
    [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
-   The FIWARE [IoT Agent for UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) which will receive
    southbound requests using [NGSI-v2](https://fiware.github.io/specifications/OpenAPI/ngsiv2) and convert them to
    [UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
    commands for the devices
-   FIWARE [Keyrock](https://fiware-idm.readthedocs.io/en/latest/) offer a complement Identity Management System
    including:
    -   An OAuth2 authentication system for Applications and Users
    -   A site graphical frontend for Identity Management Administration
    -   An equivalent REST API for Identity Management via HTTP requests
-   FIWARE [Authzforce](https://authzforce-ce-fiware.readthedocs.io/) is a XACML Server providing an interpretive Policy
    Decision Point (PDP) protecting access to resources such as **Orion** and the tutorial application.
-   FIWARE [Wilma](https://fiware-pep-proxy.rtfd.io/) is a PEP Proxy securing access to the **Orion** microservices, it
    delegates the passing of authorisation decisions to **Authzforce** PDP
-   The underlying [MongoDB](https://www.mongodb.com/) database :
    -   Used by the **Orion Context Broker** to hold context data information such as data entities, subscriptions and
        registrations
    -   Used by the **IoT Agent** to hold device information such as device URLs and Keys
-   A [MySQL](https://www.mysql.com/) database :
    -   Used to persist user identities, applications, roles and permissions
-   The **Stock Management Frontend** does the following:
    -   Displays store information
    -   Shows which products can be bought at each store
    -   Allows users to "buy" products and reduce the stock count.
    -   Allows authorized users into restricted areas, it also delegates authoriation decisions to the **Authzforce**
        PDP
-   A webserver acting as set of [dummy IoT devices](iot-sensors.md) using the
    [UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
    protocol running over HTTP - access to certain resources is restricted.

Since all interactions between the services are initiated by HTTP requests, the services can be containerized and run
from exposed ports.

![](https://fiware.github.io/tutorials.Administrating-XACML/img/architecture.png)

The all container configuration values found in the YAML file have been described in previous tutorials.

# Start Up

To start the installation, do the following:

```bash
git clone https://github.com/FIWARE/tutorials.Administrating-XACML.git
cd tutorials.Administrating-XACML

./services create
```

> **Note** The initial creation of Docker images can take up to three minutes

Thereafter, all services can be initialized from the command-line by running the
[services](https://github.com/FIWARE/tutorials.Administrating-XACML/blob/master/services) Bash script provided within
the repository:

```bash
./services start
```

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

<h3>Dramatis Personae</h3>

The following people at `test.com` legitimately have accounts within the Application

-   Alice, she will be the Administrator of the **Keyrock** Application
-   Bob, the Regional Manager of the supermarket chain - he has several store managers under him:
    -   Manager1
    -   Manager2
-   Charlie, the Head of Security of the supermarket chain - he has several store detectives under him:
    -   Detective1
    -   Detective2

| Name       | eMail                       | Password |
| ---------- | --------------------------- | -------- |
| alice      | `alice-the-admin@test.com`  | `test`   |
| bob        | `bob-the-manager@test.com`  | `test`   |
| charlie    | `charlie-security@test.com` | `test`   |
| manager1   | `manager1@test.com`         | `test`   |
| manager2   | `manager2@test.com`         | `test`   |
| detective1 | `detective1@test.com`       | `test`   |
| detective2 | `detective2@test.com`       | `test`   |

<br/>
The following people at `example.com` have signed up for accounts, but have no
reason to be granted access

-   Eve - Eve the Eavesdropper
-   Mallory - Mallory the malicious attacker
-   Rob - Rob the Robber

| Name    | eMail                 | Password |
| ------- | --------------------- | -------- |
| eve     | `eve@example.com`     | `test`   |
| mallory | `mallory@example.com` | `test`   |
| rob     | `rob@example.com`     | `test`   |

# XACML Administration

To apply an access control policy, it is necessary to be able to do the following:

1.  Create a consistent `<PolicySet>`
2.  Supply a Policy Execution Point (PEP) which provides necessary data

As will be seen, **Keyrock** is able help with the first point, and custom code within the **PEP Proxy** can help with
the second. **Authzforce** itself does not offer a UI, and is not concerned with generation and management of XACML
policies - it assumes that each `<PolicySet>` it receives has already been generated by another component.

Full-blown XACML editors are available, but the limited editor within **Keyrock** is usually sufficient for most access
control scenarios.

## Authzforce PAP

**Authzforce** can act as a Policy Administration Point (PAP), this means that PolicySets can be created and amended
using API calls directly to **Authzforce**

However there is no GUI for creating or amending a `<PolicySet>`, and no generation tool. All CRUD actions occur on the
`<PolicySet>` level.

A full XACML `<PolicySet>` for any non-trivial application is very verbose. For simplicity, for this part of the
tutorial, we will work on a completely new set of access rules designed for airport parking enforcement. **Authzforce**
is implicitly multi-tenant - a single XACML server can be used to administrate access control policies for multiple
applications. Security policies for each application are held in a separate **domain** where they can access their own
`<PolicySets>` - therefore administrating the airport application will not interfere with the existing rules for the
tutorial supermarket application.

### Creating a new Domain

To create a new domain in **Authzforce**, make a POST request to the `/authzforce-ce/domains` endpoint including a
unique `external-id` within the `<domainProperties>` element

#### 1 Request

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<domainProperties xmlns="http://authzforce.github.io/rest-api-model/xmlns/authz/5" externalId="airplane"/>'
```

#### Response

The response includes a `href` in the `<n2:link>` element which holds the `domain-id` used internally within
**Authzforce**.

An empty `PolicySet` will be created for the new domain. By default all access will be permitted.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns4:link xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0" rel="item" href="Sv-RRw9vEem6UQJCrBIBDA" title="Sv-RRw9vEem6UQJCrBIBDA"/>
```

The new `domain-id` (in this case `Sv-RRw9vEem6UQJCrBIBDA` ) will be used with all subsequent requests.

#### 2 Request

To request a decision from Authzforce, make a POST request to the `domains/{domain-id}/pdp` endpoint. In this case the
user is requesting access to `loading` in the `white` zone.

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pdp \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">airplane!</AttributeValue>
      </Attribute>
      <Attribute AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">white</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">loading</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" />
</Request>'
```

#### Response

The response for the request includes a `<Decision>` element to `Permit` or `Deny` access to the resource. at this point
all requests will be `Permit`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Response xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0">
    <Result>
        <Decision>Permit</Decision>
    </Result>
</Response>
```

### Creating an initial PolicySet

To create a `PolicySet` for a given domain information in **Authzforce**, make a POST request to the
`/authzforce-ce/domains/{{domain-id}}/pap/policies` endpoint including the full set of XACML rules to upload.

For this initial Policy, the following rules will be enforced

-   The **white** zone is for immediate loading and unloading of passengers only
-   There is no stopping in the **red** zone

#### 3 Request

The full data for an XACML `<PolicySet>` is very verbose and has been omitted from the request below:

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pap/policies \
  -H 'Content-Type: application/xml' \
  -d '<PolicySet>...etc</PolicySet>'
```

[**(Click to EXPAND)**](cmds/administrating-xacml.md#3-request)

#### Response

The response contains the internal ID of the policy held within **Authzforce** and version information about the
`PolicySet` versions available. The rules of the new `PolicySet` will not be applied until the `PolicySet` is activated.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns4:link xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0" rel="item" href="f8194af5-8a07-486a-9581-c1f05d05483c/1" title="Policy 'f8194af5-8a07-486a-9581-c1f05d05483c' v1"/>
```

### Activating the initial PolicySet

To activate a `PolicySet`, make a PUT request to the `/authzforce-ce/domains/{domain-id}/pap/pdp.properties` endpoint
including the `policy-id` to update within the `<rootPolicyRefExpresion>` attribute

#### 4 Request

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X PUT \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pap/pdp.properties \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <pdpPropertiesUpdate xmlns="http://authzforce.github.io/rest-api-model/xmlns/authz/5">
    <rootPolicyRefExpression>f8194af5-8a07-486a-9581-c1f05d05483c</rootPolicyRefExpression>
  </pdpPropertiesUpdate>'
```

#### Response

The response returns information about the `PolicySet` applied.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns3:pdpProperties xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0" lastModifiedTime="2019-01-03T15:54:45.341Z">
    <ns3:feature type="urn:ow2:authzforce:feature-type:pdp:core" enabled="false">urn:ow2:authzforce:feature:pdp:core:strict-attribute-issuer-match</ns3:feature>
    <ns3:feature type="urn:ow2:authzforce:feature-type:pdp:core" enabled="false">urn:ow2:authzforce:feature:pdp:core:xpath-eval</ns3:feature>
... ETC
    <ns3:rootPolicyRefExpression>f8194af5-8a07-486a-9581-c1f05d05483c</ns3:rootPolicyRefExpression>
    <ns3:applicablePolicies>
        <ns3:rootPolicyRef Version="1">f8194af5-8a07-486a-9581-c1f05d05483c</ns3:rootPolicyRef>
    </ns3:applicablePolicies>
</ns3:pdpProperties>
```

#### 5 Request

At this point, making a request to access to `loading` in the `white` zone will return `Permit`

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pdp \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">airplane!</AttributeValue>
      </Attribute>
      <Attribute AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">white</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">loading</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" />
</Request>'
```

#### Response

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Response xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0">
    <Result>
        <Decision>Permit</Decision>
    </Result>
</Response>
```

#### 6 Request

At this point, making a request to access to `loading` in the `red` zone will return `Deny`

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pdp \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">airplane!</AttributeValue>
      </Attribute>
      <Attribute AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">red</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">loading</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" />
</Request>'
```

#### Response

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Response xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0">
    <Result>
        <Decision>Deny</Decision>
    </Result>
</Response>
```

### Updating a PolicySet

To update a `PolicySet` for a given domain information in **Authzforce**, make a POST request to the
`/authzforce-ce/domains/{{domain-id}}/pap/policies` endpoint including the full set of XACML rules to upload. Note that
the `Version` must be unique.

For the updated Policy, the previous rules will be reversed

-   The **red** zone is for immediate loading and unloading of passengers only
-   There is no stopping in the **white** zone

#### 7 Request

The full data for an XACML `<PolicySet>` is very verbose and has been omitted from the request below:

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pap/policies \
  -H 'Content-Type: application/xml' \
  -d '<PolicySet>...etc</PolicySet>'
```

[**(Click to EXPAND)**](cmds/administrating-xacml.md#7-request)

#### Response

The response contains version information about the `PolicySet` versions available. The rules of the new `PolicySet`
will not be applied until the `PolicySet` is activated.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns4:link xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0" rel="item" href="f8194af5-8a07-486a-9581-c1f05d05483c/2" title="Policy 'f8194af5-8a07-486a-9581-c1f05d05483c' v2"/>
```

### Activating an updated PolicySet

To update an active a `PolicySet`, make another PUT request to the
`/authzforce-ce/domains/{domain-id}/pap/pdp.properties` endpoint including the `policy-id` to update within the
`<rootPolicyRefExpresion>` attribute. The ruleset will be updated to apply the latest uploaded version.

#### 8 Request

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X PUT \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pap/pdp.properties \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <pdpPropertiesUpdate xmlns="http://authzforce.github.io/rest-api-model/xmlns/authz/5">
    <rootPolicyRefExpression>f8194af5-8a07-486a-9581-c1f05d05483c</rootPolicyRefExpression>
  </pdpPropertiesUpdate>'
```

#### Response

The response returns information about the `PolicySet` applied.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns3:pdpProperties xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0" lastModifiedTime="2019-01-03T15:58:29.351Z">
    <ns3:feature type="urn:ow2:authzforce:feature-type:pdp:core" enabled="false">urn:ow2:authzforce:feature:pdp:core:strict-attribute-issuer-match</ns3:feature>
    <ns3:feature type="urn:ow2:authzforce:feature-type:pdp:core" enabled="false">urn:ow2:authzforce:feature:pdp:core:xpath-eval</ns3:feature>
... ETC
    <ns3:rootPolicyRefExpression>f8194af5-8a07-486a-9581-c1f05d05483c</ns3:rootPolicyRefExpression>
    <ns3:applicablePolicies>
        <ns3:rootPolicyRef Version="2">f8194af5-8a07-486a-9581-c1f05d05483c</ns3:rootPolicyRef>
    </ns3:applicablePolicies>
</ns3:pdpProperties>
```

#### 9 Request

Since the new policy has been activated, at this point, making a request to access to `loading` in the `white` zone will
return `Deny`

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pdp \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">airplane!</AttributeValue>
      </Attribute>
      <Attribute AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">white</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">loading</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" />
</Request>'
```

#### Response

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Response xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0">
    <Result>
        <Decision>Deny</Decision>
    </Result>
</Response>
```

#### 10 Request

Making a request to access to `loading` in the `red` zone under the current policy will return `Permit`

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pdp \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">airplane!</AttributeValue>
      </Attribute>
      <Attribute AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">red</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
      <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">
         <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">loading</AttributeValue>
      </Attribute>
   </Attributes>
   <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" />
</Request>'
```

#### Response

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Response xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns2="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6" xmlns:ns3="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns4="http://www.w3.org/2005/Atom" xmlns:ns5="http://authzforce.github.io/core/xmlns/pdp/6.0">
    <Result>
        <Decision>Permit</Decision>
    </Result>
</Response>
```

## Keyrock PAP

**Keyrock** offers a role based access control identity management system. Typically every permission is only accessible
to users within a given role. We have already seen how Verb-Resource rules can be
[set-up](https://github.com/FIWARE/tutorials.Roles-Permissions/) and
[enforced](https://github.com/FIWARE/tutorials.Securing-Access/) using the basic authorization (level 2) access control
mechanism found within Keyrock, the data for defining an advanced permission can also be administed using the
**Keyrock** GUI or via **Keyrock** REST API requests.

**Keyrock** permissions work on individual XACML `<Rule>` elements rather than a complete `<PolicySet>`. The
`<PolicySet>` is generated by combining all the roles and permissions.

### Predefined Roles and Permissions

In a similar manner to the previous tutorial, two roles have been created, one for store detectives and another for
management users. A series of permissions have been set up for the supermarket application, the following XACML rules
are applied:

#### Security Staff

-   Can unlock the door at any time
-   Can ring the alarm bell before 8 a.m. or after 5 p.m. UTC.
-   Can access the **context broker** data at any time

#### Mangement

-   Have access to the price change area
-   Have access to the stock count area
-   Can ring the alarm bell between 8 a.m. or after 5 p.m. UTC.
-   Can access the **context broker** data from 8 a.m. or after 5 p.m. UTC.

As you can see some of the new rules now have a time element to them and are no longer simple Verb-Resource rules.

For most of the rules, the Policy Execution Point (i.e. the request to **Authzforce** and analysis of the result) is
found within the tutorial
[code](https://github.com/FIWARE/tutorials.Step-by-Step/blob/master/context-provider/lib/azf.js) -

The **context broker** data for the **Store** and **IoT Devices** is held in is secured behind the **PEP Proxy**. This
means that only security staff are able to access the system outside of core hours.

> **Note** within the **Keyrock**, only four resources have been secured using advanced authorization rules (level 3)
>
> -   sending the ring bell command
> -   access to the price-change area
> -   access to the order-stock area
> -   PEP Proxy access to the **context broker**
>
> For contrast, one resource has been left as a simple VERB Resource permission (level 2)
>
> -   sending the unlock door command

### Create Token with Password

#### 11 Request

Enter a username and password to enter the application. The default super-user has the values `alice-the-admin@test.com`
and `test`.

```bash
curl -iX POST \
  http://localhost:3005/v1/auth/tokens \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "alice-the-admin@test.com",
  "password": "test"
}'
```

#### Response

The response header from **Keyrock** returns an `X-Subject-token` which identifies who has logged on the application.
This token is required in all subsequent requests to gain access

```text
HTTP/1.1 201 Created
X-Subject-Token: d848eb12-889f-433b-9811-6a4fbf0b86ca
Content-Type: application/json; charset=utf-8
Content-Length: 138
ETag: W/"8a-TVwlWNKBsa7cskJw55uE/wZl6L8"
Date: Mon, 30 Jul 2018 12:07:54 GMT
Connection: keep-alive
```

The response body from **Keyrock** indicates that **Authzforce** is in use and XACML Rules can be used to define access
policies.

```json
{
    "token": {
        "methods": ["password"],
        "expires_at": "2019-01-03T17:04:43.358Z"
    },
    "idm_authorization_config": {
        "level": "advanced",
        "authzforce": true
    }
}
```

### Read a Verb-Resource Permission

As a reminder, for simple verb-resource permissions, the `/applications/{{app-id}}/permissions/{permission-id}}`
endpoint will return the permission listed under that ID. The `X-Auth-token` must be supplied in the headers.

#### 12 Request

```bash
curl -X GET \
  http://localhost:3005/v1/applications/tutorial-dckr-site-0000-xpresswebapp/permissions/entrance-open-0000-0000-000000000000 \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
```

#### Response

The response returns the details of the requested permission, for a verb-resource permission, the `xml` element is
`null`. This permission indicates that a user is permittted to make a POST request to the `/door/unlock` endpoint to
unlock the main entrance.

```json
{
    "permission": {
        "id": "entrance-open-0000-0000-000000000000",
        "name": "Unlock",
        "description": "Unlock main entrance",
        "is_internal": false,
        "action": "POST",
        "resource": "/door/unlock",
        "xml": null,
        "oauth_client_id": "tutorial-dckr-site-0000-xpresswebapp"
    }
}
```

### Read a XACML Rule Permission

XACML Rule permissions can be accessed in the same way, the `/applications/{{app-id}}/permissions/{permission-id}}`
endpoint will return the permission listed under that ID. The `X-Auth-token` must be supplied in the headers.

#### 13 Request

```bash
curl -X GET \
  http://localhost:3005/v1/applications/tutorial-dckr-site-0000-xpresswebapp/permissions/alrmbell-ring-24hr-xaml-000000000000 \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
```

#### Response

The response returns the details of the requested permission, for a XACML Rule permission, the `xml` element holds the
details of the associated XACML `<Rule>` the `action` and `resource` fields are `null`.

There is already one `<Rule>` within the `xml` attribute, which states the following:

> **Security Staff** Can only ring the alarm bell **before** 8 a.m. or **after** 5 p.m. UTC.

To see the full `<Rule>` [**(Click to EXPAND)**](cmds/administrating-xacml.md#13-request)

The `<Target>` element of the `<Rule>` defines access on a Verb-Resource level in a similar manner as seen in the
previous tutorial. The a `<Condition>` element holds the time part of the rule and is evaluated by **Authzforce** based
on the current server time.

```json
{
    "permission": {
        "id": "alrmbell-ring-24hr-xaml-000000000000",
        "name": "Ring Alarm Bell (Outside Core hours)",
        "description": "Ring Alarm Bell for Security",
        "is_internal": false,
        "action": null,
        "resource": null,
        "xml": "<Rule RuleId=\"alrmbell-ring-24hr-hours-000000000000\" Effect=\"Permit\">\n<Description>Ring Alarm Bell (Outside Core Hours)</Description>\n<Target>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">/bell/ring</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:resource\" AttributeId=\"urn:thales:xacml:2.0:resource:sub-resource-id\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">POST</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:action\" AttributeId=\"urn:oasis:names:tc:xacml:1.0:action:action-id\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">security-role-0000-0000-000000000000</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:1.0:subject-category:access-subject\" AttributeId=\"urn:oasis:names:tc:xacml:2.0:subject:role\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n</Target>\n<Condition>\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:not\">\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:2.0:function:time-in-range\">\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-one-and-only\">\n<AttributeDesignator AttributeId=\"urn:oasis:names:tc:xacml:1.0:environment:current-time\" DataType=\"http://www.w3.org/2001/XMLSchema#time\" Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:environment\" MustBePresent=\"false\"></AttributeDesignator>\n</Apply>\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-one-and-only\">\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-bag\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#time\">08:00:00</AttributeValue>\n</Apply>\n</Apply>\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-one-and-only\">\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-bag\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#time\">17:00:00</AttributeValue>\n</Apply>\n</Apply>\n</Apply>\n</Apply>\n</Condition>\n</Rule>",
        "oauth_client_id": "tutorial-dckr-site-0000-xpresswebapp"
    }
}
```

**Tip** An annotated version of the full `<PolicySet>` can be found within the
[tutorial itself](https://github.com/FIWARE/tutorials.Administrating-XACML/blob/master/authzforce/domains/gQqnLOnIEeiBFQJCrBIBDA/policies/ZjgxOTRhZjUtOGEwNy00ODZhLTk1ODEtYzFmMDVkMDU0ODNj/2.xml)

### Deny Access to a Resource

To request a decision from Authzforce, make a POST request to the `domains/{domain-id}/pdp` endpoint. In this case the
user is requesting access to `POST` to the `/bell/ring` endpoint.

#### 14 Request

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/gQqnLOnIEeiBFQJCrBIBDA/pdp \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
  <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">
     <Attribute AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">security-role-0000-0000-000000000000</AttributeValue>
     </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
     <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">tutorial-dckr-site-0000-xpresswebapp</AttributeValue>
     </Attribute>
     <Attribute AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">/bell/ring</AttributeValue>
     </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
     <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">POST</AttributeValue>
     </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" />
</Request>'
```

#### Response

The response for the request includes a `<Decision>` element to `Permit` or `Deny` access to the resource.

If the time on the server is between 8 a.m. and 5 p.m. the access request will be denied.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:Response xmlns="http://www.w3.org/2005/Atom" xmlns:ns2="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns3="http://authzforce.github.io/core/xmlns/pdp/6.0" xmlns:ns4="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns5="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6">
    <ns2:Result>
        <ns2:Decision>Deny</ns2:Decision>
    </ns2:Result>
</ns2:Response>
```

### Update an XACML Permission

The policy will now be updated as follows:

> **Security Staff** Can only ring the alarm bell before 8 a.m. or after 5 p.m., except for **Charlie** who can ring the
> bell at any time

This means that the `alrmbell-ring-24hr-xaml-000000000000` permission will need to be amended to apply two rules:

To see the new `<Rule>` [**(Click to EXPAND)**](cmds/administrating-xacml.md#update-an-xacml-permission)

This is most easily be done in the GUI by pasting the rule into the appropriate text box, however it can also be done
programmatically.

To log-in to the **Keyrock** GUI, enter the username and password on the log-in page `http://localhost:3005/`

![](https://fiware.github.io/tutorials.Administrating-XACML/img/login.png)

Navigate to correct application, and click on the manage roles tab

![](https://fiware.github.io/tutorials.Administrating-XACML/img/manage-roles.png)

Select a permission to edit

![](https://fiware.github.io/tutorials.Administrating-XACML/img/edit-permission.png)

The HTTP Verb and Resource rule needs to be left blank, but the applicable XACML `<Rule>` elements need to be pasted
within the **Advanced XACML Rule** textbox as shown:

![](https://fiware.github.io/tutorials.Administrating-XACML/img/permission.png)

Alternatively to programatically amend the XACML rules governing a permission, make a PATCH request to the
`/applications/{{app-id}}/permissions/{permission-id}}` endpoint. The body of the request must include three
attributes - `action` and `resource` must both be set to `""` and the `xml` attribute should hold the XACML text.

#### 15 Request

The full data for the request very verbose and has been omitted below:

```bash
curl -X PATCH \
  http://localhost:3005/v1/applications/tutorial-dckr-site-0000-xpresswebapp/permissions/alrmbell-ring-24hr-xaml-000000000000 \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \
  -d '{
    "permission": {
        "action": "",
        "resource": "",
        "xml": "<Rule RuleId=\"alrmbell-ring-only-000000000000\" Effect=\"Permit\"> etc..."
    }
}
```

[**(Click to EXPAND)**](cmds/administrating-xacml.md#15-request)

#### Response

The response shows the details of the attributes which have been updated.

```json
{
    "values_updated": {
        "action": null,
        "resource": null,
        "xml": "<Rule RuleId=\"alrmbell-ring-only-000000000000\" Effect=\"Permit\"> etc..."
    }
}
```

### Passing the Updated Policy Set to Authzforce

When **Keyrock** is connected to **Authzforce** the `<PolicySet>` is automatically updated whenever the role-permission
associations are amended, the easiest way to do this is to delete and re-create any single association.

Firstly delete an association using a DELETE request:

#### 16 Request

```bash
curl -X DELETE \
  http://localhost:3005/v1/applications/tutorial-dckr-site-0000-xpresswebapp/roles/security-role-0000-0000-000000000000/permissions/alrmbell-ring-24hr-xaml-000000000000 \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
```

Then re-create it using a POST request as shown:

#### 17 Request

```bash
curl -X POST \
  http://localhost:3005/v1/applications/tutorial-dckr-site-0000-xpresswebapp/roles/security-role-0000-0000-000000000000/permissions/alrmbell-ring-24hr-xaml-000000000000 \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
```

#### Response

If **Authzforce** has been updated, an additional `authzforce` attribute will be present within the response, the new
`<PolicySet>` will now be in place.

```json
{
    "role_permission_assignments": {
        "role_id": "security-role-0000-0000-000000000000",
        "permission_id": "alrmbell-ring-24hr-xaml-000000000000"
    },
    "authzforce": {
        "create_policy": {
            "message": " Success creating policy.",
            "status": 200
        },
        "activate_policy": {
            "message": "Success",
            "status": 200
        }
    }
}
```

### Permit Access to a Resource

Additional Fields can be added to the policy decision request to improve the likelihood of a `Permit` response.

In the example below, the `emailaddress` and `subject:subject-id` have been added to the body of the request within the
`subject-category:access-subject` category.

With the new rule in place, the user `charlie` will be able to access the `/bell/ring` endpoint at all times of day.

#### 18 Request

The full data for the request very verbose and has been omitted below:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/gQqnLOnIEeiBFQJCrBIBDA/pdp \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
...etc
</Request>'
```

[**(Click to EXPAND)**](cmds/administrating-xacml.md#18-Request)

#### Response

The response is `Permit` when the new `<Rule>` has been applied.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:Response xmlns="http://www.w3.org/2005/Atom" xmlns:ns2="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" xmlns:ns3="http://authzforce.github.io/core/xmlns/pdp/6.0" xmlns:ns4="http://authzforce.github.io/rest-api-model/xmlns/authz/5" xmlns:ns5="http://authzforce.github.io/pap-dao-flat-file/xmlns/properties/3.6">
    <ns2:Result>
        <ns2:Decision>Permit</ns2:Decision>
    </ns2:Result>
</ns2:Response>
```

## Tutorial PEP - Extending Advanced Authorization

The new policy for Charlie the security manager needs additional information to be passed to **Authzforce**

### Extending Advanced Authorization - Sample Code

Programmatically, any Policy Execution Point consists of two parts, an OAuth request to Keyrock retrieves information
about the user (such as the assigned roles) as well as the policy domain to be queried.

A second request is sent to the relevant domain endpoint within Authzforce, providing all of the information necessary
for Authzforce to provide a judgement. Authzforce responds with a **permit** or **deny** response, and the decision
whether to continue can be made thereafter.

The `user.username` and `user.email` have been added to the list of fields to be sent to **Authzforce**

```javascript
function authorizeAdvancedXACML(req, res, next, resource = req.url) {
    const keyrockUserUrl =
        "http://keyrock/user?access_token=" + req.session.access_token + "&app_id=" + clientId + "&authzforce=true";

    return oa
        .get(keyrockUserUrl)
        .then((response) => {
            const user = JSON.parse(response);
            return azf.policyDomainRequest(
                user.app_azf_domain,
                user.roles,
                resource,
                req.method,
                user.username,
                user.email
            );
        })
        .then((authzforceResponse) => {
            res.locals.authorized = authzforceResponse === "Permit";
            return next();
        })
        .catch((error) => {
            debug(error);
            res.locals.authorized = false;
            return next();
        });
}
```

The full code to supply each request to Authzforce can be found within the tutorials'
[Git Repository](https://github.com/FIWARE/tutorials.Step-by-Step/blob/master/context-provider/lib/azf.js) - the
supplied information has been expanded to include the `username` and `email` within the generated XACML request

```javascript
const xml2js = require("xml2js");
const request = require("request");

function policyDomainRequest(domain, roles, resource, action, username, email) {
    let body =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">\n';
    // Code to create the XML body for the request is omitted
    body = body + "</Request>";

    const options = {
        method: "POST",
        url: "http://authzforceUrl/authzforce-ce/domains/" + domain + "/pdp",
        headers: { "Content-Type": "application/xml" },
        body
    };

    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            let decision;
            xml2js.parseString(body, { tagNameProcessors: [xml2js.processors.stripPrefix] }, function (err, jsonRes) {
                // The decision is found within the /Response/Result[0]/Decision[0] XPath
                decision = jsonRes.Response.Result[0].Decision[0];
            });
            decision = String(decision);
            return error ? reject(error) : resolve(decision);
        });
    });
}
```

## Extending Advanced Authorization - Running the Example

After successfully update the **Authzforce** `<PolicySet>` to include a special rule for Charlie, his rights will differ
from other users in the security role

#### Detective 1

Detective1 works for Charlie and has the **security** role

-   From `http://localhost:3000`, log in as `detective1@test.com` with the password `test`

##### Level 3: Advanced Authorization Access

-   Click on the restricted access links at `http://localhost:3000` - access is **denied** - This is a management only
    permission
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Unlock a door - access is **permitted** - This is a security only permission
    -   Ring a bell - access is **denied** - This is not permitted to security users between 8 a.m. and 5 p.m.

#### Charlie the Security Manager

Charlie has the **security** role

-   From `http://localhost:3000`, log in as `charlie-security@test.com` with the password `test`

##### Level 3: Advanced Authorization Access

-   Click on the restricted access links at `http://localhost:3000` - access is **denied** - This is a management only
    permission
-   Open the Device Monitor on `http://localhost:3000/device/monitor`
    -   Unlock a door - access is **permitted** - This is a security only permission
    -   Ring a bell - access is **permitted** - This is an exception which is only permitted to the user called
        `charlie`
